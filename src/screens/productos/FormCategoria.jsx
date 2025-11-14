import { useState } from 'react';
import { View, TextInput, Button, Alert, StyleSheet } from 'react-native';
import { db } from '../../db/database';

export default function FormCategoria({ route, navigation }) {
  const category = route.params?.category || {};
  const [name, setName] = useState(category.name || '');

  const save = () => {
    if (!name.trim()) return Alert.alert('Nombre requerido');

    try {
      if (category.id) {
        db.runSync(`UPDATE categories SET name = ? WHERE id = ?`, [name, category.id]);
      } else {
        db.runSync(`INSERT INTO categories (name) VALUES (?)`, [name]);
      }
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput style={styles.input} placeholder="Nombre de categoría" value={name} onChangeText={setName} />
      <Button title="Guardar" onPress={save} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 12, marginBottom: 15, borderRadius: 8 },
});