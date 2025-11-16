import { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { db } from '../../db/database';
import { Button, Input, AlertDialog } from '../../components';
import { colors, spacing } from '../../theme';
import { appEvents } from '../../utils/events';

export default function FormCategoria({ route, navigation }) {
  const category = route.params?.category || {};
  const [name, setName] = useState(category.name || '');
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
      if (category.id) {
        db.runSync(`UPDATE categories SET name = ? WHERE id = ?`, [name.trim(), category.id]);
        setAlert({
          visible: true,
          type: 'success',
          title: '¡Actualizado!',
          message: 'La categoría se actualizó correctamente',
        });
      } else {
        db.runSync(`INSERT INTO categories (name) VALUES (?)`, [name.trim()]);
        setAlert({
          visible: true,
          type: 'success',
          title: '¡Guardado!',
          message: 'La categoría se creó correctamente',
        });
      }
      
      // Emitir evento para refrescar automáticamente
      appEvents.onProductsChanged();
      
      setTimeout(() => navigation.goBack(), 1500);
    } catch (e) {
      setAlert({
        visible: true,
        type: 'error',
        title: 'Error',
        message: e.message || 'No se pudo guardar la categoría',
      });
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Input
          label="Nombre de la categoría *"
          placeholder="Ej: Electrónicos"
          value={name}
          onChangeText={(text) => {
            setName(text);
            setErrors(prev => ({ ...prev, name: '' }));
          }}
          icon="folder"
          error={errors.name}
        />

        <View style={styles.buttonContainer}>
          <Button
            title={category.id ? 'Actualizar' : 'Guardar'}
            icon={category.id ? 'checkmark' : 'add'}
            onPress={save}
            fullWidth
          />
        </View>
      </View>

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
  content: {
    padding: spacing.md,
  },
  buttonContainer: {
    marginTop: spacing.md,
  },
});