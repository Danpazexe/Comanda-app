<div align="center">

<img src="src/assets/LOGOSEMFUNDO.png" alt="Tô Servindo" width="280">

# Comanda App

**Gestão de comandas para lanchonete e eventos: pedido no celular, cozinha em tempo real e painel de pedidos prontos na TV.**

![React Native](https://img.shields.io/badge/React%20Native-0.80-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)
![Firebase](https://img.shields.io/badge/Firebase-Firestore%20%2B%20Hosting-FFCA28?logo=firebase)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite)

[Funcionalidades](#funcionalidades) · [Stack](#stack) · [Estrutura](#estrutura) · [Como rodar](#como-rodar) · [Licença](#licença)

</div>

---

## Funcionalidades

- **Nova comanda**: número, nome do cliente e itens do cardápio, com o total calculado em *sementes* (a moeda do evento).
- **Monitor da cozinha**: as comandas chegam em tempo real pelo Firestore e avançam de *preparando* para *pronto* e *entregue*.
- **Painel de clientes (web)**: tela para TV que mostra quem está em preparo e chama quem já pode retirar.
- **Cardápio**: cadastro, edição e exclusão de sabores com o valor de cada um.
- **Relatório**: comandas atendidas, quantidade por sabor e total vendido.
- **Configurações**: zerar todas as comandas para começar um novo dia.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| App | React Native 0.80 (CLI, sem Expo) + React 19 |
| Linguagem | TypeScript |
| Navegação | React Navigation (native stack) |
| UI | Reanimated, Bottom Sheet, Linear Gradient, Vector Icons |
| Dados | Firebase Firestore (`@react-native-firebase`) |
| Painel web | React 18 + Vite 5, publicado no Firebase Hosting |

## Estrutura

```
src/
├── screens/     # Splash, Home, Comanda, Editar, Cozinha, Gerenciar (cardápio), Relatorio, Config
├── services/    # firestoreService.ts: comandas, cardápio, relatório e config
├── types/       # Comanda, Item, PedidoMonitor
└── assets/      # Logos
web/             # Painel de pedidos prontos (Vite)
```

## Como rodar

Pré-requisitos: Node 18+ e o ambiente de [React Native](https://reactnative.dev/docs/set-up-your-environment) configurado (Android Studio e/ou Xcode).

```sh
npm install
npm start                      # inicia o Metro
npx react-native run-android   # builda e roda no Android
npm run ios                    # builda e roda no iOS (macOS; antes: bundle exec pod install em ios/)
```

Painel web:

```sh
cd web && npm install
npm start          # desenvolvimento
npm run deploy     # build + firebase deploy (Hosting em web/dist)
```

| Comando | O que faz |
|---------|-----------|
| `npm run android:build` | Gera o APK de release |
| `npm run web:deploy` | Build do painel web e deploy no Firebase |
| `npm run lint` / `npm test` | ESLint / Jest |

## Licença

Projeto pessoal de Daniel Paz ([PazConcept](https://www.pazconcept.com.br)). Todos os direitos reservados.
