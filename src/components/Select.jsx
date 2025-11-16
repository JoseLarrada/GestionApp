import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows, typography } from '../theme';

export const Select = ({
  label,
  value,
  onValueChange,
  items = [],
  placeholder = 'Seleccionar...',
  error,
  icon,
  disabled = false,
  style,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const selectedItem = items.find(item => 
    item.value?.toString() === value?.toString()
  );

  const handleSelect = (item) => {
    onValueChange(item.value);
    setIsOpen(false);
  };

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <TouchableOpacity
        style={[
          styles.selectButton,
          error && styles.selectError,
          disabled && styles.selectDisabled,
        ]}
        onPress={() => !disabled && setIsOpen(true)}
        disabled={disabled}
      >
        {icon && (
          <Ionicons 
            name={icon} 
            size={20} 
            color={error ? colors.error : colors.textLight} 
            style={styles.leftIcon}
          />
        )}
        
        <Text style={[
          styles.selectText,
          !selectedItem && styles.placeholderText,
        ]}>
          {selectedItem ? selectedItem.label : placeholder}
        </Text>
        
        <Ionicons 
          name={isOpen ? 'chevron-up' : 'chevron-down'} 
          size={20} 
          color={colors.textLight}
        />
      </TouchableOpacity>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1}
          onPress={() => setIsOpen(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label || placeholder}</Text>
              <TouchableOpacity onPress={() => setIsOpen(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={items}
              keyExtractor={(item, index) => item.value?.toString() || index.toString()}
              renderItem={({ item }) => {
                const isSelected = item.value?.toString() === value?.toString();
                return (
                  <TouchableOpacity
                    style={[
                      styles.option,
                      isSelected && styles.optionSelected,
                    ]}
                    onPress={() => handleSelect(item)}
                  >
                    <Text style={[
                      styles.optionText,
                      isSelected && styles.optionTextSelected,
                    ]}>
                      {item.label}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark" size={24} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                );
              }}
              style={styles.optionsList}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    minHeight: 48,
  },
  selectError: {
    borderColor: colors.error,
    backgroundColor: '#FFEBEE',
  },
  selectDisabled: {
    backgroundColor: colors.backgroundLight,
    opacity: 0.6,
  },
  leftIcon: {
    marginRight: spacing.sm,
  },
  selectText: {
    flex: 1,
    ...typography.body,
    color: colors.text,
  },
  placeholderText: {
    color: colors.textLight,
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '70%',
    ...shadows.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    ...typography.h4,
  },
  optionsList: {
    maxHeight: 400,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  optionSelected: {
    backgroundColor: colors.surfaceVariant,
  },
  optionText: {
    ...typography.body,
    color: colors.text,
  },
  optionTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
});
