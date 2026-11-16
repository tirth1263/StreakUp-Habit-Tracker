import React, { useLayoutEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { confirmAction, notify } from '../lib/dialogs';
import { formatTime, makeTime } from '../lib/streak';
import type { ScreenProps } from '../navigation';
import { remindersSupported } from '../services/reminders';
import { useStore } from '../store';
import { HABIT_COLORS, RADIUS } from '../theme';

const DEFAULT_TIME = '20:00';
const MINUTE_STEP = 5;

export function HabitFormScreen({ navigation, route }: ScreenProps<'HabitForm'>) {
  const { habits, theme, saveHabit, removeHabit } = useStore();
  const editing = habits.find((h) => h.id === route.params?.habitId);

  const [name, setName] = useState(editing?.name ?? '');
  const [color, setColor] = useState(editing?.color ?? HABIT_COLORS[0]);
  const [remind, setRemind] = useState(editing ? editing.reminderTime !== null : false);
  const [time, setTime] = useState(editing?.reminderTime ?? DEFAULT_TIME);
  const [saving, setSaving] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({ title: editing ? 'Edit habit' : 'New habit' });
  }, [navigation, editing]);

  const [hour, minute] = time.split(':').map(Number);
  const bumpHour = (by: number) => setTime(makeTime((hour + by + 24) % 24, minute));
  const bumpMinute = (by: number) => setTime(makeTime(hour, (minute + by + 60) % 60));

  const trimmed = name.trim();
  const canSave = trimmed.length > 0 && !saving;

  const onSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const { reminderOk } = await saveHabit(
        { name: trimmed, color, reminderTime: remind ? time : null },
        editing?.id
      );
      if (!reminderOk) {
        notify(
          'Reminder not set',
          'Your habit was saved, but notifications are turned off for StreakUp. Turn them on in your phone settings to get reminders.'
        );
      }
      navigation.goBack();
    } catch {
      setSaving(false);
      notify('Could not save', 'Something went wrong saving this habit. Please try again.');
    }
  };

  const onDelete = async () => {
    if (!editing) return;
    const ok = await confirmAction(
      `Delete “${editing.name}”?`,
      'This removes the habit and its whole history. It cannot be undone.',
      'Delete'
    );
    if (!ok) return;
    await removeHabit(editing.id);
    navigation.popToTop();
  };

  const stepper = (label: string, value: string, onDown: () => void, onUp: () => void) => (
    <View style={styles.stepper}>
      <Pressable
        onPress={onDown}
        accessibilityRole="button"
        accessibilityLabel={`Earlier ${label}`}
        style={[styles.stepButton, { backgroundColor: theme.track }]}
      >
        <Text style={[styles.stepText, { color: theme.text }]}>−</Text>
      </Pressable>
      <Text style={[styles.stepValue, { color: theme.text }]}>{value}</Text>
      <Pressable
        onPress={onUp}
        accessibilityRole="button"
        accessibilityLabel={`Later ${label}`}
        style={[styles.stepButton, { backgroundColor: theme.track }]}
      >
        <Text style={[styles.stepText, { color: theme.text }]}>＋</Text>
      </Pressable>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={[styles.label, { color: theme.subtext }]}>Name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="e.g. Read 10 pages"
          placeholderTextColor={theme.subtext}
          autoFocus={!editing}
          maxLength={40}
          returnKeyType="done"
          onSubmitEditing={onSave}
          style={[
            styles.input,
            { backgroundColor: theme.card, borderColor: theme.border, color: theme.text },
          ]}
        />

        <Text style={[styles.label, { color: theme.subtext }]}>Colour</Text>
        <View style={[styles.card, styles.swatches, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {HABIT_COLORS.map((c) => (
            <Pressable
              key={c}
              onPress={() => setColor(c)}
              accessibilityRole="radio"
              accessibilityState={{ selected: c === color }}
              accessibilityLabel={`Colour ${c}`}
              style={[styles.swatch, { backgroundColor: c }]}
            >
              {c === color && <Text style={styles.swatchCheck}>✓</Text>}
            </Pressable>
          ))}
        </View>

        <Text style={[styles.label, { color: theme.subtext }]}>Daily reminder</Text>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.switchRow}>
            <Text style={[styles.switchLabel, { color: theme.text }]}>
              {remind ? `Remind me at ${formatTime(time)}` : 'Remind me every day'}
            </Text>
            <Switch
              value={remind}
              onValueChange={setRemind}
              trackColor={{ true: theme.primary, false: theme.border }}
            />
          </View>
          {remind && (
            <View style={styles.timeRow}>
              {stepper('hour', formatTime(makeTime(hour, 0)).replace(':00', ''), () => bumpHour(-1), () => bumpHour(1))}
              {stepper('minute', `:${String(minute).padStart(2, '0')}`, () => bumpMinute(-MINUTE_STEP), () => bumpMinute(MINUTE_STEP))}
            </View>
          )}
          {remind && !remindersSupported && (
            <Text style={[styles.note, { color: theme.subtext }]}>
              Reminders are sent by the phone app. On the website the time is saved, but no
              notification is sent.
            </Text>
          )}
        </View>

        <Pressable
          onPress={onSave}
          disabled={!canSave}
          accessibilityRole="button"
          style={[styles.save, { backgroundColor: theme.primary, opacity: canSave ? 1 : 0.45 }]}
        >
          <Text style={[styles.saveText, { color: theme.onPrimary }]}>
            {editing ? 'Save changes' : 'Add habit'}
          </Text>
        </Pressable>

        {editing && (
          <Pressable onPress={onDelete} accessibilityRole="button" style={styles.delete}>
            <Text style={[styles.deleteText, { color: theme.danger }]}>Delete habit</Text>
          </Pressable>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 48 },
  label: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
    marginTop: 18,
  },
  input: {
    borderWidth: 1,
    borderRadius: RADIUS,
    paddingHorizontal: 16,
    paddingVertical: 15,
    fontSize: 18,
    fontWeight: '600',
  },
  card: { borderWidth: 1, borderRadius: RADIUS, padding: 16 },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  swatch: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  swatchCheck: { color: '#FFFFFF', fontSize: 20, fontWeight: '800' },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  switchLabel: { fontSize: 16, fontWeight: '600', flex: 1 },
  timeRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 18, gap: 12 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  stepText: { fontSize: 20, fontWeight: '700' },
  stepValue: {
    fontSize: 18,
    fontWeight: '700',
    minWidth: 62,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  note: { fontSize: 13, lineHeight: 18, marginTop: 14 },
  save: { marginTop: 28, borderRadius: 999, paddingVertical: 17, alignItems: 'center' },
  saveText: { fontSize: 17, fontWeight: '800' },
  delete: { marginTop: 14, paddingVertical: 14, alignItems: 'center' },
  deleteText: { fontSize: 16, fontWeight: '700' },
});
