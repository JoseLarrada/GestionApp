import { useState, useEffect } from 'react';
import { View, TextInput, Button, Alert, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { db } from '../../db/database';

export default function FormProducto({ route, navigation }) {
  const product = route.params?.product || {};
  const [name, setName] = useState(product.name || '');
  const [price, setPrice] = useState(product.price?.toString() || '');
  const [providerId, setProviderId] = useState(product.provider_id?.toString() || '');
  const [categoryId, setCategoryId] = useState(product.category_id?.toString() || '');
  const [observations, setObservations] = useState(product.observations || '');
  const [providers, setProviders] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    try {
      const prov = db.getAllSync(`SELECT * FROM providers ORDER BY name`);
      const cat = db.getAllSync(`SELECT * FROM categories ORDER BY name`);
      setProviders(prov);
      setCategories(cat);
    } catch (e) { console.error(e); }
  }, []);

  const save = () => {
    if (!name || !price || isNaN(price)) return Alert.alert('Faltan datos o precio inválido');

    try {
      if (product.id) {
        db.runSync(
          `UPDATE products SET name=?, price=?, provider_id=?, category_id=?, observations=? WHERE id=?`,
          [name, parseFloat(price), providerId || null, categoryId || null, observations, product.id]
        );
      } else {
        db.runSync(
          `INSERT INTO products (name, price, provider_id, category_id, observations) VALUES (?,?,?,?,?)`,
          [name, parseFloat(price), providerId || null, categoryId || null, observations]
        );
      }
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput style={styles.input} placeholder="Nombre" value={name} onChangeText={setName} />
      <TextInput style={styles.input} placeholder="Precio" value={price} onChangeText={setPrice} keyboardType="numeric" />

      <Picker selectedValue={providerId} onValueChange={setProviderId}>
        <Picker.Item label="Sin proveedor" value="" />
        {providers.map(p => <Picker.Item key={p.id} label={p.name} value={p.id.toString()} />)}
      </Picker>

      <Picker selectedValue={categoryId} onValueChange={setCategoryId}>
        <Picker.Item label="Sin categoría" value="" />
        {categories.map(c => <Picker.Item key={c.id} label={c.name} value={c.id.toString()} />)}
      </Picker>

      <TextInput style={styles.input} placeholder="Observaciones" value={observations} onChangeText={setObservations} multiline />

      <Button title="Guardar" onPress={save} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  prompt: { borderWidth: 1, borderColor: '#ddd', padding: 12, marginBottom: 15, borderRadius: 8 },
});