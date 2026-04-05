import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { projectPath } from '../../test/project-paths.mjs';

const parentMessagesSource = readFileSync(projectPath('src', 'screens', 'ParentMessagesScreen.js'), 'utf8');
const studentMessagesSource = readFileSync(projectPath('src', 'screens', 'student', 'StudentMessagesScreen.js'), 'utf8');
const teacherMessagesSource = readFileSync(projectPath('src', 'screens', 'teacher', 'TeacherMessagesScreen.js'), 'utf8');
const roleNotificationsSource = readFileSync(projectPath('src', 'screens', 'shared', 'RoleNotificationsScreen.js'), 'utf8');
const parentNotificationsSource = readFileSync(projectPath('src', 'screens', 'parent', 'ParentNotificationsScreen.js'), 'utf8');

test('message surfaces use FlatList instead of ScrollView for long feeds', () => {
  for (const source of [parentMessagesSource, studentMessagesSource, teacherMessagesSource]) {
    assert.equal(source.includes('FlatList'), true);
    assert.equal(source.includes('ScrollView'), false);
  }
});

test('notification surfaces use virtualized lists instead of ScrollView', () => {
  assert.equal(roleNotificationsSource.includes('SectionList'), true);
  assert.equal(roleNotificationsSource.includes('ScrollView'), false);
  assert.equal(parentNotificationsSource.includes('SectionList'), true);
  assert.equal(parentNotificationsSource.includes('ScrollView'), false);
});
