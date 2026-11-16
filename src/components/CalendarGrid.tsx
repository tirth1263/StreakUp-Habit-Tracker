import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { fromKey, toKey } from '../lib/streak';
import { useTheme } from '../store';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

type Props = {
  dates: ReadonlySet<string>;
  today: string;
  color: string;
  /** Tap a past day to fix a check-in you forgot (or made by mistake). */
  onToggleDay: (date: string) => void;
};

/** One month at a time. Filled circle = done that day. */
export function CalendarGrid({ dates, today, color, onToggleDay }: Props) {
  const theme = useTheme();
  const todayDate = fromKey(today);
  const [month, setMonth] = useState(
    () => new Date(todayDate.getFullYear(), todayDate.getMonth(), 1)
  );

  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const leadingBlanks = month.getDay();
  const isCurrentMonth =
    year === todayDate.getFullYear() && monthIndex === todayDate.getMonth();

  const cells: (number | null)[] = [
    ...Array<null>(leadingBlanks).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const shift = (by: number) => setMonth(new Date(year, monthIndex + by, 1));

  return (
    <View>
      <View style={styles.header}>
        <Pressable
          onPress={() => shift(-1)}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Previous month"
          style={[styles.arrow, { backgroundColor: theme.track }]}
        >
          <Text style={[styles.arrowText, { color: theme.text }]}>‹</Text>
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>
          {MONTHS[monthIndex]} {year}
        </Text>
        <Pressable
          onPress={() => shift(1)}
          disabled={isCurrentMonth}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Next month"
          style={[styles.arrow, { backgroundColor: theme.track, opacity: isCurrentMonth ? 0.35 : 1 }]}
        >
          <Text style={[styles.arrowText, { color: theme.text }]}>›</Text>
        </Pressable>
      </View>

      <View style={styles.row}>
        {WEEKDAYS.map((d, i) => (
          <Text key={i} style={[styles.weekday, { color: theme.subtext }]}>
            {d}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((day, i) => {
          if (day === null) return <View key={i} style={styles.cell} />;
          const key = toKey(new Date(year, monthIndex, day));
          const done = dates.has(key);
          const isToday = key === today;
          const isFuture = key > today;
          return (
            <View key={i} style={styles.cell}>
              <Pressable
                disabled={isFuture}
                onPress={() => onToggleDay(key)}
                accessibilityRole="button"
                accessibilityLabel={`${MONTHS[monthIndex]} ${day}, ${done ? 'done' : 'not done'}`}
                style={[
                  styles.day,
                  { backgroundColor: done ? color : theme.track },
                  isToday && { borderWidth: 2, borderColor: done ? theme.text : color },
                  isFuture && { opacity: 0.4 },
                ]}
              >
                <Text
                  style={[
                    styles.dayText,
                    { color: done ? '#FFFFFF' : theme.subtext },
                    done && styles.dayTextDone,
                  ]}
                >
                  {day}
                </Text>
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  title: { fontSize: 16, fontWeight: '700' },
  arrow: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: { fontSize: 22, lineHeight: 24, fontWeight: '600' },
  row: { flexDirection: 'row' },
  weekday: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, padding: 3 },
  day: { flex: 1, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  dayText: { fontSize: 13, fontVariant: ['tabular-nums'] },
  dayTextDone: { fontWeight: '700' },
});
