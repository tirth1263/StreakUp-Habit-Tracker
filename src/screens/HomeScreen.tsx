import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Confetti } from '../components/Confetti';
import { addDays, currentStreak, fromKey } from '../lib/streak';
import type { ScreenProps } from '../navigation';
import { useStore } from '../store';
import { RADIUS } from '../theme';
import { FREE_HABIT_LIMIT, type Habit } from '../types';

const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function HomeScreen({ navigation }: ScreenProps<'Home'>) {
  const { habits, datesFor, today, theme, isPro, toggleCheckin } = useStore();
  const insets = useSafeAreaInsets();
  const [burst, setBurst] = useState(0);

  const doneCount = habits.filter((h) => datesFor(h.id).has(today)).length;
  const allDone = habits.length > 0 && doneCount === habits.length;

  const onToggle = (habit: Habit) => {
    const wasDone = datesFor(habit.id).has(today);
    // Confetti when this tap completes the last habit of the day.
    if (!wasDone && doneCount === habits.length - 1) setBurst((n) => n + 1);
    toggleCheckin(habit.id);
  };

  const onAdd = () => {
    // Free plan: 3 habits. The 4th opens the Pro screen instead.
    if (!isPro && habits.length >= FREE_HABIT_LIMIT) navigation.navigate('Settings');
    else navigation.navigate('HabitForm');
  };

  const dateLabel = fromKey(today).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <View style={[styles.screen, { backgroundColor: theme.bg, paddingTop: insets.top + 12 }]}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.date, { color: theme.subtext }]}>{dateLabel}</Text>
          <Text style={[styles.title, { color: theme.text }]}>StreakUp</Text>
        </View>
        <Pressable
          onPress={() => navigation.navigate('Settings')}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Settings and Pro"
          style={[styles.pill, { backgroundColor: theme.card, borderColor: theme.border }]}
        >
          <Text style={[styles.pillText, { color: isPro ? theme.primary : theme.text }]}>
            {isPro ? '★ Pro' : 'Go Pro'}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingTop: 8, paddingBottom: insets.bottom + 110 }}
        showsVerticalScrollIndicator={false}
      >
        {habits.length > 0 && (
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.progressTitle, { color: theme.text }]}>
              {allDone ? 'All done for today 🎉' : `${doneCount} of ${habits.length} done today`}
            </Text>
            <View style={[styles.track, { backgroundColor: theme.track }]}>
              <View
                style={[
                  styles.fill,
                  { backgroundColor: theme.primary, width: `${(doneCount / habits.length) * 100}%` },
                ]}
              />
            </View>
          </View>
        )}

        {habits.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🌱</Text>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>Start your first streak</Text>
            <Text style={[styles.emptyBody, { color: theme.subtext }]}>
              Add a small habit like “drink water” or “read 10 pages”, then tap the circle each day
              you do it.
            </Text>
          </View>
        )}

        {habits.map((habit) => {
          const dates = datesFor(habit.id);
          const done = dates.has(today);
          const streak = currentStreak(dates, today);
          return (
            <Pressable
              key={habit.id}
              onPress={() => navigation.navigate('HabitDetails', { habitId: habit.id })}
              accessibilityRole="button"
              accessibilityLabel={`${habit.name}, ${streak} day streak. Open details.`}
              style={[styles.card, styles.habit, { backgroundColor: theme.card, borderColor: theme.border }]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.habitName, { color: theme.text }]} numberOfLines={1}>
                  {habit.name}
                </Text>
                <Text style={[styles.streak, { color: streak > 0 ? theme.text : theme.subtext }]}>
                  {streak > 0 ? `🔥 ${streak} day${streak === 1 ? '' : 's'}` : 'No streak yet'}
                </Text>
                <View style={styles.week}>
                  {Array.from({ length: 7 }, (_, i) => {
                    const day = addDays(today, i - 6);
                    const filled = dates.has(day);
                    return (
                      <View key={day} style={styles.weekDay}>
                        <View
                          style={[
                            styles.dot,
                            { backgroundColor: filled ? habit.color : theme.track },
                          ]}
                        />
                        <Text style={[styles.weekLetter, { color: theme.subtext }]}>
                          {DAY_LETTERS[fromKey(day).getDay()]}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
              <Pressable
                onPress={() => onToggle(habit)}
                hitSlop={10}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: done }}
                accessibilityLabel={`Mark ${habit.name} done today`}
                style={[
                  styles.check,
                  { borderColor: habit.color, backgroundColor: done ? habit.color : 'transparent' },
                ]}
              >
                <Text style={[styles.checkMark, { color: done ? '#FFFFFF' : 'transparent' }]}>✓</Text>
              </Pressable>
            </Pressable>
          );
        })}

        {!isPro && habits.length > 0 && (
          <Text style={[styles.limit, { color: theme.subtext }]}>
            {habits.length} of {FREE_HABIT_LIMIT} free habits used
          </Text>
        )}
      </ScrollView>

      <Pressable
        onPress={onAdd}
        accessibilityRole="button"
        accessibilityLabel="Add habit"
        style={[styles.fab, { backgroundColor: theme.primary, bottom: insets.bottom + 24 }]}
      >
        <Text style={[styles.fabText, { color: theme.onPrimary }]}>＋ Add habit</Text>
      </Pressable>

      <Confetti burst={burst} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 20, paddingBottom: 8 },
  date: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6 },
  title: { fontSize: 34, fontWeight: '800', letterSpacing: -0.5 },
  pill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1, marginBottom: 6 },
  pillText: { fontSize: 14, fontWeight: '700' },
  card: { borderRadius: RADIUS, borderWidth: 1, padding: 16, marginBottom: 12 },
  progressTitle: { fontSize: 16, fontWeight: '700', marginBottom: 10 },
  track: { height: 10, borderRadius: 5, overflow: 'hidden' },
  fill: { height: 10, borderRadius: 5 },
  habit: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  habitName: { fontSize: 18, fontWeight: '700' },
  streak: { fontSize: 14, fontWeight: '600', marginTop: 2 },
  week: { flexDirection: 'row', gap: 8, marginTop: 12 },
  weekDay: { alignItems: 'center', gap: 3 },
  dot: { width: 16, height: 16, borderRadius: 8 },
  weekLetter: { fontSize: 10, fontWeight: '600' },
  check: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: { fontSize: 26, fontWeight: '800', lineHeight: 30 },
  empty: { alignItems: 'center', paddingVertical: 70, paddingHorizontal: 24 },
  emptyEmoji: { fontSize: 56, marginBottom: 12 },
  emptyTitle: { fontSize: 22, fontWeight: '800', marginBottom: 8 },
  emptyBody: { fontSize: 15, lineHeight: 22, textAlign: 'center' },
  limit: { textAlign: 'center', fontSize: 13, marginTop: 6 },
  fab: {
    position: 'absolute',
    alignSelf: 'center',
    paddingHorizontal: 26,
    paddingVertical: 16,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  fabText: { fontSize: 17, fontWeight: '800' },
});
