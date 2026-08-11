import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  CalendarDays, Search, LogOut, AlertCircle,
  Leaf, Sprout, TrendingDown, Sparkles, CheckCircle2,
} from 'lucide-react';
import Login from './Login';

/* ── Flower emoji map for the 20 varieties ── */
const FLOWER_EMOJI = {
  'Rose':           '🌹',
  'Lily':           '🌷',
  'Orchid':         '🌸',
  'Carnation':      '💮',
  'Gerbera':        '🌺',
  'Tulip':          '🌷',
  'Chrysanthemum':  '🌸',
  'Sunflower':      '🌻',
  'Anthurium':      '🌺',
  'Gladiolus':      '🌷',
  'Alstroemeria':   '🌼',
  'Iris':           '💜',
  'Lisianthus':     '🌸',
  'Ranunculus':     '🌸',
  'Peony':          '🌸',
  'Bird of Paradise': '🦜',
  'Freesia':        '🌼',
  'Stock Flower':   '🌿',
  'Snapdragon':     '🌷',
  'Hydrangea':      '💠',
};

function flowerEmoji(name) {
  for (const [k, v] of Object.entries(FLOWER_EMOJI)) {
    if (name.includes(k)) return v;
  }
  return '🌸';
}

/* ─────────────── Toast component ─────────────── */
let _toastId = 0;
function useToast() {
  const [toasts, setToasts] = useState([]);

  const show = useCallback((msg, icon = '✅') => {
    const id = ++_toastId;
    setToasts(prev => [...prev, { id, msg, icon, hiding: false }]);
    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, hiding: true } : t));
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 260);
    }, 2800);
  }, []);

  return { toasts, show };
}

function ToastContainer({ toasts }) {
  if (!toasts.length) return null;
  return (
    <div className="toast-wrap">
      {toasts.map(t => (
        <div key={t.id} className={`toast${t.hiding ? ' is-hiding' : ''}`}>
          <span className="toast-icon">{t.icon}</span>
          <span>{t.msg}</span>
        </div>
      ))}
    </div>
  );
}

/* ─────────────── Shimmer skeleton rows ─────────────── */
function SkeletonRows() {
  return (
    <>
      {[...Array(6)].map((_, i) => (
        <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
          <td colSpan={7} style={{ padding: 0 }}>
            <div className="skeleton-row">
              <div className="skeleton" style={{ width: 80,  height: 18, animationDelay: `${i * 0.08}s` }} />
              <div className="skeleton" style={{ width: 140, height: 18, animationDelay: `${i * 0.08 + 0.05}s` }} />
              <div className="skeleton" style={{ width: 60,  height: 18, animationDelay: `${i * 0.08 + 0.10}s`, marginLeft: 'auto' }} />
              <div className="skeleton" style={{ width: 40,  height: 18, animationDelay: `${i * 0.08 + 0.15}s` }} />
              <div className="skeleton" style={{ width: 90,  height: 18, animationDelay: `${i * 0.08 + 0.20}s` }} />
              <div className="skeleton" style={{ width: 55,  height: 18, animationDelay: `${i * 0.08 + 0.25}s` }} />
              <div className="skeleton" style={{ width: 75,  height: 28, borderRadius: 8, animationDelay: `${i * 0.08 + 0.30}s` }} />
            </div>
          </td>
        </tr>
      ))}
    </>
  );
}

