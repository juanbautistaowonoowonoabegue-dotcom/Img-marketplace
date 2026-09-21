import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, LockKeyhole, Mail } from 'lucide-react';
import { useAuth } from './AuthContext.jsx';
import './auth.css';

function authMessage(error) {
  if (!error) return '';
  if (error.message?.toLowerCase().includes('invalid login credentials')) return 'El correo o la contraseña no son correctos.';
  if (error.message?.toLowerCase().includes('user already registered')) return 'Este correo ya está registrado.';
  return 'No se pudo completar la operación. Revisa los datos e inténtalo de nuevo.';
}

export function AuthForm({ mode }) {
  const isRegister = mode === 'register';
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setNotice('');
    if (isRegister && password !== confirmation) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setSubmitting(true);
    const result = isRegister
      ? await signUp(email, password)
      : await signIn(email, password);
    setSubmitting(false);

    if (result.error) {
      setError(authMessage(result.error));
      return;
    }

    if (isRegister && !result.data.session) {
      setNotice('Cuenta creada. Revisa tu correo para confirmar el registro.');
      return;
    }

    navigate(location.state?.from || '/');
  }

  return <section className="auth-page"><div className="auth-panel"><p className="eyebrow">COMPRA YA · CUENTA</p><h1>{isRegister ? 'Crea tu espacio.' : 'Bienvenido de nuevo.'}</h1><p className="auth-lead">Accede a una experiencia de compra y venta más cercana.</p><form onSubmit={handleSubmit} className="auth-form"><label><span><Mail size={15} /> Correo electrónico</span><input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label><label><span><LockKeyhole size={15} /> Contraseña</span><input type="password" autoComplete={isRegister ? 'new-password' : 'current-password'} minLength="6" required value={password} onChange={(event) => setPassword(event.target.value)} /></label>{isRegister && <label><span><LockKeyhole size={15} /> Confirmar contraseña</span><input type="password" autoComplete="new-password" minLength="6" required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} /></label>}{error && <p className="form-error" role="alert">{error}</p>}{notice && <p className="form-notice" role="status">{notice}</p>}<button className="button primary auth-submit" disabled={submitting}>{submitting ? 'Procesando...' : isRegister ? 'Crear cuenta' : 'Iniciar sesión'} <ArrowRight size={17} /></button></form><p className="auth-switch">{isRegister ? '¿Ya tienes cuenta?' : '¿Todavía no tienes cuenta?'} <Link to={isRegister ? '/login' : '/register'}>{isRegister ? 'Inicia sesión' : 'Regístrate'}</Link></p></div><div className="auth-image"><span>Tu mercado.<br />Tu ritmo.</span></div></section>;
}
