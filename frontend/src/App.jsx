import React from 'react';
import { CalendarDays, Package, Search, AlertCircle, ShoppingCart } from 'lucide-react';

const MOCK_BATCHES = [
  { id: '1', product: 'Red Rose', sku: 'RSE-RED-01', quantity: 150, expiryDate: '2026-08-12', status: 'ACTIVE' },
  { id: '2', product: 'Red Rose', sku: 'RSE-RED-01', quantity: 200, expiryDate: '2026-08-15', status: 'ACTIVE' },
  { id: '3', product: 'Tulip White', sku: 'TLP-WHT-02', quantity: 50, expiryDate: '2026-08-11', status: 'ACTIVE' },
  { id: '4', product: 'Baby\'s Breath', sku: 'BTH-WHT-03', quantity: 300, expiryDate: '2026-08-20', status: 'ACTIVE' },
  { id: '5', product: 'Sunflower', sku: 'SUN-YEL-01', quantity: 0, expiryDate: '2026-08-10', status: 'DEPLETED' },
];

function App() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
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
            <img
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=Florist"
              alt="User profile"
              className="w-8 h-8 rounded-full border border-slate-200 bg-slate-100"
            />
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
          <button className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm shadow-rose-200">
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
              <p className="text-2xl font-bold text-slate-900">24</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="bg-rose-50 p-4 rounded-xl text-rose-600">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Expiring Soon (48h)</p>
              <p className="text-2xl font-bold text-slate-900">3</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="bg-emerald-50 p-4 rounded-xl text-emerald-600">
              <CalendarDays className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Avg. Shelf Life</p>
              <p className="text-2xl font-bold text-slate-900">4.2 Days</p>
            </div>
          </div>
        </div>

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
                {MOCK_BATCHES.map((batch) => (
                  <tr key={batch.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-slate-400">#{batch.id}</td>
                    <td className="px-6 py-4 font-medium text-slate-900">{batch.product}</td>
                    <td className="px-6 py-4 text-slate-500">{batch.sku}</td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-slate-700">{batch.quantity}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="w-4 h-4 text-slate-400" />
                        <span className={batch.expiryDate === '2026-08-11' ? 'text-rose-600 font-medium' : 'text-slate-600'}>
                          {batch.expiryDate}
                        </span>
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
