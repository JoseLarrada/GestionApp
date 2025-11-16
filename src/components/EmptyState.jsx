import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../theme';

export const EmptyState = ({ 
  icon = 'folder-open-outline', 
  title = 'No hay datos', 
  message = 'Agrega tu primer elemento para comenzar',
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <Ionicons name={icon} size={64} color={colors.textLight} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  title: {
    ...typography.h3,
    color: colors.textSecondary,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  message: {
    ...typography.body,
    color: colors.textLight,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
});
