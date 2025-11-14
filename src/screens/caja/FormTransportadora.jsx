import { useState, useEffect } from 'react';
import { View, FlatList, TextInput, Button, TouchableOpacity, Text, Alert, StyleSheet } from 'react-native';
import { db } from '../../db/database';

export default function ListaTransportadoras({ navigation }) {
  const [transportadoras, setTransportadoras] = useState([]);
  const [search, setSearch] = useState('');

  const load = () => {
    try {
      const rows = db.getAllSync(
        `SELECT * FROM transportadoras WHERE name LIKE ? ORDER BY name`,
        [`%${search}%`]
      );
      setTransportadoras(rows);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { load(); }, [search]);

  const deleteTrans = (id) => {
    Alert.alert('Confirmar', '¿Eliminar transportadora?', [
      { text: 'Cancelar' },
      { text: 'Eliminar', style: 'destructive', onPress: () => {
        try {
          db.runSync(`DELETE FROM transportadoras WHERE id = ?`, [id]);
          load();
        } catch (e) {
          Alert.alert('Error', 'Hay gastos vinculados a esta transportadora');
        }
      }},
    ]);
  };

  return (
    <View style={styles.container}>
      <TextInput style={styles.input} placeholder="Buscar transportadora..." value={search} onChangeText={setSearch} />
      <Button title="+ Nueva transportadora" onPress={() => navigation.navigate('FormTransportadora')} />

      <FlatList
        data={transportadoras}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <TouchableOpacity onPress={() => navigation.navigate('FormTransportadora', { trans: item })}>
              <Text style={styles.title}>{item.name}</Text>
              <Text>{item.observations || 'Sin observaciones'}</Text>
            </TouchableOpacity>
            <Button title="Eliminar" color="red" onPress={() => deleteTrans(item.id)} />
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