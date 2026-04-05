import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { projectPath } from '../../test/project-paths.mjs';

const packageJson = JSON.parse(readFileSync(projectPath('package.json'), 'utf8'));
const appConfig = JSON.parse(readFileSync(projectPath('app.json'), 'utf8'));
const roleNotificationsSource = readFileSync(projectPath('src', 'screens', 'shared', 'RoleNotificationsScreen.js'), 'utf8');
const studentNotificationsSource = readFileSync(projectPath('src', 'screens', 'student', 'StudentNotificationsScreen.js'), 'utf8');
const parentNotificationsSource = readFileSync(projectPath('src', 'screens', 'parent', 'ParentNotificationsScreen.js'), 'utf8');
const startExpoAndroidSource = readFileSync(projectPath('scripts', 'start-expo-android.mjs'), 'utf8');
const rebuildExpoAndroidPath = projectPath('scripts', 'rebuild-expo-android.mjs');
const rebuildExpoAndroidSource = existsSync(rebuildExpoAndroidPath)
  ? readFileSync(rebuildExpoAndroidPath, 'utf8')
  : '';

test('shared role notifications use premium feed hero, section, and card surfaces', () => {
  assert.equal(roleNotificationsSource.includes('FeedHero'), true);
  assert.equal(roleNotificationsSource.includes('FeedSection'), true);
  assert.equal(roleNotificationsSource.includes('FeedCard'), true);
});

test('student notifications remain a thin wrapper over the shared notification surface', () => {
  assert.equal(studentNotificationsSource.includes('RoleNotificationsScreen'), true);
});

test('parent notifications adopt the same premium feed language', () => {
  assert.equal(parentNotificationsSource.includes('FeedHero'), true);
  assert.equal(parentNotificationsSource.includes('FeedCard'), true);
  assert.equal(parentNotificationsSource.includes('FeedSection'), true);
});

test('notification native support is configured for Expo builds', () => {
  assert.equal(typeof packageJson.dependencies?.['expo-notifications'], 'string');

  const notificationsPlugin = (appConfig.expo?.plugins || []).find((plugin) =>
    Array.isArray(plugin) ? plugin[0] === 'expo-notifications' : plugin === 'expo-notifications'
  );

  assert.notEqual(notificationsPlugin, undefined);
  assert.equal(Array.isArray(notificationsPlugin), true);
  assert.equal(notificationsPlugin[1]?.defaultChannel, 'default');
});

test('android mobile runtime is explicitly configured around a development build workflow', () => {
  assert.equal(typeof packageJson.dependencies?.['expo-dev-client'], 'string');
  assert.equal(packageJson.scripts?.['android:rebuild'], 'node ./scripts/rebuild-expo-android.mjs');
  assert.equal(startExpoAndroidSource.includes('"--dev-client", "--android"'), true);
  assert.equal(existsSync(rebuildExpoAndroidPath), true);
  assert.equal(rebuildExpoAndroidSource.includes('"run:android"'), true);
  assert.equal(rebuildExpoAndroidSource.includes('"--device"'), true);
  assert.equal(rebuildExpoAndroidSource.includes('"--no-bundler"'), true);
  assert.equal(rebuildExpoAndroidSource.includes('JAVA_HOME'), true);
  assert.equal(rebuildExpoAndroidSource.includes('ANDROID_HOME'), true);
  assert.equal(rebuildExpoAndroidSource.includes('local.properties'), true);
  assert.equal(
    Array.isArray(appConfig.expo?.android?.permissions) && appConfig.expo.android.permissions.includes('POST_NOTIFICATIONS'),
    true
  );
});
