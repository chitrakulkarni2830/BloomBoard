import React, { useState, useEffect } from 'react';
import { CalendarDays, Search, LogOut, Package, AlertCircle, Plus, Trash2, CheckCircle2, Truck, Box, Key, ArrowRight, ShieldCheck, Clock } from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory' | 'orders'
  const [batches, setBatches] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [saving, setSaving] = useState(false);

  // OTP Verification modal state
  const [otpModalOrder, setOtpModalOrder] = useState(null);
  const [inputOtp, setInputOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);

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

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await fetch('http://localhost:8080/api/v1/orders/all', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (err) {
      console.error('fetchOrders error:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    fetchBatches();
    fetchProducts();
    fetchOrders();
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

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch(`http://localhost:8080/api/v1/orders/${orderId}/status?status=${newStatus}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to update order status');
      await fetchOrders();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleTriggerDoorstepOtp = async (orderId) => {
    try {
      const res = await fetch(`http://localhost:8080/api/v1/orders/${orderId}/trigger-otp`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to trigger doorstep OTP');
      await fetchOrders();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleVerifyOtpSubmit = async (e) => {
    e.preventDefault();
    if (!otpModalOrder || !inputOtp.trim()) return;

    setVerifyingOtp(true);
    setOtpError('');

    try {
      const res = await fetch(`http://localhost:8080/api/v1/orders/${otpModalOrder.orderId}/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ otp: inputOtp })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Invalid Delivery OTP');
      }

      setOtpModalOrder(null);
      setInputOtp('');
      await fetchOrders();
      alert('🎉 Delivery OTP Verified! Order status updated to DELIVERED.');
    } catch (err) {
      setOtpError(err.message || 'Verification failed');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleCreateBatch = async (e) => {
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
          productId: formData.productId,
          supplierName: formData.supplierName,
          quantity: parseInt(formData.quantity, 10),
          purchasePrice: parseFloat(formData.purchasePrice),
          expiryDate: `${formData.expiryDate}T00:00:00`,
        }),
      });

      if (!res.ok) throw new Error('Failed to create batch');

      setIsModalOpen(false);
      setFormData({
        productId: products[0]?.id || '',
        supplierName: '',
        quantity: '',
        purchasePrice: '',
        expiryDate: '',
      });
      await fetchBatches();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const filteredBatches = batches.filter(b =>
    b.product.toLowerCase().includes(search.toLowerCase()) ||
    b.sku.toLowerCase().includes(search.toLowerCase()) ||
    (b.supplierName && b.supplierName.toLowerCase().includes(search.toLowerCase()))
  );

  const totalStems = batches.reduce((sum, b) => sum + b.quantity, 0);
  const expiringSoonCount = batches.filter(b => b.isDiscounted).length;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--c1)', display: 'flex', flexDirection: 'column' }}>
      
      {/* Back-Office Header */}
      <header className="header-glass" style={{ position: 'sticky', top: 0, zIndex: 30 }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 28px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'var(--c5)', color: '#FFFFFF',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: 18
            }}>🌸</div>
            <div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, margin: 0, color: 'var(--text)' }}>
                BloomBoard Back-Office
              </h1>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Florist Admin: {username}</span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div style={{ display: 'flex', gap: 6, background: 'var(--surface)', padding: 4, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            <button
              onClick={() => setActiveTab('inventory')}
              style={{
                padding: '7px 16px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: activeTab === 'inventory' ? 'var(--c5)' : 'transparent',
                color: activeTab === 'inventory' ? '#FFFFFF' : 'var(--text-muted)',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer'
              }}
            >
              Inventory Management
            </button>
            <button
              id="btn-tab-orders"
              onClick={() => { fetchOrders(); setActiveTab('orders'); }}
              style={{
                padding: '7px 16px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: activeTab === 'orders' ? 'var(--c5)' : 'transparent',
                color: activeTab === 'orders' ? '#FFFFFF' : 'var(--text-muted)',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <Package size={15} />
              <span>Live Customer Orders</span>
              {orders.filter(o => o.status !== 'DELIVERED').length > 0 && (
                <span style={{
                  background: activeTab === 'orders' ? '#FFFFFF' : 'var(--c5)',
                  color: activeTab === 'orders' ? 'var(--c5)' : '#FFFFFF',
                  fontSize: 10,
                  fontWeight: 800,
                  borderRadius: 999,
                  padding: '1px 6px'
                }}>
                  {orders.filter(o => o.status !== 'DELIVERED').length}
                </span>
              )}
            </button>
          </div>

          <button className="btn-icon" onClick={onLogout} title="Sign Out">
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Main Back-Office Container */}
      <main style={{ maxWidth: 1280, margin: '0 auto', width: '100%', padding: '32px 28px', flex: 1 }}>

        {/* ── TAB 1: INVENTORY MANAGEMENT ── */}
        {activeTab === 'inventory' && (
          <>
            {/* Stat Cards Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
              <div className="card" style={{ padding: 20, borderRadius: 'var(--radius-lg)' }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active Batches</span>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800, color: 'var(--text)', margin: '4px 0 0' }}>
                  {batches.length}
                </p>
              </div>

              <div className="card" style={{ padding: 20, borderRadius: 'var(--radius-lg)' }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Fresh Stems</span>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800, color: 'var(--c3)', margin: '4px 0 0' }}>
                  {totalStems.toLocaleString()}
                </p>
              </div>

              <div className="card" style={{ padding: 20, borderRadius: 'var(--radius-lg)', background: expiringSoonCount > 0 ? 'var(--c2)' : 'var(--surface)' }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Near-Expiry (50% OFF)</span>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800, color: 'var(--c5)', margin: '4px 0 0' }}>
                  {expiringSoonCount}
                </p>
              </div>
            </div>

            {/* Inventory Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div className="search-wrap" style={{ width: 320 }}>
                <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)' }} />
                <input
                  type="text"
                  placeholder="Filter inventory by flower or SKU…"
                  className="search-input"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>

              <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
                <Plus size={16} /> Receive New Batch
              </button>
            </div>

            {/* Batches Table */}
            <div className="card" style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', padding: 0 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: 'var(--c2)', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.5px' }}>
                    <th style={{ padding: '14px 20px' }}>Flower Variety</th>
                    <th style={{ padding: '14px 16px' }}>SKU</th>
                    <th style={{ padding: '14px 16px' }}>Available Qty</th>
                    <th style={{ padding: '14px 16px' }}>Expiry Date</th>
                    <th style={{ padding: '14px 16px' }}>Status / Tag</th>
                    <th style={{ padding: '14px 20px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBatches.map(b => (
                    <tr key={b.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '14px 20px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 20 }}>{flowerEmoji(b.product)}</span>
                        <span>{b.product}</span>
                      </td>
                      <td style={{ padding: '14px 16px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{b.sku}</td>
                      <td style={{ padding: '14px 16px', fontWeight: 700 }}>{b.quantity} stems</td>
                      <td style={{ padding: '14px 16px', color: 'var(--text-muted)' }}>{b.expiryDate}</td>
                      <td style={{ padding: '14px 16px' }}>
                        {b.isDiscounted ? (
                          <span className="badge-discount">⚡ 50% OFF Tag</span>
                        ) : (
                          <span className="badge badge-active">Active Stock</span>
                        )}
                      </td>
                      <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                        <button
                          onClick={() => handleWasteBatch(b.id)}
                          className="btn-ghost"
                          style={{ color: 'var(--crimson)', padding: '6px 12px', fontSize: 12 }}
                        >
                          <Trash2 size={13} style={{ display: 'inline', marginRight: 4 }} /> Record Waste
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ── TAB 2: LIVE CUSTOMER ORDERS MANAGEMENT ── */}
        {activeTab === 'orders' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, margin: 0 }}>
                  Incoming Customer Orders
                </h2>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                  Accept orders, update packing/shipping statuses, and verify delivery OTPs.
                </p>
              </div>

              <button className="btn-ghost" onClick={fetchOrders}>
                🔄 Refresh Orders
              </button>
            </div>

            {loadingOrders ? (
              <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
                <span>⏳ Loading live orders…</span>
              </div>
            ) : orders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)', background: 'var(--surface)', borderRadius: 'var(--radius-lg)' }}>
                <Package size={42} style={{ margin: '0 auto 12px', color: 'var(--text-faint)' }} />
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 18 }}>No orders placed yet.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 20 }}>
                {orders.map(ord => (
                  <div
                    key={ord.orderId}
                    className="card"
                    style={{
                      padding: 22,
                      borderRadius: 'var(--radius-lg)',
                      border: ord.status === 'DELIVERED' ? '1.5px solid var(--sage)' : '1.5px solid var(--border)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      {/* Top Header Row */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                        <div>
                          <span style={{ fontSize: 11, color: 'var(--text-faint)', textTransform: 'uppercase' }}>BloomBoard Order ID</span>
                          <h4 style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 14, color: 'var(--c3)', margin: 0 }}>
                            #{ord.orderId.substring(0, 14)}…
                          </h4>
                        </div>
                        <span className={
                          ord.status === 'DELIVERED' ? 'badge badge-active' :
                          ord.status === 'SHIPPED' ? 'badge' : 'badge-discount'
                        }>
                          {ord.status}
                        </span>
                      </div>

                      {/* Details */}
                      <div style={{ background: 'var(--c1)', padding: 12, borderRadius: 'var(--radius-md)', fontSize: 12, display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Customer:</span>
                          <strong style={{ color: 'var(--text)' }}>{ord.customerEmail}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Delivery Date:</span>
                          <strong>{ord.deliveryDate ? ord.deliveryDate.split('T')[0] : 'Today'}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--border)', paddingTop: 6 }}>
                          <span style={{ color: 'var(--text-muted)' }}>Total Amount:</span>
                          <strong style={{ fontFamily: 'var(--font-display)', fontSize: 15, color: 'var(--c5)' }}>
                            ₹{ord.totalAmount ? ord.totalAmount.toFixed(2) : '0.00'}
                          </strong>
                        </div>
                        {ord.deliveryOtp && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(154,178,224,0.2)', padding: '4px 8px', borderRadius: 4, marginTop: 4 }}>
                            <span style={{ fontWeight: 700, color: 'var(--c3)' }}>Delivery OTP:</span>
                            <strong style={{ fontFamily: 'monospace', fontSize: 14, letterSpacing: '1px', color: 'var(--text)' }}>
                              {ord.deliveryOtp}
                            </strong>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Order Action Buttons */}
                    <div style={{ paddingTop: 12, borderTop: '1px solid var(--border)', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      {ord.status === 'CONFIRMED' && (
                        <button
                          onClick={() => handleUpdateOrderStatus(ord.orderId, 'ACCEPTED')}
                          className="btn-primary"
                          style={{ padding: '8px 14px', fontSize: 12 }}
                        >
                          Accept Order 🌸
                        </button>
                      )}

                      {ord.status === 'ACCEPTED' && (
                        <button
                          onClick={() => handleUpdateOrderStatus(ord.orderId, 'PACKED')}
                          className="btn-primary"
                          style={{ padding: '8px 14px', fontSize: 12, background: 'linear-gradient(135deg, #0284C7, #0369A1)' }}
                        >
                          Mark Packed 📦
                        </button>
                      )}

                      {ord.status === 'PACKED' && (
                        <button
                          onClick={() => handleUpdateOrderStatus(ord.orderId, 'SHIPPED')}
                          className="btn-primary"
                          style={{ padding: '8px 14px', fontSize: 12, background: 'linear-gradient(135deg, #059669, #047857)' }}
                        >
                          Dispatch / Ship 🚚
                        </button>
                      )}

                      {ord.status === 'SHIPPED' && !ord.otpTriggered && (
                        <button
                          onClick={() => handleTriggerDoorstepOtp(ord.orderId)}
                          className="btn-primary"
                          style={{ padding: '8px 14px', fontSize: 12, background: 'linear-gradient(135deg, #0284C7, #0369A1)' }}
                        >
                          Arrived at Doorstep (Trigger OTP) 🛵
                        </button>
                      )}

                      {ord.status === 'SHIPPED' && ord.otpTriggered && (
                        <button
                          onClick={() => { setOtpModalOrder(ord); setInputOtp(''); setOtpError(''); }}
                          className="btn-primary"
                          style={{ padding: '8px 14px', fontSize: 12, background: 'linear-gradient(135deg, #7C3AED, #6D28D9)' }}
                        >
                          Enter Customer's OTP 🔑
                        </button>
                      )}

                      {ord.status === 'DELIVERED' && (
                        <span style={{ fontSize: 12, color: 'var(--sage)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <CheckCircle2 size={16} /> Delivered & Verified
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── RECEIVE NEW BATCH MODAL ── */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setIsModalOpen(false)}>
          <div className="modal-card">
            <div style={{ padding: 24, borderBottom: '1px solid var(--border)', background: 'linear-gradient(135deg, var(--c1), var(--c2))' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, margin: 0 }}>
                Receive New Flower Shipment
              </h3>
            </div>

            <form onSubmit={handleCreateBatch} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="field-label">Flower Variety</label>
                <select
                  className="field-input"
                  value={formData.productId}
                  onChange={e => setFormData(p => ({ ...p, productId: e.target.value }))}
                  required
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="field-label">Supplier / Farm Name</label>
                <input
                  type="text"
                  className="field-input"
                  placeholder="e.g. Bangalore Rose Gardens"
                  value={formData.supplierName}
                  onChange={e => setFormData(p => ({ ...p, supplierName: e.target.value }))}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="field-label">Stem Quantity</label>
                  <input
                    type="number"
                    className="field-input"
                    placeholder="250"
                    value={formData.quantity}
                    onChange={e => setFormData(p => ({ ...p, quantity: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="field-label">Purchase Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="field-input"
                    placeholder="1.20"
                    value={formData.purchasePrice}
                    onChange={e => setFormData(p => ({ ...p, purchasePrice: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="field-label">Expiration Date</label>
                <input
                  type="date"
                  className="field-input"
                  value={formData.expiryDate}
                  onChange={e => setFormData(p => ({ ...p, expiryDate: e.target.value }))}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 16 }}>
                <button type="button" className="btn-ghost" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Add Batch to Inventory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── VERIFY OTP MODAL FOR FLORIST ── */}
      {otpModalOrder && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setOtpModalOrder(null)}>
          <div className="modal-card" style={{ maxWidth: 420 }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', background: 'linear-gradient(135deg, #7C3AED, #6D28D9)', color: '#FFFFFF' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Key size={20} /> Verify Delivery OTP
              </h3>
              <span style={{ fontSize: 12, opacity: 0.85 }}>Order #{otpModalOrder.orderId.substring(0, 10)}…</span>
            </div>

            <form onSubmit={handleVerifyOtpSubmit} style={{ padding: 24 }}>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                Enter the 6-digit Delivery OTP code provided by customer <strong>{otpModalOrder.customerEmail}</strong>:
              </p>

              <div style={{ marginBottom: 16 }}>
                <input
                  type="text"
                  maxLength="6"
                  className="field-input"
                  placeholder="Enter 6-digit OTP (e.g. 849201)"
                  value={inputOtp}
                  onChange={e => setInputOtp(e.target.value)}
                  style={{ textAlign: 'center', fontSize: 22, letterSpacing: '4px', fontWeight: 800, fontFamily: 'monospace' }}
                  required
                  autoFocus
                />
              </div>

              {otpError && (
                <div style={{ background: 'var(--crimson-bg)', color: 'var(--crimson)', padding: 10, borderRadius: 8, fontSize: 12, marginBottom: 16 }}>
                  {otpError}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                <button type="button" className="btn-ghost" onClick={() => setOtpModalOrder(null)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={verifyingOtp} style={{ background: 'linear-gradient(135deg, #7C3AED, #6D28D9)' }}>
                  {verifyingOtp ? 'Verifying...' : 'Verify OTP & Deliver 🎉'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
