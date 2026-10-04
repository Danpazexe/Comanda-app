import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Animated,
  ToastAndroid,
  useWindowDimensions,
  Alert,
  TextInput,
  ActivityIndicator,
  Platform,
  Modal,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { FirestoreService } from '../../services/firestoreService';
import { useAuth } from '../../contexts/AuthContext';
import { Item } from '../../types/Comanda';
import { useNavigation } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

type Props = NativeStackScreenProps<any, 'Comanda'>;

// Header personalizado melhorado
const Header = ({ 
  navigation, 
  numeroComanda, 
  isLandscape, 
  isTablet 
}: { 
  navigation: any; 
  numeroComanda: number | null; 
  isLandscape: boolean;
  isTablet: boolean;
}) => {
  const [headerAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    // Animação de entrada do header
    Animated.spring(headerAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start();
  }, [headerAnim]);

  const getResponsiveSizeHeader = (small: number, medium: number, large: number) => {
    if (isTablet) return large;
    if (isLandscape) return medium;
    return small;
  };

  // Função para ajustar espaçamento em celulares pequenos
  const getHeaderSpacing = () => {
    if (isTablet) return 20;
    if (isLandscape) return 16;
    return 16; // Espaçamento médio para celulares pequenos
  };

  return (
    <Animated.View 
      style={[
        styles.header,
        {
          transform: [
            { 
              translateY: headerAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-50, 0],
              })
            }
          ],
          opacity: headerAnim,
        }
      ]}
    >
      {/* StatusBar gerenciada pelo App.tsx */}
      
      {/* Container principal do header */}
      <View style={[
        styles.headerContainer,
        isTablet && styles.headerContainerTablet,
                 { 
           paddingHorizontal: getHeaderSpacing(),
           paddingBottom: isTablet ? 12 : 10
         }
      ]}>
        
                {/* Lado esquerdo: Seta de voltar */}
        <TouchableOpacity
          style={[
            styles.backButton,
                         { 
               padding: isTablet ? 12 : 10,
               marginRight: getHeaderSpacing()
             }
          ]}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
                     <Icon 
             name="arrow-back" 
             size={getResponsiveSizeHeader(20, 22, 24)} 
             color="#fff" 
           />
        </TouchableOpacity>

        {/* Centro: Título e informações */}
        <View style={[
          styles.headerCenter,
          { gap: getHeaderSpacing() }
        ]}>
          <View style={styles.titleContainer}>
            <Icon 
              name="receipt-long" 
              size={getResponsiveSizeHeader(24, 28, 32)} 
              color="#fff" 
              style={styles.titleIcon}
            />
            <Text style={[
              styles.headerTitle,
              { fontSize: getResponsiveSizeHeader(18, 20, 24) }
            ]}>
              Comanda
            </Text>
          </View>
          
          {numeroComanda !== null && (
            <View style={[
              styles.comandaBadge,
                             { 
                 paddingHorizontal: getHeaderSpacing(),
                 paddingVertical: isTablet ? 12 : 10
               }
            ]}>
                             <Icon 
                 name="confirmation-number" 
                 size={getResponsiveSizeHeader(20, 24, 28)} 
                 color="#e53935" 
               />
               <Text style={[
                 styles.comandaBadgeText,
                 { fontSize: getResponsiveSizeHeader(16, 18, 22) }
               ]}>
                 Nº{numeroComanda.toString().padStart(3, '0')}
               </Text>
            </View>
          )}
        </View>

        {/* Lado direito: Botão de edição */}
        <TouchableOpacity
          onPress={() => navigation.navigate('EditarComanda')}
          style={[
            styles.editButton,
                         { 
               padding: isTablet ? 12 : 10,
               marginLeft: getHeaderSpacing()
             }
          ]}
          activeOpacity={0.8}
        >
          <View style={styles.editButtonInner}>
                         <Icon 
               name="edit" 
               size={getResponsiveSizeHeader(18, 20, 22)} 
               color="#fff" 
             />
             <Text style={[
               styles.editButtonText,
               { fontSize: getResponsiveSizeHeader(12, 14, 16) }
             ]}>
               Editar
             </Text>
          </View>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};



