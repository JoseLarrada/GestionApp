import { useState, useEffect } from 'react';
import { View, FlatList, TextInput, Button, TouchableOpacity, Text, Alert, StyleSheet } from 'react-native';
import { db } from '../../db/database';

export default function ListaCategorias({ navigation }) {
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');

  const load = () => {
    try {
      const rows = db.getAllSync(
        `SELECT * FROM categories WHERE name LIKE ? ORDER BY name`,
        [`%${search}%`]
      );
      setCategories(rows);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { load(); }, [search]);

  const deleteCat = (id) => {
    Alert.alert('Confirmar', '¿Eliminar categoría? (se eliminarán productos vinculados)', [
      { text: 'Cancelar' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => {
          try {
            db.runSync(`DELETE FROM categories WHERE id = ?`, [id]);
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
      <TextInput style={styles.input} placeholder="Buscar categoría..." value={search} onChangeText={setSearch} />
      <Button title="+ Nueva categoría" onPress={() => navigation.navigate('FormCategoria')} />

      <FlatList
        data={categories}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <TouchableOpacity onPress={() => navigation.navigate('FormCategoria', { category: item })}>
              <Text style={styles.title}>{item.name}</Text>
            </TouchableOpacity>
            <Button title="Eliminar" color="red" onPress={() => deleteCat(item.id)} />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 12, marginBottom: 15, borderRadius: 8 },
  item: { padding: 15, backgroundColor: '#f0f0f0', marginBottom: 10, borderRadius: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontWeight: 'bold', fontSize: 16 },
});