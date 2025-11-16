import { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { db } from '../../db/database';
import { Button, Input, Card, ConfirmDialog, EmptyState, Select, AlertDialog } from '../../components';
import { colors, spacing, typography } from '../../theme';
import { appEvents } from '../../utils/events';

export default function ListaProductos({ navigation }) {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [providerFilter, setProviderFilter] = useState('');
  const [categories, setCategories] = useState([]);
  const [providers, setProviders] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ visible: false, productId: null });
  const [alert, setAlert] = useState({ visible: false, type: 'success', title: '', message: '' });
  const [stats, setStats] = useState({ total: 0, totalValue: 0, byCategory: {} });

  const loadData = useCallback(() => {
    try {
      // Cargar categorías
      const cats = db.getAllSync(`SELECT * FROM categories ORDER BY name`);
      setCategories(cats);

      // Cargar proveedores
      const provs = db.getAllSync(`SELECT * FROM providers ORDER BY name`);
      setProviders(provs);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const loadProducts = useCallback(() => {
    try {
      let query = `
        SELECT p.*, pr.name as provider_name, c.name as category_name 
        FROM products p 
        LEFT JOIN providers pr ON p.provider_id = pr.id
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE (p.name LIKE ? OR pr.name LIKE ? OR c.name LIKE ?)
      `;
      
      const params = [`%${search}%`, `%${search}%`, `%${search}%`];

      // Filtro por categoría
      if (categoryFilter) {
        query += ` AND p.category_id = ?`;
        params.push(categoryFilter);
      }

      // Filtro por proveedor
      if (providerFilter) {
        query += ` AND p.provider_id = ?`;
        params.push(providerFilter);
      }

      query += ` ORDER BY p.name`;

      const rows = db.getAllSync(query, params);
      setProducts(rows);
      
      // Calcular estadísticas
      const total = rows.length;
      const totalValue = rows.reduce((sum, p) => sum + Number(p.price), 0);
      
      // Calcular por categoría
      const byCategory = {};
      rows.forEach(p => {
        const catName = p.category_name || 'Sin categoría';
        if (!byCategory[catName]) {
          byCategory[catName] = { count: 0, value: 0 };
        }
        byCategory[catName].count++;
        byCategory[catName].value += Number(p.price);
      });
      
      setStats({ total, totalValue, byCategory });
    } catch (e) { 
      console.error(e); 
    }
  }, [search, categoryFilter, providerFilter]);

  useEffect(() => { 
    loadData();
    loadProducts(); 
    
    const handleCategoriesChanged = () => loadData();
    const handleProvidersChanged = () => loadData();
    const handleProductsChanged = () => loadProducts();
    
    appEvents.on('categories:changed', handleCategoriesChanged);
    appEvents.on('providers:changed', handleProvidersChanged);
    appEvents.on('products:changed', handleProductsChanged);
    
    return () => {
      appEvents.off('categories:changed', handleCategoriesChanged);
      appEvents.off('providers:changed', handleProvidersChanged);
      appEvents.off('products:changed', handleProductsChanged);
    };
  }, [loadData, loadProducts]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    loadData();
    loadProducts();
    setRefreshing(false);
  }, [loadData, loadProducts]);

  const confirmDelete = (id) => {
    setDeleteDialog({ visible: true, productId: id });
  };

  const deleteProduct = () => {
    try {
      db.runSync(`DELETE FROM products WHERE id = ?`, [deleteDialog.productId]);
      
      appEvents.onProductsChanged();
      appEvents.onDataChanged();
      
      setAlert({
        visible: true,
        type: 'success',
        title: '¡Eliminado!',
        message: 'El producto se eliminó correctamente',
      });
      setDeleteDialog({ visible: false, productId: null });
      loadProducts();
    } catch (e) {
      setAlert({
        visible: true,
        type: 'error',
        title: 'Error',
        message: 'No se pudo eliminar el producto',
      });
      setDeleteDialog({ visible: false, productId: null });
    }
  };

  const clearFilters = () => {
    setSearch('');
    setCategoryFilter('');
    setProviderFilter('');
  };

  const formatCurrency = (value) => {
    if (value >= 1000000) {
      const millions = value / 1000000;
      if (millions % 1 !== 0) {
        return `$${millions.toFixed(3).replace(/\.?0+$/, '')}M`;
      }
      return `$${millions.toFixed(0)}M`;
    } else if (value >= 1000) {
      const thousands = value / 1000;
      if (thousands % 1 !== 0) {
        return `$${thousands.toFixed(3).replace(/\.?0+$/, '')}K`;
      }
      return `$${thousands.toFixed(0)}K`;
    } else {
      return `$${value.toFixed(0)}`;
    }
  };

  const hasActiveFilters = search || categoryFilter || providerFilter;

  const renderHeader = () => (
    <>
      {/* Header Principal */}
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        style={styles.headerGradient}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Productos</Text>
            <Text style={styles.headerSubtitle}>Inventario y Catálogo</Text>
          </View>
          <TouchableOpacity 
            style={styles.filterIconButton}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Ionicons 
              name={showFilters ? "close" : "options"} 
              size={24} 
              color="#fff" 
            />
            {hasActiveFilters && <View style={styles.filterBadge} />}
          </TouchableOpacity>
        </View>

        {/* Cards de resumen - 2x2 grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Card style={styles.statCardInner}>
              <View style={styles.statIconContainer}>
                <Ionicons name="cube" size={28} color={colors.primary} />
              </View>
              <Text style={styles.statValue}>{stats.total}</Text>
              <Text style={styles.statLabel}>Productos</Text>
            </Card>
          </View>

          <View style={styles.statCard}>
            <Card style={styles.statCardInner}>
              <View style={styles.statIconContainer}>
                <Ionicons name="cash" size={28} color={colors.success} />
              </View>
              <Text style={styles.statValue}>
                {formatCurrency(stats.totalValue)}
              </Text>
              <Text style={styles.statLabel}>Valor Total</Text>
            </Card>
          </View>

          <View style={styles.statCard}>
            <Card style={styles.statCardInner}>
              <View style={styles.statIconContainer}>
                <Ionicons name="folder" size={28} color={colors.secondary} />
              </View>
              <Text style={styles.statValue}>{categories.length}</Text>
              <Text style={styles.statLabel}>Categorías</Text>
            </Card>
          </View>

          <View style={styles.statCard}>
            <Card style={styles.statCardInner}>
              <View style={styles.statIconContainer}>
                <Ionicons name="business" size={28} color="#FF6B6B" />
              </View>
              <Text style={styles.statValue}>{providers.length}</Text>
              <Text style={styles.statLabel}>Proveedores</Text>
            </Card>
          </View>
        </View>

        {/* Búsqueda */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
          <Input
            placeholder="Buscar productos..."
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
            inputStyle={styles.searchInputField}
          />
        </View>

        {/* Botones de acción */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.primaryActionButton}
            onPress={() => navigation.navigate('FormProducto')}
            activeOpacity={0.8}
          >
            <Ionicons name="add-circle" size={24} color={colors.primary} />
            <Text style={styles.primaryActionText}>Nuevo Producto</Text>
          </TouchableOpacity>

          <View style={styles.secondaryButtons}>
            <TouchableOpacity 
              style={[styles.secondaryActionButton, { flex: 1 }]}
              onPress={() => navigation.navigate('ListaProveedores')}
              activeOpacity={0.8}
            >
              <Ionicons name="business" size={20} color="#fff" />
              <Text style={styles.secondaryActionText}>Proveedores</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.secondaryActionButton, { flex: 1 }]}
              onPress={() => navigation.navigate('ListaCategorias')}
              activeOpacity={0.8}
            >
              <Ionicons name="folder" size={20} color="#fff" />
              <Text style={styles.secondaryActionText}>Categorías</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* Filtros colapsables */}
      {showFilters && (
        <View style={styles.filtersSection}>
          <Card style={styles.filtersCard}>
            <View style={styles.filterHeader}>
              <Ionicons name="funnel" size={24} color={colors.primary} />
              <Text style={styles.filterTitle}>Filtros Avanzados</Text>
            </View>

            <Select
              label="Categoría"
              value={categoryFilter}
              onValueChange={setCategoryFilter}
              items={[
                { label: 'Todas las categorías', value: '' },
                ...categories.map(c => ({ label: c.name, value: c.id.toString() }))
              ]}
              icon="folder"
            />

            <Select
              label="Proveedor"
              value={providerFilter}
              onValueChange={setProviderFilter}
              items={[
                { label: 'Todos los proveedores', value: '' },
                ...providers.map(p => ({ label: p.name, value: p.id.toString() }))
              ]}
              icon="business"
            />

            <Button
              title="Limpiar Filtros"
              variant="outline"
              icon="refresh"
              onPress={clearFilters}
              size="small"
            />
          </Card>
        </View>
      )}

      {/* Desglose por categoría */}
      {Object.keys(stats.byCategory).length > 0 && (
        <View style={styles.breakdownSection}>
          <Text style={styles.sectionTitle}>Desglose por Categoría</Text>
          <Card style={styles.breakdownCard}>
            {Object.entries(stats.byCategory).map(([category, data]) => (
              <View key={category} style={styles.breakdownRow}>
                <View style={styles.breakdownLeft}>
                  <View style={[styles.categoryIndicator, { backgroundColor: getCategoryColor(category) }]} />
                  <Text style={styles.breakdownType}>{category}</Text>
                </View>
                <View style={styles.breakdownRight}>
                  <Text style={styles.breakdownCount}>{data.count} productos</Text>
                  <Text style={styles.breakdownAmount}>
                    ${data.value.toLocaleString('es-CO', { minimumFractionDigits: 0 })}
                  </Text>
                </View>
              </View>
            ))}
          </Card>
        </View>
      )}

      {/* Encabezado de lista */}
      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>Catálogo de Productos</Text>
        <Text style={styles.listCount}>
          {products.length} {products.length === 1 ? 'producto' : 'productos'}
        </Text>
      </View>
    </>
  );

  const renderProduct = ({ item }) => (
    <Card style={styles.productCard}>
      <TouchableOpacity 
        style={styles.cardContent}
        onPress={() => navigation.navigate('FormProducto', { product: item })}
        activeOpacity={0.7}
      >
        <View style={styles.cardTop}>
          <View style={styles.cardLeft}>
            <View style={styles.productIconContainer}>
              <Ionicons name="cube" size={32} color="#fff" />
            </View>
            <View style={styles.productInfo}>
              <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
              <Text style={styles.productPrice}>
                ${Number(item.price).toLocaleString('es-CO', { minimumFractionDigits: 2 })}
              </Text>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.deleteIconButton}
            onPress={() => confirmDelete(item.id)}
          >
            <Ionicons name="trash-outline" size={22} color={colors.error} />
          </TouchableOpacity>
        </View>

        {(item.provider_name || item.category_name) && (
          <View style={styles.productDetails}>
            {item.category_name && (
              <View style={styles.infoRow}>
                <Ionicons name="folder" size={16} color={colors.textSecondary} />
                <Text style={styles.infoText}>{item.category_name}</Text>
              </View>
            )}
            {item.provider_name && (
              <View style={styles.infoRow}>
                <Ionicons name="business" size={16} color={colors.textSecondary} />
                <Text style={styles.infoText}>{item.provider_name}</Text>
              </View>
            )}
          </View>
        )}

        {item.observations && (
          <Text style={styles.observations} numberOfLines={2}>
            {item.observations}
          </Text>
        )}
      </TouchableOpacity>
    </Card>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={products}
        keyExtractor={item => item.id.toString()}
        renderItem={renderProduct}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
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
            icon="cube-outline"
            title="No hay productos"
            message={hasActiveFilters ? "No se encontraron productos con los filtros aplicados" : "Agrega tu primer producto usando el botón 'Nuevo Producto'"}
          />
        }
      />

      <ConfirmDialog
        visible={deleteDialog.visible}
        onClose={() => setDeleteDialog({ visible: false, productId: null })}
        onConfirm={deleteProduct}
        title="¿Eliminar producto?"
        message="Esta acción no se puede deshacer"
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

