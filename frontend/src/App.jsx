import React, { useState, useEffect } from 'react';
import { CalendarDays, Package, Search, AlertCircle, ShoppingCart, LogOut, Leaf } from 'lucide-react';
import Login from './Login';

const PETALS = ['🌸', '🌺', '🌼', '🌻', '🌹', '💐', '🌷', '🏵️', '🌸', '🌼'];

const FLOWER_EMOJI = {
  'Marigold': '🌼', 'Rose': '🌹', 'Jasmine': '🤍', 'Tuberose': '🌿',
  'Lotus': '🪷', 'Chrysanthemum': '🌸', 'Gerbera': '🌺', 'Carnation': '💮',
  'Gladiolus': '🌷', 'Orchid': '🌸', 'Anthurium': '🌺', 'Hibiscus': '🌺',
  'Bird': '🦜', 'Lily': '🌷', 'Sunflower': '🌻',
};

function getFlowerEmoji(name) {
  for (const [key, emoji] of Object.entries(FLOWER_EMOJI)) {
    if (name.includes(key)) return emoji;
  }
  return '🌸';
}

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    productId: '', supplierName: '', quantity: '', purchasePrice: '', expiryDate: ''
  });

  const fetchBatches = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/inventory/batches', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.status === 401) { handleLogout(); return; }
      if (!response.ok) throw new Error('Failed to fetch batches');
      setBatches(await response.json());
      setError(null);
    } catch (err) {
      setError(err.message || 'Could not connect to server.');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/inventory/products', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
        if (data.length > 0) setFormData(prev => ({ ...prev, productId: data[0].id }));
      }
    } catch (err) { console.error('Failed to fetch products', err); }
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

  if (!token) return <Login onLoginSuccess={handleLoginSuccess} />;

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({ productId: products.length > 0 ? products[0].id : '', supplierName: '', quantity: '', purchasePrice: '', expiryDate: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:8080/api/inventory/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          productId: formData.productId,
          supplierName: formData.supplierName,
          quantity: parseInt(formData.quantity, 10),
          purchasePrice: parseFloat(formData.purchasePrice),
          expiryDate: `${formData.expiryDate}T00:00:00`
        })
      });
      if (!response.ok) throw new Error('Failed to create batch');
      await fetchBatches();
      handleCloseModal();
    } catch (err) { alert(err.message); }
  };

  const handleWasteBatch = async (batchId) => {
    if (!window.confirm('Mark this batch as wasted? This cannot be undone.')) return;
    try {
      const response = await fetch(`http://localhost:8080/api/inventory/batches/${batchId}/waste`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to waste batch');
      await fetchBatches();
    } catch (err) { alert(err.message); }
  };

  const filtered = batches.filter(b =>
    b.product.toLowerCase().includes(search.toLowerCase()) ||
    b.sku.toLowerCase().includes(search.toLowerCase())
  );
  const totalStock = batches.reduce((sum, b) => sum + b.quantity, 0);
  const discountedCount = batches.filter(b => b.isDiscounted).length;
  const urgentCount = batches.filter(b => b.quantity < 100).length;

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(160deg, var(--color-1) 0%, var(--color-2) 45%, var(--color-4) 100%)',
        position: 'relative',
      }}
    >
      {/* Floating petals background */}
      <div className="petal-bg">
        {PETALS.map((p, i) => <span key={i} className="petal">{p}</span>)}
      </div>

      {/* Corner bloom decorations */}
      <span className="bloom-decor top-right">🌺</span>
      <span className="bloom-decor bot-left">🌸</span>

      {/* ── Header ── */}
      <header
        className="header-glass sticky top-0 z-30"
        style={{ position: 'sticky', top: 0, zIndex: 30 }}
      >
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              background: 'linear-gradient(135deg, var(--color-2), var(--color-4))',
              borderRadius: 12,
              width: 38,
              height: 38,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              boxShadow: '0 2px 8px rgba(255,97,97,0.2)'
            }}>🌸</div>
            <span style={{ fontWeight: 800, fontSize: 18, color: 'var(--color-text)', letterSpacing: '-0.3px' }}>BloomBoard</span>
            <span style={{
              fontSize: 10,
              fontWeight: 700,
              background: 'var(--color-5)',
              color: 'white',
              borderRadius: 6,
              padding: '2px 7px',
              letterSpacing: '0.5px',
              marginLeft: 4
            }}>BETA</span>
          </div>

          {/* Right side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Search */}
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
              <input
                type="text"
                placeholder="Search flowers..."
                className="search-input"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {/* Receive New Batch */}
            <button
              id="btn-receive-batch"
              onClick={() => setIsModalOpen(true)}
              className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}
            >
              <span style={{ fontSize: 16 }}>＋</span> Receive Batch
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              title="Logout"
              style={{
                padding: '8px',
                borderRadius: 10,
                background: 'var(--color-2)',
                border: '1px solid var(--color-border)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--color-4)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--color-2)'}
            >
              <LogOut size={16} style={{ color: 'var(--color-text-muted)' }} />
            </button>
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px', position: 'relative', zIndex: 1 }}>

        {/* Page title */}
        <div className="fade-slide-up" style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.5px', marginBottom: 4 }}>
            🌺 Inventory Dashboard
          </h2>
          <p style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>
            Track your perishable flowers, manage batches, and monitor freshness in real time.
          </p>
        </div>

        {/* ── Stat Cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
          {/* Total Batches */}
          <div className="card fade-slide-up" style={{ padding: 22, display: 'flex', alignItems: 'center', gap: 16, animationDelay: '0.05s' }}>
            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, var(--color-3) 0%, #c3d4f5 100%)', fontSize: 22 }}>📦</div>
            <div>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 4, letterSpacing: '0.3px', textTransform: 'uppercase' }}>Active Batches</p>
              <p style={{ fontSize: 32, fontWeight: 800, color: 'var(--color-text)', lineHeight: 1 }}>{batches.length}</p>
            </div>
          </div>

          {/* Total Flowers */}
          <div className="card fade-slide-up" style={{ padding: 22, display: 'flex', alignItems: 'center', gap: 16, animationDelay: '0.1s' }}>
            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, var(--color-2) 0%, #ffd0d0 100%)', fontSize: 22 }}>🌸</div>
            <div>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 4, letterSpacing: '0.3px', textTransform: 'uppercase' }}>Total Flowers</p>
              <p style={{ fontSize: 32, fontWeight: 800, color: 'var(--color-text)', lineHeight: 1 }}>{totalStock.toLocaleString()}</p>
            </div>
          </div>

          {/* Expiring Soon */}
          <div className="card fade-slide-up" style={{ padding: 22, display: 'flex', alignItems: 'center', gap: 16, animationDelay: '0.15s' }}>
            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #FFF3CD 0%, #FFD97D 100%)', fontSize: 22 }}>⚡</div>
            <div>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 4, letterSpacing: '0.3px', textTransform: 'uppercase' }}>Expiring Soon</p>
              <p style={{ fontSize: 32, fontWeight: 800, color: discountedCount > 0 ? '#9A6A00' : 'var(--color-text)', lineHeight: 1 }}>{discountedCount}</p>
            </div>
          </div>
        </div>

        {/* ── Error Banner ── */}
        {error && (
          <div style={{
            marginBottom: 20,
            background: 'var(--color-2)',
            border: '1px solid #F4B8B8',
            borderRadius: 14,
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: '#c0392b'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle size={16} />
              <span style={{ fontSize: 14 }}>{error}</span>
            </div>
            <button onClick={fetchBatches} style={{ fontSize: 13, fontWeight: 600, textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>Retry</button>
          </div>
        )}

        {/* ── Inventory Table ── */}
        <div className="card page-enter" style={{ overflow: 'hidden' }}>
          {/* Table header */}
          <div style={{
            padding: '18px 24px',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'linear-gradient(to right, var(--color-1), var(--color-4))'
          }}>
            <div>
              <h3 style={{ fontWeight: 700, fontSize: 15, color: 'var(--color-text)' }}>Current Batches</h3>
              <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
                {filtered.length} of {batches.length} batches shown
              </p>
            </div>
            <select style={{
              background: 'var(--color-white)',
              border: '1.5px solid var(--color-border)',
              borderRadius: 10,
              fontSize: 12,
              padding: '6px 12px',
              color: 'var(--color-text)',
              outline: 'none',
              cursor: 'pointer'
            }}>
              <option>Sort by: Expiry (Earliest)</option>
              <option>Sort by: Quantity</option>
            </select>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--color-1)', borderBottom: '1px solid var(--color-border)' }}>
                  {['Batch ID', 'Flower', 'SKU', 'Qty', 'Expiry', 'Status', ''].map(h => (
                    <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontWeight: 600, fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" style={{ padding: '48px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 14 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 32, animation: 'sway 2s ease infinite' }}>🌸</span>
                        <span>Loading your garden...</span>
                      </div>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ padding: '48px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 14 }}>
                      <span style={{ fontSize: 28 }}>🪴</span>
                      <p style={{ marginTop: 8 }}>No batches found.</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((batch, idx) => (
                    <tr
                      key={batch.id}
                      className="table-row"
                      style={{
                        borderBottom: '1px solid var(--color-border)',
                        animation: `fadeSlideUp 0.3s ease ${idx * 0.04}s both`
                      }}
                    >
                      {/* Batch ID */}
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--color-3)', background: 'rgba(154,178,224,0.15)', padding: '3px 8px', borderRadius: 6 }}>
                          #{batch.id.substring(0, 8)}…
                        </span>
                      </td>

                      {/* Flower */}
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 20 }}>{getFlowerEmoji(batch.product)}</span>
                          <div>
                            <p style={{ fontWeight: 600, color: 'var(--color-text)', marginBottom: 2 }}>{batch.product}</p>
                            {batch.isDiscounted && (
                              <span className="badge-discount">⚡ Expiring Soon · 50% Off</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* SKU */}
                      <td style={{ padding: '14px 20px', color: 'var(--color-text-muted)' }}>{batch.sku}</td>

                      {/* Qty */}
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{
                          fontWeight: 700,
                          fontSize: 15,
                          color: batch.quantity < 100 ? '#c0392b' : 'var(--color-text)'
                        }}>
                          {batch.quantity.toLocaleString()}
                        </span>
                        {batch.quantity < 100 && <span style={{ fontSize: 10, color: '#c0392b', marginLeft: 6 }}>Low</span>}
                      </td>

                      {/* Expiry */}
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <CalendarDays size={13} style={{ color: batch.isDiscounted ? '#9A6A00' : 'var(--color-3)' }} />
                          <span style={{
                            color: batch.isDiscounted ? '#9A6A00' : 'var(--color-text-muted)',
                            fontWeight: batch.isDiscounted ? 600 : 400
                          }}>{batch.expiryDate}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '14px 20px' }}>
                        <span className={
                          batch.status === 'ACTIVE' ? 'badge-active' :
                          batch.status === 'DISCARDED' ? 'badge-discarded' : 'badge-active'
                        }>
                          {batch.status === 'ACTIVE' ? '● Active' : batch.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                        {batch.status === 'ACTIVE' && (
                          <button
                            onClick={() => handleWasteBatch(batch.id)}
                            style={{
                              background: 'none',
                              border: '1.5px solid var(--color-border)',
                              borderRadius: 8,
                              padding: '5px 12px',
                              fontSize: 12,
                              color: 'var(--color-text-muted)',
                              cursor: 'pointer',
                              fontWeight: 500,
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.background = 'var(--color-2)';
                              e.currentTarget.style.borderColor = '#F4B8B8';
                              e.currentTarget.style.color = '#c0392b';
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.background = 'none';
                              e.currentTarget.style.borderColor = 'var(--color-border)';
                              e.currentTarget.style.color = 'var(--color-text-muted)';
                            }}
                          >
                            🗑 Mark Waste
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* ── Modal ── */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(61, 35, 20, 0.4)',
            backdropFilter: 'blur(8px)',
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16
          }}
        >
          <div
            className="page-enter"
            style={{
              background: 'var(--color-white)',
              borderRadius: 24,
              width: '100%',
              maxWidth: 440,
              boxShadow: '0 24px 64px rgba(255,97,97,0.18)',
              overflow: 'hidden',
              border: '1.5px solid var(--color-border)'
            }}
          >
            {/* Modal header */}
            <div style={{
              background: 'linear-gradient(to right, var(--color-1), var(--color-2))',
              padding: '20px 24px',
              borderBottom: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 22 }}>🌺</span>
                <h3 style={{ fontWeight: 700, fontSize: 16, color: 'var(--color-text)' }}>Receive New Batch</h3>
              </div>
              <button
                onClick={handleCloseModal}
                style={{
                  background: 'var(--color-4)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 8,
                  width: 28,
                  height: 28,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: 16,
                  color: 'var(--color-text-muted)'
                }}
              >×</button>
            </div>

            {/* Modal form */}
            <form onSubmit={handleSubmit} style={{ padding: 24 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label className="field-label">Flower Product</label>
                  <select
                    name="productId"
                    value={formData.productId}
                    onChange={e => setFormData(p => ({ ...p, productId: e.target.value }))}
                    className="field-input"
                    required
                  >
                    {products.length === 0 && <option value="">Loading products...</option>}
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{getFlowerEmoji(p.name)} {p.name} ({p.sku})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="field-label">Supplier Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Dutch Farms Ltd"
                    className="field-input"
                    value={formData.supplierName}
                    onChange={e => setFormData(p => ({ ...p, supplierName: e.target.value }))}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="field-label">Quantity</label>
                    <input type="number" min="1" placeholder="0" className="field-input" value={formData.quantity}
                      onChange={e => setFormData(p => ({ ...p, quantity: e.target.value }))} required />
                  </div>
                  <div>
                    <label className="field-label">Unit Price (₹)</label>
                    <input type="number" step="0.01" min="0.01" placeholder="0.00" className="field-input"
                      value={formData.purchasePrice}
                      onChange={e => setFormData(p => ({ ...p, purchasePrice: e.target.value }))} required />
                  </div>
                </div>

                <div>
                  <label className="field-label">Expiry Date</label>
                  <input type="date" className="field-input" value={formData.expiryDate}
                    onChange={e => setFormData(p => ({ ...p, expiryDate: e.target.value }))} required />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  style={{
                    padding: '10px 18px',
                    borderRadius: 10,
                    border: '1.5px solid var(--color-border)',
                    background: 'none',
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer',
                    color: 'var(--color-text-muted)'
                  }}
                >Cancel</button>
                <button type="submit" className="btn-primary" style={{ padding: '10px 22px' }}>
                  🌸 Save Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
