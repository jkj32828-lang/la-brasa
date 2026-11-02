// Dados públicos do projeto Firebase (ficam visíveis no site; isso é normal no Firebase).
// Preenchido com: npx firebase-tools apps:sdkconfig WEB --project <id-do-projeto>
export const firebaseConfig = {
  apiKey: 'AIzaSyCd0xT_vuRFKHC3JviEIHH1i1_itXLCUeI',
  authDomain: 'la-brasa-burger-nf.firebaseapp.com',
  projectId: 'la-brasa-burger-nf',
  storageBucket: 'la-brasa-burger-nf.firebasestorage.app',
  messagingSenderId: '423112270414',
  appId: '1:423112270414:web:22de3719a200ab93a0191f',
};

// Contas Google que entram no painel do dono. Mantenha igual à lista em firestore.rules.
export const OWNER_EMAILS = ['jkj32828@gmail.com'];
