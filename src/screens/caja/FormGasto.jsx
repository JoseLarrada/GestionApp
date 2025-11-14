import { useState, useEffect } from 'react';
import { View, TextInput, Button, Alert, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { db } from '../../db/database';

const expenseTypes = ['Flete', 'Domicilio', 'Transportadora', 'Otro'];

export default function FormGasto({ route, navigation }) {
  const expense = route.params?.expense || {};
  const [type, setType] = useState(expense.type || 'Flete');
  const [amount, setAmount] = useState(expense.amount?.toString() || '');
  const [obs, setObs] = useState(expense.observations || '');
  const [transId, setTransId] = useState(expense.transportadora_id?.toString() || '');
  const [transportadoras, setTransportadoras] = useState([]);
  const date = expense.date ? new Date(expense.date) : new Date();

  useEffect(() => {
    try {
      const rows = db.getAllSync(`SELECT * FROM transportadoras ORDER BY name`);
      setTransportadoras(rows);
    } catch (e) { console.error(e); }
  }, []);

  const save = () => {
    if (!amount || isNaN(amount)) return Alert.alert('Monto requerido y debe ser número');

    try {
      if (expense.id) {
        db.runSync(
          `UPDATE expenses SET type=?, amount=?, observations=?, transportadora_id=?, date=? WHERE id=?`,
          [type, parseFloat(amount), obs || null, transId || null, date.getTime(), expense.id]
        );
      } else {
        db.runSync(
          `INSERT INTO expenses (type, amount, observations, transportadora_id, date) VALUES (?,?,?,?,?)`,
          [type, parseFloat(amount), obs || null, transId || null, date.getTime()]
        );
      }
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  return (
    <View style={styles.container}>
      <Picker selectedValue={type} onValueChange={setType}>
        {expenseTypes.map(t => <Picker.Item key={t} label={t} value={t} />)}
      </Picker>

      <TextInput style={styles.input} placeholder="Monto" value={amount} onChangeText={setAmount} keyboardType="numeric" />

      {type === 'Transportadora' && (
        <Picker selectedValue={transId} onValueChange={setTransId}>
          <Picker.Item label="Ninguna" value="" />
          {transportadoras.map(t => <Picker.Item key={t.id} label={t.name} value={t.id.toString()} />)}
        </Picker>
      )}

      <TextInput style={styles.input} placeholder="Observaciones" value={obs} onChangeText={setObs} multiline />

      <Button title="Guardar" onPress={save} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#fff', flex: 1 },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 12, marginBottom: 12, borderRadius: 8, backgroundColor: '#f9f9f9' },
});