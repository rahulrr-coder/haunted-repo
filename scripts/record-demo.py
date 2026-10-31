"""Record the scripted ?demo=1 take as an mp4 with sound.

The sound is synthesized live in the page (WebAudio), so we tap the page's audio destination with a MediaRecorder
and mux it with the screen recording. Re-run after changing the model or the deploy:

    URL='https://haunted-repo.netlify.app/?demo=1' python3 scripts/record-demo.py
"""
import base64, os, pathlib, shutil, subprocess, time
from playwright.sync_api import sync_playwright

URL = os.environ.get('URL', 'http://localhost:5173/?demo=1')
W, H = int(os.environ.get('W', 1280)), int(os.environ.get('H', 720))
OUT = pathlib.Path(__file__).resolve().parent.parent / 'demo'

# tap everything connected to the audio destination and record it
INIT = """
(() => {
  const orig = AudioNode.prototype.connect, chunks = []; let dest = null, rec = null;
  window.__audio = { start: null };
  AudioNode.prototype.connect = function (t, ...a) {
    const r = orig.call(this, t, ...a);
    if (t instanceof AudioDestinationNode) {
      if (!dest) {
        dest = t.context.createMediaStreamDestination();
        rec = new MediaRecorder(dest.stream, { mimeType: 'audio/webm;codecs=opus', audioBitsPerSecond: 192000 });
        rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
        rec.start(500); window.__audio.start = performance.timeOrigin + performance.now();
      }
      orig.call(this, dest);
    }
    return r;
  };
  window.__audioStop = () => new Promise((res) => {
    rec.onstop = async () => {
      const u = new Uint8Array(await new Blob(chunks, { type: 'audio/webm' }).arrayBuffer()); let s = '';
      for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000));
      res(btoa(s));
    };
    rec.stop();
  });
})();
"""


def main():
    OUT.mkdir(exist_ok=True)
    raw = OUT / 'raw'
    shutil.rmtree(raw, ignore_errors=True)
    with sync_playwright() as p:
        b = p.chromium.launch(channel='chrome', headless=True, args=['--autoplay-policy=no-user-gesture-required'])
        ctx = b.new_context(viewport={'width': W, 'height': H}, record_video_dir=str(raw), record_video_size={'width': W, 'height': H})
        ctx.add_init_script(INIT)
        t_page = time.time()
        page = ctx.new_page()
        page.goto(URL)
        page.wait_for_selector('text=Start take')
        page.wait_for_timeout(800)
        page.click('text=Start take')  # the click is the user gesture that lets audio start
        page.wait_for_function('window.__audio && window.__audio.start', timeout=8000)
        audio_start = page.evaluate('window.__audio.start') / 1000
        page.wait_for_function('window.__demoDone === true', timeout=150000, polling=500)
        page.wait_for_timeout(1000)
        (OUT / 'audio.webm').write_bytes(base64.b64decode(page.evaluate('window.__audioStop()')))
        vid = page.video.path()
        ctx.close(); b.close()

    lead = 0.25
    t0 = max(0.0, audio_start - t_page - lead)  # cut the load and splash; keep a beat before the first sound
    dur = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', vid]).strip()) - t0
    out = OUT / 'haunted-repo-demo.mp4'
    subprocess.run([
        'ffmpeg', '-y', '-loglevel', 'error', '-ss', f'{t0:.3f}', '-i', vid, '-itsoffset', f'{lead}', '-i', str(OUT / 'audio.webm'),
        '-map', '0:v', '-map', '1:a', '-t', f'{dur:.3f}',
        '-vf', f'fps=30,fade=t=in:st=0:d=0.6,fade=t=out:st={dur - 0.9:.2f}:d=0.9',
        '-af', f'alimiter=limit=0.95,afade=t=out:st={dur - 0.9:.2f}:d=0.9',
        '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', str(out)], check=True)
    print(out, f'{dur:.1f}s')


main()
