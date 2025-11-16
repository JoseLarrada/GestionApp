import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../db/database';
import { Button, Input, Select, DatePicker, AlertDialog, Card } from '../../components';
import { colors, spacing, typography } from '../../theme';
import { appEvents } from '../../utils/events';

const expenseTypes = ['Flete', 'Domicilio', 'Transportadora', 'Otro'];

export default function FormGasto({ route, navigation }) {
  const expense = route.params?.expense || {};
  const [type, setType] = useState(expense.type || 'Flete');
  const [amount, setAmount] = useState(expense.amount?.toString() || '');
  const [obs, setObs] = useState(expense.observations || '');
  const [transId, setTransId] = useState(expense.transportadora_id?.toString() || '');
  const [domiciliarioId, setDomiciliarioId] = useState(expense.domiciliario_id?.toString() || '');
  const [date, setDate] = useState(expense.date ? new Date(expense.date) : new Date());
  const [transportadoras, setTransportadoras] = useState([]);
  const [domiciliarios, setDomiciliarios] = useState([]);
  const [errors, setErrors] = useState({});
  const [alert, setAlert] = useState({ visible: false, type: 'success', title: '', message: '' });

  useEffect(() => {
    loadData();
    
    // Suscribirse a eventos
    const handleTransportadorasChanged = () => loadData();
    const handleDomiciliariosChanged = () => loadData();
    
    appEvents.on('transportadoras:changed', handleTransportadorasChanged);
    appEvents.on('domiciliarios:changed', handleDomiciliariosChanged);
    
    return () => {
      appEvents.off('transportadoras:changed', handleTransportadorasChanged);
      appEvents.off('domiciliarios:changed', handleDomiciliariosChanged);
    };
  }, []);

  const loadData = () => {
    try {
      const trans = db.getAllSync(`SELECT * FROM transportadoras ORDER BY name`);
      setTransportadoras(trans);
      
      const doms = db.getAllSync(`SELECT * FROM domiciliarios ORDER BY name`);
      setDomiciliarios(doms);
    } catch (e) { 
      console.error(e); 
    }
  };

  const formatNumber = (value) => {
    // Remover todo excepto números y punto decimal
    const cleaned = value.replace(/[^\d.]/g, '');
    
    // Prevenir múltiples puntos decimales
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      return amount;
    }
    
    // Formatear con separadores de miles
    const [integer, decimal] = parts;
    const formattedInteger = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    
    return decimal !== undefined ? `${formattedInteger}.${decimal}` : formattedInteger;
  };

  const parseNumber = (formattedValue) => {
    return formattedValue.replace(/,/g, '');
  };

  const validate = () => {
    const newErrors = {};
    
    if (!amount.trim()) {
      newErrors.amount = 'El monto es requerido';
    } else {
      const numValue = parseFloat(parseNumber(amount));
      if (isNaN(numValue) || numValue <= 0) {
        newErrors.amount = 'Ingresa un monto válido mayor a 0';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const save = () => {
    if (!validate()) return;

    try {
      const numericAmount = parseFloat(parseNumber(amount));
      
      if (expense.id) {
        db.runSync(
          `UPDATE expenses SET type=?, amount=?, observations=?, transportadora_id=?, domiciliario_id=?, date=? WHERE id=?`,
          [type, numericAmount, obs.trim() || null, transId || null, domiciliarioId || null, date.getTime(), expense.id]
        );
        setAlert({
          visible: true,
          type: 'success',
          title: '¡Actualizado!',
          message: 'El gasto se actualizó correctamente',
        });
      } else {
        db.runSync(
          `INSERT INTO expenses (type, amount, observations, transportadora_id, domiciliario_id, date) VALUES (?,?,?,?,?,?)`,
          [type, numericAmount, obs.trim() || null, transId || null, domiciliarioId || null, date.getTime()]
        );
        setAlert({
          visible: true,
          type: 'success',
          title: '¡Guardado!',
          message: 'El gasto se registró correctamente',
        });
      }
      
      appEvents.onExpensesChanged();
      appEvents.onDataChanged();
      
      setTimeout(() => navigation.goBack(), 1500);
    } catch (e) {
      setAlert({
        visible: true,
        type: 'error',
        title: 'Error',
        message: e.message || 'No se pudo guardar el gasto',
      });
    }
  };

  const typeItems = expenseTypes.map(t => ({ label: t, value: t }));
  
  const transItems = [
    { label: 'Ninguna', value: '' },
    ...transportadoras.map(t => ({ label: t.name, value: t.id.toString() }))
  ];

  const domiciliarioItems = [
    { label: 'Ninguno', value: '' },
    ...domiciliarios.map(d => ({ label: d.name, value: d.id.toString() }))
  ];

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      {/* Header con gradiente */}
      <LinearGradient
        colors={[colors.primary, '#1565C0']}
        style={styles.header}
      >
        <View style={styles.headerIconContainer}>
          <Ionicons name="wallet" size={48} color="#fff" />
        </View>
        <Text style={styles.headerTitle}>
          {expense.id ? 'Editar Gasto' : 'Nuevo Gasto'}
        </Text>
        <Text style={styles.headerSubtitle}>
          {expense.id ? 'Actualiza la información del gasto' : 'Registra un nuevo gasto en caja menor'}
        </Text>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Información del Gasto */}
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <Ionicons name="information-circle" size={24} color="#fff" />
            </View>
            <Text style={styles.sectionTitle}>Información del Gasto</Text>
          </View>

          <Select
            label="Tipo de gasto *"
            value={type}
            onValueChange={setType}
            items={typeItems}
            icon="pricetag"
          />

          <Input
            label="Monto *"
            placeholder="0.00"
            value={formatNumber(amount)}
            onChangeText={(text) => {
              setAmount(parseNumber(text));
              setErrors(prev => ({ ...prev, amount: '' }));
            }}
            icon="cash"
            keyboardType="decimal-pad"
            error={errors.amount}
          />

          <DatePicker
            label="Fecha del gasto"
            value={date}
            onChange={setDate}
            mode="date"
          />
        </Card>

        {/* Transportadora (condicional) */}
        {type === 'Transportadora' && (
          <Card style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <Ionicons name="car" size={24} color="#fff" />
              </View>
              <View style={styles.sectionHeaderContent}>
                <Text style={styles.sectionTitle}>Transportadora</Text>
              </View>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => navigation.navigate('ListaTransportadoras')}
              >
                <Ionicons name="add-circle" size={24} color={colors.primary} />
              </TouchableOpacity>
            </View>

            <Select
              label="Seleccionar transportadora"
              value={transId}
              onValueChange={setTransId}
              items={transItems}
              icon="car"
              placeholder="Ninguna"
            />
          </Card>
        )}

        {/* Domiciliario (condicional) */}
        {type === 'Domicilio' && (
          <Card style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <Ionicons name="bicycle" size={24} color="#fff" />
              </View>
              <View style={styles.sectionHeaderContent}>
                <Text style={styles.sectionTitle}>Domiciliario</Text>
              </View>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => navigation.navigate('ListaDomiciliarios')}
              >
                <Ionicons name="add-circle" size={24} color="#FF6B6B" />
              </TouchableOpacity>
            </View>

            <Select
              label="Seleccionar domiciliario"
              value={domiciliarioId}
              onValueChange={setDomiciliarioId}
              items={domiciliarioItems}
              icon="bicycle"
              placeholder="Ninguno"
            />
          </Card>
        )}

        {/* Detalles Adicionales */}
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <Ionicons name="document-text" size={24} color="#fff" />
            </View>
            <Text style={styles.sectionTitle}>Detalles Adicionales</Text>
          </View>

          <Input
            label="Observaciones"
            placeholder="Detalles, notas o comentarios sobre el gasto..."
            value={obs}
            onChangeText={setObs}
            icon="document-text"
            multiline
            numberOfLines={4}
          />
        </Card>

        {/* Botones de acción */}
        <View style={styles.buttonContainer}>
          <Button
            title={expense.id ? 'Actualizar Gasto' : 'Guardar Gasto'}
            icon={expense.id ? 'checkmark-circle' : 'add-circle'}
            onPress={save}
            fullWidth
            style={styles.saveButton}
          />
          
          <Button
            title="Cancelar"
            variant="outline"
            onPress={() => navigation.goBack()}
            fullWidth
          />
        </View>
      </ScrollView>

      <AlertDialog
        visible={alert.visible}
        onClose={() => setAlert({ ...alert, visible: false })}
        type={alert.type}
        title={alert.title}
        message={alert.message}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
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
    paddingHorizontal: spacing.lg,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  sectionHeaderContent: {
    flex: 1,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
  },
  addButton: {
    padding: spacing.xs,
  },
  buttonContainer: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  saveButton: {
    marginBottom: spacing.sm,
  },
});