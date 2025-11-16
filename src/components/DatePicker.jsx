import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../theme';

export const DatePicker = ({
  label,
  value,
  onChange,
  mode = 'date',
  placeholder = 'Seleccionar fecha...',
  error,
  disabled = false,
  minimumDate,
  maximumDate,
  style,
}) => {
  const [show, setShow] = useState(false);

  const formatDate = (date) => {
    if (!date) return placeholder;
    
    if (mode === 'date') {
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
    } else if (mode === 'time') {
      return date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else {
      return date.toLocaleString('es-ES', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  };

  const handleChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShow(false);
    }
    
    if (selectedDate) {
      onChange(selectedDate);
    }
  };

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <TouchableOpacity
        style={[
          styles.dateButton,
          error && styles.dateError,
          disabled && styles.dateDisabled,
        ]}
        onPress={() => !disabled && setShow(true)}
        disabled={disabled}
      >
        <Ionicons 
          name={mode === 'time' ? 'time' : 'calendar'} 
          size={20} 
          color={error ? colors.error : colors.primary} 
          style={styles.icon}
        />
        
        <Text style={[
          styles.dateText,
          !value && styles.placeholderText,
        ]}>
          {formatDate(value)}
        </Text>
        
        <Ionicons 
          name="chevron-down" 
          size={20} 
          color={colors.textLight}
        />
      </TouchableOpacity>

      {error && <Text style={styles.errorText}>{error}</Text>}

      {show && (
        <DateTimePicker
          value={value || new Date()}
          mode={mode}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleChange}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
        />
      )}

      {Platform.OS === 'ios' && show && (
        <View style={styles.iosButtons}>
          <TouchableOpacity onPress={() => setShow(false)}>
            <Text style={styles.iosButtonText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShow(false)}>
            <Text style={[styles.iosButtonText, styles.iosDoneButton]}>Listo</Text>
          </TouchableOpacity>
        </View>
      )}
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
  dateButton: {
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
  dateError: {
    borderColor: colors.error,
    backgroundColor: '#FFEBEE',
  },
  dateDisabled: {
    backgroundColor: colors.backgroundLight,
    opacity: 0.6,
  },
  icon: {
    marginRight: spacing.sm,
  },
  dateText: {
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
  iosButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  iosButtonText: {
    ...typography.body,
    color: colors.primary,
  },
  iosDoneButton: {
    fontWeight: '600',
  },
});
