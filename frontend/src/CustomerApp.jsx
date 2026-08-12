import React, { useState, useEffect } from 'react';
import {
  ShoppingCart, Search, LogOut, CheckCircle2,
  Sparkles, X, Plus, Minus, AlertCircle, Trash2,
  CreditCard, Smartphone, ShieldCheck, MapPin, Calendar, User, Phone, FileText, Check, ArrowRight, ArrowLeft,
  Navigation, Package, Clock
} from 'lucide-react';

const PETALS = ['🌸','🌺','🌼','🌻','🌹','💐','🌷','🏵️','🌸','🌼'];

const FLOWER_IMAGES = {
  'Rose':             '/images/flower_rose.png',
  'Lily':             '/images/flower_lily.png',
  'Orchid':           '/images/flower_orchid.png',
  'Carnation':        '/images/flower_carnation.png',
  'Gerbera':          '/images/flower_gerbera.png',
  'Tulip':            '/images/flower_tulip.png',
  'Chrysanthemum':    '/images/flower_chrysanthemum.png',
  'Sunflower':        '/images/flower_sunflower.png',
  'Anthurium':        '/images/flower_anthurium.png',
  'Gladiolus':        '/images/flower_gladiolus.png',
  'Alstroemeria':     '/images/flower_alstroemeria.png',
  'Iris':             '/images/flower_iris.png',
  'Lisianthus':       '/images/flower_lisianthus.png',
  'Ranunculus':       '/images/flower_ranunculus.png',
  'Peony':            '/images/flower_peony.png',
  'Bird of Paradise': '/images/flower_bird_of_paradise.png',
  'Freesia':          '/images/flower_freesia.png',
  'Stock Flower':     '/images/flower_stock_flower.png',
  'Snapdragon':       '/images/flower_snapdragon.png',
  'Hydrangea':        'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=600&q=80',
};

function getFlowerImage(name) {
  for (const [k, v] of Object.entries(FLOWER_IMAGES)) {
    if (name.includes(k)) return v;
  }
  return 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80';
}