// Función helper para colores por categoría
const getCategoryColor = (category) => {
  const colors = {
    'Sin categoría': '#999',
  };
  
  // Generar color basado en el hash del nombre
  if (!colors[category]) {
    const hash = category.split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0);
    const hue = hash % 360;
    colors[category] = `hsl(${hue}, 70%, 60%)`;
  }
  
  return colors[category];
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  headerTitle: {
    ...typography.h1,
    color: '#fff',
    fontSize: 28,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    ...typography.body,
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
  },
  filterIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.error,
    borderWidth: 2,
    borderColor: '#fff',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
    marginBottom: spacing.lg,
  },
  statCard: {
    width: '50%',
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.sm,
  },
  statCardInner: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  statValue: {
    ...typography.h3,
    color: colors.text,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    fontSize: 11,
  },
  searchContainer: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  searchIcon: {
    position: 'absolute',
    left: spacing.md,
    top: '50%',
    marginTop: -10,
    zIndex: 1,
  },
  searchInput: {
    marginBottom: 0,
  },
  searchInputField: {
    paddingLeft: spacing.xl + spacing.sm,
  },
  actionButtons: {
    gap: spacing.sm,
  },
  primaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
    gap: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryActionText: {
    ...typography.button,
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  secondaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  secondaryActionText: {
    ...typography.button,
    color: '#fff',
    fontSize: 14,
  },
  filtersSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  filtersCard: {
    padding: spacing.lg,
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  filterTitle: {
    ...typography.h3,
    color: colors.text,
  },
  breakdownSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  breakdownCard: {
    padding: spacing.md,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  breakdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  categoryIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  breakdownType: {
    ...typography.body,
    color: colors.text,
    fontWeight: '500',
  },
  breakdownRight: {
    alignItems: 'flex-end',
  },
  breakdownCount: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  breakdownAmount: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  listTitle: {
    ...typography.h3,
    color: colors.text,
  },
  listCount: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  productCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: 0,
  },
  cardContent: {
    padding: spacing.md,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  productIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  productPrice: {
    ...typography.h3,
    color: colors.success,
    fontWeight: 'bold',
  },
  deleteIconButton: {
    padding: spacing.sm,
  },
  productDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  infoText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  observations: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
});