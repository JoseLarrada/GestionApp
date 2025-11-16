import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useState, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../db/database';
import { exportBackup, importBackup } from '../../services/backupService';
import { Button, Card, AlertDialog } from '../../components';
import { colors, spacing, typography } from '../../theme';

export default function ConfigScreen() {
  const [lastBackup, setLastBackup] = useState('');
  const [alert, setAlert] = useState({ visible: false, type: 'info', title: '', message: '' });
  const [stats, setStats] = useState({ products: 0, expenses: 0, transfers: 0 });

  useEffect(() => {
    loadLastBackup();
    loadStats();
  }, []);

  const loadLastBackup = () => {
    try {
      const row = db.getFirstSync(`SELECT value FROM settings WHERE key='last_backup'`);
      if (row?.value) setLastBackup(row.value);
    } catch (e) { 
      console.error(e); 
    }
  };

  const loadStats = () => {
    try {
      const products = db.getFirstSync(`SELECT COUNT(*) as count FROM products`)?.count || 0;
      const expenses = db.getFirstSync(`SELECT COUNT(*) as count FROM expenses`)?.count || 0;
      const transfers = db.getFirstSync(`SELECT COUNT(*) as count FROM transfers`)?.count || 0;
      setStats({ products, expenses, transfers });
    } catch (e) {
      console.error(e);
    }
  };

  const handleExportBackup = async () => {
    try {
      setAlert({
        visible: true,
        type: 'info',
        title: 'Creando respaldo...',
        message: 'Por favor espera',
      });

      await exportBackup();
      const now = new Date().toISOString();
      db.runSync(`INSERT OR REPLACE INTO settings (key, value) VALUES ('last_backup', ?)`, [now]);
      setLastBackup(now);
      
      setAlert({
        visible: true,
        type: 'success',
        title: '¡Respaldo creado!',
        message: 'El archivo de base de datos se ha exportado correctamente. Guárdalo en un lugar seguro.',
      });
    } catch (e) {
      console.error('Error al exportar:', e);
      setAlert({
        visible: true,
        type: 'error',
        title: 'Error al crear respaldo',
        message: e.message || 'No se pudo crear el respaldo de la base de datos',
      });
    }
  };

  const handleImportBackup = async () => {
    try {
      setAlert({
        visible: true,
        type: 'info',
        title: 'Restaurando...',
        message: 'Por favor espera',
      });

      await importBackup();
      
      // Recargar datos
      loadLastBackup();
      loadStats();
      
      setAlert({
        visible: true,
        type: 'success',
        title: '¡Respaldo restaurado!',
        message: 'La base de datos se ha restaurado correctamente. La app se recargará.',
      });

      // Recargar la app después de 2 segundos
      setTimeout(() => {
        // Si tienes navigation, puedes hacer reset del stack
        // navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
      }, 2000);
    } catch (e) {
      console.error('Error al importar:', e);
      setAlert({
        visible: true,
        type: 'error',
        title: 'Error al restaurar',
        message: e.message || 'No se pudo restaurar el respaldo. Verifica que el archivo sea válido.',
      });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Nunca';
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header con gradiente */}
        <LinearGradient
          colors={['#667EEA', '#764BA2']}
          style={styles.header}
        >
          <View style={styles.headerIconContainer}>
            <Ionicons name="settings" size={48} color="#fff" />
          </View>
          <Text style={styles.headerTitle}>Configuración</Text>
          <Text style={styles.headerSubtitle}>Ajustes y respaldos</Text>
        </LinearGradient>

        {/* Estadísticas de datos */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Estadísticas de Datos</Text>
          <View style={styles.statsGrid}>
            <Card style={styles.statCard}>
              <View style={styles.statContent}>
                <View style={[styles.statIconContainer, { backgroundColor: '#E3F2FD' }]}>
                  <Ionicons name="cube" size={28} color={colors.primary} />
                </View>
                <Text style={styles.statValue}>{stats.products}</Text>
                <Text style={styles.statLabel}>Productos</Text>
              </View>
            </Card>

            <Card style={styles.statCard}>
              <View style={styles.statContent}>
                <View style={[styles.statIconContainer, { backgroundColor: '#FFF3E0' }]}>
                  <Ionicons name="wallet" size={28} color="#FF9800" />
                </View>
                <Text style={styles.statValue}>{stats.expenses}</Text>
                <Text style={styles.statLabel}>Gastos</Text>
              </View>
            </Card>

            <Card style={styles.statCard}>
              <View style={styles.statContent}>
                <View style={[styles.statIconContainer, { backgroundColor: '#E8F5E9' }]}>
                  <Ionicons name="send" size={28} color={colors.secondary} />
                </View>
                <Text style={styles.statValue}>{stats.transfers}</Text>
                <Text style={styles.statLabel}>Transferencias</Text>
              </View>
            </Card>
          </View>
        </View>

        {/* Gestión de Respaldos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gestión de Respaldos</Text>
          <Card style={styles.backupCard}>
            <View style={styles.backupHeader}>
              <View style={styles.backupIconContainer}>
                <Ionicons name="cloud-outline" size={40} color={colors.primary} />
              </View>
              <View style={styles.backupInfo}>
                <Text style={styles.backupTitle}>Último respaldo</Text>
                <Text style={styles.backupDate}>{formatDate(lastBackup)}</Text>
              </View>
            </View>

            <View style={styles.backupActions}>
              <TouchableOpacity 
                style={styles.backupButton}
                onPress={handleExportBackup}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={[colors.primary, '#1565C0']}
                  style={styles.backupButtonGradient}
                >
                  <Ionicons name="cloud-upload" size={24} color="#fff" />
                  <Text style={styles.backupButtonText}>Crear</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.backupButton}
                onPress={handleImportBackup}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={[colors.secondary, '#00897B']}
                  style={styles.backupButtonGradient}
                >
                  <Ionicons name="cloud-download" size={24} color="#fff" />
                  <Text style={styles.backupButtonText}>Restaurar</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <View style={styles.helpBox}>
              <Ionicons name="information-circle" size={20} color={colors.info} />
              <Text style={styles.helpText}>
                Crea respaldos periódicos de tus datos para mantenerlos seguros. 
                Puedes restaurarlos en cualquier momento.
              </Text>
            </View>
          </Card>
        </View>

        {/* Información de la App */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acerca de la Aplicación</Text>
          <Card style={styles.aboutCard}>
            <View style={styles.aboutRow}>
              <View style={styles.aboutIconContainer}>
                <Ionicons name="apps" size={24} color="#fff" />
              </View>
              <View style={styles.aboutContent}>
                <Text style={styles.aboutLabel}>Nombre de la App</Text>
                <Text style={styles.aboutValue}>Gestión App</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.aboutRow}>
              <View style={[styles.aboutIconContainer, { backgroundColor: colors.secondary }]}>
                <Ionicons name="code-slash" size={24} color="#fff" />
              </View>
              <View style={styles.aboutContent}>
                <Text style={styles.aboutLabel}>Versión</Text>
                <Text style={styles.aboutValue}>1.0.0</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.aboutRow}>
              <View style={[styles.aboutIconContainer, { backgroundColor: '#FF9800' }]}>
                <Ionicons name="color-palette" size={24} color="#fff" />
              </View>
              <View style={styles.aboutContent}>
                <Text style={styles.aboutLabel}>Tema</Text>
                <Text style={styles.aboutValue}>Diseño Moderno</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.aboutRow}>
              <View style={[styles.aboutIconContainer, { backgroundColor: '#667EEA' }]}>
                <Ionicons name="phone-portrait" size={24} color="#fff" />
              </View>
              <View style={styles.aboutContent}>
                <Text style={styles.aboutLabel}>Plataforma</Text>
                <Text style={styles.aboutValue}>{Platform.OS === 'ios' ? 'iOS' : 'Android'}</Text>
              </View>
            </View>
          </Card>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Desarrollado con ❤️ para gestión empresarial
          </Text>
        </View>
      </ScrollView>

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
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: spacing.xl * 2,
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
  },
  statsSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    padding: 0,
  },
  statContent: {
    padding: spacing.md,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statValue: {
    ...typography.h2,
    color: colors.text,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  backupCard: {
    padding: spacing.lg,
  },
  backupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  backupIconContainer: {
    marginRight: spacing.md,
  },
  backupInfo: {
    flex: 1,
  },
  backupTitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  backupDate: {
    ...typography.h4,
    color: colors.text,
    fontWeight: '600',
  },
  backupActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  backupButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  backupButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  backupButtonText: {
    ...typography.button,
    color: '#fff',
    fontWeight: '600',
  },
  helpBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.overlayLight,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.info,
  },
  helpText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  aboutCard: {
    padding: spacing.lg,
  },
  aboutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  aboutIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  aboutContent: {
    flex: 1,
  },
  aboutLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  aboutValue: {
    ...typography.h4,
    color: colors.text,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: spacing.sm,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    alignItems: 'center',
  },
  footerText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});