// scripts/test-spy.mjs — unit tests for the scroll-spy section picker.
import test from 'node:test';
import assert from 'node:assert/strict';
import { activeIndex } from '../site/spy.js';

const view = { scrollY: 0, innerHeight: 900, scrollHeight: 2400, offset: 84 };

test('top of page highlights the first section, not whatever sits mid-viewport', () => {
  assert.equal(activeIndex([73, 323, 559], view), 0);
});

test('section scrolled to its anchor position becomes active', () => {
  assert.equal(activeIndex([-182, 68, 304], { ...view, scrollY: 255 }), 1);
});

test('last section that has passed the offset wins', () => {
  assert.equal(activeIndex([-500, -100, 300], { ...view, scrollY: 600 }), 1);
});

test('bottom of page highlights the last section even if its top never reaches the offset', () => {
  assert.equal(activeIndex([-900, -650, 200], { ...view, scrollY: 1500 }), 2);
});

test('no sections yields -1', () => {
  assert.equal(activeIndex([], view), -1);
});
