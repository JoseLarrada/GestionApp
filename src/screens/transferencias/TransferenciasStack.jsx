import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ListaTransferencias from './ListaTransferencias';
import FormTransferencia from './FormTransferencia';

const Stack = createNativeStackNavigator();

export default function TransferenciasStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="ListaTransferencias" component={ListaTransferencias} options={{ title: 'Transferencias' }} />
      <Stack.Screen name="FormTransferencia" component={FormTransferencia} options={{ title: 'Transferencia' }} />
    </Stack.Navigator>
  );
}