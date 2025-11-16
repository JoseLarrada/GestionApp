import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../db/database';
import { Button, Input, AlertDialog, Card } from '../../components';
import { colors, spacing, typography } from '../../theme';
import { appEvents } from '../../utils/events';

export default function FormDomiciliario({ route, navigation }) {
  const domiciliario = route.params?.domiciliario || {};
  const [name, setName] = useState(domiciliario.name || '');
  const [phone, setPhone] = useState(domiciliario.phone || '');
  const [observations, setObservations] = useState(domiciliario.observations || '');
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
      if (domiciliario.id) {
        db.runSync(
          `UPDATE domiciliarios SET name=?, phone=?, observations=? WHERE id=?`,
          [name.trim(), phone.trim() || null, observations.trim() || null, domiciliario.id]
        );
        setAlert({
          visible: true,
          type: 'success',
          title: '¡Actualizado!',
          message: 'El domiciliario se actualizó correctamente',
        });
      } else {
        db.runSync(
          `INSERT INTO domiciliarios (name, phone, observations) VALUES (?,?,?)`,
          [name.trim(), phone.trim() || null, observations.trim() || null]
        );
        setAlert({
          visible: true,
          type: 'success',
          title: '¡Guardado!',
          message: 'El domiciliario se registró correctamente',
        });
      }
      
      appEvents.onDomiciliariosChanged();
      appEvents.onDataChanged();
      
      setTimeout(() => navigation.goBack(), 1500);
    } catch (e) {
      setAlert({
        visible: true,
        type: 'error',
        title: 'Error',
        message: e.message || 'No se pudo guardar el domiciliario',
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
        colors={['#84b2f7ff', '#84b2f7ff']}
        style={styles.header}
      >
        <View style={styles.headerIconContainer}>
          <Ionicons name="bicycle" size={48} color="#fff" />
        </View>
        <Text style={styles.headerTitle}>
          {domiciliario.id ? 'Editar Domiciliario' : 'Nuevo Domiciliario'}
        </Text>
        <Text style={styles.headerSubtitle}>
          {domiciliario.id ? 'Actualiza la información' : 'Registra un nuevo domiciliario'}
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
              <Ionicons name="person" size={24} color="#fff" />
            </View>
            <Text style={styles.sectionTitle}>Información del Domiciliario</Text>
          </View>

          <Input
            label="Nombre completo *"
            placeholder="Ej: Juan Pérez"
            value={name}
            onChangeText={(text) => {
              setName(text);
              setErrors(prev => ({ ...prev, name: '' }));
            }}
            icon="person"
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

        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <Ionicons name="document-text" size={24} color="#fff" />
            </View>
            <Text style={styles.sectionTitle}>Información Adicional</Text>
          </View>

          <Input
            label="Observaciones"
            placeholder="Información adicional, zona de cobertura, horarios..."
            value={observations}
            onChangeText={setObservations}
            icon="document-text"
            multiline
            numberOfLines={4}
          />
        </Card>

        <View style={styles.buttonContainer}>
          <Button
            title={domiciliario.id ? 'Actualizar Domiciliario' : 'Guardar Domiciliario'}
            icon={domiciliario.id ? 'checkmark-circle' : 'add-circle'}
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
    backgroundColor: '#84b2f7ff',
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