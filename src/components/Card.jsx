import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows, typography } from '../theme';

export const Card = ({ 
  children, 
  title, 
  subtitle,
  icon,
  onPress,
  rightElement,
  variant = 'default',
  style,
}) => {
  const CardContent = (
    <View style={[
      styles.card,
      variant === 'elevated' && shadows.md,
      variant === 'outlined' && styles.outlined,
      style,
    ]}>
      {(title || icon || rightElement) && (
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {icon && (
              <View style={styles.iconContainer}>
                <Ionicons name={icon} size={24} color={colors.primary} />
              </View>
            )}
            <View style={styles.titleContainer}>
              {title && <Text style={styles.title}>{title}</Text>}
              {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
            </View>
          </View>
          {rightElement && <View style={styles.rightElement}>{rightElement}</View>}
        </View>
      )}
      
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
        {CardContent}
      </TouchableOpacity>
    );
  }

  return CardContent;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  outlined: {
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.none,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    ...typography.h4,
    marginBottom: 2,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  rightElement: {
    marginLeft: spacing.sm,
  },
  content: {
    // El contenido hijo va aquí
  },
});
