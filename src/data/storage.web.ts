/**
 * Storage for the website: the browser's localStorage.
 *
 * Same functions as storage.ts, so the rest of the app can't tell the
 * difference. (SQLite in the browser needs special server headers that
 * static hosts like GitHub Pages can't send, so the web demo keeps it simple.)
 */
import type { Checkin, Habit, HabitInput } from '../types';

const KEY = 'streakup:v1';

type Data = {
  nextId: number;
  habits: Habit[];
  checkins: Checkin[];
  settings: Record<string, string>;
};

const empty = (): Data => ({ nextId: 1, habits: [], checkins: [], settings: {} });

function read(): Data {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? { ...empty(), ...JSON.parse(raw) } : empty();
  } catch {
    return empty();
  }
}

function write(data: Data) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // Private browsing or a full disk: the app still works for this visit.
  }
}

export async function getHabits(): Promise<Habit[]> {
  return read().habits;
}

export async function addHabit(input: HabitInput): Promise<Habit> {
  const data = read();
  const habit: Habit = { id: data.nextId, ...input, createdAt: new Date().toISOString() };
  data.nextId += 1;
  data.habits.push(habit);
  write(data);
  return habit;
}

export async function updateHabit(id: number, input: HabitInput): Promise<void> {
  const data = read();
  data.habits = data.habits.map((h) => (h.id === id ? { ...h, ...input } : h));
  write(data);
}

export async function deleteHabit(id: number): Promise<void> {
  const data = read();
  data.habits = data.habits.filter((h) => h.id !== id);
  data.checkins = data.checkins.filter((c) => c.habitId !== id);
  write(data);
}

export async function getCheckins(): Promise<Checkin[]> {
  return read().checkins;
}

export async function setCheckin(habitId: number, date: string, done: boolean): Promise<void> {
  const data = read();
  data.checkins = data.checkins.filter((c) => !(c.habitId === habitId && c.date === date));
  if (done) data.checkins.push({ habitId, date });
  write(data);
}

export async function getSetting(key: string): Promise<string | null> {
  return read().settings[key] ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const data = read();
  data.settings[key] = value;
  write(data);
}
