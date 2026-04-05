import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { projectPath } from '../../../test/project-paths.mjs';

const premiumShellSource = readFileSync(projectPath('src', 'components', 'shared', 'PremiumShell.js'), 'utf8');
const unreadRefreshSource = readFileSync(projectPath('src', 'components', 'shared', 'premiumShellUnreadRefresh.js'), 'utf8');

test('premium shell unread badge does not rely on interval polling', () => {
  assert.equal(premiumShellSource.includes('pollMs'), false);
  assert.equal(premiumShellSource.includes('setInterval'), false);
  assert.equal(unreadRefreshSource.includes('onInterval'), false);
  assert.equal(unreadRefreshSource.includes('clearIntervalTask'), false);
});

test('premium shell unread badge refreshes on app or screen visibility changes', () => {
  assert.equal(unreadRefreshSource.includes('subscribeToAppState'), true);
  assert.equal(unreadRefreshSource.includes('onAppStateActive'), true);
});

test('premium shell unread badge scheduling avoids deprecated interaction manager APIs', () => {
  assert.equal(premiumShellSource.includes('InteractionManager'), false);
  assert.equal(premiumShellSource.includes('runAfterInteractions'), false);
  assert.equal(premiumShellSource.includes('requestIdleCallback'), true);
});
