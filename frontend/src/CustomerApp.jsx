import React, { useState, useEffect } from 'react';
import {
  ShoppingCart, Search, LogOut, CheckCircle2,
  Sparkles, X, Plus, Minus, AlertCircle, Trash2,
  CreditCard, Smartphone, ShieldCheck, MapPin, Calendar, User, Phone, FileText, Check, ArrowRight, ArrowLeft
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
  'Bird of Paradise': '🌾',
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
  
  // Cart state: map of product name -> { product, sku, quantity, unitPrice, isDiscounted, productId }
  const [cart, setCart] = useState({});
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // Multi-step Checkout state: 'cart' | 'delivery' | 'paymock' | 'receipt'
  const [checkoutStep, setCheckoutStep] = useState('cart');

  // Delivery details form state
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const [deliveryForm, setDeliveryForm] = useState({
    recipientName: username || 'Alice',
    phone: '+91 98765 43210',
    streetAddress: '123 Lotus Blossom Lane, Koramangala',
    city: 'Bengaluru',
    pincode: '560034',
    deliveryDate: tomorrowStr,
    notes: 'Please hand deliver to recipient or leave with security.'
  });

  // PayMock payment gateway state
  const [payMethod, setPayMethod] = useState('UPI'); // 'UPI' | 'Card'
  const [upiId, setUpiId] = useState(`${username || 'alice'}@okaxis`);
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '4532 8812 9901 3412',
    cardHolderName: (username || 'Alice').toUpperCase(),
    expiry: '12/28',
    cvv: '888'
  });

  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentStatusText, setPaymentStatusText] = useState('');
  const [completedOrder, setCompletedOrder] = useState(null);

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
    batches.forEach(b => {
      if (b.status !== 'ACTIVE' || b.quantity <= 0) return;
      if (!map[b.product]) {
        const matchedProduct = products.find(p => p.name === b.product);
        const basePrice = matchedProduct ? 2.50 : 2.00;
        map[b.product] = {
          product: b.product,
          sku: b.sku,
          productId: b.productId || (matchedProduct ? matchedProduct.id : b.id),
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
  const deliveryFee = cartSubtotal > 500 || cartSubtotal === 0 ? 0 : 50;
  const grandTotal = cartSubtotal + deliveryFee;

  // Process payment with PayMock server (port 5001), then place FEFO order in BloomBoard (port 8080)
  const handlePayMockSubmit = async (e) => {
    e.preventDefault();
    if (cartItems.length === 0) return;

    setIsProcessingPayment(true);
    setPaymentStatusText('Initiating PayMock transaction…');

    try {
      // Step 1: Create Payment on PayMock server (port 5001)
      const paymockCreateRes = await fetch('http://localhost:5001/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantName: 'BloomBoard Florist',
          customerName: deliveryForm.recipientName,
          amount: parseFloat(grandTotal.toFixed(2)),
          paymentMethod: payMethod
        })
      });

      if (!paymockCreateRes.ok) throw new Error('PayMock gateway failed to initialize.');
      const paymockCreateData = await paymockCreateRes.json();
      const paymentId = paymockCreateData.data.paymentId;

      setPaymentStatusText('Connecting to Bank & Verifying Credentials…');
      await new Promise(r => setTimeout(r, 1200));

      // Step 2: Process Payment on PayMock server (port 5001)
      const processBody = payMethod === 'UPI' 
        ? { paymentMethod: 'UPI', upiId: upiId }
        : {
            paymentMethod: 'Card',
            cardNumber: cardDetails.cardNumber,
            cardHolderName: cardDetails.cardHolderName,
            expiry: cardDetails.expiry,
            cvv: cardDetails.cvv
          };

      const paymockProcessRes = await fetch(`http://localhost:5001/api/payments/${paymentId}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(processBody)
      });

      if (!paymockProcessRes.ok) {
        const errJson = await paymockProcessRes.json();
        throw new Error(errJson.message || 'Payment failed on PayMock gateway.');
      }

      const paymockProcessData = await paymockProcessRes.json();
      const verifiedPayment = paymockProcessData.data;

      setPaymentStatusText('Payment Approved! Allocating FEFO inventory…');
      await new Promise(r => setTimeout(r, 800));

      // Step 3: Call BloomBoard backend to place order and perform FEFO allocation
      const itemsPayload = cartItems.map(item => ({
        bouquetId: null,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice
      }));

      const bloomboardPayload = {
        cartId: '11111111-1111-1111-1111-111111111111',
        customerEmail: `${username}@bloomboard.shop`,
        items: itemsPayload,
        deliveryDate: `${deliveryForm.deliveryDate}T00:00:00`
      };

      const orderRes = await fetch('http://localhost:8080/api/v1/orders/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(bloomboardPayload)
      });

      if (!orderRes.ok) throw new Error('Order creation failed during FEFO stock allocation.');
      const orderData = await orderRes.json();

      // Step 4: Show completed order receipt
      setCompletedOrder({
        orderId: orderData.orderId,
        orderStatus: orderData.status,
        paymockId: verifiedPayment.paymentId,
        paymockStatus: verifiedPayment.status,
        merchantName: verifiedPayment.merchantName,
        totalPaid: grandTotal,
        items: [...cartItems],
        delivery: { ...deliveryForm }
      });
      setCheckoutStep('receipt');
      setCart({});
      fetchCatalog(); // Refresh live stock
    } catch (err) {
      alert(err.message || 'Payment processing failed.');
    } finally {
      setIsProcessingPayment(false);
      setPaymentStatusText('');
    }
  };

  const resetModalState = () => {
    setIsCartOpen(false);
    setCheckoutStep('cart');
    setCompletedOrder(null);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(155deg, var(--c1) 0%, var(--c2) 55%, var(--c4) 100%)',
      position: 'relative',
    }}>
      {/* Floating petals background */}
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
              onClick={() => { setCheckoutStep('cart'); setIsCartOpen(true); }}
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
              <span>✓ PayMock Gateway Ready</span>
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

      {/* ── Multi-Step Checkout Modal ── */}
      {isCartOpen && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && resetModalState()}>
          <div className="modal-card" style={{ maxWidth: checkoutStep === 'paymock' ? 480 : 460 }}>

            {/* Modal Header */}
            <div style={{
              background: checkoutStep === 'paymock' 
                ? 'linear-gradient(135deg, #0C2340 0%, #1A365D 100%)' 
                : 'linear-gradient(135deg, var(--c1), var(--c2))',
              color: checkoutStep === 'paymock' ? '#FFFFFF' : 'var(--text)',
              padding: '20px 24px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {checkoutStep === 'cart' && <ShoppingCart size={20} color="var(--c5)" />}
                {checkoutStep === 'delivery' && <MapPin size={20} color="var(--c5)" />}
                {checkoutStep === 'paymock' && <ShieldCheck size={22} color="#38BDF8" />}
                {checkoutStep === 'receipt' && <CheckCircle2 size={22} color="var(--sage)" />}

                <div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, margin: 0, color: checkoutStep === 'paymock' ? '#FFFFFF' : 'var(--text)' }}>
                    {checkoutStep === 'cart' && 'Your Flower Basket'}
                    {checkoutStep === 'delivery' && 'Delivery Details'}
                    {checkoutStep === 'paymock' && 'Razorpay (PayMock) Gateway'}
                    {checkoutStep === 'receipt' && 'Order Confirmed 🎉'}
                  </h3>
                  <span style={{ fontSize: 11, opacity: 0.8 }}>
                    {checkoutStep === 'cart' && 'Step 1 of 3: Item Review'}
                    {checkoutStep === 'delivery' && 'Step 2 of 3: Shipping & Address'}
                    {checkoutStep === 'paymock' && 'Step 3 of 3: Payment Verification'}
                    {checkoutStep === 'receipt' && 'FEFO Stock Allocated'}
                  </span>
                </div>
              </div>

              <button
                className="btn-icon"
                onClick={resetModalState}
                style={{ color: checkoutStep === 'paymock' ? '#FFFFFF' : 'var(--text-muted)' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* ── STEP 1: CART REVIEW ── */}
            {checkoutStep === 'cart' && (
              <>
                <div style={{ padding: 24, maxHeight: 380, overflowY: 'auto' }}>
                  {cartItems.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '36px 0', color: 'var(--text-muted)' }}>
                      <span style={{ fontSize: 42 }}>🧺</span>
                      <p style={{ fontFamily: 'var(--font-display)', fontSize: 16, marginTop: 12 }}>Your basket is empty.</p>
                      <p style={{ fontSize: 13, color: 'var(--text-faint)' }}>Select fresh stems from our garden!</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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

                {cartItems.length > 0 && (
                  <div style={{ padding: '20px 24px', borderTop: '1px solid var(--border)', background: 'var(--c1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-muted)', marginBottom: 6 }}>
                      <span>Subtotal ({cartTotalItemCount} stems)</span>
                      <span>₹{cartSubtotal.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-muted)', marginBottom: 14 }}>
                      <span>Express Delivery Fee</span>
                      <span>{deliveryFee === 0 ? <strong style={{ color: 'var(--sage)' }}>FREE</strong> : `₹${deliveryFee}`}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, paddingTop: 10, borderTop: '1px dashed var(--border)' }}>
                      <span style={{ fontSize: 14, fontWeight: 700 }}>Total Payable</span>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, color: 'var(--c5)' }}>
                        ₹{grandTotal.toFixed(2)}
                      </span>
                    </div>

                    <button
                      onClick={() => setCheckoutStep('delivery')}
                      className="btn-primary"
                      style={{ width: '100%', padding: '13px', fontSize: 15, justifyContent: 'center' }}
                    >
                      Proceed to Delivery Details <ArrowRight size={16} />
                    </button>
                  </div>
                )}
              </>
            )}

            {/* ── STEP 2: DELIVERY DETAILS ── */}
            {checkoutStep === 'delivery' && (
              <div style={{ padding: 24 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label className="field-label">Recipient Name</label>
                      <input
                        type="text"
                        className="field-input"
                        value={deliveryForm.recipientName}
                        onChange={e => setDeliveryForm(p => ({ ...p, recipientName: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <label className="field-label">Contact Phone</label>
                      <input
                        type="text"
                        className="field-input"
                        value={deliveryForm.phone}
                        onChange={e => setDeliveryForm(p => ({ ...p, phone: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="field-label">Street Address & Landmark</label>
                    <input
                      type="text"
                      className="field-input"
                      value={deliveryForm.streetAddress}
                      onChange={e => setDeliveryForm(p => ({ ...p, streetAddress: e.target.value }))}
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label className="field-label">City</label>
                      <input
                        type="text"
                        className="field-input"
                        value={deliveryForm.city}
                        onChange={e => setDeliveryForm(p => ({ ...p, city: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <label className="field-label">Pincode</label>
                      <input
                        type="text"
                        className="field-input"
                        value={deliveryForm.pincode}
                        onChange={e => setDeliveryForm(p => ({ ...p, pincode: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="field-label">Preferred Delivery Date</label>
                    <input
                      type="date"
                      className="field-input"
                      value={deliveryForm.deliveryDate}
                      onChange={e => setDeliveryForm(p => ({ ...p, deliveryDate: e.target.value }))}
                      required
                    />
                  </div>

                  <div>
                    <label className="field-label">Special Delivery Note / Card Message</label>
                    <input
                      type="text"
                      className="field-input"
                      placeholder="e.g. Ring doorbell twice"
                      value={deliveryForm.notes}
                      onChange={e => setDeliveryForm(p => ({ ...p, notes: e.target.value }))}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => setCheckoutStep('cart')}
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <ArrowLeft size={15} /> Back to Cart
                  </button>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => setCheckoutStep('paymock')}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px' }}
                  >
                    Pay with PayMock (Razorpay) <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 3: PAYMOCK (RAZORPAY) PAYMENT GATEWAY OVERLAY ── */}
            {checkoutStep === 'paymock' && (
              <form onSubmit={handlePayMockSubmit} style={{ padding: 24 }}>

                {/* Amount Banner */}
                <div style={{
                  background: '#F0F9FF',
                  border: '1px solid #BAE6FD',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px 18px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 18
                }}>
                  <div>
                    <span style={{ fontSize: 11, color: '#0369A1', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Merchant: BloomBoard Florist
                    </span>
                    <p style={{ fontSize: 13, color: '#0F172A', margin: '2px 0 0' }}>
                      Order for {deliveryForm.recipientName} ({cartTotalItemCount} stems)
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: 11, color: '#64748B' }}>Amount</span>
                    <p style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: '#0284C7', margin: 0 }}>
                      ₹{grandTotal.toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Payment Method Selector Tabs */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
                  <button
                    type="button"
                    onClick={() => setPayMethod('UPI')}
                    style={{
                      padding: '10px 14px',
                      borderRadius: 10,
                      border: payMethod === 'UPI' ? '2px solid #0284C7' : '1px solid #CBD5E1',
                      background: payMethod === 'UPI' ? '#E0F2FE' : '#FFFFFF',
                      color: payMethod === 'UPI' ? '#0369A1' : '#475569',
                      fontWeight: 600,
                      fontSize: 13,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      cursor: 'pointer'
                    }}
                  >
                    <Smartphone size={16} /> UPI / QR Code
                  </button>

                  <button
                    type="button"
                    onClick={() => setPayMethod('Card')}
                    style={{
                      padding: '10px 14px',
                      borderRadius: 10,
                      border: payMethod === 'Card' ? '2px solid #0284C7' : '1px solid #CBD5E1',
                      background: payMethod === 'Card' ? '#E0F2FE' : '#FFFFFF',
                      color: payMethod === 'Card' ? '#0369A1' : '#475569',
                      fontWeight: 600,
                      fontSize: 13,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      cursor: 'pointer'
                    }}
                  >
                    <CreditCard size={16} /> Card (Visa/Mastercard)
                  </button>
                </div>

                {/* UPI Input Details */}
                {payMethod === 'UPI' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div>
                      <label className="field-label">Virtual Payment Address (VPA)</label>
                      <input
                        type="text"
                        className="field-input"
                        value={upiId}
                        onChange={e => setUpiId(e.target.value)}
                        placeholder="username@upi"
                        required
                      />
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <span style={{ fontSize: 11, color: '#64748B' }}>Quick Fill:</span>
                      <button
                        type="button"
                        onClick={() => setUpiId('alice@okaxis')}
                        style={{ fontSize: 11, background: '#E2E8F0', border: 'none', borderRadius: 4, padding: '2px 6px', cursor: 'pointer' }}
                      >
                        alice@okaxis
                      </button>
                      <button
                        type="button"
                        onClick={() => setUpiId('bob@upi')}
                        style={{ fontSize: 11, background: '#E2E8F0', border: 'none', borderRadius: 4, padding: '2px 6px', cursor: 'pointer' }}
                      >
                        bob@upi
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Card Input Details */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div>
                      <label className="field-label">Card Number</label>
                      <input
                        type="text"
                        className="field-input"
                        value={cardDetails.cardNumber}
                        onChange={e => setCardDetails(p => ({ ...p, cardNumber: e.target.value }))}
                        placeholder="4532 8812 9901 3412"
                        required
                      />
                    </div>

                    <div>
                      <label className="field-label">Cardholder Name</label>
                      <input
                        type="text"
                        className="field-input"
                        value={cardDetails.cardHolderName}
                        onChange={e => setCardDetails(p => ({ ...p, cardHolderName: e.target.value }))}
                        required
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <label className="field-label">Expiry (MM/YY)</label>
                        <input
                          type="text"
                          className="field-input"
                          value={cardDetails.expiry}
                          onChange={e => setCardDetails(p => ({ ...p, expiry: e.target.value }))}
                          placeholder="12/28"
                          required
                        />
                      </div>
                      <div>
                        <label className="field-label">CVV</label>
                        <input
                          type="password"
                          className="field-input"
                          maxLength="4"
                          value={cardDetails.cvv}
                          onChange={e => setCardDetails(p => ({ ...p, cvv: e.target.value }))}
                          placeholder="•••"
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Processing animation indicator */}
                {isProcessingPayment && (
                  <div style={{
                    marginTop: 16,
                    padding: 14,
                    background: '#F0FDF4',
                    border: '1px solid #BBF7D0',
                    borderRadius: 8,
                    color: '#166534',
                    fontSize: 13,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10
                  }}>
                    <span style={{ fontSize: 18, animation: 'spin 1s linear infinite' }}>🔄</span>
                    <span>{paymentStatusText || 'Communicating with PayMock server (port 5001)…'}</span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 24 }}>
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => setCheckoutStep('delivery')}
                    disabled={isProcessingPayment}
                  >
                    Back
                  </button>

                  <button
                    type="submit"
                    disabled={isProcessingPayment}
                    style={{
                      background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: 10,
                      padding: '12px 24px',
                      fontSize: 15,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      boxShadow: '0 4px 14px rgba(2,132,199,0.35)'
                    }}
                  >
                    {isProcessingPayment ? 'Processing...' : `🔒 Pay ₹${grandTotal.toFixed(2)} via PayMock`}
                  </button>
                </div>
              </form>
            )}

            {/* ── STEP 4: ORDER CONFIRMED & RECEIPT ── */}
            {checkoutStep === 'receipt' && completedOrder && (
              <div style={{ padding: 28, textAlign: 'center' }}>
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

                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>
                  Payment Approved & Order Confirmed! 🎉
                </h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
                  Thank you! Your stock has been allocated via <strong>FEFO logic</strong>.
                </p>

                {/* Printable Receipt Card */}
                <div style={{
                  background: 'var(--c1)',
                  border: '1.5px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 20,
                  textAlign: 'left',
                  fontSize: 13,
                  marginBottom: 24
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 10, marginBottom: 12 }}>
                    <div>
                      <span style={{ fontSize: 11, color: 'var(--text-faint)', textTransform: 'uppercase' }}>BloomBoard Order ID</span>
                      <p style={{ fontWeight: 700, fontFamily: 'monospace', color: 'var(--c3)', margin: 0 }}>
                        #{completedOrder.orderId.substring(0, 13)}…
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: 11, color: 'var(--text-faint)', textTransform: 'uppercase' }}>PayMock Gateway ID</span>
                      <p style={{ fontWeight: 700, fontFamily: 'monospace', color: '#0284C7', margin: 0 }}>
                        {completedOrder.paymockId}
                      </p>
                    </div>
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-faint)', textTransform: 'uppercase' }}>Delivery Address</span>
                    <p style={{ fontWeight: 600, color: 'var(--text)', margin: '2px 0 0' }}>
                      {completedOrder.delivery.recipientName} ({completedOrder.delivery.phone})
                    </p>
                    <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: 0 }}>
                      {completedOrder.delivery.streetAddress}, {completedOrder.delivery.city} - {completedOrder.delivery.pincode}
                    </p>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px dashed var(--border)' }}>
                    <span>Total Amount Paid</span>
                    <strong style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--c5)' }}>
                      ₹{completedOrder.totalPaid.toFixed(2)}
                    </strong>
                  </div>
                </div>

                <button
                  onClick={resetModalState}
                  className="btn-primary"
                  style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
                >
                  Continue Shopping 🌸
                </button>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
