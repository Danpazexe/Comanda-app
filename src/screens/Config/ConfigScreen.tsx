import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  Linking,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../../contexts/AuthContext';

type ConfigScreenProps = NativeStackScreenProps<any, 'Config'>;

export default function ConfigScreen({ navigation }: ConfigScreenProps) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const { isAdmin, sair, usuario } = useAuth();

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={[
        styles.header,
        isTablet && styles.headerTablet
      ]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Icon name="settings" size={28} color="#fff" />
          <Text style={styles.headerTitle}>Configurações</Text>
        </View>
        
        <View style={styles.headerRight} />
      </View>

      {/* Conteúdo */}
      <View style={[
        styles.container,
        isTablet && styles.containerTablet
      ]}>
                 <View style={styles.versionCard}>
           <View style={styles.iconContainer}>
             <Icon name="info" size={48} color="#6366f1" />
           </View>
           
           <Text style={styles.appName}>Comanda App</Text>
           <Text style={styles.versionText}>Versão 1.0.0</Text>
           
           <View style={styles.divider} />
           
           <Text style={styles.description}>
             Sistema de gerenciamento de comandas para restaurantes e lanchonetes
           </Text>
         </View>

         {/* Botões de funcionalidades */}
         <View style={styles.buttonsContainer}>
           {isAdmin && (
             <TouchableOpacity
               style={styles.functionButton}
               onPress={() => navigation.navigate('AdicionarSabor')}
               activeOpacity={0.8}
             >
               <View style={styles.buttonIconContainer}>
                 <Icon name="restaurant-menu" size={24} color="#1976d2" />
               </View>
               <Text style={styles.buttonText}>Gerenciar Cardápio</Text>
               <Icon name="chevron-right" size={20} color="#9ca3af" />
             </TouchableOpacity>
           )}

           <TouchableOpacity
             style={styles.functionButton}
             onPress={() => Linking.openURL('https://comandaapp-797db.web.app')}
             activeOpacity={0.8}
           >
             <View style={styles.buttonIconContainer}>
               <Icon name="people" size={24} color="#1e3a8a" />
             </View>
             <Text style={styles.buttonText}>Monitor de Clientes</Text>
             <Icon name="chevron-right" size={20} color="#9ca3af" />
           </TouchableOpacity>

           <TouchableOpacity
             style={styles.functionButton}
             onPress={sair}
             activeOpacity={0.8}
           >
             <View style={styles.buttonIconContainer}>
               <Icon name="logout" size={24} color="#b91c1c" />
             </View>
             <Text style={styles.buttonText}>Sair ({usuario?.email})</Text>
             <Icon name="chevron-right" size={20} color="#9ca3af" />
           </TouchableOpacity>
         </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  
  header: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  headerTablet: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  
  headerRight: {
    width: 40,
  },
  
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  
  containerTablet: {
    padding: 40,
  },
  
  versionCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    maxWidth: 400,
    width: '100%',
  },
  
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  
  versionText: {
    fontSize: 18,
    color: '#6366f1',
    fontWeight: '600',
    marginBottom: 24,
  },
  
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#e5e7eb',
    marginBottom: 24,
  },
  
     description: {
     fontSize: 16,
     color: '#6b7280',
     textAlign: 'center',
     lineHeight: 24,
   },

   buttonsContainer: {
     marginTop: 24,
     width: '100%',
     maxWidth: 400,
   },

   functionButton: {
     flexDirection: 'row',
     alignItems: 'center',
     backgroundColor: '#fff',
     padding: 16,
     borderRadius: 12,
     marginBottom: 12,
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 2 },
     shadowOpacity: 0.05,
     shadowRadius: 4,
     elevation: 2,
   },

   buttonIconContainer: {
     width: 40,
     height: 40,
     borderRadius: 20,
     backgroundColor: '#f3f4f6',
     alignItems: 'center',
     justifyContent: 'center',
     marginRight: 16,
   },

   buttonText: {
     flex: 1,
     fontSize: 16,
     fontWeight: '600',
     color: '#111827',
   },
 });
