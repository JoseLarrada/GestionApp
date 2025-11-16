import { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { db, getBaseBalance } from '../../db/database';
import { Button, Card, ConfirmDialog, EmptyState, AlertDialog, DatePicker } from '../../components';
import { colors, spacing, typography } from '../../theme';
import { appEvents } from '../../utils/events';

export default function ListaBases({ navigation }) {
  const [bases, setBases] = useState([]);
  const [balance, setBalance] = useState(0);
  const [totalBase, setTotalBase] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ visible: false, id: null });
  const [alert, setAlert] = useState({ visible: false, type: 'success', title: '', message: '' });

  const load = useCallback(() => {
    const from = fromDate ? fromDate.getTime() : 0;
    const to = toDate ? toDate.getTime() + 86400000 : Date.now() + 86400000;

    try {
      const list = db.getAllSync(
        `SELECT * FROM base WHERE date >= ? AND date <= ? ORDER BY date DESC`,
        [from, to]
      );
      setBases(list);

      const total = db.getFirstSync(
        `SELECT SUM(amount) as total FROM base WHERE date >= ? AND date <= ?`,
        [from, to]
      )?.total || 0;
      setTotalBase(total);

      const expenses = db.getFirstSync(
        `SELECT SUM(amount) as total FROM expenses`
      )?.total || 0;
      setTotalExpenses(expenses);

      const currentBalance = getBaseBalance();
      setBalance(currentBalance);
    } catch (e) {
      console.error(e);
    }
  }, [fromDate, toDate]);

  useEffect(() => {
    load();

    const handleBaseChanged = () => load();
    const handleExpensesChanged = () => load();
    const handleDataChanged = () => load();

    appEvents.on('base:changed', handleBaseChanged);
    appEvents.on('expenses:changed', handleExpensesChanged);
    appEvents.on('data:changed', handleDataChanged);

    return () => {
      appEvents.off('base:changed', handleBaseChanged);
      appEvents.off('expenses:changed', handleExpensesChanged);
      appEvents.off('data:changed', handleDataChanged);
    };
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    load();
    setRefreshing(false);
  }, [load]);

  const confirmDelete = (id) => {
    setDeleteDialog({ visible: true, id });
  };

  const deleteBase = () => {
    try {
      db.runSync(`DELETE FROM base WHERE id = ?`, [deleteDialog.id]);

      appEvents.onBaseChanged();
      appEvents.onDataChanged();

      setAlert({
        visible: true,
        type: 'success',
        title: '¡Eliminado!',
        message: 'El registro se eliminó correctamente',
      });
      setDeleteDialog({ visible: false, id: null });
      load();
    } catch (e) {
      setAlert({
        visible: true,
        type: 'error',
        title: 'Error',
        message: 'No se pudo eliminar el registro',
      });
    }
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

  const hasActiveFilters = fromDate || toDate;

  const renderHeader = () => (
    <>
      {/* Header Principal */}
      <LinearGradient
        colors={['#4CAF50', '#388E3C']}
        style={styles.headerGradient}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Base de Caja</Text>
            <Text style={styles.headerSubtitle}>Registro de Entregas</Text>
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
                <Ionicons name="cash" size={28} color={colors.success} />
              </View>
              <Text style={[styles.statValue, { color: balance >= 0 ? colors.success : colors.error }]}>
                {formatCurrency(balance)}
              </Text>
              <Text style={styles.statLabel}>Saldo Actual</Text>
            </Card>
          </View>

          <View style={styles.statCard}>
            <Card style={styles.statCardInner}>
              <View style={styles.statIconContainer}>
                <Ionicons name="trending-up" size={28} color="#4CAF50" />
              </View>
              <Text style={styles.statValue}>
                {formatCurrency(totalBase)}
              </Text>
              <Text style={styles.statLabel}>Total Entregado</Text>
            </Card>
          </View>

          <View style={styles.statCard}>
            <Card style={styles.statCardInner}>
              <View style={styles.statIconContainer}>
                <Ionicons name="trending-down" size={28} color={colors.error} />
              </View>
              <Text style={styles.statValue}>
                {formatCurrency(totalExpenses)}
              </Text>
              <Text style={styles.statLabel}>Total Gastado</Text>
            </Card>
          </View>

          <View style={styles.statCard}>
            <Card style={styles.statCardInner}>
              <View style={styles.statIconContainer}>
                <Ionicons name="document-text" size={28} color={colors.primary} />
              </View>
              <Text style={styles.statValue}>{bases.length}</Text>
              <Text style={styles.statLabel}>Registros</Text>
            </Card>
          </View>
        </View>

        {/* Botón de acción */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.primaryActionButton}
            onPress={() => navigation.navigate('FormBase')}
            activeOpacity={0.8}
          >
            <Ionicons name="add-circle" size={24} color="#4CAF50" />
            <Text style={styles.primaryActionText}>Agregar Base</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Filtros colapsables */}
      {showFilters && (
        <View style={styles.filtersSection}>
          <Card style={styles.filtersCard}>
            <View style={styles.filterHeader}>
              <Ionicons name="funnel" size={24} color="#4CAF50" />
              <Text style={styles.filterTitle}>Filtros por Fecha</Text>
            </View>

            <View style={styles.dateFilters}>
              <DatePicker
                label="Desde"
                value={fromDate}
                onChange={setFromDate}
                style={styles.dateFilter}
              />
              <DatePicker
                label="Hasta"
                value={toDate}
                onChange={setToDate}
                style={styles.dateFilter}
              />
            </View>

            <Button
              title="Limpiar Filtros"
              variant="outline"
              icon="refresh"
              onPress={() => {
                setFromDate(null);
                setToDate(null);
              }}
              size="small"
            />
          </Card>
        </View>
      )}

      {/* Encabezado de lista */}
      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>Historial de Entregas</Text>
        <Text style={styles.listCount}>
          {bases.length} {bases.length === 1 ? 'registro' : 'registros'}
        </Text>
      </View>
    </>
  );

  const renderBase = ({ item }) => (
    <Card style={styles.baseCard}>
      <TouchableOpacity
        style={styles.cardContent}
        activeOpacity={0.7}
      >
        <View style={styles.cardTop}>
          <View style={styles.cardLeft}>
            <View style={styles.iconContainer}>
              <Ionicons name="add-circle" size={32} color="#fff" />
            </View>
            <View style={styles.baseInfo}>
              <Text style={styles.baseDate}>
                {new Date(item.date).toLocaleDateString('es-ES', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric'
                })}
              </Text>
              <Text style={styles.baseAmount}>
                ${Number(item.amount).toLocaleString('es-CO', { minimumFractionDigits: 2 })}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.deleteIconButton}
            onPress={() => confirmDelete(item.id)}
          >
            <Ionicons name="trash-outline" size={20} color={colors.error} />
          </TouchableOpacity>
        </View>

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
        data={bases}
        keyExtractor={item => item.id.toString()}
        renderItem={renderBase}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#4CAF50']}
            tintColor={'#4CAF50'}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="cash-outline"
            title="No hay registros"
            message={hasActiveFilters ? "No se encontraron registros con los filtros aplicados" : "Comienza agregando dinero a la base de caja"}
          />
        }
      />

      <ConfirmDialog
        visible={deleteDialog.visible}
        onClose={() => setDeleteDialog({ visible: false, id: null })}
        onConfirm={deleteBase}
        title="¿Eliminar registro?"
        message="Esta acción no se puede deshacer y afectará el saldo de caja"
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
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '600',
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
  dateFilters: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  dateFilter: {
    flex: 1,
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
  baseCard: {
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
    alignItems: 'center',
  },
  cardLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  baseInfo: {
    flex: 1,
  },
  baseDate: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  baseAmount: {
    ...typography.h3,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  deleteIconButton: {
    padding: spacing.xs,
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