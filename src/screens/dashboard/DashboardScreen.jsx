import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { db } from '../../db/database';
import { Card } from '../../components';
import { colors, spacing, typography, shadows } from '../../theme';
import { appEvents } from '../../utils/events';

const { width } = Dimensions.get('window');

export default function DashboardScreen({ navigation }) {
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    products: { total: 0, value: 0 },
    expenses: { total: 0, amount: 0, byType: {} },
    transfers: { total: 0, amount: 0, byType: {} },
    providers: { total: 0 },
    categories: { total: 0 },
    recentActivity: []
  });

  const loadStats = useCallback(() => {
    try {
      // Productos
      const productsCount = db.getFirstSync('SELECT COUNT(*) as total, SUM(price) as value FROM products')
      const products = { 
        total: productsCount?.total || 0, 
        value: productsCount?.value || 0 
      };

      // Gastos - últimos 30 días
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      const expensesData = db.getFirstSync(
        'SELECT COUNT(*) as total, SUM(amount) as amount FROM expenses WHERE date >= ?',
        [thirtyDaysAgo]
      );
      
      const expensesByType = {};
      ['Flete', 'Domicilio', 'Transportadora', 'Otro'].forEach(type => {
        const result = db.getFirstSync(
          'SELECT SUM(amount) as amount FROM expenses WHERE type = ? AND date >= ?',
          [type, thirtyDaysAgo]
        );
        if (result?.amount > 0) {
          expensesByType[type] = result.amount;
        }
      });

      const expenses = {
        total: expensesData?.total || 0,
        amount: expensesData?.amount || 0,
        byType: expensesByType
      };

      // Transferencias - últimos 30 días
      const transfersData = db.getFirstSync(
        'SELECT COUNT(*) as total, SUM(amount) as amount FROM transfers WHERE date >= ?',
        [thirtyDaysAgo]
      );

      const transfersByType = {};
      ['Ahorros', 'Corriente', 'Nequi', 'Daviplata', 'Efectivo'].forEach(type => {
        const result = db.getFirstSync(
          'SELECT SUM(amount) as amount FROM transfers WHERE account_type = ? AND date >= ?',
          [type, thirtyDaysAgo]
        );
        if (result?.amount > 0) {
          transfersByType[type] = result.amount;
        }
      });

      const transfers = {
        total: transfersData?.total || 0,
        amount: transfersData?.amount || 0,
        byType: transfersByType
      };

      // Proveedores y Categorías
      const providersCount = db.getFirstSync('SELECT COUNT(*) as total FROM providers');
      const categoriesCount = db.getFirstSync('SELECT COUNT(*) as total FROM categories');

      // Actividad reciente
      const recentProducts = db.getAllSync(
        'SELECT "product" as type, name, id FROM products ORDER BY id DESC LIMIT 3'
      );
      const recentExpenses = db.getAllSync(
        'SELECT "expense" as type, type as name, amount, date FROM expenses ORDER BY date DESC LIMIT 3'
      );
      const recentTransfers = db.getAllSync(
        'SELECT "transfer" as type, sender_name as name, amount, date FROM transfers ORDER BY date DESC LIMIT 3'
      );

      const recentActivity = [...recentProducts, ...recentExpenses, ...recentTransfers]
        .sort((a, b) => (b.date || 0) - (a.date || 0))
        .slice(0, 5);

      setStats({
        products,
        expenses,
        transfers,
        providers: { total: providersCount?.total || 0 },
        categories: { total: categoriesCount?.total || 0 },
        recentActivity
      });
    } catch (e) {
      console.error('Error loading dashboard stats:', e);
    }
  }, []);

  useEffect(() => {
    loadStats();
    
    // Escuchar cambios
    const handleRefresh = () => loadStats();
    appEvents.on('dashboard:refresh', handleRefresh);
    appEvents.on('products:changed', handleRefresh);
    appEvents.on('expenses:changed', handleRefresh);
    appEvents.on('transfers:changed', handleRefresh);

    return () => {
      appEvents.off('dashboard:refresh', handleRefresh);
      appEvents.off('products:changed', handleRefresh);
      appEvents.off('expenses:changed', handleRefresh);
      appEvents.off('transfers:changed', handleRefresh);
    };
  }, [loadStats]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    loadStats();
    setTimeout(() => setRefreshing(false), 500);
  }, [loadStats]);

  const getActivityIcon = (type) => {
    switch (type) {
      case 'product': return 'cart';
      case 'expense': return 'cash';
      case 'transfer': return 'arrow-forward';
      default: return 'ellipse';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header con gradiente */}
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        style={styles.header}
      >
        <Text style={styles.welcomeText}>¡Bienvenido!</Text>
        <Text style={styles.headerTitle}>Panel de Control</Text>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Grid de estadísticas principales 2x2 */}
        <View style={styles.statsGrid}>
          <View style={styles.statCardWrapper}>
            <Card style={styles.statCard} onPress={() => navigation.navigate('ProductosTab')}>
              <View style={[styles.statIcon, { backgroundColor: colors.primary }]}>
                <Ionicons name="cart" size={28} color={colors.textOnPrimary} />
              </View>
              <Text style={styles.statNumber}>{stats.products.total}</Text>
              <Text style={styles.statLabel}>Productos</Text>
              <Text style={styles.statValue}>
                ${stats.products.value.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            </Card>
          </View>

          <View style={styles.statCardWrapper}>
            <Card style={styles.statCard} onPress={() => navigation.navigate('CajaTab')}>
              <View style={[styles.statIcon, { backgroundColor: colors.warning }]}>
                <Ionicons name="wallet" size={28} color={colors.textOnPrimary} />
              </View>
              <Text style={styles.statNumber}>{stats.expenses.total}</Text>
              <Text style={styles.statLabel}>Gastos</Text>
              <Text style={[styles.statValue, { color: colors.error }]}>
                ${stats.expenses.amount.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            </Card>
          </View>

          <View style={styles.statCardWrapper}>
            <Card style={styles.statCard} onPress={() => navigation.navigate('TransferenciasTab')}>
              <View style={[styles.statIcon, { backgroundColor: colors.success }]}>
                <Ionicons name="arrow-forward-circle" size={28} color={colors.textOnPrimary} />
              </View>
              <Text style={styles.statNumber}>{stats.transfers.total}</Text>
              <Text style={styles.statLabel}>Transferencias</Text>
              <Text style={[styles.statValue, { color: colors.success }]}>
                ${stats.transfers.amount.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            </Card>
          </View>

          <View style={styles.statCardWrapper}>
            <Card style={styles.statCard} onPress={() => navigation.navigate('ProductosTab', { screen: 'ListaProveedores' })}>
              <View style={[styles.statIcon, { backgroundColor: '#9C27B0' }]}>
                <Ionicons name="business" size={28} color={colors.textOnPrimary} />
              </View>
              <Text style={styles.statNumber}>{stats.providers.total}</Text>
              <Text style={styles.statLabel}>Proveedores</Text>
            </Card>
          </View>
        </View>

        {/* Balance del Mes */}
        <Card 
          title="Balance del Mes"
          icon="stats-chart"
          style={styles.balanceCard}
        >
          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>Ingresos (Transferencias)</Text>
            <Text style={[styles.balanceAmount, { color: colors.success }]}>
              +${stats.transfers.amount.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>
          
          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>Gastos (Caja Menor)</Text>
            <Text style={[styles.balanceAmount, { color: colors.error }]}>
              -${stats.expenses.amount.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>

          <View style={styles.divider} />
          
          <View style={styles.balanceRow}>
            <Text style={styles.balanceTotalLabel}>Balance Neto</Text>
            <Text style={[
              styles.balanceTotalAmount,
              { color: stats.transfers.amount - stats.expenses.amount >= 0 ? colors.success : colors.error }
            ]}>
              ${(stats.transfers.amount - stats.expenses.amount).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>
        </Card>

        {/* Desglose de Gastos */}
        {Object.keys(stats.expenses.byType).length > 0 && (
          <Card 
            title="Desglose de Gastos"
            icon="pie-chart"
            style={styles.sectionCard}
          >
            {Object.entries(stats.expenses.byType).map(([type, amount]) => {
              const percentage = ((amount / stats.expenses.amount) * 100).toFixed(0);
              return (
                <View key={type} style={styles.breakdownItem}>
                  <View style={styles.breakdownHeader}>
                    <View style={styles.breakdownLabelRow}>
                      <View style={[styles.breakdownDot, { backgroundColor: colors.warning }]} />
                      <Text style={styles.breakdownLabel}>{type}</Text>
                    </View>
                    <Text style={styles.breakdownAmount}>
                      ${amount.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Text>
                  </View>
                  <View style={styles.progressBarContainer}>
                    <View style={styles.progressBar}>
                      <View 
                        style={[styles.progressFill, { 
                          width: `${percentage}%`,
                          backgroundColor: colors.warning 
                        }]} 
                      />
                    </View>
                    <Text style={styles.percentageText}>{percentage}%</Text>
                  </View>
                </View>
              );
            })}
          </Card>
        )}

        {/* Desglose de Transferencias */}
        {Object.keys(stats.transfers.byType).length > 0 && (
          <Card 
            title="Desglose de Transferencias"
            icon="wallet"
            style={styles.sectionCard}
          >
            {Object.entries(stats.transfers.byType).map(([type, amount]) => {
              const percentage = ((amount / stats.transfers.amount) * 100).toFixed(0);
              return (
                <View key={type} style={styles.breakdownItem}>
                  <View style={styles.breakdownHeader}>
                    <View style={styles.breakdownLabelRow}>
                      <View style={[styles.breakdownDot, { backgroundColor: colors.success }]} />
                      <Text style={styles.breakdownLabel}>{type}</Text>
                    </View>
                    <Text style={styles.breakdownAmount}>
                      ${amount.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Text>
                  </View>
                  <View style={styles.progressBarContainer}>
                    <View style={styles.progressBar}>
                      <View 
                        style={[styles.progressFill, { 
                          width: `${percentage}%`,
                          backgroundColor: colors.success 
                        }]} 
                      />
                    </View>
                    <Text style={styles.percentageText}>{percentage}%</Text>
                  </View>
                </View>
              );
            })}
          </Card>
        )}

        {/* Actividad Reciente */}
        {stats.recentActivity.length > 0 && (
          <Card 
            title="Actividad Reciente"
            icon="time"
            style={styles.sectionCard}
          >
            {stats.recentActivity.map((item, index) => (
              <View key={index} style={styles.activityItem}>
                <View style={[styles.activityIcon, {
                  backgroundColor: item.type === 'product' ? colors.primaryLight :
                                 item.type === 'expense' ? '#FFF3E0' : '#E8F5E9'
                }]}>
                  <Ionicons 
                    name={getActivityIcon(item.type)} 
                    size={20} 
                    color={item.type === 'product' ? colors.primary :
                           item.type === 'expense' ? colors.warning : colors.success}
                  />
                </View>
                <View style={styles.activityDetails}>
                  <Text style={styles.activityName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  {item.amount && (
                    <Text style={[styles.activityAmount, {
                      color: item.type === 'expense' ? colors.error : colors.success
                    }]}>
                      ${item.amount.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Text>
                  )}
                </View>
                {item.date && (
                  <Text style={styles.activityDate}>
                    {new Date(item.date).toLocaleDateString('es-ES', { 
                      day: '2-digit', 
                      month: 'short' 
                    })}
                  </Text>
                )}
              </View>
            ))}
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  header: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  welcomeText: {
    ...typography.body,
    color: colors.textOnPrimary,
    opacity: 0.9,
    marginBottom: spacing.xs,
  },
  headerTitle: {
    ...typography.h1,
    color: colors.textOnPrimary,
    fontWeight: 'bold',
    fontSize: 32,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingTop: spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
    marginBottom: spacing.lg,
  },
  statCardWrapper: {
    width: '50%',
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.sm,
  },
  statCard: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 150,
  },
  statIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  statNumber: {
    ...typography.h1,
    fontWeight: 'bold',
    color: colors.text,
    fontSize: 32,
    marginBottom: spacing.xxs,
  },
  statLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    fontSize: 13,
  },
  statValue: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
    fontSize: 14,
  },
  balanceCard: {
    marginBottom: spacing.lg,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  balanceLabel: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 14,
  },
  balanceAmount: {
    ...typography.h4,
    fontWeight: '700',
    fontSize: 16,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  balanceTotalLabel: {
    ...typography.h4,
    color: colors.text,
    fontWeight: '600',
  },
  balanceTotalAmount: {
    ...typography.h2,
    fontWeight: 'bold',
    fontSize: 24,
  },
  sectionCard: {
    marginBottom: spacing.lg,
  },
  breakdownItem: {
    marginBottom: spacing.md,
  },
  breakdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  breakdownLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  breakdownDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  breakdownLabel: {
    ...typography.body,
    color: colors.text,
    fontWeight: '500',
  },
  breakdownAmount: {
    ...typography.body,
    fontWeight: '700',
    color: colors.text,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: colors.surfaceVariant,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  percentageText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
    minWidth: 35,
    textAlign: 'right',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  activityDetails: {
    flex: 1,
  },
  activityName: {
    ...typography.body,
    color: colors.text,
    fontWeight: '500',
    marginBottom: 2,
  },
  activityAmount: {
    ...typography.bodySmall,
    fontWeight: '600',
  },
  activityDate: {
    ...typography.caption,
    color: colors.textLight,
    fontWeight: '500',
  },
});
