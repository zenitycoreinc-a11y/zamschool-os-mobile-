import test from 'node:test';
import assert from 'node:assert/strict';

import { TEACHER_PREWARM_TABS, mergeTeacherPrewarmTabs } from './teacherShellPrewarm.js';

test('teacher prewarm tabs cover the secondary teacher surfaces', () => {
  assert.deepEqual(TEACHER_PREWARM_TABS, ['classroom', 'attendance', 'results', 'messages']);
});

test('mergeTeacherPrewarmTabs appends missing teacher tabs without duplicates', () => {
  assert.deepEqual(
    mergeTeacherPrewarmTabs(['dashboard', 'classroom'], ['dashboard', ...TEACHER_PREWARM_TABS]),
    ['dashboard', 'classroom', 'attendance', 'results', 'messages']
  );
});

test('mergeTeacherPrewarmTabs ignores tabs outside the mounted teacher shell', () => {
  assert.deepEqual(
    mergeTeacherPrewarmTabs(['dashboard'], ['dashboard', 'classroom']),
    ['dashboard', 'classroom']
  );
});
