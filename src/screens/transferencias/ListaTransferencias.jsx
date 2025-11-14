// src/screens/transferencias/ListaTransferencias.jsx
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Button,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { db } from '../../db/database';

const accountTypes = ['Ahorros', 'Corriente', 'Nequi', 'Daviplata', 'Efectivo', 'Otro'];

export default function ListaTransferencias({ navigation }) {
  const [transfers, setTransfers] = useState([]);
  const [summary, setSummary] = useState({ total: 0, byType: {} });
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [showFrom, setShowFrom] = useState(false);
  const [showTo, setShowTo] = useState(false);
  const [typeFilter, setTypeFilter] = useState('');
  const [senderFilter, setSenderFilter] = useState('');

  const load = () => {
    const from = fromDate ? fromDate.getTime() : 0;
    const to = toDate ? toDate.getTime() + 86400000 : Date.now() + 86400000;

    try {
      // === Lista de transferencias ===
      const list = db.getAllSync(
        `SELECT * FROM transfers 
         WHERE date >= ? AND date <= ?
         AND (account_type LIKE ? OR ? = '')
         AND (sender_name LIKE ? OR ? = '')
         ORDER BY date DESC`,
        [from, to, `%${typeFilter}%`, typeFilter, `%${senderFilter}%`, senderFilter]
      );
      setTransfers(list);

      // === Total general ===
      const totalRow = db.getFirstSync(
        `SELECT SUM(amount) as total FROM transfers WHERE date >= ? AND date <= ?`,
        [from, to]
      );
      const total = totalRow?.total || 0;
      setSummary((prev) => ({ ...prev, total }));

      // === Por tipo de cuenta ===
      const byType = {};
      accountTypes.forEach((type) => {
        const sumRow = db.getFirstSync(
          `SELECT SUM(amount) as sum FROM transfers WHERE account_type = ? AND date >= ? AND date <= ?`,
          [type, from, to]
        );
        byType[type] = sumRow?.sum || 0;
      });
      setSummary((prev) => ({ ...prev, byType }));
    } catch (error) {
      console.error('Error cargando transferencias:', error);
      Alert.alert('Error', 'No se pudieron cargar las transferencias');
    }
  };

  useEffect(() => {
    load();
  }, [fromDate, toDate, typeFilter, senderFilter]);

  const deleteTransfer = (id) => {
    Alert.alert(
      'Eliminar transferencia',
      '¿Estás seguro de que quieres eliminar esta transferencia?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            try {
              db.runSync(`DELETE FROM transfers WHERE id = ?`, [id]);
              load();
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar la transferencia');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Button
        title="+ Nueva transferencia"
        onPress={() => navigation.navigate('FormTransferencia')}
      />

      {/* === Filtros === */}
      <View style={styles.filterSection}>
        <Text style={styles.label}>Desde:</Text>
        <Button
          title={fromDate ? fromDate.toLocaleDateString() : 'Seleccionar'}
          onPress={() => setShowFrom(true)}
        />
        {showFrom && (
          <DateTimePicker
            mode="date"
            value={fromDate || new Date()}
            onChange={(_, selectedDate) => {
              setShowFrom(false);
              setFromDate(selectedDate);
            }}
          />
        )}

        <Text style={styles.label}>Hasta:</Text>
        <Button
          title={toDate ? toDate.toLocaleDateString() : 'Seleccionar'}
          onPress={() => setShowTo(true)}
        />
        {showTo && (
          <DateTimePicker
            mode="date"
            value={toDate || new Date()}
            onChange={(_, selectedDate) => {
              setShowTo(false);
              setToDate(selectedDate);
            }}
          />
        )}

        <Picker selectedValue={typeFilter} onValueChange={setTypeFilter} style={styles.picker}>
          <Picker.Item label="Todos los tipos" value="" />
          {accountTypes.map((t) => (
            <Picker.Item key={t} label={t} value={t} />
          ))}
        </Picker>

        <TextInput
          style={styles.input}
          placeholder="Filtrar por remitente"
          value={senderFilter}
          onChangeText={setSenderFilter}
        />
      </View>

      {/* === Resúmenes === */}
      <View style={styles.summary}>
        <Text style={styles.totalText}>
          Total enviado: ${summary.total.toFixed(2)}
        </Text>
        {accountTypes.map(
          (t) =>
            summary.byType[t] > 0 && (
              <Text key={t} style={styles.typeText}>
                {t}: ${summary.byType[t].toFixed(2)}
              </Text>
            )
        )}
      </View>

      {/* === Lista === */}
      <FlatList
        data={transfers}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => navigation.navigate('FormTransferencia', { transfer: item })}
          >
            <View style={styles.item}>
              <View>
                <Text style={styles.date}>
                  {new Date(item.date).toLocaleDateString()} - ${item.amount}
                </Text>
                <Text style={styles.details}>
                  {item.sender_name} • {item.account_type}
                  {item.observations ? ` • ${item.observations}` : ''}
                </Text>
              </View>
              <Button title="Eliminar" color="red" onPress={() => deleteTransfer(item.id)} />
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No hay transferencias</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  filterSection: {
    marginVertical: 15,
  },
  label: {
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
  },
  picker: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginVertical: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
    backgroundColor: '#f9f9f9',
  },
  summary: {
    padding: 15,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    marginVertical: 10,
  },
  totalText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0066cc',
  },
  typeText: {
    fontSize: 15,
    color: '#333',
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f5f5f5',
    marginBottom: 10,
    borderRadius: 8,
  },
  date: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  details: {
    color: '#555',
    fontSize: 14,
  },
  empty: {
    textAlign: 'center',
    marginTop: 30,
    color: '#888',
    fontStyle: 'italic',
  },
});