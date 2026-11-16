/**
 * The app's single source of truth. Screens read habits/check-ins from here
 * and call these actions; the store is the only place that talks to storage,
 * reminders and the purchase service.
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';
import * as storage from './data/storage';
import { todayKey } from './lib/streak';
import * as purchases from './services/purchases';
import { cancelReminder, syncReminder } from './services/reminders';
import { darkTheme, lightTheme, type Theme } from './theme';
import type { Habit, HabitInput } from './types';

type CheckinMap = Record<number, ReadonlySet<string>>;
const NO_DATES: ReadonlySet<string> = new Set();

type Store = {
  ready: boolean;
  today: string;
  habits: Habit[];
  datesFor: (habitId: number) => ReadonlySet<string>;
  isPro: boolean;
  darkMode: boolean;
  theme: Theme;
  /** Returns the saved habit and whether its reminder could be scheduled. */
  saveHabit: (input: HabitInput, id?: number) => Promise<{ habit: Habit; reminderOk: boolean }>;
  removeHabit: (id: number) => Promise<void>;
  toggleCheckin: (habitId: number, date?: string) => Promise<void>;
  unlockPro: () => Promise<boolean>;
  restorePro: () => Promise<boolean>;
  setDarkMode: (on: boolean) => Promise<void>;
};

const StoreContext = createContext<Store | null>(null);

export function useStore(): Store {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useStore must be used inside <StoreProvider>');
  return store;
}

export const useTheme = () => useStore().theme;

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [today, setToday] = useState(todayKey);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [checkins, setCheckins] = useState<CheckinMap>({});
  const [isPro, setIsPro] = useState(false);
  const [darkMode, setDark] = useState(false);

  // Load everything once at startup.
  useEffect(() => {
    (async () => {
      const [loadedHabits, loadedCheckins, pro, dark] = await Promise.all([
        storage.getHabits(),
        storage.getCheckins(),
        storage.getSetting('pro'),
        storage.getSetting('darkMode'),
      ]);
      const map: Record<number, Set<string>> = {};
      for (const c of loadedCheckins) (map[c.habitId] ??= new Set()).add(c.date);
      setHabits(loadedHabits);
      setCheckins(map);
      setIsPro(pro === '1');
      setDark(dark === '1');
      setReady(true);

      // Then ask the store, if online. The saved copy keeps Pro working offline.
      try {
        const owned = await purchases.fetchProStatus();
        if (owned !== null) {
          setIsPro(owned);
          await storage.setSetting('pro', owned ? '1' : '0');
        }
      } catch {
        // Offline or store unavailable: keep the saved answer.
      }
    })().catch((e) => {
      console.error('Failed to load StreakUp data', e);
      setReady(true);
    });
  }, []);

  // Notice when the day rolls over (app left open overnight, or reopened).
  useEffect(() => {
    const refresh = () => setToday(todayKey());
    const sub = AppState.addEventListener('change', (s) => s === 'active' && refresh());
    const timer = setInterval(refresh, 60_000);
    return () => {
      sub.remove();
      clearInterval(timer);
    };
  }, []);

  const datesFor = useCallback((habitId: number) => checkins[habitId] ?? NO_DATES, [checkins]);

  const saveHabit = useCallback<Store['saveHabit']>(async (input, id) => {
    let habit: Habit;
    if (id == null) {
      habit = await storage.addHabit(input);
      setHabits((list) => [...list, habit]);
    } else {
      await storage.updateHabit(id, input);
      const existing = habits.find((h) => h.id === id);
      habit = { id, createdAt: existing?.createdAt ?? new Date().toISOString(), ...input };
      setHabits((list) => list.map((h) => (h.id === id ? habit : h)));
    }
    const reminderOk = await syncReminder(habit).catch(() => false);
    return { habit, reminderOk };
  }, [habits]);

  const removeHabit = useCallback(async (id: number) => {
    await storage.deleteHabit(id);
    await cancelReminder(id);
    setHabits((list) => list.filter((h) => h.id !== id));
    setCheckins(({ [id]: _removed, ...rest }) => rest);
  }, []);

  const toggleCheckin = useCallback(
    async (habitId: number, date: string = today) => {
      const done = !(checkins[habitId]?.has(date) ?? false);
      // Update the screen first so the tap feels instant, then save.
      setCheckins((map) => {
        const next = new Set(map[habitId]);
        if (done) next.add(date);
        else next.delete(date);
        return { ...map, [habitId]: next };
      });
      await storage.setCheckin(habitId, date, done);
    },
    [checkins, today]
  );

  const applyPro = useCallback(async (owned: boolean) => {
    if (!owned) return false;
    setIsPro(true);
    await storage.setSetting('pro', '1');
    return true;
  }, []);

  const unlockPro = useCallback(async () => applyPro(await purchases.purchasePro()), [applyPro]);
  const restorePro = useCallback(async () => applyPro(await purchases.restorePro()), [applyPro]);

  const setDarkMode = useCallback(async (on: boolean) => {
    setDark(on);
    await storage.setSetting('darkMode', on ? '1' : '0');
  }, []);

  // Dark mode is a Pro feature, so it only applies while Pro is unlocked.
  const theme = isPro && darkMode ? darkTheme : lightTheme;

  const value = useMemo<Store>(
    () => ({
      ready,
      today,
      habits,
      datesFor,
      isPro,
      darkMode,
      theme,
      saveHabit,
      removeHabit,
      toggleCheckin,
      unlockPro,
      restorePro,
      setDarkMode,
    }),
    [ready, today, habits, datesFor, isPro, darkMode, theme, saveHabit, removeHabit, toggleCheckin, unlockPro, restorePro, setDarkMode]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
