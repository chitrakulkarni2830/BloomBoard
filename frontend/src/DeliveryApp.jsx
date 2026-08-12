import React, { useState, useEffect } from 'react';
import { Truck, MapPin, Phone, CheckCircle2, LogOut, Key, Navigation, ShieldCheck, Clock, PackageCheck, AlertCircle } from 'lucide-react';

export default function DeliveryApp({ token, username, onLogout }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'completed'

  // OTP Verification Modal state
  const [otpModalOrder, setOtpModalOrder] = useState(null);
  const [inputOtp, setInputOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8080/api/v1/orders/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 401) { onLogout(); return; }
      if (!res.ok) throw new Error('Failed to fetch delivery orders');
      const data = await res.json();
      setOrders(data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Could not connect to delivery dispatch server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [token]);

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
        throw new Error(data.message || 'Invalid Delivery OTP code');
      }

      setOtpModalOrder(null);
      setInputOtp('');
      await fetchOrders();
    } catch (err) {
      setOtpError(err.message || 'Verification failed');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const activeDeliveries = orders.filter(o => o.status === 'SHIPPED' || o.status === 'PACKED');
  const completedDeliveries = orders.filter(o => o.status === 'DELIVERED');

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
      color: '#F8FAFC',
      fontFamily: 'var(--font-sans, system-ui, -apple-system, sans-serif)',
      paddingBottom: 40
    }}>
      {/* ── TOP AGENT HEADER ── */}
      <header style={{
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        padding: '16px 24px',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            background: 'linear-gradient(135deg, #0284C7, #0369A1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(2,132,199,0.4)',
            fontSize: 22
          }}>
            🛵
          </div>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
              BloomBoard Fleet
            </h1>
            <span style={{ fontSize: 11, color: '#38BDF8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              Agent: {username} <span style={{ background: '#22C55E', width: 6, height: 6, borderRadius: 999, display: 'inline-block' }} /> Online & On Duty
            </span>
          </div>
        </div>

        <button
          onClick={onLogout}
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.15)',
            color: '#F1F5F9',
            borderRadius: 10,
            padding: '8px 14px',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          <LogOut size={15} /> Logout
        </button>
      </header>

      <main style={{ maxWidth: 800, margin: '24px auto 0', padding: '0 20px' }}>
        {/* ── AGENT STAT CARDS ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
          <div style={{ background: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 16 }}>
            <span style={{ fontSize: 11, color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>Assigned Deliveries</span>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 900, color: '#38BDF8', margin: '4px 0 0' }}>
              {activeDeliveries.length}
            </p>
          </div>

          <div style={{ background: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 16 }}>
            <span style={{ fontSize: 11, color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>Completed Today</span>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 900, color: '#4ADE80', margin: '4px 0 0' }}>
              {completedDeliveries.length}
            </p>
          </div>

          <div style={{ background: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 16 }}>
            <span style={{ fontSize: 11, color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>Payout Earnings</span>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 900, color: '#FACC15', margin: '4px 0 0' }}>
              ₹{completedDeliveries.length * 50}
            </p>
          </div>
        </div>

        {/* ── TAB SELECTOR ── */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <button
            onClick={() => setActiveTab('active')}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: 12,
              border: activeTab === 'active' ? '2px solid #0284C7' : '1px solid rgba(255,255,255,0.1)',
              background: activeTab === 'active' ? '#0284C7' : 'rgba(30, 41, 59, 0.6)',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer'
            }}
          >
            📦 Active Tasks ({activeDeliveries.length})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: 12,
              border: activeTab === 'completed' ? '2px solid #22C55E' : '1px solid rgba(255,255,255,0.1)',
              background: activeTab === 'completed' ? '#15803D' : 'rgba(30, 41, 59, 0.6)',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer'
            }}
          >
            ✓ Completed History ({completedDeliveries.length})
          </button>
        </div>

        {/* ── ACTIVE DELIVERIES TAB ── */}
        {activeTab === 'active' && (
          <div>
            {loading ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#94A3B8' }}>Loading live delivery dispatch queue...</div>
            ) : activeDeliveries.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, background: 'rgba(30, 41, 59, 0.5)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)' }}>
                <PackageCheck size={48} style={{ color: '#64748B', margin: '0 auto 12px' }} />
                <h3 style={{ fontSize: 16, margin: '0 0 4px', color: '#F1F5F9' }}>No Pending Deliveries</h3>
                <p style={{ fontSize: 13, color: '#94A3B8', margin: 0 }}>You are all caught up! New assigned orders will show here.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {activeDeliveries.map(ord => (
                  <div
                    key={ord.orderId}
                    style={{
                      background: 'rgba(30, 41, 59, 0.9)',
                      border: ord.otpTriggered ? '2px solid #0284C7' : '1px solid rgba(255,255,255,0.12)',
                      borderRadius: 20,
                      padding: 20,
                      boxShadow: ord.otpTriggered ? '0 8px 24px rgba(2,132,199,0.25)' : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div>
                        <span style={{ fontSize: 11, color: '#94A3B8', textTransform: 'uppercase' }}>BloomBoard Order ID</span>
                        <h3 style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 800, color: '#38BDF8', margin: '2px 0 0' }}>
                          #{ord.orderId.substring(0, 16)}…
                        </h3>
                      </div>
                      <span style={{
                        background: ord.otpTriggered ? '#E0F2FE' : '#FEF3C7',
                        color: ord.otpTriggered ? '#0369A1' : '#92400E',
                        fontSize: 11,
                        fontWeight: 800,
                        padding: '4px 10px',
                        borderRadius: 12
                      }}>
                        {ord.otpTriggered ? '🛵 At Doorstep' : ord.status}
                      </span>
                    </div>

                    <div style={{ background: 'rgba(15, 23, 42, 0.6)', borderRadius: 12, padding: 14, marginBottom: 16, fontSize: 13 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ color: '#94A3B8' }}>Customer:</span>
                        <strong style={{ color: '#F8FAFC' }}>{ord.customerEmail}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ color: '#94A3B8' }}>Delivery Date:</span>
                        <span style={{ color: '#F8FAFC' }}>{ord.deliveryDate ? ord.deliveryDate.split('T')[0] : 'Today'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: 6 }}>
                        <span style={{ color: '#94A3B8' }}>Order Total:</span>
                        <strong style={{ color: '#38BDF8', fontSize: 15 }}>₹{ord.totalAmount ? ord.totalAmount.toFixed(2) : '0.00'}</strong>
                      </div>
                    </div>

                    {/* ACTION BUTTONS */}
                    <div style={{ display: 'flex', gap: 10 }}>
                      {!ord.otpTriggered ? (
                        <button
                          onClick={() => handleTriggerDoorstepOtp(ord.orderId)}
                          style={{
                            flex: 1,
                            background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: 12,
                            padding: '12px 16px',
                            fontWeight: 800,
                            fontSize: 13,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                            boxShadow: '0 4px 14px rgba(2,132,199,0.4)'
                          }}
                        >
                          <Navigation size={16} /> Arrived at Customer Doorstep (Trigger OTP) 🛵
                        </button>
                      ) : (
                        <button
                          onClick={() => { setOtpModalOrder(ord); setInputOtp(''); setOtpError(''); }}
                          style={{
                            flex: 1,
                            background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: 12,
                            padding: '12px 16px',
                            fontWeight: 800,
                            fontSize: 13,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                            boxShadow: '0 4px 14px rgba(124,58,237,0.4)'
                          }}
                        >
                          <Key size={16} /> Enter Customer's OTP & Complete Handover 🔑
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── COMPLETED HISTORY TAB ── */}
        {activeTab === 'completed' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {completedDeliveries.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#94A3B8' }}>No completed handovers yet today.</div>
            ) : (
              completedDeliveries.map(ord => (
                <div key={ord.orderId} style={{ background: 'rgba(30, 41, 59, 0.6)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'monospace' }}>#{ord.orderId.substring(0, 14)}…</span>
                    <p style={{ margin: '2px 0 0', fontWeight: 700, fontSize: 13, color: '#F1F5F9' }}>{ord.customerEmail}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ color: '#4ADE80', fontWeight: 800, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <CheckCircle2 size={14} /> Delivered & Verified
                    </span>
                    <span style={{ fontSize: 11, color: '#94A3B8' }}>OTP: {ord.deliveryOtp}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {/* ── DELIVERY EXECUTIVE OTP VERIFICATION MODAL ── */}
      {otpModalOrder && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: 20
        }}>
          <div style={{
            background: '#1E293B',
            border: '1.5px solid rgba(255,255,255,0.15)',
            borderRadius: 24,
            width: '100%',
            maxWidth: 420,
            overflow: 'hidden',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
          }}>
            <div style={{ padding: 24, background: 'linear-gradient(135deg, #7C3AED, #6D28D9)', color: '#FFFFFF' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Key size={24} />
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Enter Customer's OTP</h3>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: 12, opacity: 0.85 }}>
                Ask customer for 6-digit code for order #{otpModalOrder.orderId.substring(0, 10)}…
              </p>
            </div>

            <form onSubmit={handleVerifyOtpSubmit} style={{ padding: 24 }}>
              <p style={{ fontSize: 13, color: '#CBD5E1', marginBottom: 16 }}>
                The customer has received their 6-digit Delivery OTP on their phone. Enter it below to complete handover:
              </p>

              <input
                type="text"
                maxLength="6"
                autoFocus
                value={inputOtp}
                onChange={e => setInputOtp(e.target.value)}
                placeholder="Enter 6-digit OTP"
                style={{
                  width: '100%',
                  textAlign: 'center',
                  fontFamily: 'monospace',
                  fontSize: 26,
                  fontWeight: 900,
                  letterSpacing: '6px',
                  padding: '14px',
                  borderRadius: 12,
                  border: '2px solid #7C3AED',
                  background: '#0F172A',
                  color: '#FFFFFF',
                  boxSizing: 'border-box',
                  marginBottom: 16
                }}
              />

              {otpError && (
                <div style={{ color: '#EF4444', fontSize: 13, textAlign: 'center', marginBottom: 16, fontWeight: 700 }}>
                  ⚠️ {otpError}
                </div>
              )}

              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  type="button"
                  onClick={() => setOtpModalOrder(null)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: 10,
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'transparent',
                    color: '#94A3B8',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={verifyingOtp}
                  style={{
                    flex: 2,
                    padding: '12px',
                    borderRadius: 10,
                    border: 'none',
                    background: 'linear-gradient(135deg, #7C3AED, #6D28D9)',
                    color: '#FFFFFF',
                    fontWeight: 800,
                    cursor: 'pointer',
                    fontSize: 14
                  }}
                >
                  {verifyingOtp ? 'Verifying...' : 'Verify & Complete Delivery 🎉'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
