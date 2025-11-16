import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import ProductosStack from '../screens/productos/ProductosStack';
import TransferenciasStack from '../screens/transferencias/TransferenciasStack';
import CajaStack from '../screens/caja/CajaStack';
import ConfigScreen from '../screens/config/ConfigScreen';
import { colors, spacing, shadows } from '../theme';

const Tab = createBottomTabNavigator();

export default function AppNavigator() {
  return (
    <Tab.Navigator 
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'ProductosTab') {
            iconName = focused ? 'basket' : 'basket-outline';
          } else if (route.name === 'TransferenciasTab') {
            iconName = focused ? 'send' : 'send-outline';
          } else if (route.name === 'CajaTab') {
            iconName = focused ? 'cash' : 'cash-outline';
          } else if (route.name === 'Config') {
            iconName = focused ? 'settings' : 'settings-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textLight,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.borderLight,
          paddingTop: spacing.xs,
          paddingBottom: spacing.xs,
          height: 60,
          ...shadows.md,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarItemStyle: {
          paddingVertical: spacing.xs,
        },
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ 
          tabBarLabel: 'Inicio',
        }}
      />
      <Tab.Screen
        name="ProductosTab"
        component={ProductosStack}
        options={{ 
          tabBarLabel: 'Productos',
        }}
      />
      <Tab.Screen
        name="CajaTab"
        component={CajaStack}
        options={{ 
          tabBarLabel: 'Caja',
        }}
      />
      <Tab.Screen
        name="TransferenciasTab"
        component={TransferenciasStack}
        options={{ 
          tabBarLabel: 'Transferencias',
        }}
      />
      <Tab.Screen
        name="Config"
        component={ConfigScreen}
        options={{ 
          tabBarLabel: 'Ajustes',
        }}
      />
    </Tab.Navigator>
  );
}