# Comanda App

## Segurança (leia antes de publicar)

> **Aviso:** até o dono publicar as regras (`firebase deploy --only firestore:rules,storage`), ativar o App Check e restringir a chave de API, **o banco continua aberto**. Hoje qualquer pessoa com a configuração pública do projeto pode ler, alterar ou apagar comandas, cardápio e relatório. As regras deste repositório só valem depois do deploy.

### Como o acesso funciona agora

- **Login com e-mail e senha (Firebase Auth)** no app e no monitor web. Não há cadastro pelo app: o dono cria as contas no console.
- **Papel por usuário** no documento `usuarios/{uid}` do Firestore, campo `papel`:

| Papel | O que pode |
|---|---|
| `admin` | Tudo: apagar comandas e "Zerar tudo", gerenciar o cardápio, ver e limpar o relatório, zerar o contador. Também vale um custom claim `admin: true`. |
| `equipe` | Criar e editar comandas, mudar o status, ler o cardápio, somar vendas no relatório (sem ler nem limpar) e somar ou subtrair 1 no contador. |
| `monitor` | Só ler comandas. É a conta do telão (monitor web). |

- Quem faz login, mas não tem documento em `usuarios`, não acessa nada. Isso vale também para contas criadas por terceiros com a chave pública.
- Ninguém altera `usuarios` pelo app, nem um admin. Só o console ou o Admin SDK.
- As regras também validam os campos da comanda: `status` dentro da lista, `numero` inteiro positivo e imutável, `totalSementes` ≥ 0, nome com até 60 caracteres e nenhum campo extra.
- O Storage fica todo negado, porque o app não usa.

**Por que e-mail e senha, e não login anônimo:** com a chave de API pública, qualquer pessoa consegue criar um usuário anônimo. Uma regra `request.auth != null` com login anônimo não protege nada sem App Check. Contas criadas pelo dono, junto com o papel em `usuarios/{uid}`, são a menor mudança que torna as regras eficazes.

### Passo a passo para o dono (fora do código)

Faça nesta ordem. Se publicar as regras antes de os aparelhos terem o app novo, o app antigo (sem login) para de funcionar.

1. **Ativar o login.** No console do Firebase, abra Authentication → Sign-in method e ative **E-mail/senha**. Se o projeto tiver a opção (Authentication → Settings → User actions), desmarque "Enable create (sign-up)" para ninguém se cadastrar sozinho.
2. **Criar as contas.** Em Authentication → Users, crie uma conta por pessoa e uma para o telão. Copie o **UID** de cada uma.
3. **Dar os papéis.** No Firestore, crie a coleção `usuarios` com um documento por UID (o ID do documento é o próprio UID), por exemplo `{ papel: "admin" }`, `{ papel: "equipe" }` ou `{ papel: "monitor" }`.
4. **Instalar o app novo em todos os aparelhos.** Rode `npm install` e, no iOS, `cd ios && pod install`, porque o `@react-native-firebase/auth` é nativo. Depois gere o build.
5. **Publicar o monitor web:** `npm run web:deploy`. O script agora faz `firebase deploy --only hosting`, então não publica as regras sem querer. Faça login no telão com a conta `monitor`.
6. **Publicar as regras:** `firebase deploy --only firestore:rules,storage`. Depois confira no console (Firestore → Regras) que não sobrou nada em "modo de teste".
7. **Ativar o App Check:** console → App Check, com Play Integrity no Android e reCAPTCHA Enterprise no web. Acompanhe as métricas e só então ligue o "Enforce" para o Firestore. Atenção: o código do app **ainda não** envia token do App Check, porque isso exige o `@react-native-firebase/app-check` e configuração nativa. Por isso não ligue o Enforce antes de integrar esse SDK, ou o app para de funcionar.
8. **Restringir a chave de API** no Google Cloud Console (APIs e serviços → Credenciais):
   - Chave Android: restrita ao pacote `com.ComandaApp` + SHA-1 do certificado de release.
   - Chave web: restrita aos referenciadores `https://comandaapp-797db.web.app/*` e `https://comandaapp-797db.firebaseapp.com/*`.
   - Nas duas: limitar às APIs usadas (Firestore, Identity Toolkit, Token Service).

