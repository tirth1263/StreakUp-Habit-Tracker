import React, { useEffect, useLayoutEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CalendarGrid } from '../components/CalendarGrid';
import { bestStreak, currentStreak, formatTime } from '../lib/streak';
import type { ScreenProps } from '../navigation';
import { useStore } from '../store';
import { RADIUS } from '../theme';

export function HabitDetailsScreen({ navigation, route }: ScreenProps<'HabitDetails'>) {
  const { habits, datesFor, today, theme, toggleCheckin } = useStore();
  const habit = habits.find((h) => h.id === route.params.habitId);

  useLayoutEffect(() => {
    if (!habit) return;
    navigation.setOptions({
      title: habit.name,
      headerRight: () => (
        <Pressable
          onPress={() => navigation.navigate('HabitForm', { habitId: habit.id })}
          hitSlop={10}
          accessibilityRole="button"
        >
          <Text style={{ color: theme.primary, fontSize: 16, fontWeight: '700' }}>Edit</Text>
        </Pressable>
      ),
    });
  }, [navigation, habit, theme]);

  // The habit was deleted while this screen was open.
  useEffect(() => {
    if (!habit && navigation.canGoBack()) navigation.goBack();
  }, [habit, navigation]);

  if (!habit) return <View style={{ flex: 1, backgroundColor: theme.bg }} />;

  const dates = datesFor(habit.id);
  const done = dates.has(today);
  const streak = currentStreak(dates, today);
  const stats = [
    { label: 'Current streak', value: streak, unit: streak === 1 ? 'day' : 'days' },
    { label: 'Best streak', value: bestStreak(dates), unit: 'days' },
    { label: 'Total check-ins', value: dates.size, unit: 'days' },
  ];

  return (
    <ScrollView
      style={{ backgroundColor: theme.bg }}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.hero, { backgroundColor: habit.color }]}>
        <Text style={styles.heroNumber}>🔥 {streak}</Text>
        <Text style={styles.heroLabel}>
          {streak === 0
            ? 'Check in today to start a streak'
            : `day${streak === 1 ? '' : 's'} in a row${done ? '' : ' — check in to keep it going'}`}
        </Text>
      </View>

      <View style={styles.stats}>
        {stats.slice(1).map((s) => (
          <View
            key={s.label}
            style={[styles.stat, { backgroundColor: theme.card, borderColor: theme.border }]}
          >
            <Text style={[styles.statValue, { color: theme.text }]}>{s.value}</Text>
            <Text style={[styles.statLabel, { color: theme.subtext }]}>{s.label}</Text>
          </View>
        ))}
      </View>

      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <CalendarGrid
          dates={dates}
          today={today}
          color={habit.color}
          onToggleDay={(date) => toggleCheckin(habit.id, date)}
        />
        <Text style={[styles.hint, { color: theme.subtext }]}>
          Tap a day to add or remove a check-in.
        </Text>
      </View>

      <View style={[styles.card, styles.reminder, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.reminderLabel, { color: theme.subtext }]}>Daily reminder</Text>
        <Text style={[styles.reminderValue, { color: theme.text }]}>
          {habit.reminderTime ? `🔔 ${formatTime(habit.reminderTime)}` : 'Off'}
        </Text>
      </View>

      <Pressable
        onPress={() => toggleCheckin(habit.id)}
        accessibilityRole="button"
        style={[
          styles.button,
          done
            ? { backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1 }
            : { backgroundColor: habit.color },
        ]}
      >
        <Text style={[styles.buttonText, { color: done ? theme.text : '#FFFFFF' }]}>
          {done ? '✓ Done today — tap to undo' : 'Mark today done'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 48 },
  hero: { borderRadius: RADIUS, padding: 24, alignItems: 'center', marginBottom: 12 },
  heroNumber: { color: '#FFFFFF', fontSize: 52, fontWeight: '800', fontVariant: ['tabular-nums'] },
  heroLabel: { color: '#FFFFFF', fontSize: 15, fontWeight: '600', marginTop: 2, textAlign: 'center' },
  stats: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  stat: { flex: 1, borderRadius: RADIUS, borderWidth: 1, padding: 16 },
  statValue: { fontSize: 26, fontWeight: '800', fontVariant: ['tabular-nums'] },
  statLabel: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  card: { borderRadius: RADIUS, borderWidth: 1, padding: 16, marginBottom: 12 },
  hint: { fontSize: 12, textAlign: 'center', marginTop: 10 },
  reminder: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reminderLabel: { fontSize: 14, fontWeight: '600' },
  reminderValue: { fontSize: 16, fontWeight: '700' },
  button: { borderRadius: 999, paddingVertical: 17, alignItems: 'center', marginTop: 8 },
  buttonText: { fontSize: 17, fontWeight: '800' },
});
