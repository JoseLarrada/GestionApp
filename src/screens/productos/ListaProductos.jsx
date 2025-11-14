import { useState, useEffect } from 'react';
import { View, Text, FlatList, TextInput, Button, TouchableOpacity, StyleSheet } from 'react-native';
import { db } from '../../db/database';

export default function ListaProductos({ navigation }) {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');

  const loadProducts = () => {
    try {
      const rows = db.getAllSync(
        `SELECT p.*, pr.name as provider_name, c.name as category_name 
        FROM products p 
        LEFT JOIN providers pr ON p.provider_id = pr.id
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.name LIKE ? OR pr.name LIKE ? OR c.name LIKE ?
        ORDER BY p.name`,
        [`%${search}%`, `%${search}%`, `%${search}%`]
      );
      setProducts(rows);
    } catch (e) { console.error(e); }
  };

useEffect(() => { loadProducts(); }, [search]);

const deleteProduct = (id) => {
  if (!confirm('¿Eliminar?')) return;
  db.runSync(`DELETE FROM products WHERE id = ?`, [id]);
  loadProducts();
};

  return (
    <View style={styles.container}>
      <TextInput placeholder="Buscar..." value={search} onChangeText={setSearch} style={styles.input} />
      <Button title="+ Producto" onPress={() => navigation.navigate('FormProducto')} />
      <Button title="Proveedores" onPress={() => navigation.navigate('ListaProveedores')} />
      <Button title="Categorías" onPress={() => navigation.navigate('ListaCategorias')} />
      <FlatList
        data={products}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => navigation.navigate('FormProducto', { product: item })}>
            <View style={styles.item}>
              <Text>{item.name} - ${item.price}</Text>
              <Text>{item.provider_name} | {item.category_name}</Text>
              <Button title="✖" onPress={() => deleteProduct(item.id)} />
            </View>
          </TouchableOpacity>
        )}
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
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    marginBottom: 12,
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
  },
  item: {
    padding: 15,
    backgroundColor: '#f0f0f0',
    marginBottom: 10,
    borderRadius: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    color: '#666',
  },
});