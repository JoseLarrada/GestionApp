import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ListaTransferencias from './ListaTransferencias';
import FormTransferencia from './FormTransferencia';
import { colors } from '../../theme';

const Stack = createNativeStackNavigator();

export default function TransferenciasStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.secondary,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="ListaTransferencias" 
        component={ListaTransferencias}
        options={{ 
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="FormTransferencia" 
        component={FormTransferencia}
        options={{ 
          title: 'Transferencia',
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}