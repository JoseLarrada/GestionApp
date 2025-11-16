import { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../db/database';
import { Button, Card, ConfirmDialog, Select, DatePicker, Input, EmptyState, AlertDialog } from '../../components';
import { colors, spacing, typography } from '../../theme';
import { appEvents } from '../../utils/events';

const accountTypes = ['Ahorros', 'Corriente', 'Nequi', 'Daviplata', 'Efectivo', 'Otro'];

export default function ListaTransferencias({ navigation }) {
  const [transfers, setTransfers] = useState([]);
  const [summary, setSummary] = useState({ total: 0, byType: {} });
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [typeFilter, setTypeFilter] = useState('');
  const [senderFilter, setSenderFilter] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ visible: false, id: null });
  const [alert, setAlert] = useState({ visible: false, type: 'success', title: '', message: '' });
  const [showFilters, setShowFilters] = useState(false);

  const load = useCallback(() => {
    const from = fromDate ? fromDate.getTime() : 0;
    const to = toDate ? toDate.getTime() + 86400000 : Date.now() + 86400000;

    try {
      const list = db.getAllSync(
        `SELECT * FROM transfers 
         WHERE date >= ? AND date <= ?
         AND (account_type LIKE ? OR ? = '')
         AND (sender_name LIKE ? OR ? = '')
         ORDER BY date DESC`,
        [from, to, `%${typeFilter}%`, typeFilter, `%${senderFilter}%`, senderFilter]
      );
      setTransfers(list);

      const totalRow = db.getFirstSync(
        `SELECT SUM(amount) as total FROM transfers WHERE date >= ? AND date <= ?`,
        [from, to]
      );
      const total = totalRow?.total || 0;

      const byType = {};
      accountTypes.forEach((type) => {
        const sumRow = db.getFirstSync(
          `SELECT SUM(amount) as sum FROM transfers WHERE account_type = ? AND date >= ? AND date <= ?`,
          [type, from, to]
        );
        byType[type] = sumRow?.sum || 0;
      });
      
      setSummary({ total, byType });
    } catch (error) {
      console.error('Error cargando transferencias:', error);
    }
  }, [fromDate, toDate, typeFilter, senderFilter]);

  useEffect(() => { 
    load(); 
    
    const handleTransfersChanged = () => load();
    const handleDataChanged = () => load();
    
    appEvents.on('transfers:changed', handleTransfersChanged);
    appEvents.on('data:changed', handleDataChanged);
    
    return () => {
      appEvents.off('transfers:changed', handleTransfersChanged);
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

  const deleteTransfer = () => {
    try {
      db.runSync(`DELETE FROM transfers WHERE id = ?`, [deleteDialog.id]);
      
      appEvents.onTransfersChanged();
      appEvents.onDataChanged();
      
      setAlert({
        visible: true,
        type: 'success',
        title: '¡Eliminado!',
        message: 'La transferencia se eliminó correctamente',
      });
      setDeleteDialog({ visible: false, id: null });
      load();
    } catch (error) {
      setAlert({
        visible: true,
        type: 'error',
        title: 'Error',
        message: 'No se pudo eliminar la transferencia',
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
        colors={[colors.secondary, '#00897B']}
        style={styles.headerGradient}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Transferencias</Text>
            <Text style={styles.headerSubtitle}>Ingresos Recibidos</Text>
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

        {/* Cards de resumen - 2x2 grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Card style={styles.statCardInner}>
              <View style={styles.statIconContainer}>
                <Ionicons name="trending-up" size={28} color={colors.secondary} />
              </View>
              <Text style={styles.statValue}>
                {formatCurrency(summary.total)}
              </Text>
              <Text style={styles.statLabel}>Total Recibido</Text>
            </Card>
          </View>

          <View style={styles.statCard}>
            <Card style={styles.statCardInner}>
              <View style={styles.statIconContainer}>
                <Ionicons name="receipt" size={28} color="#4ECDC4" />
              </View>
              <Text style={styles.statValue}>{transfers.length}</Text>
              <Text style={styles.statLabel}>Transferencias</Text>
            </Card>
          </View>

          <View style={styles.statCard}>
            <Card style={styles.statCardInner}>
              <View style={styles.statIconContainer}>
                <Ionicons name="wallet" size={28} color="#FFD93D" />
              </View>
              <Text style={styles.statValue}>
                {Object.keys(summary.byType).filter(t => summary.byType[t] > 0).length}
              </Text>
              <Text style={styles.statLabel}>Cuentas Activas</Text>
            </Card>
          </View>

          <View style={styles.statCard}>
            <Card style={styles.statCardInner}>
              <View style={styles.statIconContainer}>
                <Ionicons name="calendar" size={28} color="#FF6B6B" />
              </View>
              <Text style={styles.statValue}>
                {new Date().getDate()}
              </Text>
              <Text style={styles.statLabel}>
                {new Date().toLocaleDateString('es-ES', { month: 'short' })}
              </Text>
            </Card>
          </View>
        </View>

        {/* Botón de acción */}
        <TouchableOpacity 
          style={styles.primaryActionButton}
          onPress={() => navigation.navigate('FormTransferencia')}
          activeOpacity={0.8}
        >
          <Ionicons name="add-circle" size={24} color={colors.secondary} />
          <Text style={styles.primaryActionText}>Nueva Transferencia</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* Filtros colapsables */}
      {showFilters && (
        <View style={styles.filtersSection}>
          <Card style={styles.filtersCard}>
            <View style={styles.filterHeader}>
              <Ionicons name="funnel" size={24} color={colors.secondary} />
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
              label="Tipo de cuenta"
              value={typeFilter}
              onValueChange={setTypeFilter}
              items={[
                { label: 'Todos los tipos', value: '' },
                ...accountTypes.map(t => ({ label: t, value: t }))
              ]}
              icon="wallet"
            />

            <Input
              label="Remitente"
              placeholder="Buscar por remitente..."
              value={senderFilter}
              onChangeText={setSenderFilter}
              icon="person"
            />

            <Button
              title="Limpiar Filtros"
              variant="outline"
              icon="refresh"
              onPress={() => {
                setFromDate(null);
                setToDate(null);
                setTypeFilter('');
                setSenderFilter('');
              }}
              size="small"
            />
          </Card>
        </View>
      )}

      {/* Desglose por tipo */}
      {Object.keys(summary.byType).filter(t => summary.byType[t] > 0).length > 0 && (
        <View style={styles.breakdownSection}>
          <Text style={styles.sectionTitle}>Desglose por Cuenta</Text>
          <Card style={styles.breakdownCard}>
            {Object.entries(summary.byType).map(([type, amount]) => 
              amount > 0 && (
                <View key={type} style={styles.breakdownRow}>
                  <View style={styles.breakdownLeft}>
                    <View style={[styles.typeIndicator, { backgroundColor: getAccountColor(type) }]} />
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
        <Text style={styles.listTitle}>Historial de Transferencias</Text>
        <Text style={styles.listCount}>
          {transfers.length} {transfers.length === 1 ? 'registro' : 'registros'}
        </Text>
      </View>
    </>
  );

  const renderTransfer = ({ item }) => (
    <Card style={styles.transferCard}>
      <TouchableOpacity 
        style={styles.cardContent}
        onPress={() => navigation.navigate('FormTransferencia', { transfer: item })}
        activeOpacity={0.7}
      >
        <View style={styles.cardTop}>
          <View style={styles.cardLeft}>
            <View style={[styles.typeChip, { backgroundColor: `${getAccountColor(item.account_type)}20` }]}>
              <View style={[styles.typeChipDot, { backgroundColor: getAccountColor(item.account_type) }]} />
              <Text style={[styles.typeChipText, { color: getAccountColor(item.account_type) }]}>
                {item.account_type}
              </Text>
            </View>
            <Text style={styles.transferDate}>
              {new Date(item.date).toLocaleDateString('es-ES', { 
                day: '2-digit', 
                month: 'short',
                year: 'numeric'
              })}
            </Text>
          </View>
          
          <View style={styles.cardRight}>
            <Text style={styles.transferAmount}>
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

        <View style={styles.senderInfo}>
          <Ionicons name="person" size={16} color={colors.textSecondary} />
          <Text style={styles.senderName}>{item.sender_name}</Text>
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
        data={transfers}
        keyExtractor={item => item.id.toString()}
        renderItem={renderTransfer}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.secondary]}
            tintColor={colors.secondary}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="send-outline"
            title="No hay transferencias"
            message={typeFilter || senderFilter ? "No se encontraron transferencias con los filtros aplicados" : "Comienza agregando tu primera transferencia"}
          />
        }
      />

      <ConfirmDialog
        visible={deleteDialog.visible}
        onClose={() => setDeleteDialog({ visible: false, id: null })}
        onConfirm={deleteTransfer}
        title="¿Eliminar transferencia?"
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

// Función helper para colores por tipo de cuenta
const getAccountColor = (type) => {
  const colors = {
    'Ahorros': '#4ECDC4',
    'Corriente': '#FFD93D',
    'Nequi': '#FF6B6B',
    'Daviplata': '#A8DADC',
    'Efectivo': '#95E1D3',
    'Otro': '#999',
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
    marginHorizontal: -6,
    marginBottom: spacing.lg,
  },
  statCard: {
    width: '50%',
    paddingHorizontal: 6,
    marginBottom: spacing.sm,
  },
  statCardInner: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${colors.secondary}15`,
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
    fontSize: 12,
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
    color: colors.secondary,
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
  transferCard: {
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
  transferDate: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  cardRight: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  transferAmount: {
    ...typography.h3,
    color: colors.secondary,
    fontWeight: 'bold',
  },
  deleteIconButton: {
    padding: spacing.xs,
  },
  senderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    marginTop: spacing.sm,
  },
  senderName: {
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