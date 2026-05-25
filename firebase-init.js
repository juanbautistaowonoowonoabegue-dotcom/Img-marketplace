 
<script src="https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.14.1/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore-compat.js"></script>

<script>
// @ts-nocheck
// ==================== CONFIGURACIÓN FIREBASE ====================
const firebaseConfig = {
    apiKey: "AIzaSyDQu4XnOG8lRadXJ_WrgOAuUWaYJouZJ5w",
    authDomain: "marketplace-2005.firebaseapp.com",
    projectId: "marketplace-2005",
    storageBucket: "marketplace-2005.firebasestorage.app",
    messagingSenderId: "525827241488",
    appId: "1:525827241488:web:c88a4d8e88d0f0a28bbc95",
    measurementId: "G-REKGVTB1L5"
};

// ==================== INICIALIZACIÓN ÚNICA Y SEGURA ====================
if (!firebase || !firebase.apps || !firebase.apps.length) {
    try {
        firebase.initializeApp(firebaseConfig);
        console.log("✅ Firebase inicializado correctamente - Compra Ya Marketplace");
    } catch (error) {
        console.error("❌ Error al inicializar Firebase:", error);
    }
} else {
    console.log("🔄 Firebase ya estaba inicializado");
}

// Referencias globales
const db = firebase.firestore();
const auth = firebase.auth();

console.log("🔥 Firebase listo → db y auth disponibles globalmente");
</script>