import { useEffect, useState } from 'react';
import { Link, Route, Routes, useLocation } from 'react-router-dom';
import { ArrowRight, Heart, Menu, Search, ShieldCheck, ShoppingBag, Sparkles, X } from 'lucide-react';
import { api } from './api.js';
import { AuthForm } from './auth/AuthForm.jsx';
import { useAuth } from './auth/AuthContext.jsx';
import AnalyticsPanel from './components/AnalyticsPanel.jsx';

const fallbackProducts = [
  { id: 'demo-1', nombre: 'Auriculares inalámbricos', precio: 28000, categoria: 'Tecnología', ciudad: 'Malabo', imagen: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80' },
  { id: 'demo-2', nombre: 'Bolso artesanal de Bata', precio: 18500, categoria: 'Moda', ciudad: 'Bata', imagen: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80' },
  { id: 'demo-3', nombre: 'Set de cerámica local', precio: 32000, categoria: 'Hogar', ciudad: 'Malabo', imagen: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=800&q=80' }
];

function Layout({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const { user, signOut } = useAuth();
  const links = [['/', 'Explorar'], ['/empresa', 'La empresa'], ['/vender', 'Vender'], ['/actividad', 'Actividad']];
  return <div className="app-shell">
    <header className="topbar">
      <Link className="brand" to="/"><span className="brand-mark">CY</span><span>Compra <b>Ya</b></span></Link>
      <nav className={menuOpen ? 'nav open' : 'nav'}>{links.map(([to, label]) => <Link className={location.pathname === to ? 'active' : ''} onClick={() => setMenuOpen(false)} key={to} to={to}>{label}</Link>)}</nav>
      <div className="top-actions"><button className="icon-button" aria-label="Buscar"><Search size={18} /></button><button className="icon-button" aria-label="Favoritos"><Heart size={18} /></button>{user ? <button className="session-button" onClick={() => signOut()}>Salir</button> : <Link className="session-button" to="/login">Entrar</Link>}<button className="menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Abrir menú">{menuOpen ? <X size={20} /> : <Menu size={20} />}</button></div>
    </header>
    <main>{children}</main>
    <footer><span>Compra Ya · v0.1.0</span><span>Un mercado más cercano, construido desde Guinea Ecuatorial.</span></footer>
  </div>;
}

function Home() {
  const [products, setProducts] = useState(fallbackProducts);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api.products().then((response) => setProducts(response.data || fallbackProducts)).catch(() => {}).finally(() => setLoading(false)); }, []);
  return <>
    <section className="hero"><div className="hero-copy"><p className="eyebrow"><Sparkles size={15} /> EL MERCADO QUE CONECTA</p><h1>Encuentra algo <em>tuyo.</em></h1><p className="hero-text">Productos, servicios y personas reales. Compra con confianza y vende con una historia detrás.</p><div className="hero-actions"><Link className="button primary" to="#productos">Explorar ahora <ArrowRight size={17} /></Link><Link className="text-link" to="/empresa">Conoce Compra Ya</Link></div></div><div className="hero-art"><div className="hero-note"><span>01</span><strong>Hecho aquí.<br />Para todos.</strong></div></div></section>
    <section className="section" id="productos"><div className="section-heading"><div><p className="eyebrow">SELECCIÓN LOCAL</p><h2>Lo que está pasando cerca</h2></div><button className="filter-button">Todas las categorías <ArrowRight size={16} /></button></div>{loading && <p className="status">Conectando con el catálogo central...</p>}<div className="product-grid">{products.map((product) => <article className="product-card" key={product.id}><div className="product-image"><img src={product.imagen || product.image || fallbackProducts[0].imagen} alt={product.nombre || product.name} /><button className="save" aria-label="Guardar producto"><Heart size={17} /></button></div><div className="product-info"><span>{product.categoria || 'Marketplace'} · {product.ciudad || 'Guinea Ecuatorial'}</span><h3>{product.nombre || product.name || 'Producto Compra Ya'}</h3><strong>{Number(product.precio || product.price || 0).toLocaleString('es-GQ')} XAF</strong></div></article>)}</div></section>
    <section className="trust-strip"><ShieldCheck size={24} /><div><strong>Compra con más tranquilidad</strong><span>Pagos centralizados, vendedores verificados y soporte cercano.</span></div><Link to="/empresa">Cómo funciona <ArrowRight size={16} /></Link></section>
  </>;
}

function Company() { return <section className="company-page"><div className="company-intro"><p className="eyebrow">QUIÉNES SOMOS</p><h1>Una empresa local, <em>una mirada abierta.</em></h1><p>Compra Ya nace para hacer que comprar, vender y descubrir talento en Guinea Ecuatorial sea más sencillo, humano y confiable.</p></div><div className="company-grid"><div className="company-stat"><span>01</span><h2>Conexión</h2><p>Acercamos a compradores y vendedores de Malabo, Bata y cada comunidad.</p></div><div className="company-stat accent"><span>02</span><h2>Confianza</h2><p>Centralizamos los datos y los pagos para que cada paso sea claro.</p></div><div className="company-stat"><span>03</span><h2>Futuro</h2><p>Construimos una plataforma preparada para web, PWA, Android e iOS.</p></div></div><div className="founder-note"><div className="founder-avatar">CY</div><div><p className="eyebrow">DETRÁS DE COMPRA YA</p><h2>Una visión que empieza cerca.</h2><p>La empresa está construida con una convicción sencilla: la tecnología tiene más valor cuando fortalece las relaciones que ya existen.</p></div></div></section>; }

function Sell() { const [message, setMessage] = useState(''); const pay = async () => { setMessage('Preparando checkout seguro...'); try { const result = await api.createPayment('local-wallet', { amount: 1000, currency: 'XAF', reference: `demo_${Date.now()}` }); setMessage(result.data?.message || 'Checkout preparado correctamente.'); } catch (error) { setMessage(error.message); } }; return <section className="sell-page"><div><p className="eyebrow">PARA VENDEDORES</p><h1>Tu producto merece <em>ser encontrado.</em></h1><p>Publica, recibe pagos y sigue tus ventas desde una única experiencia.</p><button className="button primary" onClick={pay}><ShoppingBag size={17} /> Probar checkout</button>{message && <p className="status">{message}</p>}</div><div className="sell-panel"><span>PRÓXIMAMENTE</span><h2>Tu escaparate,<br />sin complicaciones.</h2><p>La nueva consola de vendedor conectará catálogo, pedidos y pagos centralizados.</p></div></section>; }

export default function App() { return <Layout><Routes><Route path="/" element={<Home />} /><Route path="/empresa" element={<Company />} /><Route path="/vender" element={<Sell />} /><Route path="/actividad" element={<AnalyticsPanel />} /><Route path="/login" element={<AuthForm mode="login" />} /><Route path="/register" element={<AuthForm mode="register" />} /></Routes></Layout>; }
