import React, { useState, useEffect, ReactNode } from 'react';
import {
  View,
  Text,
  TouchableWithoutFeedback,
  StyleSheet,
  useWindowDimensions,
  Animated,
  StatusBar,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../../contexts/AuthContext';

const TROFEU = require('../../assets/LOGOSEMFUNDO.png');

type AnimatedButtonProps = {
  onPress: () => void;
  gradient: string[];
  children: ReactNode;
  style?: any;
  icon?: string;
  iconSize?: number;
};

function AnimatedButton({ onPress, gradient, children, style, icon, iconSize = 24 }: AnimatedButtonProps) {
  const [pressAnim] = useState(new Animated.Value(1));

  const handlePressIn = () => {
    Animated.spring(pressAnim, { toValue: 0.95, useNativeDriver: true }).start();
  };
  const handlePressOut = () => {
    Animated.spring(pressAnim, { toValue: 1, useNativeDriver: true }).start();
  };

  return (
    <TouchableWithoutFeedback
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={[{ transform: [{ scale: pressAnim }] }, style]}>
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientButton}
        >
          <View style={styles.buttonContent}>
            {icon && <Icon name={icon} size={iconSize} color="#fff" style={styles.buttonIcon} />}
            <Text style={styles.buttonText}>{children}</Text>
          </View>
        </LinearGradient>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

export default function HomeScreen({ navigation }: NativeStackScreenProps<any, 'Home'>) {
  const { width, height } = useWindowDimensions();
  const [animValue] = useState(new Animated.Value(0));
  const { isAdmin } = useAuth();

  const isLandscape = width > height;
  const isTablet = width >= 768;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animValue, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(animValue, { toValue: 0, duration: 1200, useNativeDriver: true }),
      ]),
    ).start();
  }, [animValue]);

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* StatusBar gerenciada pelo App.tsx */}
      <View style={[styles.container, isLandscape && styles.containerLandscape]}>
        
        {/* Logo flutuando */}
        <Animated.Image
          source={TROFEU}
          style={[
            styles.logo,
            {
              transform: [
                {
                  scale: animValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.08],
                  }),
                },
              ],
            },
          ]}
          resizeMode="contain"
        />

        {/* Card de botões */}
        <View style={[styles.card, isTablet && { maxWidth: 500 }]}>
          <AnimatedButton
            onPress={() => navigation.navigate('Comanda', { nova: true })}
            gradient={['#ff9800', '#ffb74d']}
            style={styles.buttonWrapper}
            icon="receipt"
            iconSize={28}
          >
            Nova Comanda
          </AnimatedButton>

          {isAdmin && (
            <AnimatedButton
              onPress={() => navigation.navigate('Relatorio')}
              gradient={['#43a047', '#81c784']}
              style={styles.buttonWrapper}
              icon="chart-bar"
              iconSize={28}
            >
              Relatório
            </AnimatedButton>
          )}

          <AnimatedButton
            onPress={() => navigation.navigate('CozinhaMonitor')}
            gradient={['#ef6c00', '#ff8a65']}
            style={styles.buttonWrapper}
            icon="stove"
            iconSize={28}
          >
            Monitor da Cozinha
          </AnimatedButton>

          <AnimatedButton
            onPress={() => navigation.navigate('Config')}
            gradient={['#6b7280', '#9ca3af']}
            style={styles.buttonWrapper}
            icon="cog"
            iconSize={28}
          >
            Configurações
          </AnimatedButton>
        </View>
        

      </View>
    </SafeAreaView>
  );
}

// === Styles ===
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f9fafb' },
  container: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#f9fafb',
  },
  containerLandscape: { flexDirection: 'row' },
  


  logo: {
    width: 180,
    height: 140,
    marginBottom: 20,
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    alignItems: 'center',
  },

  buttonWrapper: { width: '100%', marginBottom: 16 },

  gradientButton: {
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  buttonIcon: {
    marginRight: 10,
  },

  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  

});