### Testar as regras

As regras têm testes com o Firebase Emulator, em `rules-tests/`. O teste usa um projeto fictício (`demo-comanda`) e não toca no Firebase real. Precisa de Java 21 ou mais novo.

```sh
cd rules-tests
npm install
npm test
```

### Build de produção

- **App:** no bundle de release, o `babel-plugin-transform-remove-console` remove todos os `console.*` (ver `babel.config.js`).
- **Monitor web:**
  - O build não gera mais sourcemap (`sourcemap: false`) e remove `console.*`.
  - O hosting ignora `*.map`, então um `.map` antigo esquecido em `web/dist` não é publicado.
  - O hosting envia headers de segurança (`X-Frame-Options`, `nosniff`, `Referrer-Policy`, CSP `frame-ancestors`).

### Próximos passos (não feitos aqui)

- **Número e total da comanda calculados no servidor.** Hoje o app calcula `numero` (último + 1) e `totalSementes`. As regras validam tipo e faixa, mas não conferem o total contra o cardápio, e dois aparelhos ainda podem gerar o mesmo número ao mesmo tempo. Resolver isso de verdade exige **Cloud Functions**, por exemplo uma função `criarComanda` que lê o cardápio, calcula o total e gera o número em transação. As regras passariam então a negar `create` direto do cliente.
- Integrar o App Check no código (ver passo 7).
- Uma CSP completa para o monitor web (`script-src`/`connect-src`), depois de testar com o Firebase.

---

This is a new [**React Native**](https://reactnative.dev) project, bootstrapped using [`@react-native-community/cli`](https://github.com/react-native-community/cli).

# Getting Started

> **Note**: Make sure you have completed the [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.

## Step 1: Start Metro

First, you will need to run **Metro**, the JavaScript build tool for React Native.

To start the Metro dev server, run the following command from the root of your React Native project:

```sh
# Using npm
npm start

# OR using Yarn
yarn start
```

## Step 2: Build and run your app

With Metro running, open a new terminal window/pane from the root of your React Native project, and use one of the following commands to build and run your Android or iOS app:

### Android

```sh
# Using npm
npm run android

# OR using Yarn
yarn android
```

### iOS

For iOS, remember to install CocoaPods dependencies (this only needs to be run on first clone or after updating native deps).

The first time you create a new project, run the Ruby bundler to install CocoaPods itself:

```sh
bundle install
```

Then, and every time you update your native dependencies, run:

```sh
bundle exec pod install
```

For more information, please visit [CocoaPods Getting Started guide](https://guides.cocoapods.org/using/getting-started.html).

```sh
# Using npm
npm run ios

# OR using Yarn
yarn ios
```

If everything is set up correctly, you should see your new app running in the Android Emulator, iOS Simulator, or your connected device.

This is one way to run your app — you can also build it directly from Android Studio or Xcode.

## Step 3: Modify your app

Now that you have successfully run the app, let's make changes!

Open `App.tsx` in your text editor of choice and make some changes. When you save, your app will automatically update and reflect these changes — this is powered by [Fast Refresh](https://reactnative.dev/docs/fast-refresh).

When you want to forcefully reload, for example to reset the state of your app, you can perform a full reload:

- **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Dev Menu**, accessed via <kbd>Ctrl</kbd> + <kbd>M</kbd> (Windows/Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (macOS).
- **iOS**: Press <kbd>R</kbd> in iOS Simulator.

## Congratulations! :tada:

You've successfully run and modified your React Native App. :partying_face:

### Now what?

- If you want to add this new React Native code to an existing application, check out the [Integration guide](https://reactnative.dev/docs/integration-with-existing-apps).
- If you're curious to learn more about React Native, check out the [docs](https://reactnative.dev/docs/getting-started).

# Troubleshooting

If you're having issues getting the above steps to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

# Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.
