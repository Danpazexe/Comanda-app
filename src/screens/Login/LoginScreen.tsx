import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';

// Tela de login da equipe. As contas são criadas pelo dono no console do
// Firebase (Authentication) e recebem um papel em usuarios/{uid}.
export default function LoginScreen() {
  const { entrar, sair, usuario, carregando } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');

  // Logado, mas sem papel de equipe/admin em usuarios/{uid}.
  const semAcesso = !!usuario && !carregando;

  async function handleEntrar() {
    if (!email.trim() || !senha) {
      setErro('Informe e-mail e senha.');
      return;
    }
    setErro('');
    setEnviando(true);
    try {
      await entrar(email, senha);
    } catch {
      // Mensagem genérica: não diz se o e-mail existe.
      setErro('E-mail ou senha inválidos.');
    } finally {
      setEnviando(false);
    }
  }

  if (semAcesso) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.card}>
          <Text style={styles.titulo}>Sem acesso</Text>
          <Text style={styles.texto}>
            A conta {usuario?.email} não tem permissão neste app. Peça ao
            administrador para liberar o seu acesso.
          </Text>
          <TouchableOpacity style={styles.botao} onPress={sair}>
            <Text style={styles.botaoTexto}>Sair</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.card}>
          <Text style={styles.titulo}>Entrar</Text>
          <TextInput
            style={styles.input}
            placeholder="E-mail"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            editable={!enviando}
          />
          <TextInput
            style={styles.input}
            placeholder="Senha"
            secureTextEntry
            autoComplete="password"
            value={senha}
            onChangeText={setSenha}
            onSubmitEditing={handleEntrar}
            editable={!enviando}
          />
          {!!erro && <Text style={styles.erro}>{erro}</Text>}
          <TouchableOpacity
            style={[styles.botao, enviando && styles.botaoDesabilitado]}
            onPress={handleEntrar}
            disabled={enviando}
          >
            {enviando ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.botaoTexto}>Entrar</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f9fafb', justifyContent: 'center' },
  flex: { flex: 1, justifyContent: 'center' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    marginHorizontal: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  titulo: { fontSize: 24, fontWeight: '700', marginBottom: 16, color: '#111827' },
  texto: { fontSize: 16, color: '#374151', marginBottom: 16 },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 12,
    color: '#111827',
  },
  erro: { color: '#b91c1c', marginBottom: 12 },
  botao: {
    backgroundColor: '#ff9800',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  botaoDesabilitado: { opacity: 0.6 },
  botaoTexto: { color: '#fff', fontSize: 18, fontWeight: '700' },
});
