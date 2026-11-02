// Liga o site ao Firebase: banco Firestore + login do dono com Google.
// Entrega ao index.html o mesmo formato de banco que a página já usa (connectBackend).
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js';
import { getFirestore, doc, collection, query, orderBy, setDoc, updateDoc, deleteDoc, onSnapshot } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import { firebaseConfig, OWNER_EMAILS } from './config.js';

const app = initializeApp(firebaseConfig);
const fdb = getFirestore(app);
const auth = getAuth(app);
const owners = OWNER_EMAILS.map(e => e.toLowerCase());

const wrapQuery = q => ({
  orderBy: (field, dir) => wrapQuery(query(q, orderBy(field, dir))),
  onSnapshot: (next, error) => onSnapshot(q, next, error),
});

window.connectBackend({
  db: {
    doc: path => {
      const ref = doc(fdb, path);
      return {
        set: data => setDoc(ref, data), update: data => updateDoc(ref, data), delete: () => deleteDoc(ref),
        // Um documento só, ao vivo (o cliente acompanha o próprio pedido assim)
        onSnapshot: (next, error) => onSnapshot(ref, s => next({ exists: s.exists(), data: () => s.data() }), error),
      };
    },
    collection: path => wrapQuery(collection(fdb, path)),
  },
  // Só mostra o painel; quem protege os dados de verdade são as regras em firestore.rules
  onAuth: cb => onAuthStateChanged(auth, u => cb(u ? {
    email: u.email,
    isOwner: u.emailVerified && owners.includes((u.email || '').toLowerCase()),
  } : null)),
  signIn: () => signInWithPopup(auth, new GoogleAuthProvider()),
  signOut: () => signOut(auth),
});
