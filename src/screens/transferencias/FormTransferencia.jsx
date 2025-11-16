import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../db/database';
import { Button, Input, Select, DatePicker, AlertDialog, Card } from '../../components';
import { colors, spacing, typography } from '../../theme';
import { appEvents } from '../../utils/events';

const accountTypes = ['Nequi', 'Daviplata', 'Bancolombia', 'Datafono', 'Otro'];

export default function FormTransferencia({ route, navigation }) {
  const transfer = route.params?.transfer || {};
  const [amount, setAmount] = useState(transfer.amount?.toString() || '');
  const [type, setType] = useState(transfer.account_type || 'Nequi');
  const [sender, setSender] = useState(transfer.sender_name || '');
  const [obs, setObs] = useState(transfer.observations || '');
  const [date, setDate] = useState(transfer.date ? new Date(transfer.date) : new Date());
  const [errors, setErrors] = useState({});
  const [alert, setAlert] = useState({ visible: false, type: 'success', title: '', message: '' });

  const validate = () => {
    const newErrors = {};
    
    if (!amount.trim()) {
      newErrors.amount = 'El monto es requerido';
    } else if (isNaN(amount) || parseFloat(amount) <= 0) {
      newErrors.amount = 'Ingresa un monto válido mayor a 0';
    }

    if (!sender.trim()) {
      newErrors.sender = 'El nombre del remitente es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const save = () => {
    if (!validate()) return;

    try {
      if (transfer.id) {
        db.runSync(
          `UPDATE transfers SET amount=?, account_type=?, sender_name=?, observations=?, date=? WHERE id=?`,
          [parseFloat(amount), type, sender.trim(), obs.trim() || null, date.getTime(), transfer.id]
        );
        setAlert({
          visible: true,
          type: 'success',
          title: '¡Actualizado!',
          message: 'La transferencia se actualizó correctamente',
        });
      } else {
        db.runSync(
          `INSERT INTO transfers (amount, account_type, sender_name, observations, date) VALUES (?,?,?,?,?)`,
          [parseFloat(amount), type, sender.trim(), obs.trim() || null, date.getTime()]
        );
        setAlert({
          visible: true,
          type: 'success',
          title: '¡Guardado!',
          message: 'La transferencia se registró correctamente',
        });
      }
      
      // Emitir eventos para refrescar automáticamente
      appEvents.onTransfersChanged();
      appEvents.onDataChanged();
      
      setTimeout(() => navigation.goBack(), 1500);
    } catch (e) {
      setAlert({
        visible: true,
        type: 'error',
        title: 'Error',
        message: e.message || 'No se pudo guardar la transferencia',
      });
    }
  };

  const typeItems = accountTypes.map(t => ({ label: t, value: t }));

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      {/* Header con gradiente */}
      <LinearGradient
        colors={[colors.secondary, '#00897B']}
        style={styles.header}
      >
        <View style={styles.headerIconContainer}>
          <Ionicons name="send" size={48} color="#fff" />
        </View>
        <Text style={styles.headerTitle}>
          {transfer.id ? 'Editar Transferencia' : 'Nueva Transferencia'}
        </Text>
        <Text style={styles.headerSubtitle}>
          {transfer.id ? 'Actualiza la información de la transferencia' : 'Registra un nuevo ingreso recibido'}
        </Text>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Información de la Transferencia */}
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <Ionicons name="cash" size={24} color="#fff" />
            </View>
            <Text style={styles.sectionTitle}>Información de la Transferencia</Text>
          </View>

          <Input
            label="Monto *"
            placeholder="0.00"
            value={amount}
            onChangeText={(text) => {
              setAmount(text);
              setErrors(prev => ({ ...prev, amount: '' }));
            }}
            icon="cash"
            keyboardType="decimal-pad"
            formatNumber={true}
            error={errors.amount}
          />

          <Select
            label="Tipo de cuenta *"
            value={type}
            onValueChange={setType}
            items={typeItems}
            icon="wallet"
          />

          <DatePicker
            label="Fecha de la transferencia"
            value={date}
            onChange={setDate}
            mode="date"
          />
        </Card>

        {/* Información del Remitente */}
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <Ionicons name="person" size={24} color="#fff" />
            </View>
            <Text style={styles.sectionTitle}>Información del Remitente</Text>
          </View>

          <Input
            label="Nombre del remitente *"
            placeholder="Ej: Juan Pérez"
            value={sender}
            onChangeText={(text) => {
              setSender(text);
              setErrors(prev => ({ ...prev, sender: '' }));
            }}
            icon="person"
            error={errors.sender}
          />
        </Card>

        {/* Detalles Adicionales */}
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <Ionicons name="document-text" size={24} color="#fff" />
            </View>
            <Text style={styles.sectionTitle}>Detalles Adicionales</Text>
          </View>

          <Input
            label="Observaciones"
            placeholder="Detalles, notas o comentarios sobre la transferencia..."
            value={obs}
            onChangeText={setObs}
            icon="document-text"
            multiline
            numberOfLines={4}
          />
        </Card>

        {/* Botones de acción */}
        <View style={styles.buttonContainer}>
          <Button
            title={transfer.id ? 'Actualizar Transferencia' : 'Guardar Transferencia'}
            icon={transfer.id ? 'checkmark-circle' : 'add-circle'}
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
    backgroundColor: colors.secondary,
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
  },
});