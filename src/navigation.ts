import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Home: undefined;
  HabitForm: { habitId?: number } | undefined;
  HabitDetails: { habitId: number };
  Settings: undefined;
};

export type ScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;
