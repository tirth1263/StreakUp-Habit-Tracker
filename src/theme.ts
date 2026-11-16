export type Theme = {
  dark: boolean;
  bg: string;
  card: string;
  text: string;
  subtext: string;
  border: string;
  track: string;
  primary: string;
  onPrimary: string;
  danger: string;
};

export const lightTheme: Theme = {
  dark: false,
  bg: '#F4F6F8',
  card: '#FFFFFF',
  text: '#111827',
  subtext: '#6B7280',
  border: '#E5E7EB',
  track: '#EEF0F3',
  primary: '#16A34A',
  onPrimary: '#FFFFFF',
  danger: '#DC2626',
};

export const darkTheme: Theme = {
  dark: true,
  bg: '#0B0F14',
  card: '#161B22',
  text: '#F3F4F6',
  subtext: '#9CA3AF',
  border: '#262C36',
  track: '#222831',
  primary: '#22C55E',
  onPrimary: '#06240F',
  danger: '#F87171',
};

/** Colours a habit can be. The first one (green) is the default. */
export const HABIT_COLORS = [
  '#22C55E',
  '#0EA5E9',
  '#8B5CF6',
  '#EC4899',
  '#F97316',
  '#EAB308',
  '#14B8A6',
  '#EF4444',
];

export const RADIUS = 18;
