import React, { useState, useEffect, useCallback } from 'react';
import {
  ShoppingCart, Search, LogOut, CheckCircle2,
  Calendar, Sparkles, X, Plus, Minus, AlertCircle, Trash2, Heart
} from 'lucide-react';

const PETALS = ['🌸','🌺','🌼','🌻','🌹','💐','🌷','🏵️','🌸','🌼'];

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

export default function CustomerApp({ token, username, onLogout }) {
  const [batches, setBatches] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  
  // Cart state: map of product name -> { product, sku, quantity, price, isDiscounted, productId }
  const [cart, setCart] = useState({});
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCatalog = async () => {
    try {
      const [batchesRes, productsRes] = await Promise.all([
        fetch('http://localhost:8080/api/inventory/batches', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('http://localhost:8080/api/inventory/products', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (batchesRes.status === 401) { onLogout(); return; }
      if (!batchesRes.ok) throw new Error('Failed to load flower catalog');

      const batchesData = await batchesRes.json();
      setBatches(batchesData);

      if (productsRes.ok) {
        const productsData = await productsRes.json();
        setProducts(productsData);
      }
      setError(null);
    } catch (err) {
      setError(err.message || 'Could not connect to store catalog.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, [token]);

  // Aggregate batches into customer product cards
  const productCatalog = React.useMemo(() => {
    const map = {};
    
    // Group active batches by product name
    batches.forEach(b => {
      if (b.status !== 'ACTIVE' || b.quantity <= 0) return;
      
      if (!map[b.product]) {
        // Find product ID from products list
        const matchedProduct = products.find(p => p.name === b.product);
        const basePrice = matchedProduct ? 2.50 : 2.00; // Base estimated unit price

        map[b.product] = {
          product: b.product,
          sku: b.sku,
          productId: matchedProduct ? matchedProduct.id : b.id,
          totalQty: 0,
          isDiscounted: false,
          expiryDate: b.expiryDate,
          basePrice: basePrice,
        };
      }

      map[b.product].totalQty += b.quantity;
      if (b.isDiscounted) {
        map[b.product].isDiscounted = true;
      }
    });

    return Object.values(map);
  }, [batches, products]);

  const filteredCatalog = productCatalog.filter(item =>
    item.product.toLowerCase().includes(search.toLowerCase()) ||
    item.sku.toLowerCase().includes(search.toLowerCase())
  );

  const addToCart = (item, qtyToAdd = 1) => {
    setCart(prev => {
      const currentQty = prev[item.product] ? prev[item.product].quantity : 0;
      const newQty = Math.min(currentQty + qtyToAdd, item.totalQty);
      
      const effectivePrice = item.isDiscounted ? item.basePrice * 0.5 : item.basePrice;

      return {
        ...prev,
        [item.product]: {
          product: item.product,
          sku: item.sku,
          productId: item.productId,
          quantity: newQty,
          unitPrice: effectivePrice,
          isDiscounted: item.isDiscounted,
          maxStock: item.totalQty
        }
      };
    });
  };

  const updateCartQty = (productName, newQty) => {
    if (newQty <= 0) {
      removeFromCart(productName);
      return;
    }
    setCart(prev => {
      if (!prev[productName]) return prev;
      const max = prev[productName].maxStock;
      return {
        ...prev,
        [productName]: {
          ...prev[productName],
          quantity: Math.min(newQty, max)
        }
      };
    });
  };

  const removeFromCart = (productName) => {
    setCart(prev => {
      const copy = { ...prev };
      delete copy[productName];
      return copy;
    });
  };

  const cartItems = Object.values(cart);
  const cartTotalItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cartItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;
    setIsSubmitting(true);
    try {
      const itemsPayload = cartItems.map(item => ({
        bouquetId: '00000000-0000-0000-0000-000000000000',
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice
      }));

      const payload = {
        cartId: '11111111-1111-1111-1111-111111111111',
        customerEmail: `${username}@bloomboard.shop`,
        items: itemsPayload,
        deliveryDate: new Date(Date.now() + 86400000).toISOString()
      };

      const res = await fetch('http://localhost:8080/api/v1/orders/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Checkout failed. Please try again.');
      const data = await res.json();

      setCheckoutSuccess(data);
      setCart({});
      setIsCartOpen(false);
      fetchCatalog(); // refetch live inventory to see updated stock after FEFO allocation
    } catch (err) {
      alert(err.message || 'Checkout failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(155deg, var(--c1) 0%, var(--c2) 55%, var(--c4) 100%)',
      position: 'relative',
    }}>
      {/* Floating petals animation */}
      <div className="petal-bg">
        {PETALS.map((p, i) => <span key={i} className="petal">{p}</span>)}
      </div>

      {/* Ambient corner blooms */}
      <span className="bloom-corner tr">🌺</span>
      <span className="bloom-corner bl">🌸</span>

      {/* Customer Header */}
      <header className="header-glass" style={{ position: 'sticky', top: 0, zIndex: 30 }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 28px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 12,
              background: 'linear-gradient(135deg, var(--c2), var(--c4))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22,
              boxShadow: '0 2px 10px rgba(255,97,97,0.2)',
            }}>🌸</div>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text)', letterSpacing: '-0.3px' }}>
              BloomBoard Florist
            </span>
            <span className="badge badge-active" style={{ marginLeft: 4 }}>Boutique Shop</span>
          </div>

          {/* Search & Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div className="search-wrap">
              <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)', pointerEvents: 'none' }} />
              <input
                type="text"
                placeholder="Search fresh blooms…"
                className="search-input"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {/* Shopping Cart Button */}
            <button
              id="btn-cart-drawer"
              onClick={() => setIsCartOpen(true)}
              className="btn-primary"
              style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px' }}
            >
              <ShoppingCart size={16} />
              <span>Cart</span>
              {cartTotalItemCount > 0 && (
                <span style={{
                  background: '#FFFFFF',
                  color: 'var(--c5)',
                  fontWeight: 800,
                  fontSize: 11,
                  borderRadius: 999,
                  padding: '2px 7px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  {cartTotalItemCount}
                </span>
              )}
            </button>

            {/* Logout */}
            <button className="btn-icon" onClick={onLogout} title="Sign Out">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 28px 64px', position: 'relative', zIndex: 1 }}>

        {/* Hero Banner */}
        <div
          className="anim-fade-up card"
          style={{
            marginBottom: 36,
            padding: '36px 40px',
            background: 'linear-gradient(135deg, rgba(255,250,246,0.95), rgba(255,233,233,0.85))',
            borderRadius: 'var(--radius-xl)',
            border: '1.5px solid var(--border)',
            boxShadow: 'var(--shadow-md)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div style={{ maxWidth: 680, position: 'relative', zIndex: 2 }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--c5)',
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              marginBottom: 8
            }}>
              <Sparkles size={14} /> Fresh From Local Gardens
            </span>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 34,
              fontWeight: 800,
              color: 'var(--text)',
              lineHeight: 1.2,
              marginBottom: 10
            }}>
              Hand-Picked Flowers, Delivered With Care 🌺
            </h1>
            <p style={{ fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 18 }}>
              Explore 20 freshly cut varieties. Our dynamic FEFO algorithm ensures premium freshness, with special 50% discounts on near-expiry blooms!
            </p>

            <div style={{ display: 'flex', gap: 12, fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>
              <span>✓ 100% Freshness Guarantee</span>
              <span>•</span>
              <span>✓ Same-Day Express Delivery</span>
              <span>•</span>
              <span>✓ FEFO Smart Allocation</span>
            </div>
          </div>

          <div style={{
            position: 'absolute',
            right: 30,
            bottom: -20,
            fontSize: 140,
            opacity: 0.15,
            pointerEvents: 'none',
            userSelect: 'none'
          }}>
            💐
          </div>
        </div>

        {/* Section Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: 'var(--text)' }}>
              Available Fresh Blooms
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
              {filteredCatalog.length} flower varieties currently in stock
            </p>
          </div>
        </div>

        {/* Error notice */}
        {error && (
          <div style={{ background: 'var(--crimson-bg)', border: '1px solid rgba(184,50,50,0.2)', padding: 16, borderRadius: 'var(--radius-md)', color: 'var(--crimson)', marginBottom: 24 }}>
            <AlertCircle size={18} style={{ inlineSize: 18, marginRight: 8 }} />
            {error}
          </div>
        )}

        {/* Flower Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: 20 }}>
          {loading ? (
            [...Array(8)].map((_, i) => (
              <div key={i} className="card skeleton" style={{ height: 280, borderRadius: 'var(--radius-lg)' }} />
            ))
          ) : filteredCatalog.length === 0 ? (
            <div style={{ colSpan: 'all', padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
              <span style={{ fontSize: 48 }}>🪴</span>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 18, marginTop: 12 }}>No flowers match your search.</p>
            </div>
          ) : (
            filteredCatalog.map((item, idx) => {
              const inCart = cart[item.product];
              const effectivePrice = item.isDiscounted ? item.basePrice * 0.5 : item.basePrice;

              return (
                <div
                  key={item.product}
                  className="card"
                  style={{
                    padding: 22,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    borderRadius: 'var(--radius-lg)',
                    animation: `fadeUp 0.4s ease ${idx * 0.04}s both`,
                    position: 'relative'
                  }}
                >
                  {/* Top Badge */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div style={{
                      width: 52,
                      height: 52,
                      borderRadius: 16,
                      background: 'linear-gradient(135deg, var(--c1), var(--c2))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 28,
                      boxShadow: 'var(--shadow-sm)'
                    }}>
                      {flowerEmoji(item.product)}
                    </div>

                    {item.isDiscounted ? (
                      <span className="badge-discount">⚡ 50% OFF</span>
                    ) : (
                      <span className="badge badge-active">Fresh Stock</span>
                    )}
                  </div>

                  {/* Product Details */}
                  <div style={{ marginBottom: 16 }}>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>
                      {item.product}
                    </h3>
                    <p style={{ fontSize: 12, color: 'var(--text-faint)', marginBottom: 10 }}>SKU: {item.sku}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span>In Stock:</span> <strong style={{ color: 'var(--text)' }}>{item.totalQty.toLocaleString()} stems</strong>
                    </p>
                  </div>

                  {/* Price & Cart Control */}
                  <div style={{ paddingTop: 14, borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <span style={{ fontSize: 11, color: 'var(--text-faint)', display: 'block' }}>Price per stem</span>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                        <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: 'var(--c5)' }}>
                          ₹{effectivePrice.toFixed(2)}
                        </span>
                        {item.isDiscounted && (
                          <span style={{ fontSize: 12, color: 'var(--text-faint)', textDecoration: 'line-through' }}>
                            ₹{item.basePrice.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>

                    {inCart ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--c1)', borderRadius: 'var(--radius-md)', padding: 3, border: '1px solid var(--border)' }}>
                        <button
                          onClick={() => updateCartQty(item.product, inCart.quantity - 1)}
                          style={{ border: 'none', background: 'var(--surface)', borderRadius: 6, width: 26, height: 26, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <Minus size={12} />
                        </button>
                        <span style={{ fontSize: 13, fontWeight: 700, minWidth: 20, textAlign: 'center' }}>{inCart.quantity}</span>
                        <button
                          onClick={() => updateCartQty(item.product, inCart.quantity + 1)}
                          style={{ border: 'none', background: 'var(--surface)', borderRadius: 6, width: 26, height: 26, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    ) : (
                      <button
                        id={`btn-add-${item.product.toLowerCase().replace(/\s+/g, '-')}`}
                        onClick={() => addToCart(item, 1)}
                        className="btn-primary"
                        style={{ padding: '8px 14px', fontSize: 13 }}
                      >
                        ＋ Add
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* Cart Drawer / Modal */}
      {isCartOpen && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setIsCartOpen(false)}>
          <div className="modal-card" style={{ maxWidth: 460 }}>
            {/* Cart Header */}
            <div style={{
              background: 'linear-gradient(135deg, var(--c1), var(--c2))',
              padding: '20px 24px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <ShoppingCart size={20} color="var(--c5)" />
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--text)' }}>
                  Your Flower Basket
                </h3>
              </div>
              <button className="btn-icon" onClick={() => setIsCartOpen(false)}>
                <X size={16} />
              </button>
            </div>

            {/* Cart Body */}
            <div style={{ padding: 24, maxHeight: 420, overflowY: 'auto' }}>
              {cartItems.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '36px 0', color: 'var(--text-muted)' }}>
                  <span style={{ fontSize: 42 }}>🧺</span>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: 16, marginTop: 12 }}>Your cart is empty.</p>
                  <p style={{ fontSize: 13, color: 'var(--text-faint)' }}>Add some fresh blooms to get started!</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {cartItems.map(ci => (
                    <div
                      key={ci.product}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: 'var(--c1)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-md)',
                        padding: '12px 16px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 24 }}>{flowerEmoji(ci.product)}</span>
                        <div>
                          <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{ci.product}</p>
                          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            ₹{ci.unitPrice.toFixed(2)} × {ci.quantity} stems
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontWeight: 800, fontSize: 15, color: 'var(--text)' }}>
                          ₹{(ci.unitPrice * ci.quantity).toFixed(2)}
                        </span>
                        <button
                          onClick={() => removeFromCart(ci.product)}
                          style={{ background: 'none', border: 'none', color: 'var(--crimson)', cursor: 'pointer', padding: 4 }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cart Footer */}
            {cartItems.length > 0 && (
              <div style={{ padding: '20px 24px', borderTop: '1px solid var(--border)', background: 'var(--c1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>Total Amount</span>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, color: 'var(--c5)' }}>
                    ₹{cartSubtotal.toFixed(2)}
                  </span>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={isSubmitting}
                  className="btn-primary"
                  style={{ width: '100%', padding: '13px', fontSize: 15, justifyContent: 'center' }}
                >
                  {isSubmitting ? 'Placing Order...' : '🌸 Place Order (FEFO Allocated)'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Checkout Success Modal */}
      {checkoutSuccess && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: 400, textAlign: 'center', padding: 32 }}>
            <div style={{
              width: 64,
              height: 64,
              borderRadius: 999,
              background: 'var(--sage-bg)',
              color: 'var(--sage)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              animation: 'checkBounce 0.5s ease both'
            }}>
              <CheckCircle2 size={36} />
            </div>

            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
              Order Confirmed! 🎉
            </h3>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 16 }}>
              Thank you, <strong>{username}</strong>! Your flowers have been reserved using our intelligent FEFO allocation engine.
            </p>
            <div style={{ background: 'var(--c1)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 12, fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>
              Order ID: <code style={{ color: 'var(--c3)' }}>#{checkoutSuccess.orderId.substring(0, 8)}</code> · Status: <strong style={{ color: 'var(--sage)' }}>{checkoutSuccess.status}</strong>
            </div>

            <button
              onClick={() => setCheckoutSuccess(null)}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Continue Shopping
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
