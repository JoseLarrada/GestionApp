import { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, shadows } from '../theme';

export default function AutocompleteInput({
  label,
  placeholder,
  value,
  onChangeText,
  suggestions = [],
  onSelectSuggestion,
  icon,
  error,
  style,
  ...props
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const inputRef = useRef(null);

  useEffect(() => {
    if (value && value.length > 0) {
      const filtered = suggestions.filter(item =>
        item.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredSuggestions(filtered);
      setShowSuggestions(filtered.length > 0 && isFocused);
    } else {
      setFilteredSuggestions([]);
      setShowSuggestions(false);
    }
  }, [value, suggestions, isFocused]);

  const handleSelectSuggestion = (suggestion) => {
    onSelectSuggestion(suggestion);
    setShowSuggestions(false);
    setIsFocused(false);
    if (inputRef.current) {
      inputRef.current.blur();
    }
  };

  return (
    <View style={[
      styles.container, 
      style,
      showSuggestions && filteredSuggestions.length > 0 && { marginBottom: spacing.md + Math.min(filteredSuggestions.length * 56, 200) }
    ]}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <View style={[
        styles.inputContainer,
        isFocused && styles.inputContainerFocused,
        error && styles.inputContainerError,
      ]}>
        {icon && (
          <Ionicons 
            name={icon} 
            size={20} 
            color={error ? colors.error : isFocused ? colors.primary : colors.textLight} 
            style={styles.icon}
          />
        )}
        
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={colors.textLight}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => {
            setIsFocused(true);
            if (value && value.length > 0) {
              setShowSuggestions(true);
            }
          }}
          autoCapitalize="words"
          autoCorrect={false}
          {...props}
        />

        {value && value.length > 0 && (
          <TouchableOpacity 
            onPress={() => {
              onChangeText('');
              setShowSuggestions(false);
            }}
            style={styles.clearButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close-circle" size={20} color={colors.textLight} />
          </TouchableOpacity>
        )}
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}

      {showSuggestions && filteredSuggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <ScrollView 
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled={true}
            style={styles.suggestionsList}
          >
            {filteredSuggestions.slice(0, 5).map((suggestion, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.suggestionItem,
                  index === filteredSuggestions.slice(0, 5).length - 1 && styles.suggestionItemLast
                ]}
                onPress={() => handleSelectSuggestion(suggestion)}
                activeOpacity={0.7}
              >
                <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                <Text style={styles.suggestionText}>{suggestion}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    minHeight: 48,
  },
  inputContainerFocused: {
    borderColor: colors.primary,
    ...shadows.sm,
  },
  inputContainerError: {
    borderColor: colors.error,
  },
  icon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    paddingVertical: spacing.sm,
  },
  clearButton: {
    padding: spacing.xs,
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
  },
  suggestionsContainer: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    marginTop: spacing.xs,
    ...shadows.lg,
    maxHeight: 200,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  suggestionsList: {
    maxHeight: 200,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    gap: spacing.sm,
  },
  suggestionItemLast: {
    borderBottomWidth: 0,
  },
  suggestionText: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
});
