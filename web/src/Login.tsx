import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, User } from 'firebase/auth';
import { auth } from './services/firebase';

// O monitor só mostra as comandas depois do login. Use uma conta com papel
// 'monitor' (somente leitura) em usuarios/{uid}; ver README.
const Login: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [usuario, setUsuario] = useState<User | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(
    () =>
      onAuthStateChanged(auth, (u) => {
        setUsuario(u);
        setCarregando(false);
      }),
    [],
  );

  const entrar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setEnviando(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), senha);
      setSenha('');
    } catch {
      setErro('E-mail ou senha inválidos.');
    } finally {
      setEnviando(false);
    }
  };

  if (carregando) {
    return <div className="tela-azul login-tela" />;
  }

  if (usuario) {
    return (
      <>
        {children}
        <button className="login-sair" onClick={() => signOut(auth)} title="Sair">
          Sair
        </button>
      </>
    );
  }

  return (
    <div className="tela-azul login-tela">
      <form className="login-card" onSubmit={entrar}>
        <h1>Monitor de Comandas</h1>
        <input
          type="email"
          placeholder="E-mail"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={enviando}
          required
        />
        <input
          type="password"
          placeholder="Senha"
          autoComplete="current-password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          disabled={enviando}
          required
        />
        {erro && <p className="login-erro">{erro}</p>}
        <button type="submit" disabled={enviando}>
          {enviando ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </div>
  );
};

export default Login;
