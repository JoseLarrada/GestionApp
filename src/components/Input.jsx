import React, { useState } from 'react';
import { TextInput, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../theme';

export const Input = ({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  error,
  helperText,
  multiline = false,
  keyboardType = 'default',
  secureTextEntry = false,
  editable = true,
  style,
  inputStyle,
  formatNumber = false, // Nueva prop para activar formato numérico
  ...props
}) => {
  const [displayValue, setDisplayValue] = useState(value);

  // Función para formatear número con separadores de miles
  const formatNumberWithSeparators = (text) => {
    // Remover todo excepto números y punto decimal
    const cleaned = text.replace(/[^\d.]/g, '');
    
    // Dividir en parte entera y decimal
    const parts = cleaned.split('.');
    let integerPart = parts[0];
    const decimalPart = parts[1];
    
    // Agregar separadores de miles
    integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    
    // Reconstruir el número
    return decimalPart !== undefined ? `${integerPart},${decimalPart}` : integerPart;
  };

  // Función para quitar formato y obtener valor real
  const unformatNumber = (text) => {
    return text.replace(/\./g, '').replace(',', '.');
  };

  const handleChangeText = (text) => {
    if (formatNumber && (keyboardType === 'numeric' || keyboardType === 'decimal-pad')) {
      // Remover formato anterior
      const cleanValue = text.replace(/\./g, '').replace(',', '.');
      
      // Validar que sea un número válido
      if (cleanValue === '' || /^\d*\.?\d*$/.test(cleanValue)) {
        // Formatear para display
        const formatted = formatNumberWithSeparators(text);
        setDisplayValue(formatted);
        
        // Enviar valor sin formato al parent
        onChangeText(cleanValue);
      }
    } else {
      setDisplayValue(text);
      onChangeText(text);
    }
  };

  // Sincronizar displayValue cuando value cambia desde el parent
  React.useEffect(() => {
    if (formatNumber && value !== undefined && value !== null) {
      const formatted = formatNumberWithSeparators(value.toString());
      setDisplayValue(formatted);
    } else {
      setDisplayValue(value);
    }
  }, [value, formatNumber]);

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <View style={[
        styles.inputContainer,
        error && styles.inputError,
        !editable && styles.inputDisabled,
      ]}>
        {icon && (
          <Ionicons 
            name={icon} 
            size={20} 
            color={error ? colors.error : colors.textLight} 
            style={styles.icon}
          />
        )}
        
        <TextInput
          style={[
            styles.input,
            multiline && styles.multilineInput,
            inputStyle,
          ]}
          value={displayValue}
          onChangeText={handleChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textLight}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          editable={editable}
          multiline={multiline}
          {...props}
        />
      </View>
      
      {(error || helperText) && (
        <Text style={[styles.helperText, error && styles.errorText]}>
          {error || helperText}
        </Text>
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
  },
  inputError: {
    borderColor: colors.error,
    backgroundColor: '#FFEBEE',
  },
  inputDisabled: {
    backgroundColor: colors.backgroundLight,
    opacity: 0.6,
  },
  icon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    ...typography.body,
    paddingVertical: spacing.sm + 4,
    color: colors.text,
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: spacing.md,
  },
  helperText: {
    ...typography.caption,
    color: colors.textLight,
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
  },
  errorText: {
    color: colors.error,
  },
});
