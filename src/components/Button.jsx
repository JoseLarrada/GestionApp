import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows, typography } from '../theme';

export const Button = ({ 
  title, 
  onPress, 
  variant = 'primary', 
  size = 'medium',
  icon = null,
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
}) => {
  const getVariantStyle = () => {
    switch (variant) {
      case 'primary':
        return styles.primaryButton;
      case 'secondary':
        return styles.secondaryButton;
      case 'outline':
        return styles.outlineButton;
      case 'ghost':
        return styles.ghostButton;
      case 'danger':
        return styles.dangerButton;
      default:
        return styles.primaryButton;
    }
  };

  const getTextVariantStyle = () => {
    switch (variant) {
      case 'primary':
        return styles.primaryText;
      case 'secondary':
        return styles.secondaryText;
      case 'outline':
        return styles.outlineText;
      case 'ghost':
        return styles.ghostText;
      case 'danger':
        return styles.dangerText;
      default:
        return styles.primaryText;
    }
  };

  const getSizeStyle = () => {
    switch (size) {
      case 'small':
        return styles.smallButton;
      case 'medium':
        return styles.mediumButton;
      case 'large':
        return styles.largeButton;
      default:
        return styles.mediumButton;
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        getVariantStyle(),
        getSizeStyle(),
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.textOnPrimary : colors.primary} />
      ) : (
        <View style={styles.content}>
          {icon && (
            <Ionicons 
              name={icon} 
              size={size === 'small' ? 16 : size === 'large' ? 24 : 20} 
              color={variant === 'primary' || variant === 'danger' ? colors.textOnPrimary : colors.primary}
              style={styles.icon}
            />
          )}
          <Text style={[styles.text, getTextVariantStyle()]}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: spacing.xs,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Variants
  primaryButton: {
    backgroundColor: colors.primary,
    ...shadows.sm,
  },
  secondaryButton: {
    backgroundColor: colors.secondary,
    ...shadows.sm,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  ghostButton: {
    backgroundColor: 'transparent',
  },
  dangerButton: {
    backgroundColor: colors.error,
    ...shadows.sm,
  },
  
  // Text variants
  primaryText: {
    color: colors.textOnPrimary,
  },
  secondaryText: {
    color: colors.textOnPrimary,
  },
  outlineText: {
    color: colors.primary,
  },
  ghostText: {
    color: colors.primary,
  },
  dangerText: {
    color: colors.textOnPrimary,
  },
  
  // Sizes
  smallButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    minHeight: 36,
  },
  mediumButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    minHeight: 44,
  },
  largeButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    minHeight: 52,
  },
  
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
});
