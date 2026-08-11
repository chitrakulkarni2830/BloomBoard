import React, { useState, useEffect } from 'react';
import { CalendarDays, Package, Search, AlertCircle, ShoppingCart, X, LogOut } from 'lucide-react';
import Login from './Login';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [userRole, setUserRole] = useState(localStorage.getItem('role'));
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [products, setProducts] = useState([]);
  
  // Form State
  const [formData, setFormData] = useState({
    productId: '',
    supplierName: '',
    quantity: '',
    purchasePrice: '',
    expiryDate: ''
  });

  const fetchBatches = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/inventory/batches', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.status === 401) {
        handleLogout();
        throw new Error('Session expired');
      }
      if (!response.ok) throw new Error('Failed to fetch batches');
      const data = await response.json();
      setBatches(data);
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
        if (data.length > 0) {
          setFormData(prev => ({ ...prev, productId: data[0].id }));
        }
      }
    } catch (err) {
      console.error('Failed to fetch products', err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchBatches();
      fetchProducts();
    }
  }, [token]);

  const handleLoginSuccess = (newToken, username, role) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('role', role);
    setToken(newToken);
    setUserRole(role);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    setToken(null);
    setUserRole(null);
  };

  if (!token) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({
      productId: products.length > 0 ? products[0].id : '',
      supplierName: '',
      quantity: '',
      purchasePrice: '',
      expiryDate: ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Add time to the end of the date string to match LocalDateTime required by backend
      const expiryDateTime = `${formData.expiryDate}T00:00:00`;
      
      const payload = {
        productId: formData.productId,
        supplierName: formData.supplierName,
        quantity: parseInt(formData.quantity, 10),
        purchasePrice: parseFloat(formData.purchasePrice),
        expiryDate: expiryDateTime
      };

      const response = await fetch('http://localhost:8080/api/inventory/batches', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Failed to create batch');
      
      await fetchBatches(); // Refresh data
      handleCloseModal();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col relative">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-rose-100 p-2 rounded-lg">
              <Package className="w-6 h-6 text-rose-600" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">BloomBoard</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search inventory..."
                className="pl-10 pr-4 py-2 bg-slate-100 border-transparent rounded-full text-sm focus:bg-white focus:border-rose-300 focus:ring-2 focus:ring-rose-200 transition-all outline-none w-64"
              />
            </div>
            <button className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
              <ShoppingCart className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full"></span>
            </button>
            <button 
              onClick={handleLogout}
              className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors flex items-center gap-2"
              title="Logout"
            >
              <LogOut className="w-5 h-5 text-slate-500" />
            </button>
            <div className="flex items-center gap-2 ml-2">
              <img
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin"
                alt="User profile"
                className="w-8 h-8 rounded-full border border-slate-200 bg-slate-100"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Inventory Dashboard</h2>
            <p className="text-slate-500 mt-1">Manage your perishable stock and monitor expirations.</p>
          </div>
          <button 
            onClick={handleOpenModal}
            className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm shadow-rose-200"
          >
            + Receive New Batch
          </button>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="bg-blue-50 p-4 rounded-xl text-blue-600">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Active Batches</p>
              <p className="text-2xl font-bold text-slate-900">{batches.length}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="bg-rose-50 p-4 rounded-xl text-rose-600">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Low Stock / Urgent</p>
              <p className="text-2xl font-bold text-slate-900">
                {batches.filter(b => b.quantity < 100).length}
              </p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="bg-emerald-50 p-4 rounded-xl text-emerald-600">
              <CalendarDays className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">System Status</p>
              <p className="text-2xl font-bold text-slate-900">
                {error ? 'Offline' : 'Online'}
              </p>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-8 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
            <button onClick={fetchBatches} className="text-sm font-medium underline">Retry</button>
          </div>
        )}

        {/* Inventory Table */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
            <h3 className="font-semibold text-slate-800">Current Batches</h3>
            <div className="flex gap-2">
              <select className="bg-white border border-slate-200 text-sm rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-rose-200">
                <option>Sort by: Expiry (Earliest)</option>
                <option>Sort by: Quantity</option>
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 font-medium">Batch ID</th>
                  <th className="px-6 py-3 font-medium">Product</th>
                  <th className="px-6 py-3 font-medium">SKU</th>
                  <th className="px-6 py-3 font-medium">Available Qty</th>
                  <th className="px-6 py-3 font-medium">Expiry Date</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-slate-500">
                      Loading inventory...
                    </td>
                  </tr>
                ) : batches.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-slate-500">
                      No active batches found in the system.
                    </td>
                  </tr>
                ) : (
                  batches.map((batch) => (
                    <tr key={batch.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-slate-400" title={batch.id}>
                        #{batch.id.substring(0,8)}...
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-900">{batch.product}</td>
                      <td className="px-6 py-4 text-slate-500">{batch.sku}</td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-slate-700">{batch.quantity}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <CalendarDays className="w-4 h-4 text-slate-400" />
                          <span className="text-slate-600">{batch.expiryDate}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                            batch.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {batch.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Receive Batch Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Receive New Batch</h3>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Product</label>
                  <select 
                    name="productId"
                    value={formData.productId}
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-rose-200"
                    required
                  >
                    {products.length === 0 && <option value="">Loading products...</option>}
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Supplier Name</label>
                  <input
                    type="text"
                    name="supplierName"
                    value={formData.supplierName}
                    onChange={handleInputChange}
                    placeholder="e.g. Dutch Farms Ltd"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-rose-200"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Quantity</label>
                    <input
                      type="number"
                      name="quantity"
                      min="1"
                      value={formData.quantity}
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-rose-200"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Unit Price ($)</label>
                    <input
                      type="number"
                      name="purchasePrice"
                      step="0.01"
                      min="0.01"
                      value={formData.purchasePrice}
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-rose-200"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Expiry Date</label>
                  <input
                    type="date"
                    name="expiryDate"
                    value={formData.expiryDate}
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-rose-200"
                    required
                  />
                </div>
              </div>
              
              <div className="mt-8 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm shadow-rose-200"
                >
                  Save Batch
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
