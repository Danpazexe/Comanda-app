import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

// Papéis gravados pelo dono no console do Firebase, em usuarios/{uid}.papel.
// As regras do Firestore (firestore.rules) é que garantem as permissões;
// aqui o papel só serve para esconder botões que o usuário não pode usar.
export type Papel = 'admin' | 'equipe' | 'monitor' | null;

type AuthState = {
  carregando: boolean;
  usuario: FirebaseAuthTypes.User | null;
  papel: Papel;
  isAdmin: boolean;
  entrar: (email: string, senha: string) => Promise<void>;
  sair: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

async function buscarPapel(user: FirebaseAuthTypes.User): Promise<Papel> {
  const token = await user.getIdTokenResult();
  if (token.claims?.admin === true) {
    return 'admin';
  }
  const snap = await firestore().collection('usuarios').doc(user.uid).get();
  const papel = snap.exists ? snap.data()?.papel : null;
  return papel === 'admin' || papel === 'equipe' || papel === 'monitor' ? papel : null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [carregando, setCarregando] = useState(true);
  const [usuario, setUsuario] = useState<FirebaseAuthTypes.User | null>(null);
  const [papel, setPapel] = useState<Papel>(null);

  useEffect(() => {
    return auth().onAuthStateChanged(async (user) => {
      setCarregando(true);
      setUsuario(user);
      if (!user) {
        setPapel(null);
        setCarregando(false);
        return;
      }
      try {
        setPapel(await buscarPapel(user));
      } catch {
        setPapel(null);
      } finally {
        setCarregando(false);
      }
    });
  }, []);

  const entrar = async (email: string, senha: string) => {
    await auth().signInWithEmailAndPassword(email.trim(), senha);
  };

  const sair = async () => {
    await auth().signOut();
  };

  return (
    <AuthContext.Provider
      value={{ carregando, usuario, papel, isAdmin: papel === 'admin', entrar, sair }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth precisa estar dentro de <AuthProvider>');
  }
  return ctx;
}
