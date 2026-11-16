/**
 * Storage for phones (iOS + Android): a local SQLite database.
 * No server, no login — the data never leaves the device.
 *
 * The website uses storage.web.ts instead (same functions, different engine).
 */
import * as SQLite from 'expo-sqlite';
import type { Checkin, Habit, HabitInput } from '../types';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync('streakup.db');
      await db.execAsync(`
        PRAGMA journal_mode = WAL;
        PRAGMA foreign_keys = ON;
        CREATE TABLE IF NOT EXISTS habits (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          color TEXT NOT NULL,
          reminder_time TEXT,
          created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS checkins (
          habit_id INTEGER NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
          date TEXT NOT NULL,
          PRIMARY KEY (habit_id, date)
        );
        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        );
      `);
      return db;
    })();
  }
  return dbPromise;
}

type HabitRow = {
  id: number;
  name: string;
  color: string;
  reminder_time: string | null;
  created_at: string;
};

const toHabit = (r: HabitRow): Habit => ({
  id: r.id,
  name: r.name,
  color: r.color,
  reminderTime: r.reminder_time,
  createdAt: r.created_at,
});

export async function getHabits(): Promise<Habit[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<HabitRow>('SELECT * FROM habits ORDER BY id');
  return rows.map(toHabit);
}

export async function addHabit(input: HabitInput): Promise<Habit> {
  const db = await getDb();
  const createdAt = new Date().toISOString();
  const result = await db.runAsync(
    'INSERT INTO habits (name, color, reminder_time, created_at) VALUES (?, ?, ?, ?)',
    [input.name, input.color, input.reminderTime, createdAt]
  );
  return { id: result.lastInsertRowId, ...input, createdAt };
}

export async function updateHabit(id: number, input: HabitInput): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE habits SET name = ?, color = ?, reminder_time = ? WHERE id = ?', [
    input.name,
    input.color,
    input.reminderTime,
    id,
  ]);
}

export async function deleteHabit(id: number): Promise<void> {
  const db = await getDb();
  // ON DELETE CASCADE removes this habit's check-ins too.
  await db.runAsync('DELETE FROM habits WHERE id = ?', [id]);
}

export async function getCheckins(): Promise<Checkin[]> {
  const db = await getDb();
  return db.getAllAsync<Checkin>('SELECT habit_id AS habitId, date FROM checkins');
}

export async function setCheckin(habitId: number, date: string, done: boolean): Promise<void> {
  const db = await getDb();
  if (done) {
    await db.runAsync('INSERT OR IGNORE INTO checkins (habit_id, date) VALUES (?, ?)', [
      habitId,
      date,
    ]);
  } else {
    await db.runAsync('DELETE FROM checkins WHERE habit_id = ? AND date = ?', [habitId, date]);
  }
}

export async function getSetting(key: string): Promise<string | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM settings WHERE key = ?',
    [key]
  );
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, value]);
}
