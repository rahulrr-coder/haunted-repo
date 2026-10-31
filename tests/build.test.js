import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from '../src/lib/server/analyze.js';

const FILES = {
	'src/index.ts': "import { run } from './core/run';\nimport { log } from './util/log';\nrun(log);\n",
	'src/core/run.ts': "import { log } from '../util/log';\nexport const run = (f) => f(log);\n",
	'src/core/plan.ts': "import { log } from '../util/log';\nexport const plan = 1;\n",
	'src/util/log.ts': 'export const log = console.log;\n',
	'src/util/time.ts': 'export const now = Date.now;\n',
	'src/app.py': 'from .util import helper\nimport os\n',
	'src/util.py': 'def helper(): pass\n'
};

test('graph and rites are consistent', () => {
	const d = build(FILES, 'demo/repo');
	assert.equal(d.entry, 'src/index.ts');
	assert.equal(d.stats.links, 5); // index->run, index->log, run->log, plan->log, app.py->util.py
	assert.ok(d.rooms[0].questions.length, 'the door room must have rites');
	for (const room of d.rooms)
		for (const q of room.questions) {
			assert.ok(q.options[q.answer] in FILES);
			assert.equal(new Set(q.options).size, q.options.length);
		}
	const door = d.rooms.flatMap((r) => r.questions).find((q) => q.text.includes('front door'));
	assert.equal(door.options[door.answer], 'src/index.ts');
});

test('flat repo gets layered rooms', () => {
	const flat = {
		'index.js': "require('./a'); require('./b');", 'a.js': "require('./c');", 'b.js': "require('./c');",
		'c.js': "require('./d');", 'd.js': '', 'e.js': "require('./d');"
	};
	assert.ok(build(flat, 'flat/repo').rooms.length >= 2);
});
