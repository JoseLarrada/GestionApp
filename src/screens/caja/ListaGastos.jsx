import { useState, useEffect } from 'react';
import { View, Text, FlatList, Button, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { db } from '../../db/database';

const expenseTypes = ['Flete', 'Domicilio', 'Transportadora', 'Otro'];

export default function ListaGastos({ navigation }) {
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState({ total: 0, byType: {} });
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [showFrom, setShowFrom] = useState(false);
  const [showTo, setShowTo] = useState(false);
  const [typeFilter, setTypeFilter] = useState('');
  const [transFilter, setTransFilter] = useState('');

  const load = () => {
    const from = fromDate ? fromDate.getTime() : 0;
    const to = toDate ? toDate.getTime() + 86400000 : Date.now() + 86400000;

    try {
      // Lista
      const list = db.getAllSync(
        `SELECT e.*, t.name as trans_name FROM expenses e 
         LEFT JOIN transportadoras t ON e.transportadora_id = t.id
         WHERE e.date >= ? AND e.date <= ?
         AND e.type LIKE ?
         AND (t.name LIKE ? OR ? = '')
         ORDER BY e.date DESC`,
        [from, to, `%${typeFilter}%`, `%${transFilter}%`, transFilter]
      );
      setExpenses(list);

      // Total general
      const total = db.getFirstSync(
        `SELECT SUM(amount) as total FROM expenses WHERE date >= ? AND date <= ?`,
        [from, to]
      )?.total || 0;
      setSummary(prev => ({ ...prev, total }));

      // Por tipo
      const byType = {};
      expenseTypes.forEach(t => {
        const sum = db.getFirstSync(
          `SELECT SUM(amount) as sum FROM expenses WHERE type = ? AND date >= ? AND date <= ?`,
          [t, from, to]
        )?.sum || 0;
        byType[t] = sum;
      });
      setSummary(prev => ({ ...prev, byType }));
    } catch (e) { console.error(e); }
  };

  useEffect(() => { load(); }, [fromDate, toDate, typeFilter, transFilter]);

  const deleteExpense = (id) => {
    Alert.alert('Confirmar', '¿Eliminar gasto?', [
      { text: 'Cancelar' },
      { text: 'Eliminar', style: 'destructive', onPress: () => {
        db.runSync(`DELETE FROM expenses WHERE id = ?`, [id]);
        load();
      }},
    ]);
  };

  return (
    <View style={styles.container}>
      <Button title="+ Nuevo gasto" onPress={() => navigation.navigate('FormGasto')} />
      <Button title="Transportadoras" onPress={() => navigation.navigate('ListaTransportadoras')} />

      {/* Filtros */}
      <Text style={styles.label}>Desde</Text>
      <Button title={fromDate ? fromDate.toLocaleDateString() : 'Seleccionar'} onPress={() => setShowFrom(true)} />
      {showFrom && <DateTimePicker mode="date" value={fromDate || new Date()} onChange={(_, d) => { setShowFrom(false); setFromDate(d); }} />}

      <Text style={styles.label}>Hasta</Text>
      <Button title={toDate ? toDate.toLocaleDateString() : 'Seleccionar'} onPress={() => setShowTo(true)} />
      {showTo && <DateTimePicker mode="date" value={toDate || new Date()} onChange={(_, d) => { setShowTo(false); setToDate(d); }} />}

      <Picker selectedValue={typeFilter} onValueChange={setTypeFilter}>
        <Picker.Item label="Todos los tipos" value="" />
        {expenseTypes.map(t => <Picker.Item key={t} label={t} value={t} />)}
      </Picker>

      <TextInput style={styles.input} placeholder="Filtrar transportadora" value={transFilter} onChangeText={setTransFilter} />

      <Text style={styles.total}>Total gastado: ${summary.total.toFixed(2)}</Text>
      {expenseTypes.map(t => summary.byType[t] > 0 && <Text key={t}>{t}: ${summary.byType[t].toFixed(2)}</Text>)}

      <FlatList
        data={expenses}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => navigation.navigate('FormGasto', { expense: item })}>
            <View style={styles.item}>
              <Text style={styles.title}>{new Date(item.date).toLocaleDateString()} - ${item.amount} - {item.type}</Text>
              <Text>{item.trans_name || ''} {item.observations}</Text>
              <Button title="Eliminar" color="red" onPress={() => deleteExpense(item.id)} />
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  label: { marginTop: 10, fontWeight: 'bold' },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 12, marginVertical: 8, borderRadius: 8 },
  total: { fontSize: 18, fontWeight: 'bold', marginVertical: 10 },
  item: { padding: 15, backgroundColor: '#f0f0f0', marginBottom: 10, borderRadius: 8 },
  title: { fontWeight: 'bold' },
});