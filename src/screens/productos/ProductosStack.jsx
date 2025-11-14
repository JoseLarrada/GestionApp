import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ListaProductos from './ListaProductos';
import FormProducto from './FormProducto';
import ListaProveedores from './ListaProveedores';
import FormProveedor from './FormProveedor';
import ListaCategorias from './ListaCategorias';
import FormCategoria from './FormCategoria';

const Stack = createNativeStackNavigator();

export default function ProductosStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="ListaProductos" component={ListaProductos} options={{ title: 'Productos' }} />
      <Stack.Screen name="FormProducto" component={FormProducto} options={{ title: 'Producto' }} />
      <Stack.Screen name="ListaProveedores" component={ListaProveedores} options={{ title: 'Proveedores' }} />
      <Stack.Screen name="FormProveedor" component={FormProveedor} options={{ title: 'Proveedor' }} />
      <Stack.Screen name="ListaCategorias" component={ListaCategorias} options={{ title: 'Categorías' }} />
      <Stack.Screen name="FormCategoria" component={FormCategoria} options={{ title: 'Categoría' }} /> 
      {/* Categorías puedes hacerlas igual que proveedores */}
    </Stack.Navigator>
  );
}