import { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, TouchableOpacity, Platform, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../db/database';
import { Button, Input, Card, ConfirmDialog, AlertDialog, EmptyState } from '../../components';
import { colors, spacing, typography } from '../../theme';
import { appEvents } from '../../utils/events';

export default function ListaDomiciliarios({ navigation }) {
  const [domiciliarios, setDomiciliarios] = useState([]);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ visible: false, id: null });
  const [alert, setAlert] = useState({ visible: false, type: 'error', title: '', message: '' });

  const load = useCallback(() => {
    try {
      const rows = db.getAllSync(
        `SELECT * FROM domiciliarios WHERE name LIKE ? ORDER BY name`,
        [`%${search}%`]
      );
      setDomiciliarios(rows);
    } catch (e) {
      console.error(e);
    }
  }, [search]);

  useEffect(() => { 
    load(); 
    
    const handleDomiciliariosChanged = () => load();
    const handleDataChanged = () => load();
    
    appEvents.on('domiciliarios:changed', handleDomiciliariosChanged);
    appEvents.on('data:changed', handleDataChanged);
    
    return () => {
      appEvents.off('domiciliarios:changed', handleDomiciliariosChanged);
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

  const deleteDomiciliario = () => {
    try {
      db.runSync(`DELETE FROM domiciliarios WHERE id = ?`, [deleteDialog.id]);
      
      appEvents.onDomiciliariosChanged();
      appEvents.onDataChanged();
      
      setAlert({
        visible: true,
        type: 'success',
        title: '¡Eliminado!',
        message: 'El domiciliario se eliminó correctamente',
      });
      setDeleteDialog({ visible: false, id: null });
      load();
    } catch (e) {
      setAlert({
        visible: true,
        type: 'error',
        title: 'No se puede eliminar',
        message: 'Hay gastos vinculados a este domiciliario',
      });
      setDeleteDialog({ visible: false, id: null });
    }
  };

  const handleCall = (phone) => {
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    }
  };

  const renderHeader = () => (
    <LinearGradient
      colors={['#6bd0ffff', '#84b2f7ff']}
      style={styles.header}
    >
      <Text style={styles.headerTitle}>Domiciliarios</Text>
      <Text style={styles.headerSubtitle}>
        {domiciliarios.length} {domiciliarios.length === 1 ? 'domiciliario' : 'domiciliarios'}
      </Text>

      {/* Búsqueda */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
        <Input
          placeholder="Buscar domiciliarios..."
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
          inputStyle={styles.searchInputField}
        />
      </View>

      {/* Botón principal */}
      <Button
        title="Nuevo Domiciliario"
        icon="add-circle"
        onPress={() => navigation.navigate('FormDomiciliario')}
        style={styles.newButton}
        size="large"
      />
    </LinearGradient>
  );

  const renderDomiciliario = ({ item }) => (
    <Card style={styles.domiciliarioCard}>
      <TouchableOpacity 
        style={styles.cardContent}
        onPress={() => navigation.navigate('FormDomiciliario', { domiciliario: item })}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.iconContainer}>
            <Ionicons name="bicycle" size={28} color="#fff" />
          </View>
          
          <View style={styles.cardInfo}>
            <Text style={styles.domiciliarioName}>{item.name}</Text>
            
            {item.phone && (
              <TouchableOpacity 
                style={styles.phoneContainer}
                onPress={() => handleCall(item.phone)}
                activeOpacity={0.7}
              >
                <Ionicons name="call" size={16} color={colors.secondary} />
                <Text style={styles.phoneText}>{item.phone}</Text>
              </TouchableOpacity>
            )}
            
            {item.observations && (
              <Text style={styles.observations} numberOfLines={2}>
                {item.observations}
              </Text>
            )}
          </View>

          <View style={styles.cardActions}>
            {item.phone && (
              <TouchableOpacity 
                style={styles.callButton}
                onPress={() => handleCall(item.phone)}
              >
                <Ionicons name="call" size={22} color={colors.secondary} />
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={styles.deleteButton}
              onPress={() => confirmDelete(item.id)}
            >
              <Ionicons name="trash-outline" size={22} color={colors.error} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Card>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={domiciliarios}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderDomiciliario}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#84b2f7ff']}
            tintColor={'#84b2f7ff'}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="bicycle-outline"
            title="No hay domiciliarios"
            message={search ? "No se encontraron domiciliarios con ese nombre" : "Agrega tu primer domiciliario usando el botón 'Nuevo Domiciliario'"}
          />
        }
      />

      <ConfirmDialog
        visible={deleteDialog.visible}
        onClose={() => setDeleteDialog({ visible: false, id: null })}
        onConfirm={deleteDomiciliario}
        title="¿Eliminar domiciliario?"
        message="Los gastos vinculados quedarán sin domiciliario"
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
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  headerTitle: {
    ...typography.h1,
    color: '#fff',
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    ...typography.body,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: spacing.lg,
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
  newButton: {
    marginBottom: 0,
  },
  domiciliarioCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: 0,
  },
  cardContent: {
    padding: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#84b2f7ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  domiciliarioName: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  phoneText: {
    ...typography.bodySmall,
    color: colors.secondary,
    fontWeight: '500',
  },
  observations: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  cardActions: {
    gap: spacing.xs,
  },
  callButton: {
    padding: spacing.sm,
    backgroundColor: `${colors.secondary}15`,
    borderRadius: 8,
  },
  deleteButton: {
    padding: spacing.sm,
  },
});