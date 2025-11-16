import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ListaGastos from './ListaGastos';
import FormGasto from './FormGasto';
import FormBase from './FormBase';
import ListaBases from './ListaBases';
import ListaTransportadoras from './ListaTransportadoras';
import FormTransportadora from './FormTransportadora';
import ListaDomiciliarios from './ListaDomiciliario';
import FormDomiciliario from './FormDomiciliario';
import { colors } from '../../theme';

const Stack = createNativeStackNavigator();

export default function CajaStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.primary,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="ListaGastos" 
        component={ListaGastos}
        options={{ 
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="FormGasto" 
        component={FormGasto}
        options={{ 
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="FormBase" 
        component={FormBase}
        options={{ 
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="ListaBases" 
        component={ListaBases}
        options={{ 
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="ListaTransportadoras" 
        component={ListaTransportadoras}
        options={{ 
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="FormTransportadora" 
        component={FormTransportadora}
        options={{ 
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="ListaDomiciliarios" 
        component={ListaDomiciliarios}
        options={{ 
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="FormDomiciliario" 
        component={FormDomiciliario}
        options={{ 
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}