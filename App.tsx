/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import SplashScreen from './src/screens/Splash/SplashScreen';
import HomeScreen from './src/screens/Home/HomeScreen';
import ComandaScreen from './src/screens/Comanda/ComandaScreen';
import EditarScreen from './src/screens/Editar/EditarScreen';
import GerenciarScreen from './src/screens/Gerenciar/GerenciarScreen';
import RelatorioScreen from './src/screens/Relatorio/RelatorioScreen';
import CozinhaMonitorScreen from './src/screens/Cozinha/CozinhaMonitorScreen';
import ConfigScreen from './src/screens/Config/ConfigScreen';
import LoginScreen from './src/screens/Login/LoginScreen';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <AuthProvider>
      <AppConteudo />
    </AuthProvider>
  );
}

function AppConteudo() {
  const [isLoading, setIsLoading] = useState(true);
  const { carregando, usuario, papel } = useAuth();

  const handleSplashFinish = () => {
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <SafeAreaProvider>
        <SplashScreen onFinish={handleSplashFinish} />
      </SafeAreaProvider>
    );
  }

  if (carregando) {
    return (
      <SafeAreaProvider>
        <View style={styles.carregando}>
          <ActivityIndicator size="large" color="#ff9800" />
        </View>
      </SafeAreaProvider>
    );
  }

  // Sem login, ou logado sem papel de equipe/admin: só a tela de login.
  if (!usuario || (papel !== 'admin' && papel !== 'equipe')) {
    return (
      <SafeAreaProvider>
        <LoginScreen />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Home">
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{
              headerShown: false,
              headerStyle: { backgroundColor: '#ffb300' },
              headerTintColor: '#fff',
            }}
          />
          <Stack.Screen
            name="Comanda"
            component={ComandaScreen}
            options={{
                headerShown: false,
            }}
          />
          <Stack.Screen
            name="Relatorio"
            component={RelatorioScreen}
            options={{
              title: 'Relatório',
              headerStyle: { backgroundColor: '#4caf50' },
              headerTintColor: '#fff',
              headerTitleStyle: { fontWeight: 'bold' },
              headerTitleAlign: 'center',
            }}
          />
          <Stack.Screen
            name="AdicionarSabor"
            component={GerenciarScreen}
            options={{
              title: 'Gerenciar Cardápio',
              headerStyle: { backgroundColor: '#1976d2' },
              headerTintColor: '#fff',
              headerTitleStyle: { fontWeight: 'bold' },
              headerTitleAlign: 'center',
            }}
          />
          <Stack.Screen
            name="EditarComanda"
            component={EditarScreen}
            options={{
              title: 'Editar Comanda',
              headerStyle: { backgroundColor: '#9c27b0' },
              headerTintColor: '#fff',
              headerTitleStyle: { fontWeight: 'bold' },
              headerTitleAlign: 'center',
            }}
          />
          <Stack.Screen
            name="CozinhaMonitor"
            component={CozinhaMonitorScreen}
            options={{
              title: 'Monitor da Cozinha',
              headerStyle: { backgroundColor: '#ff6b35' },
              headerTintColor: '#fff',
              headerTitleStyle: { fontWeight: 'bold' },
              headerTitleAlign: 'center',
            }}
          />

          <Stack.Screen
            name="Config"
            component={ConfigScreen}
            options={{
                headerShown: false,
                headerStyle: { backgroundColor: '#6366f1' },
                headerTintColor: '#fff',
              }}
          />

        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  carregando: { flex: 1, justifyContent: 'center' },
});
