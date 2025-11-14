import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import ProductosStack from '../screens/productos/ProductosStack';
import TransferenciasStack from '../screens/transferencias/TransferenciasStack';   // ← crearás igual que productos
import CajaStack from '../screens/caja/CajaStack';                           // ← crearás igual
import ConfigScreen from '../screens/config/ConfigScreen';

const Tab = createBottomTabNavigator();

export default function AppNavigator() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen
        name="ProductosTab"
        component={ProductosStack}
        options={{ tabBarLabel: 'Productos', tabBarIcon: ({color}) => <Ionicons name="basket" size={24} color={color} /> }}
      />
      <Tab.Screen
        name="TransferenciasTab"
        component={TransferenciasStack}
        options={{ tabBarLabel: 'Transferencias', tabBarIcon: ({color}) => <Ionicons name="send" size={24} color={color} /> }}
      />
      <Tab.Screen
        name="CajaTab"
        component={CajaStack}
        options={{ tabBarLabel: 'Caja Menor', tabBarIcon: ({color}) => <Ionicons name="cash" size={24} color={color} /> }}
      />
      <Tab.Screen
        name="Config"
        component={ConfigScreen}
        options={{ tabBarLabel: 'Config', tabBarIcon: ({color}) => <Ionicons name="settings" size={24} color={color} /> }}
      />
    </Tab.Navigator>
  );
}