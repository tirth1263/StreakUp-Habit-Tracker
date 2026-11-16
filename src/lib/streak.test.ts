// Run with: npm test
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { addDays, bestStreak, currentStreak, formatTime } from './streak.ts';

const TODAY = '2026-03-01';
const days = (...offsets: number[]) => new Set(offsets.map((o) => addDays(TODAY, o)));

test('no check-ins means no streak', () => {
  assert.equal(currentStreak(new Set(), TODAY), 0);
  assert.equal(bestStreak(new Set()), 0);
});

test('counts back from today', () => {
  assert.equal(currentStreak(days(0, -1, -2), TODAY), 3);
});

test('today not done yet keeps yesterday\'s streak alive', () => {
  assert.equal(currentStreak(days(-1, -2), TODAY), 2);
});

test('a missed full day breaks the streak', () => {
  assert.equal(currentStreak(days(-2, -3, -4), TODAY), 0);
  assert.equal(currentStreak(days(0, -2, -3), TODAY), 1);
});

test('streaks cross month and leap-day boundaries', () => {
  // 2026-03-01 back into February
  assert.equal(currentStreak(days(0, -1, -2, -3), TODAY), 4);
  assert.equal(addDays('2028-02-28', 1), '2028-02-29');
});

test('best streak finds the longest run', () => {
  assert.equal(bestStreak(days(0, -1, -5, -6, -7, -8, -20)), 4);
});

test('formats reminder times', () => {
  assert.equal(formatTime('00:05'), '12:05 AM');
  assert.equal(formatTime('20:00'), '8:00 PM');
  assert.equal(formatTime('12:30'), '12:30 PM');
});
