import { useEffect, useState } from 'react';
import { Activity, ArrowUpRight, ShoppingCart, Users } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '../api.js';
import './analytics.css';

const fallbackData = [
  { day: 'Lun', visits: 42, orders: 8 },
  { day: 'Mar', visits: 58, orders: 13 },
  { day: 'Mié', visits: 51, orders: 11 },
  { day: 'Jue', visits: 76, orders: 19 },
  { day: 'Vie', visits: 88, orders: 24 },
  { day: 'Sáb', visits: 101, orders: 31 },
  { day: 'Dom', visits: 94, orders: 27 }
];

export default function AnalyticsPanel() {
  const [products, setProducts] = useState([]);
  const [chartData, setChartData] = useState(fallbackData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api.products()
      .then((response) => {
        const records = Array.isArray(response?.data) ? response.data : [];
        if (active && records.length) {
          setProducts(records);
          setChartData(fallbackData.map((point, index) => ({
            ...point,
            orders: Math.max(point.orders, Math.round(records.length * (index + 2) / 2))
          })));
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const visits = chartData.reduce((total, item) => total + item.visits, 0);
  const orders = chartData.reduce((total, item) => total + item.orders, 0);

  return <section className="analytics-page" aria-label="Actividad del marketplace">
    <div className="analytics-heading"><div><p className="eyebrow"><Activity size={15} /> CENTRO DE ACTIVIDAD</p><h1>Tu mercado, <em>en movimiento.</em></h1><p>Una lectura sencilla de la actividad reciente de Compra Ya.</p></div><span className="analytics-live"><i /> Datos de demostración</span></div>
    <div className="metric-grid"><article><span><Users size={17} /> Visitas</span><strong>{visits}</strong><small><ArrowUpRight size={14} /> Últimos 7 días</small></article><article><span><ShoppingCart size={17} /> Pedidos</span><strong>{orders}</strong><small><ArrowUpRight size={14} /> Estimación local</small></article><article><span><Activity size={17} /> Catálogo</span><strong>{loading ? '...' : products.length}</strong><small>Productos conectados a la API</small></article></div>
    <div className="chart-card"><div className="chart-card-heading"><div><p className="eyebrow">ÚLTIMOS 7 DÍAS</p><h2>Actividad del marketplace</h2></div><span>Visitas · Pedidos</span></div><div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData} margin={{ top: 10, right: 12, left: -20, bottom: 0 }}><defs><linearGradient id="visitsFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#dc5d38" stopOpacity=".32" /><stop offset="100%" stopColor="#dc5d38" stopOpacity="0" /></linearGradient></defs><CartesianGrid stroke="#e4e3da" vertical={false} /><XAxis dataKey="day" axisLine={false} tickLine={false} /><YAxis axisLine={false} tickLine={false} allowDecimals={false} /><Tooltip /><Area type="monotone" dataKey="visits" stroke="#dc5d38" strokeWidth={3} fill="url(#visitsFill)" /><Area type="monotone" dataKey="orders" stroke="#102c25" strokeWidth={2} fill="none" /></AreaChart></ResponsiveContainer></div></div>
  </section>;
}
