import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../db/database';
import { Button, Input, AlertDialog, Card } from '../../components';
import { colors, spacing, typography } from '../../theme';
import { appEvents } from '../../utils/events';

export default function FormProveedor({ route, navigation }) {
  const provider = route.params?.provider || {};
  const [name, setName] = useState(provider.name || '');
  const [phone, setPhone] = useState(provider.phone || '');
  const [notes, setNotes] = useState(provider.notes || '');
  const [errors, setErrors] = useState({});
  const [alert, setAlert] = useState({ visible: false, type: 'success', title: '', message: '' });

  const validate = () => {
    const newErrors = {};
    
    if (!name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const save = () => {
    if (!validate()) return;

    try {
      if (provider.id) {
        db.runSync(`UPDATE providers SET name=?, phone=?, notes=? WHERE id=?`, 
          [name.trim(), phone.trim() || null, notes.trim() || null, provider.id]);
        setAlert({
          visible: true,
          type: 'success',
          title: '¡Actualizado!',
          message: 'El proveedor se actualizó correctamente',
        });
      } else {
        db.runSync(`INSERT INTO providers (name, phone, notes) VALUES (?,?,?)`, 
          [name.trim(), phone.trim() || null, notes.trim() || null]);
        setAlert({
          visible: true,
          type: 'success',
          title: '¡Guardado!',
          message: 'El proveedor se creó correctamente',
        });
      }
      
      // Emitir evento para refrescar automáticamente
      appEvents.onProvidersChanged();
      appEvents.onDataChanged();
      
      setTimeout(() => navigation.goBack(), 1500);
    } catch (e) {
      setAlert({
        visible: true,
        type: 'error',
        title: 'Error',
        message: e.message || 'No se pudo guardar el proveedor',
      });
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      {/* Header con gradiente */}
      <LinearGradient
        colors={[colors.primary, '#1565C0']}
        style={styles.header}
      >
        <View style={styles.headerIconContainer}>
          <Ionicons name="business" size={48} color="#fff" />
        </View>
        <Text style={styles.headerTitle}>
          {provider.id ? 'Editar Proveedor' : 'Nuevo Proveedor'}
        </Text>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Información del Proveedor */}
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <Ionicons name="business" size={24} color="#fff" />
            </View>
            <Text style={styles.sectionTitle}>Información del Proveedor</Text>
          </View>

          <Input
            label="Nombre del proveedor *"
            placeholder="Ej: Distribuidora XYZ"
            value={name}
            onChangeText={(text) => {
              setName(text);
              setErrors(prev => ({ ...prev, name: '' }));
            }}
            icon="business"
            error={errors.name}
          />

          <Input
            label="Teléfono"
            placeholder="Ej: 3001234567"
            value={phone}
            onChangeText={setPhone}
            icon="call"
            keyboardType="phone-pad"
          />
        </Card>

        {/* Información Adicional */}
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <Ionicons name="document-text" size={24} color="#fff" />
            </View>
            <Text style={styles.sectionTitle}>Información Adicional</Text>
          </View>

          <Input
            label="Notas"
            placeholder="Información adicional del proveedor..."
            value={notes}
            onChangeText={setNotes}
            icon="document-text"
            multiline
            numberOfLines={4}
          />
        </Card>

        {/* Botones de acción */}
        <View style={styles.buttonContainer}>
          <Button
            title={provider.id ? 'Actualizar Proveedor' : 'Guardar Proveedor'}
            icon={provider.id ? 'checkmark-circle' : 'add-circle'}
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
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
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
    backgroundColor: colors.primary,
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