function OrderStatusTimeline({ status }) {
  const stages = [
    { key: 'CONFIRMED', label: 'Confirmed' },
    { key: 'ACCEPTED', label: 'Packing' },
    { key: 'SHIPPED', label: 'Out for Delivery' },
    { key: 'DELIVERED', label: 'Delivered' },
  ];

  const getActiveIndex = (st) => {
    if (st === 'CONFIRMED') return 0;
    if (st === 'ACCEPTED' || st === 'PACKED') return 1;
    if (st === 'SHIPPED') return 2;
    if (st === 'DELIVERED') return 3;
    return 0;
  };

  const activeIdx = getActiveIndex(status);

  return (
    <div style={{ margin: '14px 0 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', padding: '0 4px' }}>
      <div style={{ position: 'absolute', top: 12, left: 16, right: 16, height: 3, background: '#E2E8F0', zIndex: 0 }} />
      <div style={{ position: 'absolute', top: 12, left: 16, width: `${(activeIdx / 3) * 88}%`, height: 3, background: 'var(--c5)', zIndex: 0, transition: 'width 0.4s ease' }} />

      {stages.map((stage, idx) => {
        const isDone = idx <= activeIdx;
        const isCurrent = idx === activeIdx;
        return (
          <div key={stage.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1 }}>
            <div style={{
              width: 24,
              height: 24,
              borderRadius: 999,
              background: isDone ? 'var(--c5)' : '#FFFFFF',
              border: isDone ? '2px solid var(--c5)' : '2px solid #CBD5E1',
              color: isDone ? '#FFFFFF' : '#94A3B8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 10,
              fontWeight: 800,
              boxShadow: isCurrent ? '0 0 0 4px rgba(255,97,97,0.25)' : 'none'
            }}>
              {isDone ? '✓' : idx + 1}
            </div>
            <span style={{ fontSize: 10, fontWeight: isCurrent ? 800 : 600, color: isCurrent ? 'var(--c5)' : 'var(--text-muted)', marginTop: 4, textAlign: 'center' }}>
              {stage.label}
            </span>
          </div>
        );
      })}
    </div>
  );
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
  
  // My Orders state
  const [isMyOrdersOpen, setIsMyOrdersOpen] = useState(false);
  const [myOrders, setMyOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Customer OTP modal state
  const [customerOtpModalOrder, setCustomerOtpModalOrder] = useState(null);
  const [customerInputOtp, setCustomerInputOtp] = useState('');
  const [customerOtpError, setCustomerOtpError] = useState('');
  const [verifyingCustomerOtp, setVerifyingCustomerOtp] = useState(false);

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

  // Location detection state
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationStatus, setLocationStatus] = useState('');

  const detectLocation = () => {
    setIsDetectingLocation(true);
    setLocationStatus('Locating device…');

    if (!navigator.geolocation) {
      setTimeout(() => {
        setDeliveryForm(p => ({ ...p, streetAddress: '100 Feet Road, Indiranagar', city: 'Bengaluru', pincode: '560038' }));
        setLocationStatus('📍 Detected: Indiranagar, Bengaluru (560038)');
        setIsDetectingLocation(false);
      }, 600);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          setLocationStatus('Fetching address details…');
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            const street = addr.road || addr.suburb || addr.neighbourhood || 'Lotus Garden Lane';
            const city = addr.city || addr.town || addr.state_district || 'Bengaluru';
            const pincode = addr.postcode || '560034';

            setDeliveryForm(prev => ({
              ...prev,
              streetAddress: `${street}, ${addr.suburb || 'Koramangala'}`,
              city: city,
              pincode: pincode
            }));
            setLocationStatus(`📍 Detected: ${city} (${pincode})`);
          } else {
            setDeliveryForm(prev => ({ ...prev, streetAddress: '77 Residency Road, Ashok Nagar', city: 'Bengaluru', pincode: '560025' }));
            setLocationStatus('📍 Detected: Bengaluru (560025)');
          }
        } catch (err) {
          setDeliveryForm(prev => ({ ...prev, streetAddress: '77 Residency Road, Ashok Nagar', city: 'Bengaluru', pincode: '560025' }));
          setLocationStatus('📍 Detected: Bengaluru (560025)');
        } finally {
          setIsDetectingLocation(false);
        }
      },
      () => {
        setIsDetectingLocation(false);
        setDeliveryForm(prev => ({ ...prev, streetAddress: '100 Feet Road, Indiranagar', city: 'Bengaluru', pincode: '560038' }));
        setLocationStatus('📍 Detected: Indiranagar, Bengaluru (560038)');
      },
      { timeout: 8000 }
    );
  };

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

  const fetchMyOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await fetch(`http://localhost:8080/api/v1/orders/my-orders?email=${encodeURIComponent(username || 'alice')}@bloomboard.shop`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMyOrders(data);
      }
    } catch (err) {
      console.error('fetchMyOrders error:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleCustomerVerifyOtpSubmit = async (e) => {
    e.preventDefault();
    if (!customerOtpModalOrder || !customerInputOtp.trim()) return;

    setVerifyingCustomerOtp(true);
    setCustomerOtpError('');

    try {
      const res = await fetch(`http://localhost:8080/api/v1/orders/${customerOtpModalOrder.orderId}/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ otp: customerInputOtp })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Invalid Delivery OTP');
      }

      setCustomerOtpModalOrder(null);
      setCustomerInputOtp('');
      await fetchMyOrders();
      alert('🎉 Order Delivered & Verified! Thank you for ordering from BloomBoard!');
    } catch (err) {
      setCustomerOtpError(err.message || 'Verification failed');
    } finally {
      setVerifyingCustomerOtp(false);
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
  
  // FREE Delivery threshold updated to ₹200 as requested!
  const deliveryFee = cartSubtotal >= 200 || cartSubtotal === 0 ? 0 : 50;
  const grandTotal = cartSubtotal + deliveryFee;
  const amountNeededForFreeShipping = Math.max(0, 200 - cartSubtotal);

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
        deliveryOtp: orderData.deliveryOtp,
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
      fetchMyOrders(); // Refresh customer order history and OTPs
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

          {/* Search, Location & Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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

            {/* Detect Location Button */}
            <button
              id="btn-detect-location-header"
              onClick={detectLocation}
              disabled={isDetectingLocation}
              className="btn-ghost"
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', fontSize: 13 }}
              title="Auto-detect location"
            >
              <Navigation size={15} color="var(--c5)" className={isDetectingLocation ? 'spin' : ''} />
              <span>{isDetectingLocation ? 'Locating...' : 'Detect Location'}</span>
            </button>

            {/* My Orders Drawer Button */}
            <button
              id="btn-my-orders"
              onClick={() => { fetchMyOrders(); setIsMyOrdersOpen(true); }}
              className="btn-ghost"
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', fontSize: 13 }}
            >
              <Package size={16} color="var(--c3)" />
              <span>My Orders</span>
            </button>

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

            <div style={{ display: 'flex', gap: 14, fontSize: 13, color: 'var(--text-muted)', fontWeight: 600, flexWrap: 'wrap' }}>
              <span>✓ 100% Freshness Guarantee</span>
              <span>•</span>
              <span style={{ color: 'var(--c5)' }}>⚡ FREE Express Delivery on Orders &gt; ₹200</span>
              <span>•</span>
              <span>✓ PayMock Gateway Ready</span>
            </div>

            {locationStatus && (
              <div style={{ marginTop: 14, fontSize: 12, fontWeight: 700, color: 'var(--c3)', background: 'rgba(154,178,224,0.2)', padding: '6px 14px', borderRadius: 999, display: 'inline-block' }}>
                {locationStatus}
              </div>
            )}
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

        {/* Flower Cards Grid with Real High-Res Photography */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: 20 }}>
          {loading ? (
            [...Array(8)].map((_, i) => (
              <div key={i} className="card skeleton" style={{ height: 320, borderRadius: 'var(--radius-lg)' }} />
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
              const flowerImageUrl = getFlowerImage(item.product);

              return (
                <div
                  key={item.product}
                  className="card"
                  style={{
                    padding: 0,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    borderRadius: 'var(--radius-lg)',
                    animation: `fadeUp 0.4s ease ${idx * 0.04}s both`,
                    position: 'relative'
                  }}
                >
                  {/* Real Flower Image Card Header */}
                  <div style={{ position: 'relative', width: '100%', height: 180, overflow: 'hidden' }}>
                    <img
                      src={flowerImageUrl}
                      alt={item.product}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80';
                      }}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transition: 'transform 0.5s ease',
                      }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                    />

                    {/* Gradient Overlay */}
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 60%)'
                    }} />

                    {/* Discount / Freshness Badge */}
                    <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 2 }}>
                      {item.isDiscounted ? (
                        <span className="badge-discount" style={{ boxShadow: '0 4px 12px rgba(255,97,97,0.4)' }}>⚡ 50% OFF</span>
                      ) : (
                        <span className="badge badge-active" style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(4px)' }}>Fresh Stock</span>
                      )}
                    </div>

                    {/* Flower Name overlay */}
                    <div style={{ position: 'absolute', bottom: 12, left: 16, right: 16, zIndex: 2 }}>
                      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: '#FFFFFF', textShadow: '0 2px 6px rgba(0,0,0,0.6)', margin: 0 }}>
                        {item.product}
                      </h3>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)' }}>SKU: {item.sku}</span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div style={{ padding: 18, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 1 }}>
                    <div style={{ marginBottom: 14 }}>
                      <p style={{ fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span>Available Quantity:</span>
                        <strong style={{ color: 'var(--text)', fontWeight: 700 }}>{item.totalQty.toLocaleString()} stems</strong>
                      </p>
                    </div>

                    {/* Price & Cart Control */}
                    <div style={{ paddingTop: 12, borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
                          style={{ padding: '8px 16px', fontSize: 13 }}
                        >
                          ＋ Add
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* ── MY ORDERS DRAWER ── */}
      {isMyOrdersOpen && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setIsMyOrdersOpen(false)}>
          <div className="modal-card" style={{ maxWidth: 500 }}>
            <div style={{
              background: 'linear-gradient(135deg, var(--c1), var(--c2))',
              padding: '20px 24px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Package size={22} color="var(--c5)" />
                <div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, margin: 0 }}>
                    My Past Orders
                  </h3>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    Customer: {username}@bloomboard.shop
                  </span>
                </div>
              </div>
              <button className="btn-icon" onClick={() => setIsMyOrdersOpen(false)}>
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: 24, maxHeight: 440, overflowY: 'auto' }}>
              {loadingOrders ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                  <span style={{ fontSize: 24 }}>⏳</span>
                  <p style={{ marginTop: 8 }}>Fetching order history…</p>
                </div>
              ) : myOrders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                  <span style={{ fontSize: 42 }}>📦</span>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: 16, marginTop: 12 }}>No past orders found.</p>
                  <p style={{ fontSize: 12, color: 'var(--text-faint)' }}>Place your first order to see history here!</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {myOrders.map(ord => (
                    <div
                      key={ord.orderId}
                      style={{
                        background: 'var(--c1)',
                        border: '1.5px solid var(--border)',
                        borderRadius: 'var(--radius-md)',
                        padding: 16
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                        <div>
                          <span style={{ fontSize: 11, color: 'var(--text-faint)', textTransform: 'uppercase' }}>Order Reference</span>
                          <p style={{ fontWeight: 700, fontFamily: 'monospace', color: 'var(--c3)', margin: 0, fontSize: 13 }}>
                            #{ord.orderId.substring(0, 14)}…
                          </p>
                        </div>
                        <span className={
                          ord.status === 'DELIVERED' ? 'badge badge-active' :
                          ord.status === 'SHIPPED' ? 'badge' : 'badge-discount'
                        }>
                          {ord.status}
                        </span>
                      </div>

                      {/* 4-Stage Visual Status Timeline */}
                      <OrderStatusTimeline status={ord.status} />

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12, color: 'var(--text-muted)', marginTop: 10 }}>
                        <div>
                          <span>Delivery Date:</span>
                          <p style={{ fontWeight: 600, color: 'var(--text)', margin: '2px 0 0' }}>
                            {ord.deliveryDate ? ord.deliveryDate.split('T')[0] : 'Standard'}
                          </p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span>Total Paid:</span>
                          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: 'var(--c5)', margin: '2px 0 0' }}>
                            ₹{ord.totalAmount ? ord.totalAmount.toFixed(2) : '0.00'}
                          </p>
                        </div>
                      </div>

                      {/* Zomato-style Doorstep Delivery OTP Card - ONLY when rider triggers OTP at doorstep */}
                      {ord.status !== 'DELIVERED' && ord.otpTriggered && (
                        <div style={{ background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)', color: '#FFFFFF', borderRadius: 10, padding: '14px 16px', marginTop: 12, boxShadow: '0 4px 14px rgba(2,132,199,0.35)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#BAE6FD' }}>
                              🛵 Rider at your Doorstep!
                            </span>
                            <span style={{ fontSize: 11, background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: 12 }}>Live</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <p style={{ fontSize: 12, margin: 0, opacity: 0.9 }}>Share this OTP with delivery rider:</p>
                              <p style={{ fontFamily: 'monospace', fontSize: 24, fontWeight: 900, letterSpacing: '4px', margin: '2px 0 0', color: '#FFFFFF' }}>
                                {ord.deliveryOtp}
                              </p>
                            </div>
                            <span style={{ fontSize: 28 }}>🔑</span>
                          </div>
                        </div>
                      )}

                      {ord.status !== 'DELIVERED' && !ord.otpTriggered && (
                        <div style={{ marginTop: 10, padding: '10px 14px', background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#475569', borderRadius: 8, fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 16 }}>🛵</span>
                          <span>
                            {ord.status === 'SHIPPED' ? 'Delivery rider is on the way. OTP will appear when rider arrives at doorstep.' : 'Order being prepared. OTP will appear when rider arrives at doorstep.'}
                          </span>
                        </div>
                      )}

                      {ord.status === 'DELIVERED' && (
                        <div style={{ marginTop: 10, padding: '8px 12px', background: 'var(--sage-bg)', color: 'var(--sage)', borderRadius: 6, fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <CheckCircle2 size={16} /> Order Delivered & Handover Verified via OTP
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', background: 'var(--c1)', textAlign: 'right' }}>
              <button className="btn-primary" onClick={() => setIsMyOrdersOpen(false)} style={{ padding: '8px 20px', fontSize: 13 }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MULTI-STEP CHECKOUT MODAL ── */}
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
                  {/* Free Delivery Threshold Banner (₹200) */}
                  <div style={{
                    background: deliveryFee === 0 ? 'var(--sage-bg)' : '#FFF7ED',
                    border: deliveryFee === 0 ? '1px solid var(--sage)' : '1px solid #FFEDD5',
                    borderRadius: 'var(--radius-md)',
                    padding: '10px 14px',
                    fontSize: 12,
                    color: deliveryFee === 0 ? 'var(--sage)' : '#C2410C',
                    marginBottom: 16,
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <span>
                      {deliveryFee === 0 
                        ? '🎉 You unlocked FREE Express Delivery!' 
                        : `Add ₹${amountNeededForFreeShipping.toFixed(2)} more to get FREE Express Delivery (Orders > ₹200)`}
                    </span>
                  </div>

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
                            padding: '10px 14px'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <img
                              src={getFlowerImage(ci.product)}
                              alt={ci.product}
                              style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover' }}
                            />
                            <div>
                              <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', margin: 0 }}>{ci.product}</p>
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
                      <span>{deliveryFee === 0 ? <strong style={{ color: 'var(--sage)' }}>FREE (&gt; ₹200)</strong> : `₹${deliveryFee}`}</span>
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
                {/* Location Detection Banner */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(154,178,224,0.2), rgba(255,233,233,0.3))',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 16px',
                  marginBottom: 16,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Navigation size={18} color="var(--c5)" className={isDetectingLocation ? 'spin' : ''} />
                    <div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>Auto-Detect Location</span>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
                        {locationStatus || 'Use device GPS to auto-fill address'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={detectLocation}
                    disabled={isDetectingLocation}
                    className="btn-ghost"
                    style={{ padding: '6px 12px', fontSize: 12 }}
                  >
                    {isDetectingLocation ? 'Detecting...' : '📍 Detect Now'}
                  </button>
                </div>

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
                    id="btn-proceed-paymock"
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
                    id="btn-paymock-submit"
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

                  {/* Delivery Verification OTP Note */}
                  <div style={{
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: 10,
                    padding: '12px 16px',
                    marginBottom: 14,
                    fontSize: 12,
                    color: '#475569',
                    textAlign: 'center'
                  }}>
                    🚚 Your <strong>Delivery Verification OTP</strong> will be revealed in <strong>My Orders</strong> once your florist dispatches your package (Out for Delivery).
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

      {/* ── CUSTOMER VERIFY OTP MODAL ── */}
      {customerOtpModalOrder && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setCustomerOtpModalOrder(null)}>
          <div className="modal-card" style={{ maxWidth: 420 }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', background: 'linear-gradient(135deg, #0284C7, #0369A1)', color: '#FFFFFF' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShieldCheck size={20} /> Confirm Delivery Receipt
              </h3>
              <span style={{ fontSize: 12, opacity: 0.85 }}>Order #{customerOtpModalOrder.orderId.substring(0, 10)}…</span>
            </div>

            <form onSubmit={handleCustomerVerifyOtpSubmit} style={{ padding: 24 }}>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                Enter your 6-digit Delivery OTP (or the code from your delivery agent) to complete delivery:
              </p>

              <div style={{ marginBottom: 16 }}>
                <input
                  type="text"
                  maxLength="6"
                  className="field-input"
                  placeholder="Enter 6-digit OTP"
                  value={customerInputOtp}
                  onChange={e => setCustomerInputOtp(e.target.value)}
                  style={{ textAlign: 'center', fontSize: 22, letterSpacing: '4px', fontWeight: 800, fontFamily: 'monospace' }}
                  required
                  autoFocus
                />
              </div>

              {customerOtpError && (
                <div style={{ background: 'var(--crimson-bg)', color: 'var(--crimson)', padding: 10, borderRadius: 8, fontSize: 12, marginBottom: 16 }}>
                  {customerOtpError}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                <button type="button" className="btn-ghost" onClick={() => setCustomerOtpModalOrder(null)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={verifyingCustomerOtp} style={{ background: '#0284C7' }}>
                  {verifyingCustomerOtp ? 'Verifying...' : 'Verify OTP & Mark Delivered 🎉'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
