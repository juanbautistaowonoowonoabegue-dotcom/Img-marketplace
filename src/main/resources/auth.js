// auth.js
import { auth } from "./firebase.js";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup,
  GoogleAuthProvider,
  signInAnonymously,
  signOut,
  onAuthStateChanged 
} from "firebase/auth";

// Registrar usuario
export async function registrar(email, password) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    console.log("✅ Usuario registrado:", userCredential.user.email);
    return userCredential.user;
  } catch (error) {
    console.error("Error al registrar:", error.message);
    throw error;
  }
}

// Iniciar sesión con email
export async function login(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log("✅ Sesión iniciada:", userCredential.user.email);
    return userCredential.user;
  } catch (error) {
    console.error("Error al iniciar sesión:", error.message);
    throw error;
  }
}

// Iniciar sesión con Google
export async function loginConGoogle() {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    console.log("✅ Login con Google:", result.user.email);
    return result.user;
  } catch (error) {
    console.error("Error Google:", error.message);
    throw error;
  }
}

// auth.js - Versión corregida para CDN

// No importamos nada aquí. Usaremos las funciones directamente desde el script del HTML

export async function registrar(email, password) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    console.log("✅ Usuario registrado:", userCredential.user.email);
    return userCredential.user;
  } catch (error) {
    console.error("Error al registrar:", error.message);
    throw error;
  }
}

export async function login(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log("✅ Sesión iniciada:", userCredential.user.email);
    return userCredential.user;
  } catch (error) {
    console.error("Error al iniciar sesión:", error.message);
    throw error;
  }
}

export async function loginConGoogle() {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    console.log("✅ Login con Google:", result.user.email || result.user.uid);
    return result.user;
  } catch (error) {
    console.error("Error Google:", error.message);
    throw error;
  }
}

export async function loginAnonimo() {
  try {
    const result = await signInAnonymously(auth);
    console.log("✅ Login anónimo exitoso:", result.user.uid);
    return result.user;
  } catch (error) {
    console.error("Error anónimo:", error.message);
    throw error;
  }
}

export async function logout() {
  try {
    await signOut(auth);
    console.log("✅ Sesión cerrada");
  } catch (error) {
    console.error("Error al cerrar sesión:", error.message);
  }
}

export function escucharAuth(callback) {
  onAuthStateChanged(auth, callback);
}