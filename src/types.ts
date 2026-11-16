export type Habit = {
  id: number;
  name: string;
  /** Hex colour used for the checkmark and calendar cells. */
  color: string;
  /** Daily reminder as "HH:MM" (24h), or null for no reminder. */
  reminderTime: string | null;
  createdAt: string;
};

export type Checkin = {
  habitId: number;
  /** Local calendar day as "YYYY-MM-DD". */
  date: string;
};

export type HabitInput = Pick<Habit, 'name' | 'color' | 'reminderTime'>;

export const FREE_HABIT_LIMIT = 3;
