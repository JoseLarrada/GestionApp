import { useState, useEffect, useCallback } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, Text, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { db } from '../../db/database';
import { Button, Input, Card, ConfirmDialog, AlertDialog, EmptyState } from '../../components';
import { colors, spacing, typography, shadows } from '../../theme';
import { appEvents } from '../../utils/events';

export default function ListaCategorias({ navigation }) {
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ visible: false, id: null });
  const [alert, setAlert] = useState({ visible: false, type: 'error', title: '', message: '' });
  const [stats, setStats] = useState({ total: 0 });

  const load = useCallback(() => {
    try {
      const rows = db.getAllSync(
        `SELECT * FROM categories WHERE name LIKE ? ORDER BY name`,
        [`%${search}%`]
      );
      setCategories(rows);
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

  const deleteCat = () => {
    try {
      db.runSync(`DELETE FROM categories WHERE id = ?`, [deleteDialog.id]);
      
      // Emitir evento para refrescar automáticamente
      appEvents.onProductsChanged();
      
      load();
    } catch (e) {
      setAlert({
        visible: true,
        type: 'error',
        title: 'No se puede eliminar',
        message: 'Hay productos vinculados a esta categoría',
      });
    }
  };

  const renderCategory = ({ item }) => (
    <Card
      style={styles.categoryCard}
      onPress={() => navigation.navigate('FormCategoria', { category: item })}
    >
      <View style={styles.categoryHeader}>
        <View style={styles.categoryIcon}>
          <Ionicons name="folder" size={28} color="#fff" />
        </View>
        <View style={styles.categoryInfo}>
          <Text style={styles.categoryName} numberOfLines={2}>{item.name}</Text>
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => confirmDelete(item.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="trash-outline" size={24} color={colors.error} />
        </TouchableOpacity>
      </View>
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
            <Text style={styles.headerTitle}>Lista de Categorías</Text>
            <Text style={styles.headerSubtitle}>{stats.total} categorías registradas</Text>
          </View>
        </View>

        <Input
          placeholder="Buscar categorías..."
          value={search}
          onChangeText={setSearch}
          icon="search"
          style={styles.searchInput}
        />

        <Button
          title="Nueva Categoría"
          icon="add-circle"
          onPress={() => navigation.navigate('FormCategoria')}
          fullWidth
          style={styles.newButton}
        />
      </LinearGradient>

      <FlatList
        data={categories}
        keyExtractor={item => item.id.toString()}
        renderItem={renderCategory}
        contentContainerStyle={[
          styles.listContent,
          categories.length === 0 && styles.emptyList
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
            icon="folder-outline"
            title="No hay categorías"
            message={search ? "No se encontraron categorías con ese criterio" : "Agrega tu primera categoría usando el botón de arriba"}
          />
        }
      />

      <ConfirmDialog
        visible={deleteDialog.visible}
        onClose={() => setDeleteDialog({ visible: false, id: null })}
        onConfirm={deleteCat}
        title="¿Eliminar categoría?"
        message="Los productos vinculados quedarán sin categoría"
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
  categoryCard: {
    marginBottom: spacing.md,
    padding: spacing.lg,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  deleteButton: {
    padding: spacing.xs,
  },
});