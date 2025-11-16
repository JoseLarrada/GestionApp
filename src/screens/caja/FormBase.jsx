import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { addBase } from '../../db/database';
import { Button, Input, AlertDialog, Card, DatePicker } from '../../components';
import { colors, spacing, typography } from '../../theme';
import { appEvents } from '../../utils/events';

export default function FormBase({ navigation }) {
  const [amount, setAmount] = useState('');
  const [observations, setObservations] = useState('');
  const [date, setDate] = useState(new Date());
  const [errors, setErrors] = useState({});
  const [alert, setAlert] = useState({ visible: false, type: 'success', title: '', message: '' });

  const formatNumber = (value) => {
    const cleaned = value.replace(/[^\d.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      return amount;
    }
    const [integer, decimal] = parts;
    const formattedInteger = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return decimal !== undefined ? `${formattedInteger}.${decimal}` : formattedInteger;
  };

  const parseNumber = (formattedValue) => {
    return formattedValue.replace(/,/g, '');
  };

  const validate = () => {
    const newErrors = {};
    
    if (!amount.trim()) {
      newErrors.amount = 'El monto es requerido';
    } else {
      const numValue = parseFloat(parseNumber(amount));
      if (isNaN(numValue) || numValue <= 0) {
        newErrors.amount = 'Ingresa un monto válido mayor a 0';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const save = () => {
    if (!validate()) return;

    try {
      const numericAmount = parseFloat(parseNumber(amount));
      
      const success = addBase(numericAmount, observations.trim() || null);
      
      if (success) {
        setAlert({
          visible: true,
          type: 'success',
          title: '¡Guardado!',
          message: 'El dinero se agregó a la base correctamente',
        });
        
        appEvents.onBaseChanged();
        appEvents.onDataChanged();
        
        setTimeout(() => navigation.goBack(), 1500);
      } else {
        throw new Error('No se pudo guardar');
      }
    } catch (e) {
      setAlert({
        visible: true,
        type: 'error',
        title: 'Error',
        message: e.message || 'No se pudo agregar el dinero a la base',
      });
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <LinearGradient
        colors={['#4CAF50', '#388E3C']}
        style={styles.header}
      >
        <View style={styles.headerIconContainer}>
          <Ionicons name="cash" size={48} color="#fff" />
        </View>
        <Text style={styles.headerTitle}>Agregar a Base</Text>
        <Text style={styles.headerSubtitle}>
          Registra dinero entregado para caja menor
        </Text>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <Ionicons name="information-circle" size={24} color="#fff" />
            </View>
            <Text style={styles.sectionTitle}>Información</Text>
          </View>

          <Input
            label="Monto *"
            placeholder="0.00"
            value={formatNumber(amount)}
            onChangeText={(text) => {
              setAmount(parseNumber(text));
              setErrors(prev => ({ ...prev, amount: '' }));
            }}
            icon="cash"
            keyboardType="decimal-pad"
            error={errors.amount}
          />

          <DatePicker
            label="Fecha"
            value={date}
            onChange={setDate}
            mode="date"
          />

          <Input
            label="Observaciones"
            placeholder="Notas o detalles adicionales..."
            value={observations}
            onChangeText={setObservations}
            icon="document-text"
            multiline
            numberOfLines={4}
          />
        </Card>

        <View style={styles.buttonContainer}>
          <Button
            title="Agregar a Base"
            icon="add-circle"
            onPress={save}
            fullWidth
            style={styles.saveButton}
          />
          
          <Button
            title="Cancelar"
            variant="outline"
            onPress={() => navigation.goBack()}
            fullWidth
          />
        </View>
      </ScrollView>

      <AlertDialog
        visible={alert.visible}
        onClose={() => setAlert({ ...alert, visible: false })}
        type={alert.type}
        title={alert.title}
        message={alert.message}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  headerIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerTitle: {
    ...typography.h1,
    color: '#fff',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    ...typography.body,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
  },
  buttonContainer: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  saveButton: {
    marginBottom: spacing.sm,
    backgroundColor: '#4CAF50',
  },
});