import React, { useState, useEffect } from 'react';
import { CalendarDays, Search, LogOut, Package, AlertCircle, Plus, Trash2 } from 'lucide-react';

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

export default function FloristApp({ token, username, onLogout }) {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    productId: '',
    supplierName: '',
    quantity: '',
    purchasePrice: '',
    expiryDate: '',
  });

  const fetchBatches = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/inventory/batches', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) { onLogout(); return; }
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
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
        if (data.length > 0 && !formData.productId) {
          setFormData(prev => ({ ...prev, productId: data[0].id }));
        }
      }
    } catch (err) {
      console.error('fetchProducts error:', err);
    }
  };

  useEffect(() => {
    fetchBatches();
    fetchProducts();
  }, [token]);

  const handleWasteBatch = async (batchId) => {
    if (!window.confirm('Mark this batch as wasted? This will update stock.')) return;
    try {
      const res = await fetch(`http://localhost:8080/api/inventory/batches/${batchId}/waste`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to waste batch');
      await fetchBatches();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleReceiveSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('http://localhost:8080/api/inventory/batches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: formData.productId || (products[0] && products[0].id),
          supplierName: formData.supplierName,
          quantity: parseInt(formData.quantity, 10),
          purchasePrice: parseFloat(formData.purchasePrice),
          expiryDate: `${formData.expiryDate}T00:00:00`,
        }),
      });
      if (!res.ok) throw new Error('Failed to receive batch');
      await fetchBatches();
      setIsModalOpen(false);
      setFormData({
        productId: products[0] ? products[0].id : '',
        supplierName: '',
        quantity: '',
        purchasePrice: '',
        expiryDate: '',
      });
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const filtered = batches.filter(b =>
    b.product.toLowerCase().includes(search.toLowerCase()) ||
    b.sku.toLowerCase().includes(search.toLowerCase())
  );
  const totalStock = batches.reduce((sum, b) => sum + b.quantity, 0);
  const expiringCount = batches.filter(b => b.isDiscounted).length;

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAF9', color: '#1E2923', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Florist Admin Header */}
      <header style={{
        background: '#FFFFFF',
        borderBottom: '1px solid #E2E8F0',
        padding: '0 24px',
        height: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 20
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            background: '#2E5B44',
            color: '#FFFFFF',
            fontWeight: 700,
            fontSize: 14,
            padding: '4px 10px',
            borderRadius: 6,
            letterSpacing: '0.5px'
          }}>
            BLOOMBOARD
          </div>
          <span style={{ fontSize: 13, color: '#64748B', fontWeight: 500 }}>Florist Management Portal</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 13, color: '#475569' }}>
            Logged in as <strong style={{ color: '#0F172A' }}>{username}</strong> (Florist Admin)
          </span>
          <button
            onClick={onLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: '#F1F5F9',
              border: '1px solid #CBD5E1',
              borderRadius: 6,
              padding: '6px 12px',
              fontSize: 13,
              cursor: 'pointer',
              color: '#334155'
            }}
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 24px 48px' }}>
        {/* Title Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', margin: 0, fontFamily: 'Inter, sans-serif' }}>
              Inventory Batches
            </h1>
            <p style={{ fontSize: 13, color: '#64748B', margin: '4px 0 0' }}>
              Monitor stock levels, received dates, and batch expirations.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            style={{
              background: '#2E5B44',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 6,
              padding: '10px 18px',
              fontSize: 13,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer'
            }}
          >
            <Plus size={16} /> Receive New Batch
          </button>
        </div>

        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, padding: 18 }}>
            <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active Batches</span>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#0F172A', marginTop: 4 }}>{batches.length}</div>
          </div>
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, padding: 18 }}>
            <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Stem Stock</span>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#2E5B44', marginTop: 4 }}>{totalStock.toLocaleString()}</div>
          </div>
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, padding: 18 }}>
            <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Near Expiry (&le; 48h)</span>
            <div style={{ fontSize: 28, fontWeight: 700, color: expiringCount > 0 ? '#D97706' : '#0F172A', marginTop: 4 }}>{expiringCount}</div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', padding: 12, borderRadius: 6, marginBottom: 20, fontSize: 13 }}>
            {error}
          </div>
        )}

        {/* Table Container */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, overflow: 'hidden' }}>
          {/* Table Toolbar */}
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FAFAFA' }}>
            <div style={{ position: 'relative', width: 280 }}>
              <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              <input
                type="text"
                placeholder="Filter by flower or SKU..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 12px 6px 34px',
                  fontSize: 13,
                  border: '1px solid #CBD5E1',
                  borderRadius: 6,
                  outline: 'none'
                }}
              />
            </div>
            <span style={{ fontSize: 12, color: '#64748B' }}>Showing {filtered.length} of {batches.length} active batches</span>
          </div>

          {/* Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#F1F5F9', borderBottom: '1px solid #E2E8F0', color: '#475569', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <th style={{ padding: '12px 18px' }}>Batch ID</th>
                <th style={{ padding: '12px 18px' }}>Flower Product</th>
                <th style={{ padding: '12px 18px' }}>SKU</th>
                <th style={{ padding: '12px 18px' }}>Available Qty</th>
                <th style={{ padding: '12px 18px' }}>Expiry Date</th>
                <th style={{ padding: '12px 18px' }}>Discount Status</th>
                <th style={{ padding: '12px 18px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ padding: 40, textAlign: 'center', color: '#64748B' }}>Loading inventory...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: 40, textAlign: 'center', color: '#64748B' }}>No batches found matching filter.</td>
                </tr>
              ) : (
                filtered.map(b => (
                  <tr key={b.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                    <td style={{ padding: '12px 18px', fontFamily: 'monospace', fontSize: 11, color: '#475569' }}>
                      #{b.id.substring(0, 8)}
                    </td>
                    <td style={{ padding: '12px 18px', fontWeight: 600, color: '#0F172A' }}>
                      <span style={{ marginRight: 6 }}>{flowerEmoji(b.product)}</span> {b.product}
                    </td>
                    <td style={{ padding: '12px 18px', color: '#64748B' }}>{b.sku}</td>
                    <td style={{ padding: '12px 18px', fontWeight: 700, color: b.quantity < 100 ? '#DC2626' : '#0F172A' }}>
                      {b.quantity.toLocaleString()} {b.quantity < 100 && <span style={{ fontSize: 10, background: '#FEE2E2', color: '#991B1B', padding: '1px 5px', borderRadius: 4, marginLeft: 4 }}>Low</span>}
                    </td>
                    <td style={{ padding: '12px 18px', color: b.isDiscounted ? '#D97706' : '#475569' }}>
                      {b.expiryDate}
                    </td>
                    <td style={{ padding: '12px 18px' }}>
                      {b.isDiscounted ? (
                        <span style={{ background: '#FEF3C7', color: '#92400E', fontSize: 11, padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>
                          50% Discount (Expiring &le; 48h)
                        </span>
                      ) : (
                        <span style={{ background: '#DCFCE7', color: '#166534', fontSize: 11, padding: '2px 8px', borderRadius: 4, fontWeight: 500 }}>
                          Standard Price
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 18px', textAlign: 'right' }}>
                      <button
                        onClick={() => handleWasteBatch(b.id)}
                        style={{
                          background: '#FFF1F1',
                          border: '1px solid #FECACA',
                          color: '#DC2626',
                          borderRadius: 4,
                          padding: '4px 10px',
                          fontSize: 12,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4
                        }}
                      >
                        <Trash2 size={13} /> Waste Batch
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* Modal for Receive Batch */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: '#FFFFFF', borderRadius: 8, width: 440, maxWidth: '90%', padding: 24, boxShadow: '0 10px 25px rgba(0,0,0,0.15)' }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 16px', color: '#0F172A' }}>Receive New Inventory Batch</h2>
            <form onSubmit={handleReceiveSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Flower Product</label>
                <select
                  value={formData.productId}
                  onChange={e => setFormData(p => ({ ...p, productId: e.target.value }))}
                  required
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13 }}
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{flowerEmoji(p.name)} {p.name} ({p.sku})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Supplier Name</label>
                <input
                  type="text"
                  placeholder="e.g. Dutch Farms Exports"
                  value={formData.supplierName}
                  onChange={e => setFormData(p => ({ ...p, supplierName: e.target.value }))}
                  required
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13 }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Quantity (Stems)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="100"
                    value={formData.quantity}
                    onChange={e => setFormData(p => ({ ...p, quantity: e.target.value }))}
                    required
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Unit Cost (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="1.50"
                    value={formData.purchasePrice}
                    onChange={e => setFormData(p => ({ ...p, purchasePrice: e.target.value }))}
                    required
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13 }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Expiry Date</label>
                <input
                  type="date"
                  value={formData.expiryDate}
                  onChange={e => setFormData(p => ({ ...p, expiryDate: e.target.value }))}
                  required
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13 }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: 6, padding: '8px 14px', fontSize: 13, cursor: 'pointer', color: '#475569' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{ background: '#2E5B44', color: '#FFFFFF', border: 'none', borderRadius: 6, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  {saving ? 'Saving...' : 'Save Batch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
