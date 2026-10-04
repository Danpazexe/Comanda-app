import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FirestoreService } from '../../services/firestoreService';
import { useAuth } from '../../contexts/AuthContext';

interface Item {
  nome: string;
  quantidade: number;
}
interface ComandaFechada {
  id?: string;
  numero: number;
  itens: Item[];
  data: string;
  nomeCliente?: string;
  totalSementes?: number;
}

export default function EditarScreen() {
  const [comandas, setComandas] = useState<ComandaFechada[]>([]);
  const [comandasFiltradas, setComandasFiltradas] = useState<ComandaFechada[]>([]);
  const [pesquisa, setPesquisa] = useState('');
  const [ordenacaoNumero, setOrdenacaoNumero] = useState<'crescente' | 'decrescente'>('crescente');
  const [isZerando, setIsZerando] = useState(false);
  const [comandasNaoEditaveis, setComandasNaoEditaveis] = useState<Set<number>>(new Set());
  const navigation = useNavigation<NavigationProp<any>>();
  const { isAdmin } = useAuth();

  function avisarSomenteAdmin() {
    Alert.alert('Sem permissão', 'Somente administradores podem excluir comandas.');
  }

  const filtrarEOrdenarComandas = useCallback(() => {
    let comandasProcessadas = [...comandas];

    // Filtrar por número da comanda
    if (pesquisa.trim()) {
      const numeroPesquisa = parseInt(pesquisa.trim());
      if (!isNaN(numeroPesquisa)) {
        comandasProcessadas = comandasProcessadas.filter(
          comanda => comanda.numero === numeroPesquisa
        );
      }
    }

    // Ordenar por número da comanda
    if (ordenacaoNumero === 'crescente') {
      comandasProcessadas.sort((a, b) => a.numero - b.numero);
    } else {
      comandasProcessadas.sort((a, b) => b.numero - a.numero);
    }

    setComandasFiltradas(comandasProcessadas);
  }, [comandas, pesquisa, ordenacaoNumero]);

  useEffect(() => {
    carregarComandas();
  }, []);

  // Escutar mudanças nos parâmetros da navegação (quando o botão zerar é pressionado)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      carregarComandas();
    });

    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    filtrarEOrdenarComandas();
  }, [filtrarEOrdenarComandas]);

  async function carregarComandas() {
    try {
      // Buscar todas as comandas do Firebase
      const comandasFirebase = await FirestoreService.buscarTodasComandas();
      
      // Converter para o formato esperado
      const comandasFormatadas: ComandaFechada[] = comandasFirebase.map(comanda => ({
        numero: comanda.numero,
        itens: comanda.itens,
        data: comanda.timestamp.toISOString(),
        nomeCliente: comanda.nomeCliente,
        totalSementes: comanda.totalSementes
      }));
      
      setComandas(comandasFormatadas);
      
      // Carregar status das comandas que não podem ser editadas
      const comandasNaoEditaveisSet = new Set<number>();
      
      for (const comanda of comandasFirebase) {
        // Só pode editar se estiver em espera (status 'aberta')
        if (comanda.status !== 'aberta') {
          comandasNaoEditaveisSet.add(comanda.numero);
        }
      }
      
      setComandasNaoEditaveis(comandasNaoEditaveisSet);
    } catch (error) {
      console.error('Erro ao carregar comandas:', error);
      setComandas([]);
    }
  }

  function formatarDataHora(dataStr: string) {
    if (!dataStr) return '';
    const data = new Date(dataStr);
    if (isNaN(data.getTime())) return dataStr;
    return data.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }

  // Adicionar função para excluir comanda do Firebase
  async function excluirComanda(comanda: ComandaFechada) {
    if (!isAdmin) {
      avisarSomenteAdmin();
      return;
    }
    Alert.alert(
      'Excluir Comanda',
      'Tem certeza que deseja excluir esta comanda?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              // Buscar a comanda no Firestore para obter o ID
              const comandaAtual = await FirestoreService.buscarComandaPorNumero(comanda.numero);
              
              if (comandaAtual && comandaAtual.id) {
                // Deletar do Firebase
                await FirestoreService.deletarComanda(comandaAtual.id);
                
                // Decrementar contador de comandas atendidas
                await FirestoreService.decrementarComandasAtendidas();
                
                // Recarregar comandas
                await carregarComandas();
              } else {
                Alert.alert('Erro', 'Comanda não encontrada para exclusão.');
              }
            } catch (error) {
              console.error('Erro ao excluir comanda:', error);
              Alert.alert('Erro', 'Não foi possível excluir a comanda.');
            }
          },
        },
      ],
    );
  }

  async function editarComanda(comanda: ComandaFechada) {
    try {
      // Verificar o status atual da comanda no Firestore
      const comandaAtual = await FirestoreService.buscarComandaPorNumero(comanda.numero);
      
      if (!comandaAtual) {
        Alert.alert(
          '❌ Comanda não encontrada',
          'Esta comanda não foi encontrada no sistema!',
          [{ text: 'OK', style: 'default' }]
        );
        return;
      }
      
      // Só permite edição se estiver em espera (status 'aberta')
      if (comandaAtual.status === 'aberta') {
        navigation.navigate('Comanda', { comandaParaEditar: comanda });
      } else {
        let mensagem = '';
        let titulo = '';
        
        switch (comandaAtual.status) {
          case 'preparando':
            titulo = '❌ Comanda em Preparo';
            mensagem = 'Esta comanda está sendo preparada na cozinha e não pode mais ser editada!';
            break;
          case 'pronto':
            titulo = '❌ Comanda Pronta';
            mensagem = 'Esta comanda já está pronta e não pode mais ser editada!';
            break;
          case 'entregue':
            titulo = '❌ Comanda Entregue';
            mensagem = 'Esta comanda já foi entregue e não pode mais ser editada!';
            break;
          default:
            titulo = '❌ Comanda não pode ser editada';
            mensagem = `Esta comanda não está mais disponível para edição! Status: ${comandaAtual.status}`;
        }
        
        Alert.alert(titulo, mensagem, [{ text: 'OK', style: 'default' }]);
      }
    } catch (error) {
      console.error('Erro ao verificar status da comanda:', error);
      Alert.alert(
        '❌ Erro',
        'Não foi possível verificar o status da comanda. Tente novamente.',
        [{ text: 'OK', style: 'default' }]
      );
    }
  }





  function limparPesquisa() {
    setPesquisa('');
  }

  function alternarOrdenacao() {
    // Alterna entre ordenação crescente e decrescente por número
    setOrdenacaoNumero(ordenacaoNumero === 'crescente' ? 'decrescente' : 'crescente');
  }

  function zerarTudo() {
    if (!isAdmin) {
      avisarSomenteAdmin();
      return;
    }
    Alert.alert(
      'Zerar Tudo',
      'Tem certeza que deseja apagar todas as comandas do Firestore, relatório e contador?\n\nEsta ação não pode ser desfeita!',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Zerar Tudo',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsZerando(true);
              console.log('🚀 Iniciando processo de zerar tudo...');
              
              // Zerar tudo no Firebase (comandas, relatórios e contadores)
              console.log('🗑️ Zerando tudo no Firebase...');
              await FirestoreService.zerarTudo();
              
              // Atualizar estado local
              setComandas([]);
              setPesquisa('');
              
              console.log('✅ Processo de zerar tudo concluído com sucesso!');
              Alert.alert(
                '✅ Sucesso!', 
                'Todos os dados foram apagados com sucesso!\n\n• Comandas do Firebase: Deletadas\n• Relatório de vendas: Zerado\n• Contador de comandas: Resetado\n• Cardápio: Mantido'
              );
            } catch (error) {
              console.error('❌ Erro ao zerar comandas:', error);
              Alert.alert(
                '❌ Erro', 
                `Não foi possível apagar todas as comandas.\n\nErro: ${error instanceof Error ? error.message : 'Erro desconhecido'}\n\nTente novamente ou verifique sua conexão com a internet.`
              );
            } finally {
              setIsZerando(false);
            }
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.container}>
        {/* StatusBar gerenciada pelo App.tsx */}

        {/* Campo de Pesquisa */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Pesquisar por número da comanda..."
              placeholderTextColor="#9ca3af"
              value={pesquisa}
              onChangeText={setPesquisa}
              keyboardType="numeric"
              maxLength={10}
            />
            {pesquisa.length > 0 && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={limparPesquisa}
              >
                <Text style={styles.clearButtonText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
          
          <TouchableOpacity
            style={[styles.sortButton, ordenacaoNumero === 'decrescente' && styles.sortButtonActive]}
            onPress={alternarOrdenacao}
          >
            <Text style={[styles.sortButtonText, ordenacaoNumero === 'decrescente' && styles.sortButtonTextActive]}>
              {ordenacaoNumero === 'crescente' ? 'Número ↑' : 'Número ↓'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Contador de resultados */}
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsText}>
            {comandasFiltradas.length} comanda{comandasFiltradas.length !== 1 ? 's' : ''} encontrada{comandasFiltradas.length !== 1 ? 's' : ''}
          </Text>
        </View>

        <FlatList
          data={comandasFiltradas}
          keyExtractor={(item, index) =>
            `comanda-${item.numero}-${item.data}-${index}`
          }
          renderItem={({ item }) => (
            <View style={styles.comandaItem}>
              <View style={styles.comandaHeader}>
                <View style={styles.comandaNumeroContainer}>
                  <Text style={styles.comandaNumero}>
                    #{item.numero}
                  </Text>
                </View>
                <View style={styles.comandaHeaderRight}>
                  <Text style={styles.comandaData}>
                    {item.data && formatarDataHora(item.data)}
                  </Text>

                </View>
              </View>
              
              <View style={styles.comandaContent}>
                <View style={styles.saboresLista}>
                  {item.itens.map((i, idx) => (
                    <View key={idx} style={styles.saborLinha}>
                      <Text style={styles.saborNome} numberOfLines={1}>
                        {i.nome}
                      </Text>
                      <View style={styles.quantidadeContainer}>
                        <Text style={styles.saborQtd}>
                          {i.quantidade}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
              
              <View style={styles.actionsContainer}>
                <TouchableOpacity
                  style={[
                    styles.buttonEditar,
                    comandasNaoEditaveis.has(item.numero) && styles.buttonEditarDisabled
                  ]}
                  onPress={() => editarComanda(item)}
                  disabled={comandasNaoEditaveis.has(item.numero)}
                >
                  <Text style={[
                    styles.buttonEditarText,
                    comandasNaoEditaveis.has(item.numero) && styles.buttonEditarTextDisabled
                  ]}>
                    {comandasNaoEditaveis.has(item.numero) ? 'Não Editável' : 'Editar'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.buttonExcluir}
                  onPress={() => excluirComanda(item)}
                >
                  <Text style={styles.buttonExcluirText}>Excluir</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          numColumns={1}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {pesquisa ? 'Nenhuma comanda encontrada com este número' : 'Nenhuma comanda encontrada'}
              </Text>
            </View>
          }
        />
        
        <TouchableOpacity 
          style={[styles.buttonZerar, isZerando && styles.buttonZerarDisabled]} 
          onPress={zerarTudo}
          disabled={isZerando}
        >
          {isZerando ? (
            <>
              <ActivityIndicator size="small" color="#ffffff" style={{ marginRight: 8 }} />
              <Text style={styles.buttonZerarText}>Zerando...</Text>
            </>
          ) : (
            <Text style={styles.buttonZerarText}>Zerar Todas as Comandas</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    position: 'relative',
  },
  searchInput: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    color: '#374151',
  },
  clearButton: {
    position: 'absolute',
    right: 12,
    top: 12,
    backgroundColor: '#9ca3af',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  sortButton: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    minWidth: 90,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  sortButtonActive: {
    backgroundColor: '#9c27b0',
    borderColor: '#9c27b0',
    shadowColor: '#9c27b0',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  sortButtonText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
  },
  sortButtonTextActive: {
    color: '#ffffff',
  },
  resultsContainer: {
    marginBottom: 16,
  },
  resultsText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  listContainer: {
    paddingBottom: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
  },
  comandaItem: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  comandaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  comandaHeaderRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  comandaNumeroContainer: {
    backgroundColor: '#9c27b0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  comandaNumero: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  comandaData: {
    fontSize: 13,
    color: '#6c757d',
    fontWeight: '500',
    fontFamily: 'monospace',
  },
  statusEmPreparo: {
    backgroundColor: '#ff6b35',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusEmPreparoText: {
    fontSize: 11,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  comandaContent: {
    flex: 1,
  },
  saboresLista: {
    marginBottom: 16,
  },
  saborLinha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  saborNome: {
    fontSize: 16,
    color: '#212529',
    fontWeight: '500',
    flex: 1,
    marginRight: 12,
  },
  quantidadeContainer: {
    backgroundColor: '#e3f2fd',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    minWidth: 32,
    alignItems: 'center',
  },
  saborQtd: {
    fontSize: 14,
    color: '#1976d2',
    fontWeight: 'bold',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 8,
  },
  buttonEditar: {
    backgroundColor: '#2196f3',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    flex: 1,
    alignItems: 'center',
    shadowColor: '#2196f3',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  buttonEditarText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  buttonEditarDisabled: {
    backgroundColor: '#9ca3af',
    shadowColor: '#9ca3af',
    opacity: 0.7,
  },
  buttonEditarTextDisabled: {
    color: '#e5e7eb',
  },
  buttonExcluir: {
    backgroundColor: '#f44336',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    flex: 1,
    alignItems: 'center',
    shadowColor: '#f44336',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  buttonExcluirText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  buttonZerar: {
    backgroundColor: '#dc3545',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#dc3545',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  buttonZerarDisabled: {
    backgroundColor: '#6c757d',
    shadowColor: '#6c757d',
    opacity: 0.7,
  },
  buttonZerarText: { 
    color: '#ffffff', 
    fontSize: 16, 
    fontWeight: 'bold' 
  },

});
