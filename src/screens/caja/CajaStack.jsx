import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ListaGastos from './ListaGastos';
import FormGasto from './FormGasto';
import ListaTransportadoras from './ListaTransportadoras';
import FormTransportadora from './FormTransportadora';

const Stack = createNativeStackNavigator();

export default function CajaStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="ListaGastos" component={ListaGastos} options={{ title: 'Caja Menor' }} />
      <Stack.Screen name="FormGasto" component={FormGasto} options={{ title: 'Gasto' }} />
      <Stack.Screen name="ListaTransportadoras" component={ListaTransportadoras} options={{ title: 'Transportadoras' }} />
      <Stack.Screen name="FormTransportadora" component={FormTransportadora} options={{ title: 'Transportadora' }} />
    </Stack.Navigator>
  );
}