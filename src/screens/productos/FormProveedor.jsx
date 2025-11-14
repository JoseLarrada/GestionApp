import { useState } from 'react';
import { View, TextInput, Button, Alert, StyleSheet } from 'react-native';
import { db } from '../../db/database';

export default function FormProveedor({ route, navigation }) {
  const provider = route.params?.provider || {};
  const [name, setName] = useState(provider.name || '');
  const [phone, setPhone] = useState(provider.phone || '');
  const [notes, setNotes] = useState(provider.notes || '');

  const save = () => {
    if (!name.trim()) return Alert.alert('El nombre es obligatorio');

    try {
      if (provider.id) {
        db.runSync(`UPDATE providers SET name=?, phone=?, notes=? WHERE id=?`, [name, phone || null, notes || null, provider.id]);
      } else {
        db.runSync(`INSERT INTO providers (name, phone, notes) VALUES (?,?,?)`, [name, phone || null, notes || null]);
      }
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput style={styles.input} placeholder="Nombre del proveedor" value={name} onChangeText={setName} />
      <TextInput style={styles.input} placeholder="Teléfono (opcional)" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <TextInput style={styles.input} placeholder="Notas (opcional)" value={notes} onChangeText={setNotes} multiline />
      <Button title="Guardar" onPress={save} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 12, marginBottom: 12, borderRadius: 8, backgroundColor: '#f9f9f9' },
});