import { useState, useEffect } from 'react';
import { View, FlatList, TextInput, Button, TouchableOpacity, Text, Alert, StyleSheet } from 'react-native';
import { db } from '../../db/database';

export default function ListaProveedores({ navigation }) {
  const [providers, setProviders] = useState([]);
  const [search, setSearch] = useState('');

  const load = () => {
    try {
      const rows = db.getAllSync(
        `SELECT * FROM providers WHERE name LIKE ? ORDER BY name`,
        [`%${search}%`]
      );
      setProviders(rows);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { load(); }, [search]);

  const deleteProvider = (id) => {
    Alert.alert('Confirmar', '¿Eliminar proveedor? (se eliminarán productos vinculados)', [
      { text: 'Cancelar' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => {
          try {
            db.runSync(`DELETE FROM providers WHERE id = ?`, [id]);
            load();
          } catch (e) {
            Alert.alert('Error', 'No se puede eliminar: hay productos vinculados');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <TextInput style={styles.input} placeholder="Buscar proveedor..." value={search} onChangeText={setSearch} />
      <Button title="+ Nuevo proveedor" onPress={() => navigation.navigate('FormProveedor')} />

      <FlatList
        data={providers}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <TouchableOpacity onPress={() => navigation.navigate('FormProveedor', { provider: item })}>
              <Text style={styles.title}>{item.name}</Text>
              <Text>{item.phone || 'Sin teléfono'}</Text>
              <Text>{item.notes || 'Sin notas'}</Text>
            </TouchableOpacity>
            <Button title="Eliminar" color="red" onPress={() => deleteProvider(item.id)} />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 12, marginBottom: 15, borderRadius: 8 },
  item: { padding: 15, backgroundColor: '#f0f0f0', marginBottom: 10, borderRadius: 8 },
  title: { fontWeight: 'bold', fontSize: 16 },
});