import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { db } from '../../db/database';
import { Button, Input, AutocompleteInput, AlertDialog, Card } from '../../components';
import { colors, spacing, typography, shadows } from '../../theme';
import { appEvents } from '../../utils/events';

export default function FormProducto({ route, navigation }) {
  const product = route.params?.product || {};
  const [name, setName] = useState(product.name || '');
  const [price, setPrice] = useState(product.price?.toString() || '');
  const [providerName, setProviderName] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [observations, setObservations] = useState(product.observations || '');
  const [providers, setProviders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [providerSuggestions, setProviderSuggestions] = useState([]);
  const [categorySuggestions, setCategorySuggestions] = useState([]);
  const [errors, setErrors] = useState({});
  const [alert, setAlert] = useState({ visible: false, type: 'success', title: '', message: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    try {
      const prov = db.getAllSync(`SELECT * FROM providers ORDER BY name`);
      const cat = db.getAllSync(`SELECT * FROM categories ORDER BY name`);
      setProviders(prov);
      setCategories(cat);
      setProviderSuggestions(prov.map(p => p.name));
      setCategorySuggestions(cat.map(c => c.name));

      // Si es edición, cargar nombres existentes
      if (product.id) {
        if (product.provider_id) {
          const provider = prov.find(p => p.id === product.provider_id);
          if (provider) setProviderName(provider.name);
        }
        if (product.category_id) {
          const category = cat.find(c => c.id === product.category_id);
          if (category) setCategoryName(category.name);
        }
      }
    } catch (e) { 
      console.error(e); 
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }
    
    if (!price.trim()) {
      newErrors.price = 'El precio es requerido';
    } else if (isNaN(price) || parseFloat(price) < 0) {
      newErrors.price = 'Ingresa un precio válido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const save = () => {
    if (!validate()) return;

    try {
      // Obtener o crear proveedor
      let providerId = null;
      if (providerName.trim()) {
        let provider = providers.find(p => p.name.toLowerCase() === providerName.trim().toLowerCase());
        if (!provider) {
          // Crear nuevo proveedor
          const result = db.runSync(
            `INSERT INTO providers (name) VALUES (?)`,
            [providerName.trim()]
          );
          providerId = result.lastInsertRowId;
        } else {
          providerId = provider.id;
        }
      }

      // Obtener o crear categoría
      let categoryId = null;
      if (categoryName.trim()) {
        let category = categories.find(c => c.name.toLowerCase() === categoryName.trim().toLowerCase());
        if (!category) {
          // Crear nueva categoría
          const result = db.runSync(
            `INSERT INTO categories (name) VALUES (?)`,
            [categoryName.trim()]
          );
          categoryId = result.lastInsertRowId;
        } else {
          categoryId = category.id;
        }
      }

      if (product.id) {
        db.runSync(
          `UPDATE products SET name=?, price=?, provider_id=?, category_id=?, observations=? WHERE id=?`,
          [name.trim(), parseFloat(price), providerId, categoryId, observations.trim(), product.id]
        );
        setAlert({
          visible: true,
          type: 'success',
          title: '¡Actualizado!',
          message: 'El producto se actualizó correctamente',
        });
      } else {
        db.runSync(
          `INSERT INTO products (name, price, provider_id, category_id, observations) VALUES (?,?,?,?,?)`,
          [name.trim(), parseFloat(price), providerId, categoryId, observations.trim()]
        );
        setAlert({
          visible: true,
          type: 'success',
          title: '¡Guardado!',
          message: 'El producto se creó correctamente',
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
        message: e.message || 'No se pudo guardar el producto',
      });
    }
  };

  return (
    <View style={styles.container}>
      {/* Header con gradiente */}
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Ionicons name={product.id ? "pencil" : "add-circle"} size={32} color="#fff" />
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>
              {product.id ? 'Editar Producto' : 'Nuevo Producto'}
            </Text>
            <Text style={styles.headerSubtitle}>
              {product.id ? 'Actualiza la información' : 'Completa los datos del producto'}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Información del Producto */}
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.iconContainer}>
                <Ionicons name="cube" size={20} color={colors.primary} />
              </View>
              <Text style={styles.cardTitle}>Información del Producto</Text>
            </View>
            
            <Input
              label="Nombre del producto *"
              placeholder="Ej: Laptop Dell Inspiron 15"
              value={name}
              onChangeText={(text) => {
                setName(text);
                setErrors(prev => ({ ...prev, name: '' }));
              }}
              icon="pricetag"
              error={errors.name}
            />

            <Input
              label="Precio *"
              placeholder="0.00"
              value={price}
              onChangeText={(text) => {
                setPrice(text);
                setErrors(prev => ({ ...prev, price: '' }));
              }}
              icon="cash"
              keyboardType="decimal-pad"
              error={errors.price}
            />
          </Card>

          {/* Proveedor */}
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.iconContainer}>
                <Ionicons name="business" size={20} color={colors.primary} />
              </View>
              <Text style={styles.cardTitle}>Proveedor</Text>
              <TouchableOpacity 
                style={styles.linkButton}
                onPress={() => navigation.navigate('ListaProveedores')}
              >
                <Ionicons name="list" size={18} color={colors.primary} />
                <Text style={styles.linkText}>Ver todos</Text>
              </TouchableOpacity>
            </View>

            <AutocompleteInput
              label="Nombre del proveedor"
              placeholder="Escribe para buscar o crear nuevo..."
              value={providerName}
              onChangeText={setProviderName}
              suggestions={providerSuggestions}
              onSelectSuggestion={setProviderName}
              icon="business"
            />
            
            {providerName && !providers.find(p => p.name.toLowerCase() === providerName.toLowerCase()) && (
              <View style={styles.infoBox}>
                <Ionicons name="add-circle" size={20} color={colors.success} />
                <Text style={styles.infoText}>
                  Nuevo proveedor: <Text style={styles.infoBold}>"{providerName}"</Text>
                </Text>
              </View>
            )}

            {providerName && providers.find(p => p.name.toLowerCase() === providerName.toLowerCase()) && (
              <View style={[styles.infoBox, styles.successBox]}>
                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                <Text style={styles.successText}>
                  Proveedor existente
                </Text>
              </View>
            )}
          </Card>

          {/* Categoría */}
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.iconContainer}>
                <Ionicons name="folder" size={20} color={colors.primary} />
              </View>
              <Text style={styles.cardTitle}>Categoría</Text>
              <TouchableOpacity 
                style={styles.linkButton}
                onPress={() => navigation.navigate('ListaCategorias')}
              >
                <Ionicons name="list" size={18} color={colors.primary} />
                <Text style={styles.linkText}>Ver todas</Text>
              </TouchableOpacity>
            </View>

            <AutocompleteInput
              label="Nombre de la categoría"
              placeholder="Escribe para buscar o crear nueva..."
              value={categoryName}
              onChangeText={setCategoryName}
              suggestions={categorySuggestions}
              onSelectSuggestion={setCategoryName}
              icon="folder"
            />
            
            {categoryName && !categories.find(c => c.name.toLowerCase() === categoryName.toLowerCase()) && (
              <View style={styles.infoBox}>
                <Ionicons name="add-circle" size={20} color={colors.success} />
                <Text style={styles.infoText}>
                  Nueva categoría: <Text style={styles.infoBold}>"{categoryName}"</Text>
                </Text>
              </View>
            )}

            {categoryName && categories.find(c => c.name.toLowerCase() === categoryName.toLowerCase()) && (
              <View style={[styles.infoBox, styles.successBox]}>
                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                <Text style={styles.successText}>
                  Categoría existente
                </Text>
              </View>
            )}
          </Card>

          {/* Detalles Adicionales */}
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.iconContainer}>
                <Ionicons name="document-text" size={20} color={colors.primary} />
              </View>
              <Text style={styles.cardTitle}>Detalles Adicionales</Text>
            </View>
            
            <Input
              label="Observaciones"
              placeholder="Detalles adicionales del producto..."
              value={observations}
              onChangeText={setObservations}
              icon="chatbox-ellipses"
              multiline
              numberOfLines={4}
            />
          </Card>

          {/* Botones de acción */}
          <View style={styles.buttonContainer}>
            <Button
              title={product.id ? 'Actualizar Producto' : 'Guardar Producto'}
              icon={product.id ? 'checkmark-circle' : 'save'}
              onPress={save}
              fullWidth
            />
            
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <AlertDialog
        visible={alert.visible}
        onClose={() => setAlert({ ...alert, visible: false })}
        type={alert.type}
        title={alert.title}
        message={alert.message}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingTop: spacing.md,
  },
  card: {
    marginBottom: spacing.md,
    padding: spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    flex: 1,
    ...typography.h4,
    fontWeight: '600',
    color: colors.text,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.xs,
    borderRadius: 6,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
  },
  linkText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successLight || '#E8F5E9',
    padding: spacing.md,
    borderRadius: 8,
    gap: spacing.sm,
    marginTop: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.success,
  },
  successBox: {
    backgroundColor: colors.successLight || '#E8F5E9',
    borderLeftColor: colors.success,
  },
  infoText: {
    ...typography.bodySmall,
    color: colors.success,
    flex: 1,
  },
  infoBold: {
    fontWeight: '700',
  },
  successText: {
    ...typography.bodySmall,
    color: colors.success,
    fontWeight: '600',
  },
  buttonContainer: {
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  cancelButton: {
    alignItems: 'center',
    padding: spacing.md,
  },
  cancelButtonText: {
    ...typography.body,
    color: colors.textLight,
    fontWeight: '600',
  },
});