/* ─────────────── Batch row ─────────────── */
function BatchRow({ batch, idx, onWaste }) {
  const [wasting, setWasting] = useState(false);

  const handleWaste = async () => {
    if (!window.confirm('Mark this batch as wasted? This cannot be undone.')) return;
    setWasting(true);
    // small delay lets the animation play before the parent removes the row
    await new Promise(r => setTimeout(r, 380));
    onWaste(batch.id);
  };

  return (
    <tr
      className={`table-row${wasting ? ' is-wasting' : ''}`}
      style={{ animation: `fadeUp 0.35s ease ${idx * 0.045}s both` }}
    >
      {/* Batch ID */}
      <td style={{ padding: '15px 20px' }}>
        <span className="batch-id-pill">#{batch.id.substring(0, 8)}…</span>
      </td>

      {/* Flower name + discount badge */}
      <td style={{ padding: '15px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 22, lineHeight: 1 }}>{flowerEmoji(batch.product)}</span>
          <div>
            <p style={{ fontWeight: 600, color: 'var(--text)', fontSize: 14, marginBottom: batch.isDiscounted ? 3 : 0 }}>
              {batch.product}
            </p>
            {batch.isDiscounted && (
              <span className="badge-discount">⚡ Expiring Soon · 50% Off</span>
            )}
          </div>
        </div>
      </td>

      {/* SKU */}
      <td style={{ padding: '15px 20px', color: 'var(--text-muted)', fontSize: 13 }}>
        {batch.sku}
      </td>

      {/* Qty */}
      <td style={{ padding: '15px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            fontWeight: 700,
            fontSize: 15,
            color: batch.quantity < 100 ? 'var(--crimson)' : 'var(--text)',
          }}>
            {batch.quantity.toLocaleString()}
          </span>
          {batch.quantity < 100 && (
            <span className="badge badge-low">Low</span>
          )}
        </div>
      </td>

      {/* Expiry */}
      <td style={{ padding: '15px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <CalendarDays
            size={13}
            style={{ color: batch.isDiscounted ? 'var(--amber)' : 'var(--c3)', flexShrink: 0 }}
          />
          <span style={{
            fontSize: 13,
            color: batch.isDiscounted ? 'var(--amber)' : 'var(--text-muted)',
            fontWeight: batch.isDiscounted ? 600 : 400,
          }}>
            {batch.expiryDate}
          </span>
        </div>
      </td>

      {/* Status badge */}
      <td style={{ padding: '15px 20px' }}>
        <span className={`badge ${batch.status === 'ACTIVE' ? 'badge-active' : 'badge-discarded'}`}>
          {batch.status === 'ACTIVE' ? '● Active' : batch.status}
        </span>
      </td>

      {/* Action */}
      <td style={{ padding: '15px 20px', textAlign: 'right' }}>
        {batch.status === 'ACTIVE' && (
          <button className="btn-ghost" onClick={handleWaste} style={{ fontSize: 12, padding: '6px 12px' }}>
            🗑 Waste
          </button>
        )}
      </td>
    </tr>
  );
}

/* ─────────────── Modal component ─────────────── */
function BatchModal({ products, onClose, onSaved, token }) {
  const [closing, setClosing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    productId: products.length > 0 ? products[0].id : '',
    supplierName: '', quantity: '', purchasePrice: '', expiryDate: '',
  });

  const close = () => {
    setClosing(true);
    setTimeout(onClose, 230);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('http://localhost:8080/api/inventory/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          productId: formData.productId,
          supplierName: formData.supplierName,
          quantity: parseInt(formData.quantity, 10),
          purchasePrice: parseFloat(formData.purchasePrice),
          expiryDate: `${formData.expiryDate}T00:00:00`,
        }),
      });
      if (!res.ok) throw new Error('Failed to create batch');
      const saved = await res.json();
      setClosing(true);
      setTimeout(() => { onClose(); onSaved(saved); }, 230);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && close()}>
      <div className={`modal-card${closing ? ' is-closing' : ''}`}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, var(--c1) 0%, var(--c2) 100%)',
          borderBottom: '1px solid var(--border)',
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 24 }}>🌺</span>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, color: 'var(--text)' }}>
              Receive New Batch
            </h3>
          </div>
          <button className="btn-icon" onClick={close} aria-label="Close">
            <span style={{ fontSize: 18, lineHeight: 1, marginTop: -1 }}>×</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '24px 24px 28px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label className="field-label">Flower Product</label>
              <select
                className="field-input"
                value={formData.productId}
                onChange={e => setFormData(p => ({ ...p, productId: e.target.value }))}
                required
              >
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {flowerEmoji(p.name)} {p.name} ({p.sku})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="field-label">Supplier Name</label>
              <input
                type="text"
                className="field-input"
                placeholder="e.g. Dutch Farms Ltd"
                value={formData.supplierName}
                onChange={e => setFormData(p => ({ ...p, supplierName: e.target.value }))}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="field-label">Quantity</label>
                <input
                  type="number" min="1" placeholder="0" className="field-input"
                  value={formData.quantity}
                  onChange={e => setFormData(p => ({ ...p, quantity: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="field-label">Unit Price (₹)</label>
                <input
                  type="number" step="0.01" min="0.01" placeholder="0.00" className="field-input"
                  value={formData.purchasePrice}
                  onChange={e => setFormData(p => ({ ...p, purchasePrice: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div>
              <label className="field-label">Expiry Date</label>
              <input
                type="date" className="field-input"
                value={formData.expiryDate}
                onChange={e => setFormData(p => ({ ...p, expiryDate: e.target.value }))}
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
            <button type="button" className="btn-ghost" onClick={close}>Cancel</button>
            <button
              type="submit"
              className="btn-primary"
              disabled={saving}
              style={{ padding: '10px 22px' }}
            >
              {saving
                ? <><span style={{ display: 'inline-block', animation: 'leafSway 0.6s ease infinite' }}>🌸</span> Saving…</>
                : '🌸 Save Batch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─────────────── Main App ─────────────── */
const PETALS = ['🌸','🌺','🌼','🌻','🌹','💐','🌷','🏵️','🌸','🌼'];

function App() {
  /* ── All original state & logic — untouched ── */
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const { toasts, show: showToast } = useToast();

  const fetchBatches = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/inventory/batches', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) { handleLogout(); return; }
      if (!res.ok) throw new Error('Failed to fetch batches');
      setBatches(await res.json());
      setError(null);
    } catch (err) {
      setError(err.message || 'Could not connect to server.');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/inventory/products', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setProducts(await res.json());
    } catch (err) { console.error('fetchProducts:', err); }
  };

  useEffect(() => {
    if (token) { fetchBatches(); fetchProducts(); }
  }, [token]);

  const handleLoginSuccess = (newToken, username, role) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('role', role);
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    setToken(null);
  };

  /* ── Waste handler — passes down to row ── */
  const handleWasteBatch = async (batchId) => {
    try {
      const res = await fetch(`http://localhost:8080/api/inventory/batches/${batchId}/waste`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to waste batch');
      await fetchBatches();
      showToast('Batch marked as wasted', '🗑');
    } catch (err) { alert(err.message); }
  };

  /* ── Success callback from modal ── */
  const handleBatchSaved = async (saved) => {
    await fetchBatches();
    showToast(`New batch of ${saved.product || 'flowers'} received!`, '🌸');
  };

  if (!token) return <Login onLoginSuccess={handleLoginSuccess} />;

  /* ── Derived data ── */
  const filtered = batches.filter(b =>
    b.product.toLowerCase().includes(search.toLowerCase()) ||
    b.sku.toLowerCase().includes(search.toLowerCase())
  );
  const totalStock = batches.reduce((sum, b) => sum + b.quantity, 0);
  const discountedCount = batches.filter(b => b.isDiscounted).length;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(155deg, var(--c1) 0%, var(--c2) 55%, var(--c4) 100%)',
      position: 'relative',
    }}>
      {/* Floating petals */}
      <div className="petal-bg">
        {PETALS.map((p, i) => <span key={i} className="petal">{p}</span>)}
      </div>

      {/* Ambient corner blooms */}
      <span className="bloom-corner tr">🌺</span>
      <span className="bloom-corner bl">🌸</span>

      {/* Toast stack */}
      <ToastContainer toasts={toasts} />

      {/* ── Header ── */}
      <header className="header-glass" style={{ position: 'sticky', top: 0, zIndex: 30 }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 28px', height: 62, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 11,
              background: 'linear-gradient(135deg, var(--c2), var(--c4))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 19,
              boxShadow: '0 2px 8px rgba(255,97,97,0.18)',
            }}>🌸</div>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 19, color: 'var(--text)', letterSpacing: '-0.2px' }}>
              BloomBoard
            </span>
            <span style={{ fontSize: 9.5, fontWeight: 700, background: 'var(--c5)', color: '#fff', borderRadius: 5, padding: '2px 6px', letterSpacing: '0.6px', marginLeft: 2 }}>
              BETA
            </span>
          </div>

          {/* Right controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Search */}
            <div className="search-wrap">
              <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)', pointerEvents: 'none' }} />
              <input
                type="text"
                placeholder="Search flowers…"
                className="search-input"
                value={search}
                onChange={e => setSearch(e.target.value)}
                id="search-input"
              />
            </div>

            {/* Primary CTA */}
            <button
              id="btn-receive-batch"
              className="btn-primary"
              onClick={() => setIsModalOpen(true)}
            >
              <span style={{ fontSize: 15 }}>＋</span>
              Receive Batch
            </button>

            {/* Logout */}
            <button className="btn-icon" onClick={handleLogout} title="Sign out" id="btn-logout">
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '36px 28px 60px', position: 'relative', zIndex: 1 }}>

        {/* Page heading */}
        <div className="anim-fade-up" style={{ marginBottom: 30 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.4px', marginBottom: 5 }}>
            🌺 Inventory Dashboard
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
            Track your perishable flowers, manage batches, and monitor freshness in real time.
          </p>
        </div>

        {/* ── Stat Cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>

          <div className="stat-card" style={{ animationDelay: '0.04s' }}>
            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, rgba(154,178,224,0.25), rgba(195,212,245,0.4))' }}>
              <Leaf size={22} color="var(--c3)" />
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active Batches</p>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 34, fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>
                {loading ? <span className="skeleton" style={{ display: 'inline-block', width: 40, height: 32, borderRadius: 6 }} /> : batches.length}
              </p>
            </div>
          </div>

          <div className="stat-card" style={{ animationDelay: '0.09s' }}>
            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, rgba(255,180,180,0.3), rgba(255,208,208,0.4))' }}>
              <Sprout size={22} color="var(--sage)" />
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Flowers</p>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 34, fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>
                {loading ? <span className="skeleton" style={{ display: 'inline-block', width: 70, height: 32, borderRadius: 6 }} /> : totalStock.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="stat-card" style={{ animationDelay: '0.14s' }}>
            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, rgba(255,243,214,0.8), rgba(255,217,125,0.5))' }}>
              <TrendingDown size={22} color="var(--amber)" />
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Expiring Soon</p>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 34, fontWeight: 700, lineHeight: 1, color: discountedCount > 0 ? 'var(--amber)' : 'var(--text)' }}>
                {loading ? <span className="skeleton" style={{ display: 'inline-block', width: 30, height: 32, borderRadius: 6 }} /> : discountedCount}
              </p>
            </div>
          </div>
        </div>

        {/* ── Error Banner ── */}
        {error && (
          <div className="anim-fade-up" style={{
            marginBottom: 20,
            background: 'var(--crimson-bg)',
            border: '1px solid rgba(184,50,50,0.18)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: 'var(--crimson)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
            <button onClick={fetchBatches} style={{ fontSize: 12, fontWeight: 600, textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>
              Retry
            </button>
          </div>
        )}

        {/* ── Inventory Table card ── */}
        <div className="card anim-fade-up" style={{ overflow: 'hidden', animationDelay: '0.18s' }}>

          {/* Toolbar */}
          <div style={{
            padding: '16px 24px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'linear-gradient(to right, var(--c1), var(--c4))',
          }}>
            <div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 16, color: 'var(--text)' }}>Current Batches</h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                {loading ? 'Loading…' : `${filtered.length} of ${batches.length} batches`}
              </p>
            </div>
            <select style={{
              background: 'var(--surface)',
              border: '1.5px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              fontSize: 12,
              padding: '7px 12px',
              color: 'var(--text)',
              outline: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--font-body)',
            }}>
              <option>Sort: Expiry (Earliest)</option>
              <option>Sort: Quantity</option>
            </select>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--c1)', borderBottom: '1px solid var(--border)' }}>
                  {['Batch ID', 'Flower', 'SKU', 'Qty', 'Expiry', 'Status', ''].map(h => (
                    <th key={h} style={{
                      padding: '11px 20px',
                      textAlign: 'left',
                      fontWeight: 600,
                      fontSize: 10.5,
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      whiteSpace: 'nowrap',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <SkeletonRows />
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '60px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 40 }}>🪴</span>
                        <p style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: 'var(--text-muted)' }}>
                          {search ? 'No flowers match your search.' : 'No batches yet — receive your first one!'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((batch, idx) => (
                    <BatchRow
                      key={batch.id}
                      batch={batch}
                      idx={idx}
                      onWaste={handleWasteBatch}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* ── Modal ── */}
      {isModalOpen && (
        <BatchModal
          products={products}
          token={token}
          onClose={() => setIsModalOpen(false)}
          onSaved={handleBatchSaved}
        />
      )}
    </div>
  );
}

export default App;
