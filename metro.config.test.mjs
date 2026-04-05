import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);
const config = require('./metro.config.js');
const createFileMapModule = require('./node_modules/metro/src/node-haste/DependencyGraph/createFileMap.js');

test('metro blockList excludes non-mobile workspace folders and logs', () => {
  const blockList = config.resolver?.blockList;
  const webappPath = path.win32.join('C:\\-zamschool-os', 'webapp', 'app', 'page.tsx');
  const docsPath = path.win32.join('C:\\-zamschool-os', 'docs', 'plans', 'example.md');
  const logPath = path.win32.join('C:\\-zamschool-os', '.orchids', 'dev.log');
  const rootDistPath = path.win32.join('C:\\-zamschool-os', 'dist', 'bundle.js');
  const packageDistPath = path.win32.join(
    'C:\\-zamschool-os',
    'mobile',
    'node_modules',
    'memoize-one',
    'dist',
    'memoize-one.cjs.js'
  );
  const screenPath = path.win32.join('C:\\-zamschool-os', 'mobile', 'src', 'screens', 'LoginScreen.js');
  const appPath = path.win32.join('C:\\-zamschool-os', 'mobile', 'App.js');

  assert.ok(blockList instanceof RegExp);
  assert.equal(blockList.test(webappPath), true);
  assert.equal(blockList.test(docsPath), true);
  assert.equal(blockList.test(logPath), true);
  assert.equal(blockList.test(rootDistPath), true);
  assert.equal(blockList.test(packageDistPath), false);
  assert.equal(blockList.test(screenPath), false);
  assert.equal(blockList.test(appPath), false);
});

test('metro config patches metro file map into no-watch mode for this workspace', () => {
  assert.equal(createFileMapModule.__zamschoolWatchPatch, true);
});
