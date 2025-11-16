import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ListaProductos from './ListaProductos';
import FormProducto from './FormProducto';
import ListaProveedores from './ListaProveedores';
import FormProveedor from './FormProveedor';
import ListaCategorias from './ListaCategorias';
import FormCategoria from './FormCategoria';
import { colors } from '../../theme';

const Stack = createNativeStackNavigator();

export default function ProductosStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.primary,
        },
        headerTintColor: colors.textOnPrimary,
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 18,
        },
        headerShadowVisible: true,
      }}
    >
      <Stack.Screen 
        name="ListaProductos" 
        component={ListaProductos} 
        options={{ 
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="FormProducto" 
        component={FormProducto} 
        options={{ 
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="ListaProveedores" 
        component={ListaProveedores} 
        options={{ 
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="FormProveedor" 
        component={FormProveedor} 
        options={({ route }) => ({
          title: route.params?.provider ? 'Editar Proveedor' : 'Nuevo Proveedor'
        })}
      />
      <Stack.Screen 
        name="ListaCategorias" 
        component={ListaCategorias} 
        options={{ 
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="FormCategoria" 
        component={FormCategoria} 
        options={({ route }) => ({
          title: route.params?.category ? 'Editar Categoría' : 'Nueva Categoría'
        })}
      />
    </Stack.Navigator>
  );
}