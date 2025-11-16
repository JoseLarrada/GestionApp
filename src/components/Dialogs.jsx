import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows, typography } from '../theme';
import { Button } from './Button';

export const ConfirmDialog = ({
  visible,
  onClose,
  onConfirm,
  title = '¿Estás seguro?',
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'default', // default, danger, warning
  icon,
}) => {
  const getVariantConfig = () => {
    switch (variant) {
      case 'danger':
        return {
          iconName: icon || 'alert-circle',
          iconColor: colors.error,
          iconBg: '#FFEBEE',
        };
      case 'warning':
        return {
          iconName: icon || 'warning',
          iconColor: colors.warning,
          iconBg: '#FFF3E0',
        };
      default:
        return {
          iconName: icon || 'help-circle',
          iconColor: colors.info,
          iconBg: colors.surfaceVariant,
        };
    }
  };

  const variantConfig = getVariantConfig();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.dialog}>
              <View style={[styles.iconContainer, { backgroundColor: variantConfig.iconBg }]}>
                <Ionicons name={variantConfig.iconName} size={48} color={variantConfig.iconColor} />
              </View>

              <Text style={styles.title}>{title}</Text>
              {message && <Text style={styles.message}>{message}</Text>}

              <View style={styles.buttons}>
                <Button
                  title={cancelText}
                  variant="outline"
                  onPress={onClose}
                  style={styles.button}
                />
                <Button
                  title={confirmText}
                  variant={variant === 'danger' ? 'danger' : 'primary'}
                  onPress={() => {
                    onConfirm();
                    onClose();
                  }}
                  style={styles.button}
                />
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export const AlertDialog = ({
  visible,
  onClose,
  title,
  message,
  type = 'info', // success, error, warning, info
  buttonText = 'Entendido',
}) => {
  const getTypeConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: 'checkmark-circle',
          color: colors.success,
          bg: '#E8F5E9',
        };
      case 'error':
        return {
          icon: 'close-circle',
          color: colors.error,
          bg: '#FFEBEE',
        };
      case 'warning':
        return {
          icon: 'warning',
          color: colors.warning,
          bg: '#FFF3E0',
        };
      default:
        return {
          icon: 'information-circle',
          color: colors.info,
          bg: colors.surfaceVariant,
        };
    }
  };

  const typeConfig = getTypeConfig();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.dialog}>
              <View style={[styles.iconContainer, { backgroundColor: typeConfig.bg }]}>
                <Ionicons name={typeConfig.icon} size={48} color={typeConfig.color} />
              </View>

              <Text style={styles.title}>{title}</Text>
              {message && <Text style={styles.message}>{message}</Text>}

              <Button
                title={buttonText}
                variant="primary"
                onPress={onClose}
                fullWidth
              />
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  dialog: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    ...shadows.xl,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h3,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  message: {
    ...typography.body,
    textAlign: 'center',
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  buttons: {
    flexDirection: 'row',
    width: '100%',
    gap: spacing.sm,
  },
  button: {
    flex: 1,
  },
});
