import { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { db, getBaseBalance } from '../../db/database';
import { Button, Card, ConfirmDialog, Select, DatePicker, Input, EmptyState, AlertDialog } from '../../components';
import { colors, spacing, typography } from '../../theme';
import { appEvents } from '../../utils/events';

const expenseTypes = ['Flete', 'Domicilio', 'Transportadora', 'Otro'];

export default function ListaGastos({ navigation }) {
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState({ total: 0, byType: {} });
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [typeFilter, setTypeFilter] = useState('');
  const [transFilter, setTransFilter] = useState('');
  const [domiciliarioFilter, setDomiciliarioFilter] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ visible: false, id: null });
  const [alert, setAlert] = useState({ visible: false, type: 'success', title: '', message: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [baseBalance, setBaseBalance] = useState(0);

  const load = useCallback(() => {
    const from = fromDate ? fromDate.getTime() : 0;
    const to = toDate ? toDate.getTime() + 86400000 : Date.now() + 86400000;

    try {
      const list = db.getAllSync(
        `SELECT e.*, t.name as trans_name, d.name as domiciliario_name 
         FROM expenses e 
         LEFT JOIN transportadoras t ON e.transportadora_id = t.id
         LEFT JOIN domiciliarios d ON e.domiciliario_id = d.id
         WHERE e.date >= ? AND e.date <= ?
         AND e.type LIKE ?
         AND (t.name LIKE ? OR ? = '')
         AND (d.name LIKE ? OR ? = '')
         ORDER BY e.date DESC`,
        [from, to, `%${typeFilter}%`, `%${transFilter}%`, transFilter, `%${domiciliarioFilter}%`, domiciliarioFilter]
      );
      setExpenses(list);

      const total = db.getFirstSync(
        `SELECT SUM(amount) as total FROM expenses WHERE date >= ? AND date <= ?`,
        [from, to]
      )?.total || 0;

      const byType = {};
      expenseTypes.forEach(t => {
        const sum = db.getFirstSync(
          `SELECT SUM(amount) as sum FROM expenses WHERE type = ? AND date >= ? AND date <= ?`,
          [t, from, to]
        )?.sum || 0;
        byType[t] = sum;
      });
      
      setSummary({ total, byType });

      // Cargar saldo de base
      const balance = getBaseBalance();
      setBaseBalance(balance);
    } catch (e) { 
      console.error(e); 
    }
  }, [fromDate, toDate, typeFilter, transFilter, domiciliarioFilter]);

  useEffect(() => { 
    load(); 
    
    const handleExpensesChanged = () => load();
    const handleDataChanged = () => load();
    const handleBaseChanged = () => load();
    
    appEvents.on('expenses:changed', handleExpensesChanged);
    appEvents.on('data:changed', handleDataChanged);
    appEvents.on('base:changed', handleBaseChanged);
    
    return () => {
      appEvents.off('expenses:changed', handleExpensesChanged);
      appEvents.off('data:changed', handleDataChanged);
      appEvents.off('base:changed', handleBaseChanged);
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

  const deleteExpense = () => {
    try {
      db.runSync(`DELETE FROM expenses WHERE id = ?`, [deleteDialog.id]);
      
      appEvents.onExpensesChanged();
      appEvents.onDataChanged();
      
      setAlert({
        visible: true,
        type: 'success',
        title: '¡Eliminado!',
        message: 'El gasto se eliminó correctamente',
      });
      setDeleteDialog({ visible: false, id: null });
      load();
    } catch (e) {
      setAlert({
        visible: true,
        type: 'error',
        title: 'Error',
        message: 'No se pudo eliminar el gasto',
      });
    }
  };

  const formatCurrency = (value) => {
    if (value >= 1000000) {
      // Para millones, mostrar con precisión hasta 3 dígitos
      const millions = value / 1000000;
      // Si tiene decimales significativos, mostrarlos
      if (millions % 1 !== 0) {
        return `$${millions.toFixed(3).replace(/\.?0+$/, '')}M`;
      }
      return `$${millions.toFixed(0)}M`;
    } else if (value >= 1000) {
      // Para miles, mostrar con precisión hasta 3 dígitos
      const thousands = value / 1000;
      if (thousands % 1 !== 0) {
        return `$${thousands.toFixed(3).replace(/\.?0+$/, '')}K`;
      }
      return `$${thousands.toFixed(0)}K`;
    } else {
      return `$${value.toFixed(0)}`;
    }
  };

  const renderHeader = () => (
    <>
      {/* Header Principal */}
      <LinearGradient
        colors={[colors.primary, '#1565C0']}
        style={styles.headerGradient}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Caja Menor</Text>
            <Text style={styles.headerSubtitle}>Gestión de Gastos</Text>
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
          </TouchableOpacity>
        </View>

        {/* Cards de resumen - Actualizar primera card */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Card style={styles.statCardInner}>
              <View style={styles.statIconContainer}>
                <Ionicons name="cash" size={28} color={colors.success} />
              </View>
              <Text style={[styles.statValue, { color: baseBalance >= 0 ? colors.success : colors.error }]}>
                {formatCurrency(baseBalance)}
              </Text>
              <Text style={styles.statLabel}>Saldo Disponible</Text>
            </Card>
          </View>

          <View style={styles.statCard}>
            <Card style={styles.statCardInner}>
              <View style={styles.statIconContainer}>
                <Ionicons name="wallet" size={28} color={colors.error} />
              </View>
              <Text style={styles.statValue}>
                {formatCurrency(summary.total)}
              </Text>
              <Text style={styles.statLabel}>Total Gastado</Text>
            </Card>
          </View>

          <View style={styles.statCard}>
            <Card style={styles.statCardInner}>
              <View style={styles.statIconContainer}>
                <Ionicons name="document-text" size={28} color={colors.secondary} />
              </View>
              <Text style={styles.statValue}>{expenses.length}</Text>
              <Text style={styles.statLabel}>Gastos</Text>
            </Card>
          </View>

          <View style={styles.statCard}>
            <Card style={styles.statCardInner}>
              <View style={styles.statIconContainer}>
                <Ionicons name="trending-up" size={28} color="#FF6B6B" />
              </View>
              <Text style={styles.statValue}>
                {Object.keys(summary.byType).filter(t => summary.byType[t] > 0).length}
              </Text>
              <Text style={styles.statLabel}>Tipos Activos</Text>
            </Card>
          </View>
        </View>
        
        {/* Botones de acción */}
        <View style={styles.actionButtons}>
          <View style={styles.primaryButtons}>
            <TouchableOpacity 
              style={[styles.primaryActionButton, { flex: 1 }]}
              onPress={() => navigation.navigate('FormGasto')}
              activeOpacity={0.8}
            >
              <Ionicons name="remove-circle" size={24} color={colors.error} />
              <Text style={[styles.primaryActionText, { color: colors.error }]}>Nuevo Gasto</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.primaryActionButton, { flex: 1, backgroundColor: '#4CAF50' }]}
              onPress={() => navigation.navigate('FormBase')}
              activeOpacity={0.8}
            >
              <Ionicons name="add-circle" size={24} color="#fff" />
              <Text style={[styles.primaryActionText, { color: '#fff' }]}>Agregar Base</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.secondaryButtons}>
            <TouchableOpacity 
              style={[styles.secondaryActionButton, { flex: 1 }]}
              onPress={() => navigation.navigate('ListaTransportadoras')}
              activeOpacity={0.8}
            >
              <Ionicons name="car" size={20} color="#fff" />
              <Text style={styles.secondaryActionText}>Transportadoras</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.secondaryActionButton, { flex: 1, backgroundColor: 'rgba(255, 107, 107, 0.3)' }]}
              onPress={() => navigation.navigate('ListaDomiciliarios')}
              activeOpacity={0.8}
            >
              <Ionicons name="bicycle" size={20} color="#fff" />
              <Text style={styles.secondaryActionText}>Domiciliarios</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.secondaryActionButton, { flex: 1, backgroundColor: 'rgba(76, 175, 80, 0.3)' }]}
              onPress={() => navigation.navigate('ListaBases')}
              activeOpacity={0.8}
            >
              <Ionicons name="cash" size={20} color="#fff" />
              <Text style={styles.secondaryActionText}>Ver Bases</Text>
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

            <Select
              label="Tipo de gasto"
              value={typeFilter}
              onValueChange={setTypeFilter}
              items={[
                { label: 'Todos los tipos', value: '' },
                ...expenseTypes.map(t => ({ label: t, value: t }))
              ]}
              icon="pricetag"
            />

            <Input
              label="Transportadora"
              placeholder="Buscar por transportadora..."
              value={transFilter}
              onChangeText={setTransFilter}
              icon="car"
            />

            <Input
              label="Domiciliario"
              placeholder="Buscar por domiciliario..."
              value={domiciliarioFilter}
              onChangeText={setDomiciliarioFilter}
              icon="bicycle"
            />

            <Button
              title="Limpiar Filtros"
              variant="outline"
              icon="refresh"
              onPress={() => {
                setFromDate(null);
                setToDate(null);
                setTypeFilter('');
                setTransFilter('');
                setDomiciliarioFilter('');
              }}
              size="small"
            />
          </Card>
        </View>
      )}

      {/* Desglose por tipo */}
      {Object.keys(summary.byType).filter(t => summary.byType[t] > 0).length > 0 && (
        <View style={styles.breakdownSection}>
          <Text style={styles.sectionTitle}>Desglose por Tipo</Text>
          <Card style={styles.breakdownCard}>
            {Object.entries(summary.byType).map(([type, amount]) => 
              amount > 0 && (
                <View key={type} style={styles.breakdownRow}>
                  <View style={styles.breakdownLeft}>
                    <View style={[styles.typeIndicator, { backgroundColor: getTypeColor(type) }]} />
                    <Text style={styles.breakdownType}>{type}</Text>
                  </View>
                  <View style={styles.breakdownRight}>
                    <Text style={styles.breakdownAmount}>
                      ${amount.toLocaleString('es-CO', { minimumFractionDigits: 0 })}
                    </Text>
                    <Text style={styles.breakdownPercentage}>
                      {((amount / summary.total) * 100).toFixed(0)}%
                    </Text>
                  </View>
                </View>
              )
            )}
          </Card>
        </View>
      )}

      {/* Encabezado de lista */}
      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>Historial de Gastos</Text>
        <Text style={styles.listCount}>
          {expenses.length} {expenses.length === 1 ? 'registro' : 'registros'}
        </Text>
      </View>
    </>
  );

  const renderExpense = ({ item }) => (
    <Card style={styles.expenseCard}>
      <TouchableOpacity 
        style={styles.cardContent}
        onPress={() => navigation.navigate('FormGasto', { expense: item })}
        activeOpacity={0.7}
      >
        <View style={styles.cardTop}>
          <View style={styles.cardLeft}>
            <View style={[styles.typeChip, { backgroundColor: `${getTypeColor(item.type)}20` }]}>
              <View style={[styles.typeChipDot, { backgroundColor: getTypeColor(item.type) }]} />
              <Text style={[styles.typeChipText, { color: getTypeColor(item.type) }]}>
                {item.type}
              </Text>
            </View>
            <Text style={styles.expenseDate}>
              {new Date(item.date).toLocaleDateString('es-ES', { 
                day: '2-digit', 
                month: 'short',
                year: 'numeric'
              })}
            </Text>
          </View>
          
          <View style={styles.cardRight}>
            <Text style={styles.expenseAmount}>
              ${Number(item.amount).toLocaleString('es-CO', { minimumFractionDigits: 2 })}
            </Text>
            <TouchableOpacity 
              style={styles.deleteIconButton}
              onPress={() => confirmDelete(item.id)}
            >
              <Ionicons name="trash-outline" size={20} color={colors.error} />
            </TouchableOpacity>
          </View>
        </View>

        {item.trans_name && (
          <View style={styles.infoRow}>
            <Ionicons name="car" size={16} color={colors.textSecondary} />
            <Text style={styles.infoText}>{item.trans_name}</Text>
          </View>
        )}

        {item.domiciliario_name && (
          <View style={styles.infoRow}>
            <Ionicons name="bicycle" size={16} color={colors.textSecondary} />
            <Text style={styles.infoText}>{item.domiciliario_name}</Text>
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
        data={expenses}
        keyExtractor={item => item.id.toString()}
        renderItem={renderExpense}
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
            icon="wallet-outline"
            title="No hay gastos"
            message={typeFilter || transFilter || domiciliarioFilter ? "No se encontraron gastos con los filtros aplicados" : "Comienza agregando tu primer gasto"}
          />
        }
      />

      <ConfirmDialog
        visible={deleteDialog.visible}
        onClose={() => setDeleteDialog({ visible: false, id: null })}
        onConfirm={deleteExpense}
        title="¿Eliminar gasto?"
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

// Función helper para colores por tipo
const getTypeColor = (type) => {
  const colors = {
    'Flete': '#FF6B6B',
    'Domicilio': '#4ECDC4',
    'Transportadora': '#FFD93D',
    'Otro': '#A8DADC',
  };
  return colors[type] || '#999';
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
  primaryButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
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
  dateFilters: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  dateFilter: {
    flex: 1,
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
  typeIndicator: {
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
  breakdownAmount: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginBottom: 2,
  },
  breakdownPercentage: {
    ...typography.caption,
    color: colors.textSecondary,
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
  expenseCard: {
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
    marginBottom: spacing.sm,
  },
  cardLeft: {
    flex: 1,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 6,
    marginBottom: spacing.xs,
  },
  typeChipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  typeChipText: {
    ...typography.caption,
    fontWeight: '600',
  },
  expenseDate: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  cardRight: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  expenseAmount: {
    ...typography.h3,
    color: colors.error,
    fontWeight: 'bold',
  },
  deleteIconButton: {
    padding: spacing.xs,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    marginTop: spacing.sm,
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