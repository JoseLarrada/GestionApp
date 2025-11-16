import { useEffect } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { initDatabase } from './src/db/database';
import AppNavigator from './src/navigation/AppNavigator';
import { StatusBar } from 'expo-status-bar';
import { colors } from './src/theme';

// Tema personalizado para la navegación
const CustomTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    notification: colors.primary,
  },
};

export default function App() {
  useEffect(() => {
    initDatabase();
  }, []);

  return (
    <NavigationContainer theme={CustomTheme}>
      <StatusBar style="light" backgroundColor={colors.primary} />
      <AppNavigator />
    </NavigationContainer>
  );
}