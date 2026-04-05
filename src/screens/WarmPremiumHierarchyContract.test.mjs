import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { projectPath } from '../../test/project-paths.mjs';

const themeSource = readFileSync(projectPath('src', 'theme.js'), 'utf8');
const parentMessagesSource = readFileSync(projectPath('src', 'screens', 'ParentMessagesScreen.js'), 'utf8');
const parentAttendanceSource = readFileSync(projectPath('src', 'screens', 'parent', 'ParentAttendanceScreen.js'), 'utf8');
const parentShellSource = readFileSync(projectPath('src', 'screens', 'ParentShellScreen.js'), 'utf8');
const studentAnnouncementsSource = readFileSync(projectPath('src', 'screens', 'student', 'StudentAnnouncementsScreen.js'), 'utf8');
const teacherAnnouncementsSource = readFileSync(projectPath('src', 'screens', 'teacher', 'TeacherAnnouncementsScreen.js'), 'utf8');
const teacherAttendanceSource = readFileSync(projectPath('src', 'screens', 'teacher', 'TeacherAttendanceScreen.js'), 'utf8');
const adminAnnouncementsSource = readFileSync(projectPath('src', 'screens', 'AdminAnnouncementsScreen.js'), 'utf8');
const accountProfileViewSource = readFileSync(projectPath('src', 'components', 'shared', 'AccountProfileView.js'), 'utf8');

test('theme warm pass softens the app canvas away from the colder white-blue base', () => {
  assert.equal(themeSource.includes("const neutralCanvas = '#FBF7F1';"), true);
  assert.equal(themeSource.includes("const neutralCanvasSoft = '#F4EEE4';"), true);
  assert.equal(themeSource.includes("const neutralPanel = '#FFFDFC';"), true);
});

test('parent inbox adopts the shared premium feed hierarchy', () => {
  assert.equal(parentMessagesSource.includes('FeedHero'), true);
  assert.equal(parentMessagesSource.includes('FeedSection'), true);
  assert.equal(parentMessagesSource.includes('FeedCard'), true);
});

test('parent attendance and parent shell surfaces keep the premium hierarchy on attendance, notices, and progress', () => {
  assert.equal(parentAttendanceSource.includes('FeedHero'), true);
  assert.equal(parentAttendanceSource.includes('FeedSection'), true);
  assert.equal(parentAttendanceSource.includes('FeedCard'), true);
  assert.equal(parentShellSource.includes('FeedHero'), true);
  assert.equal(parentShellSource.includes('FeedSection'), true);
  assert.equal(parentShellSource.includes('FeedCard'), true);
});

test('student and teacher notices are rebuilt on the shared premium feed language', () => {
  assert.equal(studentAnnouncementsSource.includes('FeedHero'), true);
  assert.equal(studentAnnouncementsSource.includes('FeedSection'), true);
  assert.equal(studentAnnouncementsSource.includes('FeedCard'), true);
  assert.equal(teacherAnnouncementsSource.includes('FeedHero'), true);
  assert.equal(teacherAnnouncementsSource.includes('FeedSection'), true);
  assert.equal(teacherAnnouncementsSource.includes('FeedCard'), true);
});

test('teacher attendance gets the same premium hierarchy rather than plain utility cards', () => {
  assert.equal(teacherAttendanceSource.includes('FeedHero'), true);
  assert.equal(teacherAttendanceSource.includes('FeedSection'), true);
  assert.equal(teacherAttendanceSource.includes('FeedCard'), true);
});

test('admin announcements are upgraded off the legacy app layout path', () => {
  assert.equal(adminAnnouncementsSource.includes('FeedHero'), true);
  assert.equal(adminAnnouncementsSource.includes('FeedSection'), true);
  assert.equal(adminAnnouncementsSource.includes('FeedCard'), true);
  assert.equal(adminAnnouncementsSource.includes('AppLayout'), false);
});

test('account profile view exposes notification state as a command center surface', () => {
  assert.equal(accountProfileViewSource.includes('Notification Command Center'), true);
  assert.equal(accountProfileViewSource.includes('Messages, attendance, and school notices'), true);
  assert.equal(accountProfileViewSource.includes('notificationPermissionMeta'), true);
});