export default function ComandaScreen({ route }: Props) {
  const [itens, setItens] = useState<Item[]>([]);
  const [cardapio, setCardapio] = useState<{ nome: string; valor: string }[]>(
    [],
  );
  const [fadeAnims, setFadeAnims] = useState<Animated.Value[]>([]);
  const [numeroComanda, setNumeroComanda] = useState<number | null>(null);
  const [totalSementes, setTotalSementes] = useState(0);
  const [nomeCliente, setNomeCliente] = useState<string>('');
  const [isEnviando, setIsEnviando] = useState(false);
  const [bottomSheetVisible, setBottomSheetVisible] = useState(false);
  const { width, height } = useWindowDimensions();
  const isFocused = useIsFocused();
  const navigation = useNavigation<any>();
  const { isAdmin } = useAuth();

  // Animações para o Bottom Sheet
  const bottomSheetAnim = useRef(new Animated.Value(0)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  // Responsive breakpoints
  const isLandscape = width > height && width > 700;
  const isTablet = width >= 768;
  const isLargeTablet = width >= 1024;
  const isMediumPhone = width >= 375 && width < 414;
  const isLargePhone = width >= 414 && width < 768;

  // Dynamic sizing based on screen dimensions
  const getResponsiveSize = (small: number, medium: number, large: number, tablet: number) => {
    if (isLargeTablet) return tablet;
    if (isTablet) return large;
    if (isLargePhone) return large;
    if (isMediumPhone) return medium;
    return small;
  };

  // Dynamic spacing based on screen size
  const getSpacing = (small: number, medium: number, large: number, tablet: number) => {
    if (isLargeTablet) return tablet;
    if (isTablet) return large;
    if (isLandscape) return medium;
    return small;
  };

  // Dynamic padding based on screen size
  const getPadding = (small: number, medium: number, large: number, tablet: number) => {
    if (isLargeTablet) return tablet;
    if (isTablet) return large;
    if (isLandscape) return medium;
    return small;
  };

  // Dynamic font size based on screen size
  const getFontSize = (small: number, medium: number, large: number, tablet: number) => {
    if (isLargeTablet) return tablet;
    if (isTablet) return large;
    if (isLandscape) return medium;
    return small;
  };

  // Função para mostrar/esconder Bottom Sheet
  const toggleBottomSheet = useCallback((show: boolean) => {
    console.log('🎯 toggleBottomSheet chamado com:', show);
    
    if (show) {
      console.log('📱 Configurando Bottom Sheet para VISÍVEL');
      setBottomSheetVisible(true);
      Animated.parallel([
        Animated.timing(bottomSheetAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(overlayAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start(() => {
        console.log('✅ Animação de entrada concluída');
      });
    } else {
      console.log('📱 Configurando Bottom Sheet para INVISÍVEL');
      Animated.parallel([
        Animated.timing(bottomSheetAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(overlayAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start(() => {
        console.log('✅ Animação de saída concluída');
        setBottomSheetVisible(false);
      });
    }
  }, [bottomSheetAnim, overlayAnim]);

  // Bottom Sheet só abre quando clicado no botão flutuante
  // useEffect(() => {
  //   console.log('🔄 useEffect itens.length:', itens.length, 'bottomSheetVisible:', bottomSheetVisible);
  //   
  //   if (itens.length > 0 && !bottomSheetVisible) {
  //     console.log('📱 Mostrando Bottom Sheet - itens adicionados');
  //       toggleBottomSheet(true);
  //   } else if (itens.length === 0 && bottomSheetVisible) {
  //     console.log('📱 Escondendo Bottom Sheet - comanda vazia');
  //       toggleBottomSheet(false);
  //   }
  // }, [itens.length, bottomSheetVisible, toggleBottomSheet]);

  useEffect(() => {
    async function carregarCardapio() {
      try {
        // Inicializar cardápio se necessário (só admin pode gravar no cardápio)
        if (isAdmin) {
          await FirestoreService.inicializarCardapio();
        }
        
        // Carregar cardápio do Firebase
        const cardapioFirebase = await FirestoreService.buscarCardapio();
        setCardapio(cardapioFirebase);
      } catch (error) {
        console.error('Erro ao carregar cardápio:', error);
        setCardapio([]);
      }
    }
    carregarCardapio();
  }, [isAdmin]);

  useEffect(() => {
    if (route?.params?.comandaParaEditar) {
      setItens(route.params.comandaParaEditar.itens);
      setNumeroComanda(route.params.comandaParaEditar.numero);
      setNomeCliente(route.params.comandaParaEditar.nomeCliente || '');
    } else {
      async function buscarNumeroComanda() {
        try {
          // Usar numeração sequencial do Firestore
          const proximoNumero = await FirestoreService.gerarProximoNumero();
          setNumeroComanda(proximoNumero);
        } catch (error) {
          console.error('Erro ao buscar próximo número:', error);
          // Fallback para número 1
          setNumeroComanda(1);
        }
      }
      if (isFocused) buscarNumeroComanda();
    }
  }, [isFocused, route?.params]);

  // Calcular total de sementes
  useEffect(() => {
    let total = 0;
    itens.forEach(item => {
      const cardapioItem = cardapio.find(c => c.nome === item.nome);
      if (cardapioItem) {
        total += parseInt(cardapioItem.valor) * item.quantidade;
      }
    });
    setTotalSementes(total);
  }, [itens, cardapio]);

  React.useEffect(() => {
    setFadeAnims(itens.map(() => new Animated.Value(1)));
  }, [itens]);

  function adicionarItem(itemNome: string) {
    setItens(prevItens => {
      const idx = prevItens.findIndex(i => i.nome === itemNome);
      if (idx !== -1) {
        // Já existe, soma quantidade
        const novos = [...prevItens];
        novos[idx] = { ...novos[idx], quantidade: novos[idx].quantidade + 1 };
        return novos;
      } else {
        // Novo item
        return [...prevItens, { nome: itemNome, quantidade: 1 }];
      }
    });
  }

  function removerItem(index: number) {
    setItens(prevItens => {
      const novos = [...prevItens];
      if (novos[index].quantidade > 1) {
        novos[index] = {
          ...novos[index],
          quantidade: novos[index].quantidade - 1,
        };
        return novos;
      } else {
        novos.splice(index, 1);
        return novos;
      }
    });
  }

  function limparComanda() {
    if (itens.length === 0) return;
    
    Alert.alert(
      'Limpar Comanda',
      'Tem certeza que deseja limpar todos os itens da comanda?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Limpar', 
          style: 'destructive',
          onPress: () => {
            setItens([]);
            ToastAndroid.show('Comanda limpa!', ToastAndroid.SHORT);
          }
        }
      ]
    );
  }

  async function fecharComanda() {
    if (itens.length === 0) {
      ToastAndroid.show('Adicione itens à comanda primeiro!', ToastAndroid.SHORT);
      return;
    }
    
    setIsEnviando(true);
    console.log('🚀 Iniciando processo de fechar comanda...');
    
    const itensParaRegistrar: string[] = [];
    itens.forEach(i => {
      for (let j = 0; j < i.quantidade; j++) itensParaRegistrar.push(i.nome);
    });

    try {
      if (route?.params?.comandaParaEditar) {
        console.log('📝 Editando comanda existente...');
        // EDIÇÃO: Atualizar comanda existente no Firestore
        if (route.params.comandaParaEditar.id) {
          await FirestoreService.atualizarComanda(
            route.params.comandaParaEditar.id,
            itens,
            totalSementes,
            nomeCliente
          );
        }
        
        // Não precisa mais atualizar relatório manualmente para edição
        // O relatório será baseado nas comandas do Firebase
      } else {
        console.log('🆕 Criando nova comanda...');
        // NOVA: Criar comanda no Firestore
        if (numeroComanda !== null) {
          await FirestoreService.criarComanda(numeroComanda, itens, totalSementes, nomeCliente);
        }
        
        // Registrar vendas no Firebase
        await FirestoreService.registrarVendas(itensParaRegistrar);
      }

      console.log('✅ Comanda salva com sucesso!');
      ToastAndroid.show('Comanda enviada para a cozinha!', ToastAndroid.SHORT);
      
      // Incrementar contador de comandas atendidas se for nova comanda
      if (!route?.params?.comandaParaEditar && numeroComanda !== null) {
        await FirestoreService.incrementarComandasAtendidas();
      }
      
      console.log('✅ Comanda enviada com sucesso!');
      
      // Limpar dados e preparar para nova comanda
      setItens([]);
      setNomeCliente('');
      
      // Buscar próximo número para nova comanda
      try {
        const proximoNumero = await FirestoreService.gerarProximoNumero();
        setNumeroComanda(proximoNumero);
      } catch (error) {
        console.error('Erro ao buscar próximo número:', error);
      }
      
    } catch (error) {
      console.error('❌ Erro ao salvar comanda:', error);
      Alert.alert('Erro', 'Não foi possível salvar a comanda. Tente novamente.');
    } finally {
      setIsEnviando(false);
    }
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <Header 
          navigation={navigation} 
          numeroComanda={numeroComanda} 
          isLandscape={isLandscape} 
          isTablet={isTablet} 
        />
        
        {/* Container principal - apenas cardápio */}
        <View
          style={[
            styles.container, 
            isLandscape && styles.containerLandscape,
            isTablet && styles.containerTablet
          ]}
        >
          {/* Cardápio ocupando toda a largura */}
          <View style={[
            styles.menuContainer,
            isTablet && styles.menuContainerTablet
          ]}>
            <FlatList
              data={cardapio}
              keyExtractor={item => item.nome}
              numColumns={isTablet ? 2 : 1}
              columnWrapperStyle={isTablet ? styles.menuRow : undefined}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.menuButton,
                    {
                      padding: getPadding(14, 16, 18, 20),
                      marginBottom: getSpacing(10, 12, 14, 16),
                      borderRadius: getResponsiveSize(16, 18, 20, 22),
                      flex: isTablet ? 1 : undefined,
                      marginHorizontal: isTablet ? getSpacing(4, 6, 8, 10) : 0,
                    }
                  ]}
                  onPress={() => adicionarItem(item.nome)}
                  activeOpacity={0.8}
                >
                  <View style={styles.menuButtonContent}>
                    <Text style={[
                      styles.menuButtonTitle,
                      { fontSize: getFontSize(14, 15, 16, 17) }
                    ]}>
                      {item.nome}
                    </Text>
                    <View style={styles.menuButtonFooter}>
                      <Icon 
                        name="attach-money" 
                        size={getResponsiveSize(14, 16, 18, 20)} 
                        color="#fffde7" 
                      />
                      <Text style={[
                        styles.menuButtonValor,
                        { fontSize: getFontSize(12, 13, 14, 15) }
                      ]}>
                        {item.valor} Sementes
                      </Text>
                    </View>
                  </View>
                  <Icon 
                    name="add-circle" 
                    size={getResponsiveSize(20, 24, 26, 28)} 
                    color="#fff" 
                    style={styles.addIcon} 
                  />
                </TouchableOpacity>
              )}
              contentContainerStyle={{ 
                paddingBottom: getSpacing(12, 16, 18, 20), 
                paddingTop: getSpacing(6, 8, 10, 12),
                paddingHorizontal: getSpacing(8, 10, 12, 14),
              }}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>

        {/* Botão flutuante para abrir Bottom Sheet */}
        <TouchableOpacity
          style={[
            styles.floatingButton,
            {
              bottom: getSpacing(20, 24, 28, 32),
              right: getSpacing(16, 20, 24, 28),
            }
          ]}
          onPress={() => toggleBottomSheet(true)}
          activeOpacity={0.8}
        >
          <View style={styles.floatingButtonContent}>
            <Icon 
              name="shopping-cart" 
              size={getResponsiveSize(20, 22, 24, 26)} 
              color="#fff" 
            />
            {itens.length > 0 && (
              <View style={styles.floatingBadge}>
                <Text style={styles.floatingBadgeText}>
                  {itens.reduce((total, item) => total + item.quantidade, 0)}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        {/* Bottom Sheet para itens selecionados */}
        <Modal
          visible={bottomSheetVisible}
          transparent
          animationType="none"
          onRequestClose={() => toggleBottomSheet(false)}
        >
          {/* Overlay */}
          <Animated.View 
            style={[
              styles.overlay,
              { opacity: overlayAnim }
            ]}
          >
            <TouchableOpacity
              style={styles.overlayTouchable}
              activeOpacity={1}
              onPress={() => toggleBottomSheet(false)}
            />
          </Animated.View>

          {/* Bottom Sheet */}
                      <Animated.View
              style={[
                styles.bottomSheet,
                {
                  transform: [
                    {
                      translateY: bottomSheetAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [height, 0],
                      }),
                    },
                  ],
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  // Força posição fixa
                  top: 'auto',
                  height: 400, // Altura fixa
                  maxHeight: 400, // Altura máxima fixa
                },
              ]}
            >
            {/* Handle do Bottom Sheet */}
            <View style={styles.bottomSheetHandle}>
              <View style={styles.handleBar} />
            </View>

            {/* Conteúdo do Bottom Sheet */}
            <View style={styles.bottomSheetContent}>
              {/* Total de Sementes */}
              <View style={[
                styles.totalContainer,
                {
                  padding: getPadding(8, 10, 12, 14), 
                  borderRadius: getResponsiveSize(10, 12, 14, 16),
                  marginBottom: getSpacing(12, 16, 18, 20),
                }
              ]}>
                <Icon 
                  name="account-balance-wallet" 
                  size={getResponsiveSize(16, 18, 20, 22)} 
                  color="#4caf50" 
                />
                <Text style={[
                  styles.totalText,
                  { fontSize: getFontSize(14, 16, 18, 20) }
                ]}>
                  Total: {totalSementes} Sementes
                </Text>
              </View>

              {/* Campo Nome do Cliente */}
              <View style={[
                styles.clienteSection,
                { marginBottom: getSpacing(12, 16, 18, 20) }
              ]}>
                <View style={[
                  styles.clienteInputContainer,
                  {
                    paddingHorizontal: getPadding(10, 12, 14, 16),
                    paddingVertical: getPadding(6, 8, 10, 12),
                    borderRadius: getResponsiveSize(10, 12, 14, 16),
                  }
                ]}>
                  <Icon 
                    name="person" 
                    size={getResponsiveSize(18, 20, 22, 24)} 
                    color="#666" 
                    style={styles.clienteIcon} 
                  />
                  <TextInput
                    style={[
                      styles.clienteInput,
                      { 
                        fontSize: getFontSize(14, 16, 18, 20),
                        paddingVertical: getPadding(6, 8, 10, 12),
                      }
                    ]}
                    placeholder="Nome do cliente (opcional)"
                    value={nomeCliente}
                    onChangeText={setNomeCliente}
                    placeholderTextColor="#999"
                    blurOnSubmit={true}
                    returnKeyType="done"
                    keyboardType="default"
                    autoCapitalize="words"
                    autoCorrect={false}
                    spellCheck={false}
                  />
                </View>
              </View>

              {/* Lista de itens selecionados */}
              <FlatList
                data={itens}
                keyExtractor={(_, index) => `item-${index}`}
                renderItem={({ item, index }) => (
                  <Animated.View
                    style={[
                      styles.itemRow,
                      {
                        padding: getPadding(12, 16, 18, 20),
                        borderRadius: getResponsiveSize(14, 16, 18, 20),
                        marginBottom: getSpacing(6, 8, 10, 12),
                      },
                      { opacity: fadeAnims[index] || 1 }
                    ]}
                  >
                    <View style={styles.itemInfo}>
                      <Text style={[
                        styles.selectedItem,
                        { 
                          fontSize: getFontSize(13, 15, 16, 17),
                          marginBottom: getSpacing(2, 3, 4, 5),
                        }
                      ]}>
                        {item.nome}
                      </Text>
                      <View style={styles.itemDetails}>
                        <Icon 
                          name="shopping-cart" 
                          size={getResponsiveSize(14, 16, 18, 20)} 
                          color="#666" 
                        />
                        <Text style={[
                          styles.itemQuantidade,
                          { fontSize: getFontSize(11, 13, 14, 15) }
                        ]}>
                          x{item.quantidade}
                        </Text>
                        <Text style={[
                          styles.itemValor,
                          { fontSize: getFontSize(11, 13, 14, 15) }
                        ]}>
                          {(() => {
                            const cardapioItem = cardapio.find(c => c.nome === item.nome);
                            return cardapioItem ? `${parseInt(cardapioItem.valor) * item.quantidade} Sementes` : '';
                          })()}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.removeButton,
                        {
                          padding: getPadding(10, 12, 14, 16),
                          borderRadius: getResponsiveSize(10, 12, 14, 16),
                          marginLeft: getSpacing(10, 12, 14, 16),
                        }
                      ]}
                      onPress={() => removerItem(index)}
                      activeOpacity={0.8}
                    >
                      <Icon 
                        name="remove" 
                        size={getResponsiveSize(18, 20, 22, 24)} 
                        color="#fff" 
                      />
                    </TouchableOpacity>
                  </Animated.View>
                )}
                ItemSeparatorComponent={() => <View style={{ height: getSpacing(6, 8, 10, 12) }} />}
                showsVerticalScrollIndicator={false}
                style={{ maxHeight: height * 0.4 }}
              />

              {/* Botões de Ação */}
              <View style={[
                styles.actionButtons,
                { 
                  marginTop: getSpacing(8, 10, 12, 14),
                  gap: getSpacing(8, 10, 12, 14),
                }
              ]}>
                <TouchableOpacity 
                  style={[
                    styles.clearButton,
                    {
                      padding: getPadding(14, 16, 18, 20),
                      borderRadius: getResponsiveSize(12, 14, 16, 18),
                    }
                  ]} 
                  onPress={limparComanda}
                  activeOpacity={0.8}
                >
                  <Icon 
                    name="clear-all" 
                    size={getResponsiveSize(18, 20, 22, 24)} 
                    color="#fff" 
                  />
                  <Text style={[
                    styles.clearButtonText,
                    { fontSize: getFontSize(13, 15, 16, 17) }
                  ]}>
                    Limpar
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[
                    styles.finishButton,
                    {
                      padding: getPadding(14, 16, 18, 20),
                      borderRadius: getResponsiveSize(12, 14, 16, 18),
                    },
                    isEnviando && styles.finishButtonDisabled
                  ]} 
                  onPress={fecharComanda}
                  disabled={isEnviando}
                  activeOpacity={0.8}
                >
                  {isEnviando ? (
                    <>
                      <ActivityIndicator 
                        size="small" 
                        color="#ffffff" 
                        style={{ marginRight: getSpacing(6, 8, 10, 12) }} 
                      />
                      <Text style={[
                        styles.finishButtonText,
                        { fontSize: getFontSize(13, 15, 16, 17) }
                      ]}>
                        Enviando...
                      </Text>
                    </>
                  ) : (
                    <>
                      <Icon 
                        name="restaurant" 
                        size={getResponsiveSize(18, 20, 22, 24)} 
                        color="#fff" 
                      />
                      <Text style={[
                        styles.finishButtonText,
                        { fontSize: getFontSize(13, 15, 16, 17) }
                      ]}>
                        Enviar Comanda
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </Modal>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: '#ffb300',
    paddingTop: 30, // Valor fixo para Android/iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
    }),
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerContainerTablet: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  titleIcon: {
    marginTop: 5,
  },
  headerTitle: {
    color: '#fff',
    fontWeight: 'bold',
  },
  comandaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff5f5',
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#fed7d7',
    paddingHorizontal: 18,
    paddingVertical: 12,
    shadowColor: '#fed7d7',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    ...Platform.select({
      ios: {
        shadowColor: '#fed7d7',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
    }),
  },
  comandaBadgeText: {
    color: '#e53935',
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    padding: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    marginRight: 16,
  },
  editButton: {
    padding: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    marginLeft: 16,
  },
  editButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 6,
  },
  editButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    marginTop: 80, // Espaço para o header personalizado
  },
  containerLandscape: {
    // Removido flexDirection row
  },
  containerTablet: {
    paddingHorizontal: 16,
  },
  
  // Novo container para o cardápio
  menuContainer: {
    flex: 1,
    padding: 12,
  },
  menuContainerTablet: {
    padding: 16,
  },
  menuRow: {
    justifyContent: 'space-between',
  },

  // Estilos do Bottom Sheet
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  overlayTouchable: {
    flex: 1,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 20,
    maxHeight: '80%',
    minHeight: 400,
    zIndex: 1000, 
    top: 'auto',
    transform: 'none', 
  },
  bottomSheetHandle: {
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#ccc',
    borderRadius: 2,
  },
  bottomSheetContent: {
    padding: 20,
    paddingBottom: 30,
    flex: 1,
    justifyContent: 'space-between',
  },

  totalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    gap: 6,
    borderWidth: 2,
    borderColor: '#4caf50',
    shadowColor: '#4caf50',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#4caf50',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
      },
    }),
  },
  totalText: {
    fontWeight: 'bold',
    color: '#4caf50',
  },
  clienteSection: {
    marginBottom: 16,
  },
  clienteInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  clienteIcon: {
    marginRight: 8,
  },
  clienteInput: {
    flex: 1,
    color: '#333',
  },
  menuButton: {
    backgroundColor: '#ffb300',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#ffb300',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
    borderWidth: 1,
    borderColor: '#ff8f00',
    ...Platform.select({
      ios: {
        shadowColor: '#ffb300',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
      },
    }),
  },
  menuButtonContent: {
    flex: 1,
  },
  menuButtonTitle: {
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 3,
  },
  menuButtonFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  menuButtonValor: {
    color: '#fffde7',
    fontWeight: '600',
  },
  addIcon: {
    marginLeft: 10,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#ffb300',
  },
  itemInfo: {
    flex: 1,
  },
  selectedItem: {
    fontWeight: 'bold',
    color: '#333',
  },
  itemDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  itemQuantidade: {
    color: '#666',
    fontWeight: '600',
  },
  itemValor: {
    color: '#4caf50',
    fontWeight: '600',
  },
  removeButton: {
    backgroundColor: '#e53935',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  clearButton: {
    flex: 1,
    backgroundColor: '#6c757d',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  clearButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  finishButton: {
    flex: 2,
    backgroundColor: '#4caf50',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  finishButtonDisabled: {
    backgroundColor: '#ccc',
  },
  finishButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  
  // Estilos para o botão flutuante
  floatingButton: {
    position: 'absolute',
    zIndex: 1000,
    backgroundColor: '#ffb300',
    width: 60,
    height: 60,
    borderRadius: 30,
    shadowColor: '#ffb300',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#ffb300',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
      },
    }),
  },
  floatingButtonContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  floatingBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#e53935',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  floatingBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
