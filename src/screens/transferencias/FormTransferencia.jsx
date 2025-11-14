import { useState, useEffect } from 'react';
import { View, TextInput, Button, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { db } from '../../db/database';

const accountTypes = ['Ahorros', 'Corriente', 'Nequi', 'Daviplata', 'Efectivo', 'Otro'];

export default function FormTransferencia({ route, navigation }) {
  const transfer = route.params?.transfer || {};
  const [amount, setAmount] = useState(transfer.amount?.toString() || '');
  const [type, setType] = useState(transfer.account_type || 'Ahorros');
  const [sender, setSender] = useState(transfer.sender_name || '');
  const [obs, setObs] = useState(transfer.observations || '');
  const date = transfer.date ? new Date(transfer.date) : new Date();

  const save = () => {
    if (!amount || !sender) return Alert.alert('Faltan datos');
    const sql = transfer.id
      ? `UPDATE transfers SET amount=?, account_type=?, sender_name=?, observations=?, date=? WHERE id=?`
      : `INSERT INTO transfers (amount, account_type, sender_name, observations, date) VALUES (?,?,?,?,?)`;
    const params = transfer.id
      ? [amount, type, sender, obs, date.getTime(), transfer.id]
      : [amount, type, sender, obs, date.getTime()];

    db.runSync(tx => tx.runSync(sql, params, () => navigation.goBack()));
  };

  return (
    <View style={{ padding: 20 }}>
      <TextInput placeholder="Cantidad" value={amount} onChangeText={setAmount} keyboardType="numeric" />
      <Picker selectedValue={type} onValueChange={setType}>
        {accountTypes.map(t => <Picker.Item key={t} label={t} value={t} />)}
      </Picker>
      <TextInput placeholder="Nombre de quien envió" value={sender} onChangeText={setSender} />
      <TextInput placeholder="Observaciones" value={obs} onChangeText={setObs} />
      <Button title="Guardar" onPress={save} />
    </View>
  );
}