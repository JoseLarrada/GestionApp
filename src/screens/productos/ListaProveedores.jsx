import { useState, useEffect, useCallback } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, Text, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { db } from '../../db/database';
import { Button, Input, Card, ConfirmDialog, AlertDialog, EmptyState } from '../../components';
import { colors, spacing, typography, shadows } from '../../theme';
import { appEvents } from '../../utils/events';

export default function ListaProveedores({ navigation }) {
  const [providers, setProviders] = useState([]);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ visible: false, id: null });
  const [alert, setAlert] = useState({ visible: false, type: 'error', title: '', message: '' });
  const [stats, setStats] = useState({ total: 0 });

  const load = useCallback(() => {
    try {
      const rows = db.getAllSync(
        `SELECT * FROM providers WHERE name LIKE ? ORDER BY name`,
        [`%${search}%`]
      );
      setProviders(rows);
      setStats({ total: rows.length });
    } catch (e) { console.error(e); }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    load();
    setRefreshing(false);
  }, [load]);

  const confirmDelete = (id) => {
    setDeleteDialog({ visible: true, id });
  };

  const deleteProvider = () => {
    try {
      db.runSync(`DELETE FROM providers WHERE id = ?`, [deleteDialog.id]);
      
      // Emitir evento para refrescar automáticamente
      appEvents.onProductsChanged();
      
      load();
    } catch (e) {
      setAlert({
        visible: true,
        type: 'error',
        title: 'No se puede eliminar',
        message: 'Hay productos vinculados a este proveedor',
      });
    }
  };

  const renderProvider = ({ item }) => (
    <Card
      style={styles.providerCard}
      onPress={() => navigation.navigate('FormProveedor', { provider: item })}
    >
      <View style={styles.providerHeader}>
        <View style={styles.providerIcon}>
          <Ionicons name="business" size={28} color="#fff" />
        </View>
        <View style={styles.providerInfo}>
          <Text style={styles.providerName} numberOfLines={2}>{item.name}</Text>
          {item.phone && (
            <View style={styles.phoneRow}>
              <Ionicons name="call" size={16} color={colors.primary} />
              <Text style={styles.phoneText}>{item.phone}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => confirmDelete(item.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="trash-outline" size={24} color={colors.error} />
        </TouchableOpacity>
      </View>

      {item.notes && (
        <Text style={styles.notes} numberOfLines={2}>
          {item.notes}
        </Text>
      )}
    </Card>
  );

  return (
    <View style={styles.container}>
      {/* Header con fondo azul */}
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Lista de Proveedores</Text>
            <Text style={styles.headerSubtitle}>{stats.total} proveedores registrados</Text>
          </View>
        </View>

        <Input
          placeholder="Buscar proveedores..."
          value={search}
          onChangeText={setSearch}
          icon="search"
          style={styles.searchInput}
        />

        <Button
          title="Nuevo Proveedor"
          icon="add-circle"
          onPress={() => navigation.navigate('FormProveedor')}
          fullWidth
          style={styles.newButton}
        />
      </LinearGradient>

      <FlatList
        data={providers}
        keyExtractor={item => item.id.toString()}
        renderItem={renderProvider}
        contentContainerStyle={[
          styles.listContent,
          providers.length === 0 && styles.emptyList
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="business-outline"
            title="No hay proveedores"
            message={search ? "No se encontraron proveedores con ese criterio" : "Agrega tu primer proveedor usando el botón de arriba"}
          />
        }
      />

      <ConfirmDialog
        visible={deleteDialog.visible}
        onClose={() => setDeleteDialog({ visible: false, id: null })}
        onConfirm={deleteProvider}
        title="¿Eliminar proveedor?"
        message="Los productos vinculados quedarán sin proveedor"
        variant="danger"
      />

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
    padding: spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: spacing.lg,
  },
  headerTop: {
    marginBottom: spacing.md,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  searchInput: {
    marginBottom: spacing.md,
  },
  newButton: {
    height: 56,
  },
  listContent: {
    padding: spacing.lg,
  },
  emptyList: {
    flex: 1,
  },
  providerCard: {
    marginBottom: spacing.md,
    padding: spacing.lg,
  },
  providerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  providerIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  phoneText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  deleteButton: {
    padding: spacing.xs,
  },
  notes: {
    fontSize: 13,
    color: colors.textLight,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    lineHeight: 18,
  },
});