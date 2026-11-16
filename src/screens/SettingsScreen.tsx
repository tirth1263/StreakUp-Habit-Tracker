import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { notify } from '../lib/dialogs';
import type { ScreenProps } from '../navigation';
import { getProPrice, isDemoStore } from '../services/purchases';
import { useStore } from '../store';
import { RADIUS } from '../theme';
import { FREE_HABIT_LIMIT } from '../types';

const PERKS = [
  { icon: '∞', title: 'Unlimited habits', body: `The free plan stops at ${FREE_HABIT_LIMIT}.` },
  { icon: '🌙', title: 'Dark mode', body: 'Easier on the eyes at night.' },
  { icon: '📱', title: 'Home-screen widget', body: 'Coming in a later update, included.' },
];

export function SettingsScreen(_props: ScreenProps<'Settings'>) {
  const { theme, isPro, darkMode, setDarkMode, unlockPro, restorePro } = useStore();
  const [price, setPrice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getProPrice().then(setPrice).catch(() => {});
  }, []);

  const run = async (action: () => Promise<boolean>, emptyMessage: string | null) => {
    setBusy(true);
    try {
      const unlocked = await action();
      if (!unlocked && emptyMessage) notify('Nothing to restore', emptyMessage);
    } catch (e: any) {
      notify('Purchase failed', e?.message ?? 'Please try again in a moment.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView style={{ backgroundColor: theme.bg }} contentContainerStyle={styles.content}>
      <View style={[styles.hero, { backgroundColor: theme.primary }]}>
        <Text style={[styles.heroTitle, { color: theme.onPrimary }]}>
          {isPro ? '★ You have StreakUp Pro' : 'StreakUp Pro'}
        </Text>
        <Text style={[styles.heroBody, { color: theme.onPrimary }]}>
          {isPro ? 'Thanks for supporting the app.' : 'Pay once. Yours forever. No subscription.'}
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        {PERKS.map((p, i) => (
          <View key={p.title} style={[styles.perk, i > 0 && { marginTop: 16 }]}>
            <Text style={styles.perkIcon}>{p.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.perkTitle, { color: theme.text }]}>{p.title}</Text>
              <Text style={[styles.perkBody, { color: theme.subtext }]}>{p.body}</Text>
            </View>
          </View>
        ))}
      </View>

      {!isPro && (
        <>
          <Pressable
            disabled={busy}
            onPress={() => run(unlockPro, null)}
            accessibilityRole="button"
            style={[styles.button, { backgroundColor: theme.primary, opacity: busy ? 0.5 : 1 }]}
          >
            <Text style={[styles.buttonText, { color: theme.onPrimary }]}>
              {isDemoStore ? 'Unlock Pro (demo — free)' : `Unlock Pro${price ? ` · ${price}` : ''}`}
            </Text>
          </Pressable>
          {isDemoStore ? (
            <Text style={[styles.note, { color: theme.subtext }]}>
              Demo mode: no payment is taken. In the store version this is a one-time purchase.
            </Text>
          ) : (
            <Pressable
              disabled={busy}
              onPress={() => run(restorePro, 'No earlier Pro purchase was found for this account.')}
              accessibilityRole="button"
              style={styles.link}
            >
              <Text style={[styles.linkText, { color: theme.primary }]}>Restore purchase</Text>
            </Pressable>
          )}
        </>
      )}

      <Text style={[styles.label, { color: theme.subtext }]}>Appearance</Text>
      <View style={[styles.card, styles.row, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.perkTitle, { color: theme.text }]}>Dark mode</Text>
          {!isPro && (
            <Text style={[styles.perkBody, { color: theme.subtext }]}>Unlock Pro to use it.</Text>
          )}
        </View>
        <Switch
          value={isPro && darkMode}
          disabled={!isPro}
          onValueChange={setDarkMode}
          trackColor={{ true: theme.primary, false: theme.border }}
        />
      </View>

      <Text style={[styles.footer, { color: theme.subtext }]}>
        Your habits are stored only on this device. No account, no server, no tracking.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 48 },
  hero: { borderRadius: RADIUS, padding: 24, marginBottom: 12 },
  heroTitle: { fontSize: 26, fontWeight: '800' },
  heroBody: { fontSize: 15, fontWeight: '600', marginTop: 4 },
  card: { borderRadius: RADIUS, borderWidth: 1, padding: 16, marginBottom: 12 },
  perk: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  perkIcon: { fontSize: 24, width: 32, textAlign: 'center' },
  perkTitle: { fontSize: 16, fontWeight: '700' },
  perkBody: { fontSize: 14, marginTop: 2 },
  button: { borderRadius: 999, paddingVertical: 17, alignItems: 'center', marginTop: 4 },
  buttonText: { fontSize: 17, fontWeight: '800' },
  note: { fontSize: 13, lineHeight: 18, textAlign: 'center', marginTop: 10 },
  link: { paddingVertical: 14, alignItems: 'center' },
  linkText: { fontSize: 15, fontWeight: '700' },
  label: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
    marginTop: 22,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  footer: { fontSize: 13, lineHeight: 18, textAlign: 'center', marginTop: 16 },
});
