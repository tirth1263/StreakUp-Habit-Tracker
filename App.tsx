import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { RootStackParamList } from './src/navigation';
import { HabitDetailsScreen } from './src/screens/HabitDetailsScreen';
import { HabitFormScreen } from './src/screens/HabitFormScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { StoreProvider, useStore } from './src/store';

const Stack = createNativeStackNavigator<RootStackParamList>();

function Root() {
  const { ready, theme } = useStore();

  const base = theme.dark ? DarkTheme : DefaultTheme;
  const navTheme = {
    ...base,
    colors: {
      ...base.colors,
      primary: theme.primary,
      background: theme.bg,
      card: theme.bg,
      text: theme.text,
      border: theme.bg,
    },
  };

  return (
    // On a wide browser window the app sits in a phone-width column.
    <View style={[styles.page, { backgroundColor: theme.dark ? '#000000' : '#E3E7EC' }]}>
      <View style={[styles.column, { backgroundColor: theme.bg }]}>
        {ready ? (
          <NavigationContainer theme={navTheme}>
            <Stack.Navigator
              screenOptions={{
                headerShadowVisible: false,
                headerTintColor: theme.text,
                headerStyle: { backgroundColor: theme.bg },
                headerBackButtonDisplayMode: 'minimal',
                contentStyle: { backgroundColor: theme.bg },
              }}
            >
              <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
              <Stack.Screen name="HabitForm" component={HabitFormScreen} options={{ title: 'New habit' }} />
              <Stack.Screen name="HabitDetails" component={HabitDetailsScreen} options={{ title: '' }} />
              <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
            </Stack.Navigator>
          </NavigationContainer>
        ) : (
          <View style={styles.loading}>
            <ActivityIndicator color={theme.primary} />
          </View>
        )}
      </View>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <Root />
      </StoreProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, alignItems: 'center' },
  column: { flex: 1, width: '100%', maxWidth: 480 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
