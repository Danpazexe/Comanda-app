// Testes das regras (firestore.rules e storage.rules) contra o Firebase Emulator.
// Rodar: cd rules-tests && npm install && npm test
// O projeto "demo-comanda" é fictício: nada aqui toca o Firebase real.
import { readFileSync } from 'node:fs';
import { after, before, beforeEach, describe, test } from 'node:test';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  Timestamp,
  deleteDoc,
  doc,
  getDoc,
  increment,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { ref, uploadString } from 'firebase/storage';

let env;

const comanda = (extra = {}) => ({
  numero: 1,
  nomeCliente: 'Maria',
  itens: [{ nome: 'FRANGO', quantidade: 2 }],
  status: 'aberta',
  timestamp: Timestamp.now(),
  totalSementes: 4,
  ...extra,
});

before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-comanda',
    firestore: { rules: readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8') },
    storage: { rules: readFileSync(new URL('../storage.rules', import.meta.url), 'utf8') },
  });
});

after(async () => {
  await env.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'usuarios/admin1'), { papel: 'admin' });
    await setDoc(doc(db, 'usuarios/equipe1'), { papel: 'equipe' });
    await setDoc(doc(db, 'usuarios/monitor1'), { papel: 'monitor' });
    await setDoc(doc(db, 'comandas/c1'), comanda());
    await setDoc(doc(db, 'cardapio/i1'), { nome: 'FRANGO', valor: '2' });
    await setDoc(doc(db, 'relatorio/vendas'), { vendas: { FRANGO: 3 } });
    await setDoc(doc(db, 'config/contadores'), { comandasAtendidas: 5 });
  });
});

const db = (uid, claims) =>
  (uid ? env.authenticatedContext(uid, claims) : env.unauthenticatedContext()).firestore();

describe('sem login', () => {
  test('não lê nem escreve nada', async () => {
    await assertFails(getDoc(doc(db(null), 'comandas/c1')));
    await assertFails(setDoc(doc(db(null), 'comandas/c2'), comanda({ numero: 2 })));
    await assertFails(getDoc(doc(db(null), 'cardapio/i1')));
    await assertFails(deleteDoc(doc(db(null), 'comandas/c1')));
  });
});

describe('logado mas sem papel (ex.: conta criada por estranho)', () => {
  test('não acessa nada', async () => {
    await assertFails(getDoc(doc(db('estranho'), 'comandas/c1')));
    await assertFails(setDoc(doc(db('estranho'), 'comandas/c2'), comanda({ numero: 2 })));
  });
  test('não consegue se promover a admin', async () => {
    await assertFails(setDoc(doc(db('estranho'), 'usuarios/estranho'), { papel: 'admin' }));
  });
});

describe('monitor (telão)', () => {
  test('lê comandas', async () => {
    await assertSucceeds(getDoc(doc(db('monitor1'), 'comandas/c1')));
  });
  test('não altera comandas nem lê cardápio', async () => {
    await assertFails(updateDoc(doc(db('monitor1'), 'comandas/c1'), { status: 'pronto' }));
    await assertFails(getDoc(doc(db('monitor1'), 'cardapio/i1')));
  });
});

describe('equipe', () => {
  test('cria comanda válida e muda status', async () => {
    await assertSucceeds(setDoc(doc(db('equipe1'), 'comandas/c2'), comanda({ numero: 2 })));
    await assertSucceeds(updateDoc(doc(db('equipe1'), 'comandas/c1'), { status: 'preparando', horaAtendimento: Timestamp.now() }));
  });
  test('rejeita comanda inválida', async () => {
    await assertFails(setDoc(doc(db('equipe1'), 'comandas/c3'), comanda({ numero: -1 })));
    await assertFails(setDoc(doc(db('equipe1'), 'comandas/c3'), comanda({ status: 'pronto' })));
    await assertFails(setDoc(doc(db('equipe1'), 'comandas/c3'), comanda({ totalSementes: -5 })));
    await assertFails(setDoc(doc(db('equipe1'), 'comandas/c3'), comanda({ campoEstranho: true })));
    await assertFails(updateDoc(doc(db('equipe1'), 'comandas/c1'), { status: 'qualquer' }));
    await assertFails(updateDoc(doc(db('equipe1'), 'comandas/c1'), { numero: 99 }));
  });
  test('não apaga comanda (nem "Zerar tudo")', async () => {
    await assertFails(deleteDoc(doc(db('equipe1'), 'comandas/c1')));
  });
  test('lê cardápio mas não altera', async () => {
    await assertSucceeds(getDoc(doc(db('equipe1'), 'cardapio/i1')));
    await assertFails(setDoc(doc(db('equipe1'), 'cardapio/i2'), { nome: 'X', valor: '0' }));
    await assertFails(deleteDoc(doc(db('equipe1'), 'cardapio/i1')));
  });
  test('soma vendas, mas não lê nem limpa o relatório', async () => {
    await assertSucceeds(setDoc(doc(db('equipe1'), 'relatorio/vendas'), { vendas: { FRANGO: increment(1) } }, { merge: true }));
    await assertFails(getDoc(doc(db('equipe1'), 'relatorio/vendas')));
    await assertFails(setDoc(doc(db('equipe1'), 'relatorio/vendas'), { vendas: {} }));
  });
  test('contador: +1/-1 sim, zerar não', async () => {
    await assertSucceeds(setDoc(doc(db('equipe1'), 'config/contadores'), { comandasAtendidas: 6 }));
    await assertSucceeds(setDoc(doc(db('equipe1'), 'config/contadores'), { comandasAtendidas: 5 }));
    await assertFails(setDoc(doc(db('equipe1'), 'config/contadores'), { comandasAtendidas: 0 }));
  });
});

describe('admin', () => {
  test('apaga comandas, mexe no cardápio e limpa relatório e contador', async () => {
    await assertSucceeds(deleteDoc(doc(db('admin1'), 'comandas/c1')));
    await assertSucceeds(setDoc(doc(db('admin1'), 'cardapio/i2'), { nome: 'QUEIJO', valor: '2' }));
    await assertSucceeds(deleteDoc(doc(db('admin1'), 'cardapio/i1')));
    await assertSucceeds(getDoc(doc(db('admin1'), 'relatorio/vendas')));
    await assertSucceeds(setDoc(doc(db('admin1'), 'relatorio/vendas'), { vendas: {} }));
    await assertSucceeds(setDoc(doc(db('admin1'), 'config/contadores'), { comandasAtendidas: 0 }));
  });
  test('custom claim admin também vale', async () => {
    await assertSucceeds(deleteDoc(doc(db('semDoc', { admin: true }), 'comandas/c1')));
  });
  test('nem admin escreve em usuarios pelo app', async () => {
    await assertFails(setDoc(doc(db('admin1'), 'usuarios/equipe1'), { papel: 'admin' }));
  });
});

describe('storage', () => {
  test('tudo negado, mesmo para admin', async () => {
    const st = env.authenticatedContext('admin1').storage();
    await assertFails(uploadString(ref(st, 'qualquer.txt'), 'oi'));
  });
});
