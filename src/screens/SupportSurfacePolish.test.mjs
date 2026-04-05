import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { projectPath } from '../../test/project-paths.mjs';

const studentShellSource = readFileSync(projectPath('src', 'screens', 'StudentShellScreen.js'), 'utf8');
const teacherDashboardSource = readFileSync(projectPath('src', 'screens', 'TeacherDashboardScreen.js'), 'utf8');
const parentShellSource = readFileSync(projectPath('src', 'screens', 'ParentShellScreen.js'), 'utf8');
const adminShellSource = readFileSync(projectPath('src', 'screens', 'AdminShellScreen.js'), 'utf8');
const unsupportedRoleSource = readFileSync(projectPath('src', 'screens', 'UnsupportedRoleScreen.js'), 'utf8');
const loadingStateSource = readFileSync(projectPath('src', 'components', 'ui', 'LoadingState.js'), 'utf8');
const errorBannerSource = readFileSync(projectPath('src', 'components', 'ui', 'ErrorBanner.js'), 'utf8');

test('loading and error support surfaces feel intentional instead of placeholder-like', () => {
  assert.equal(loadingStateSource.includes('Loading…'), true);
  assert.equal(loadingStateSource.includes('Loading your workspace'), false);
  assert.equal(loadingStateSource.includes('Preparing your dashboard'), false);
  assert.equal(errorBannerSource.includes('Try again'), true);
  assert.equal(errorBannerSource.includes('supportingTone'), true);
});

test('unsupported role guidance uses a premium support card with clear recovery copy', () => {
  assert.equal(unsupportedRoleSource.includes('EmptyState'), true);
  assert.equal(unsupportedRoleSource.includes('roleLabel'), true);
  assert.equal(unsupportedRoleSource.includes('Sign out and ask your school admin to review this account.'), true);
});

test('support-heavy screens keep premium empty states in low-data sections', () => {
  assert.equal(studentShellSource.includes('supportingTone'), true);
  assert.equal(teacherDashboardSource.includes('supportingTone'), true);
  assert.equal(parentShellSource.includes('supportingTone'), true);
  assert.equal(adminShellSource.includes('supportingTone'), true);
});

test('dashboard support surfaces stay behind real loading gates before empty states appear', () => {
  assert.equal(studentShellSource.includes('if (dashboardLoading && !dashboard) return <LoadingState />;'), true);
  assert.equal(teacherDashboardSource.includes('if (isLoading && !data) return <LoadingState />;'), true);
});

test('teacher dashboard support actions are wired to existing shell routes', () => {
  assert.equal(teacherDashboardSource.includes("onAction={() => onNavigate?.('attendance')}"), true);
  assert.equal(teacherDashboardSource.includes("onAction={() => onNavigate?.('announcements')}"), true);
});
