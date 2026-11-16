import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet, useWindowDimensions, View } from 'react-native';
import { HABIT_COLORS } from '../theme';

const PIECES = 36;

/**
 * A small burst of confetti. Change `burst` to a new number to play it again;
 * 0 means "don't play". No library — just 36 little views falling and spinning.
 */
export function Confetti({ burst }: { burst: number }) {
  const { width, height } = useWindowDimensions();
  const progress = useRef(new Animated.Value(0)).current;

  const pieces = useMemo(
    () =>
      Array.from({ length: PIECES }, (_, i) => ({
        left: Math.random() * Math.min(width, 480),
        drift: (Math.random() - 0.5) * 140,
        size: 7 + Math.random() * 7,
        spin: 2 + Math.random() * 4,
        delay: Math.random() * 0.25,
        color: HABIT_COLORS[i % HABIT_COLORS.length],
        round: i % 3 === 0,
      })),
    // New random layout for every burst.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [burst, width]
  );

  useEffect(() => {
    if (!burst) return;
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: 1800,
      easing: Easing.out(Easing.quad),
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [burst, progress]);

  if (!burst) return null;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {pieces.map((p, i) => {
        const start = p.delay;
        const translateY = progress.interpolate({
          inputRange: [0, start, 1],
          outputRange: [-20, -20, height * 0.75],
        });
        const translateX = progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, p.drift],
        });
        const rotate = progress.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', `${p.spin * 360}deg`],
        });
        const opacity = progress.interpolate({
          inputRange: [0, start, 0.75, 1],
          outputRange: [0, 1, 1, 0],
        });
        return (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              top: 0,
              left: p.left,
              width: p.size,
              height: p.round ? p.size : p.size * 1.6,
              borderRadius: p.round ? p.size / 2 : 2,
              backgroundColor: p.color,
              opacity,
              transform: [{ translateX }, { translateY }, { rotate }],
            }}
          />
        );
      })}
    </View>
  );
}
