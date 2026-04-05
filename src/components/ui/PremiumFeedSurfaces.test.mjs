import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { projectPath } from '../../../test/project-paths.mjs';

const heroSource = readFileSync(projectPath('src', 'components', 'ui', 'FeedHero.js'), 'utf8');
const cardSource = readFileSync(projectPath('src', 'components', 'ui', 'FeedCard.js'), 'utf8');
const sectionSource = readFileSync(projectPath('src', 'components', 'ui', 'FeedSection.js'), 'utf8');
const emptyStateSource = readFileSync(projectPath('src', 'components', 'ui', 'EmptyState.js'), 'utf8');

test('premium feed hero supports title summary chips and meta content', () => {
  assert.equal(heroSource.includes('title'), true);
  assert.equal(heroSource.includes('summary'), true);
  assert.equal(heroSource.includes('chips'), true);
  assert.equal(heroSource.includes('meta'), true);
});

test('premium feed card supports eyebrow message timestamp unread and accessory content', () => {
  assert.equal(cardSource.includes('eyebrow'), true);
  assert.equal(cardSource.includes('message'), true);
  assert.equal(cardSource.includes('timestamp'), true);
  assert.equal(cardSource.includes('unread'), true);
  assert.equal(cardSource.includes('accessory'), true);
});

test('premium feed section centralizes grouped list titles and action text', () => {
  assert.equal(sectionSource.includes('title'), true);
  assert.equal(sectionSource.includes('action'), true);
  assert.equal(sectionSource.includes('children'), true);
});

test('empty state supports action label and supporting tone variants', () => {
  assert.equal(emptyStateSource.includes('actionLabel'), true);
  assert.equal(emptyStateSource.includes('supportingTone'), true);
  assert.equal(emptyStateSource.includes('tone'), true);
});
