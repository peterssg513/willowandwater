import { useState, useEffect } from 'react';
import { 
  Package, 
  Search, 
  Plus,
  RefreshCw,
  AlertTriangle,
  Edit,
  Trash2,
  ArrowUp,
  ArrowDown,
  X,
  Check,
  ShoppingCart,
  ExternalLink,
  Truck,
  ClipboardList
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const Inventory = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // all, low_stock, out_of_stock
  const [selectedItem, setSelectedItem] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showReorderModal, setShowReorderModal] = useState(false);
  const [reorderItem, setReorderItem] = useState(null);
  const [showReorderList, setShowReorderList] = useState(false);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .order('name');

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      // If table doesn't exist yet, just set empty
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter(item => {
    // Status filter
    if (filter === 'low_stock' && item.status !== 'low_stock') return false;
    if (filter === 'out_of_stock' && item.status !== 'out_of_stock') return false;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        item.name?.toLowerCase().includes(query) ||
        item.category?.toLowerCase().includes(query) ||
        item.supplier?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const lowStockCount = items.filter(i => i.status === 'low_stock' || i.status === 'out_of_stock').length;

  const getStatusBadge = (status) => {
    const styles = {
      in_stock: 'bg-green-100 text-green-700',
      low_stock: 'bg-yellow-100 text-yellow-700',
      out_of_stock: 'bg-red-100 text-red-700',
      discontinued: 'bg-gray-100 text-gray-700'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-inter font-medium ${styles[status] || ''}`}>
        {status?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
      </span>
    );
  };

  const adjustQuantity = async (itemId, change, type = 'adjustment') => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    const newQuantity = Math.max(0, item.quantity + change);

    try {
      await supabase
        .from('inventory')
        .update({ quantity: newQuantity })
        .eq('id', itemId);

      // Log transaction
      await supabase.from('inventory_transactions').insert({
        inventory_id: itemId,
        type: type,
        quantity: change,
        notes: `${type === 'restock' ? 'Restocked' : 'Adjusted'} by ${Math.abs(change)}`
      });

      setItems(prev => prev.map(i => {
        if (i.id !== itemId) return i;
        const qty = newQuantity;
        let status = 'in_stock';
        if (qty <= 0) status = 'out_of_stock';
        else if (qty <= i.min_quantity) status = 'low_stock';
        return { ...i, quantity: qty, status };
      }));
    } catch (error) {
      console.error('Error adjusting quantity:', error);
    }
  };

  const deleteItem = async (itemId) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      await supabase.from('inventory').delete().eq('id', itemId);
      setItems(prev => prev.filter(i => i.id !== itemId));
      setSelectedItem(null);
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const formatPrice = (price) => {
    if (!price) return '—';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
  };

  // Items that need reordering
  const itemsToReorder = items.filter(i => i.status === 'low_stock' || i.status === 'out_of_stock');

  // Open reorder modal for a single item
  const openReorder = (item, e) => {
    if (e) e.stopPropagation();
    setReorderItem(item);
    setShowReorderModal(true);
  };

  // Mark item as reordered (update last_restock_at and add restock quantity)
  const markAsReordered = async (itemId, quantityOrdered) => {
    try {
      const { error } = await supabase
        .from('inventory')
        .update({ 
          last_restock_at: new Date().toISOString(),
          notes: `Reordered ${quantityOrdered} units on ${new Date().toLocaleDateString()}`
        })
        .eq('id', itemId);

      if (error) throw error;

      // Log transaction
      await supabase.from('inventory_transactions').insert({
        inventory_id: itemId,
        type: 'restock',
        quantity: quantityOrdered,
        notes: `Reorder placed for ${quantityOrdered} units`
      });

      fetchInventory();
    } catch (error) {
      console.error('Error marking as reordered:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-sage border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-playfair text-2xl sm:text-3xl font-semibold text-charcoal">
            Inventory
          </h1>
          <p className="text-charcoal/60 font-inter mt-1">
            {items.length} items tracked
          </p>
        </div>
        <div className="flex items-center gap-2">
          {itemsToReorder.length > 0 && (
            <button 
              onClick={() => setShowReorderList(true)} 
              className="btn-secondary flex items-center gap-2 text-yellow-700 border-yellow-300 hover:bg-yellow-50"
            >
              <ShoppingCart className="w-4 h-4" />
              Reorder ({itemsToReorder.length})
            </button>
          )}
          <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Item
          </button>
          <button onClick={fetchInventory} className="btn-secondary flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockCount > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600" />
          <div className="flex-1">
            <p className="font-inter font-medium text-yellow-800">
              {lowStockCount} item{lowStockCount !== 1 ? 's' : ''} need{lowStockCount === 1 ? 's' : ''} attention
            </p>
            <p className="text-sm text-yellow-700">Low stock or out of stock items require reordering</p>
          </div>
          <button
            onClick={() => setFilter('low_stock')}
            className="text-yellow-700 hover:text-yellow-900 text-sm font-inter font-medium"
          >
            View →
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-charcoal/5 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Filter Tabs */}
          <div className="flex bg-bone rounded-lg p-1">
            {[
              { key: 'all', label: 'All' },
              { key: 'low_stock', label: 'Low Stock' },
              { key: 'out_of_stock', label: 'Out of Stock' }
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-4 py-2 rounded-lg font-inter text-sm transition-colors ${
                  filter === f.key ? 'bg-white shadow text-charcoal' : 'text-charcoal/60 hover:text-charcoal'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/40" />
            <input
              type="text"
              placeholder="Search inventory..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-2.5 bg-bone border border-charcoal/10 rounded-xl
                         font-inter text-sm focus:outline-none focus:ring-2 focus:ring-sage"
            />
          </div>
        </div>
      </div>

      {/* Inventory List */}
      <div className="bg-white rounded-2xl shadow-sm border border-charcoal/5 overflow-hidden">
        {filteredItems.length > 0 ? (
          <div className="divide-y divide-charcoal/5">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className="p-4 hover:bg-bone/50 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-inter font-semibold text-charcoal">{item.name}</h3>
                      {getStatusBadge(item.status)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-charcoal/60">
                      <span className="capitalize">{item.category}</span>
                      <span>•</span>
                      <span>{item.supplier}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-semibold ${
                      item.quantity <= 0 ? 'text-red-600' :
                      item.quantity <= item.min_quantity ? 'text-yellow-600' : 'text-charcoal'
                    }`}>
                      {item.quantity}
                    </p>
                    <p className="text-xs text-charcoal/50">{item.unit}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {(item.status === 'low_stock' || item.status === 'out_of_stock') && (
                      <button
                        onClick={(e) => openReorder(item, e)}
                        className="p-2 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 rounded-lg"
                        title="Reorder"
                      >
                        <Truck className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); adjustQuantity(item.id, -1, 'used'); }}
                      className="p-2 text-charcoal/50 hover:text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); adjustQuantity(item.id, 1, 'restock'); }}
                      className="p-2 text-charcoal/50 hover:text-green-600 hover:bg-green-50 rounded-lg"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <Package className="w-12 h-12 text-charcoal/20 mx-auto mb-4" />
            <h3 className="font-inter font-medium text-charcoal mb-1">No inventory items</h3>
            <p className="text-charcoal/50 text-sm mb-4">
              {searchQuery ? 'Try adjusting your search' : 'Add your first inventory item to start tracking'}
            </p>
            <button onClick={() => setShowAddModal(true)} className="btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </button>
          </div>
        )}
      </div>

      {/* Item Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-charcoal/50" onClick={() => setSelectedItem(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-charcoal/10">
              <div className="flex items-center justify-between">
                <h2 className="font-playfair text-xl font-semibold text-charcoal">{selectedItem.name}</h2>
                {getStatusBadge(selectedItem.status)}
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-charcoal/50 mb-1">Quantity</p>
                  <p className={`text-2xl font-semibold ${
                    selectedItem.quantity <= 0 ? 'text-red-600' :
                    selectedItem.quantity <= selectedItem.min_quantity ? 'text-yellow-600' : 'text-charcoal'
                  }`}>
                    {selectedItem.quantity} <span className="text-sm text-charcoal/50">{selectedItem.unit}</span>
                  </p>
                </div>
                <div>
                  <p className="text-xs text-charcoal/50 mb-1">Reorder At</p>
                  <p className="text-lg font-semibold text-charcoal">{selectedItem.min_quantity} {selectedItem.unit}</p>
                </div>
                <div>
                  <p className="text-xs text-charcoal/50 mb-1">Cost Per Unit</p>
                  <p className="font-inter text-charcoal">{formatPrice(selectedItem.cost_per_unit)}</p>
                </div>
                <div>
                  <p className="text-xs text-charcoal/50 mb-1">Category</p>
                  <p className="font-inter text-charcoal capitalize">{selectedItem.category}</p>
                </div>
              </div>

              {selectedItem.supplier && (
                <div className="bg-bone/50 rounded-xl p-4">
                  <p className="text-xs text-charcoal/50 mb-1">Supplier</p>
                  <p className="font-inter text-charcoal">{selectedItem.supplier}</p>
                  {selectedItem.supplier_url && (
                    <a
                      href={selectedItem.supplier_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-sage hover:underline flex items-center gap-1 mt-2"
                    >
                      Order More <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )}

              {/* Quick Adjust */}
              <div className="bg-sage/10 rounded-xl p-4">
                <p className="text-sm font-medium text-charcoal mb-3">Quick Adjust</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => adjustQuantity(selectedItem.id, -5, 'used')}
                    className="px-3 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200"
                  >
                    -5
                  </button>
                  <button
                    onClick={() => adjustQuantity(selectedItem.id, -1, 'used')}
                    className="px-3 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200"
                  >
                    -1
                  </button>
                  <div className="flex-1 text-center font-semibold">{selectedItem.quantity}</div>
                  <button
                    onClick={() => adjustQuantity(selectedItem.id, 1, 'restock')}
                    className="px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200"
                  >
                    +1
                  </button>
                  <button
                    onClick={() => adjustQuantity(selectedItem.id, 5, 'restock')}
                    className="px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200"
                  >
                    +5
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-charcoal/10 flex gap-3">
              <button
                onClick={() => deleteItem(selectedItem.id)}
                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-xl text-sm flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
              <div className="flex-1" />
              {(selectedItem.status === 'low_stock' || selectedItem.status === 'out_of_stock') && (
                <button 
                  onClick={() => { setSelectedItem(null); openReorder(selectedItem); }}
                  className="btn-secondary flex items-center gap-2 text-yellow-700"
                >
                  <Truck className="w-4 h-4" />
                  Reorder
                </button>
              )}
              <button onClick={() => setSelectedItem(null)} className="btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      {showAddModal && (
        <AddItemModal
          onClose={() => setShowAddModal(false)}
          onAdd={(newItem) => {
            setItems(prev => [...prev, newItem]);
            setShowAddModal(false);
          }}
        />
      )}

      {/* Reorder Modal - Single Item */}
      {showReorderModal && reorderItem && (
        <ReorderModal
          item={reorderItem}
          onClose={() => { setShowReorderModal(false); setReorderItem(null); }}
          onReorder={(qty) => {
            markAsReordered(reorderItem.id, qty);
            setShowReorderModal(false);
            setReorderItem(null);
          }}
        />
      )}

      {/* Reorder List Modal - All Low Stock Items */}
      {showReorderList && (
        <ReorderListModal
          items={itemsToReorder}
          onClose={() => setShowReorderList(false)}
          onReorder={(itemId, qty) => markAsReordered(itemId, qty)}
          formatPrice={formatPrice}
        />
      )}
    </div>
  );
};

// Add Item Modal Component
const AddItemModal = ({ onClose, onAdd }) => {
  const [formData, setFormData] = useState({
    name: '',
    category: 'supplies',
    quantity: 0,
    min_quantity: 5,
    unit: 'units',
    cost_per_unit: '',
    supplier: '',
    supplier_url: ''
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { data, error } = await supabase
        .from('inventory')
        .insert({
          ...formData,
          cost_per_unit: formData.cost_per_unit ? parseFloat(formData.cost_per_unit) : null,
          status: formData.quantity <= 0 ? 'out_of_stock' : 
                  formData.quantity <= formData.min_quantity ? 'low_stock' : 'in_stock'
        })
        .select()
        .single();

      if (error) throw error;
      onAdd(data);
    } catch (error) {
      console.error('Error adding item:', error);
      alert('Failed to add item');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-charcoal/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-charcoal/10">
          <h2 className="font-playfair text-xl font-semibold text-charcoal">Add Inventory Item</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1.5">Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 bg-bone border border-charcoal/10 rounded-xl font-inter
                         focus:outline-none focus:ring-2 focus:ring-sage"
              placeholder="Branch Basics Concentrate"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1.5">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-3 bg-bone border border-charcoal/10 rounded-xl font-inter
                           focus:outline-none focus:ring-2 focus:ring-sage"
              >
                <option value="supplies">Supplies</option>
                <option value="chemicals">Chemicals</option>
                <option value="equipment">Equipment</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1.5">Unit</label>
              <input
                type="text"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-4 py-3 bg-bone border border-charcoal/10 rounded-xl font-inter
                           focus:outline-none focus:ring-2 focus:ring-sage"
                placeholder="bottles, units, boxes"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1.5">Current Quantity</label>
              <input
                type="number"
                min="0"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-3 bg-bone border border-charcoal/10 rounded-xl font-inter
                           focus:outline-none focus:ring-2 focus:ring-sage"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1.5">Reorder At</label>
              <input
                type="number"
                min="0"
                value={formData.min_quantity}
                onChange={(e) => setFormData({ ...formData, min_quantity: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-3 bg-bone border border-charcoal/10 rounded-xl font-inter
                           focus:outline-none focus:ring-2 focus:ring-sage"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-charcoal mb-1.5">Cost Per Unit</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.cost_per_unit}
              onChange={(e) => setFormData({ ...formData, cost_per_unit: e.target.value })}
              className="w-full px-4 py-3 bg-bone border border-charcoal/10 rounded-xl font-inter
                         focus:outline-none focus:ring-2 focus:ring-sage"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-charcoal mb-1.5">Supplier</label>
            <input
              type="text"
              value={formData.supplier}
              onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
              className="w-full px-4 py-3 bg-bone border border-charcoal/10 rounded-xl font-inter
                         focus:outline-none focus:ring-2 focus:ring-sage"
              placeholder="Amazon, Branch Basics, etc."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {saving ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Add Item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Reorder Modal - Single Item
const ReorderModal = ({ item, onClose, onReorder }) => {
  const [quantity, setQuantity] = useState(item.min_quantity * 2 || 10);

  const handleReorder = () => {
    // Open supplier URL if available
    if (item.supplier_url) {
      window.open(item.supplier_url, '_blank');
    }
    onReorder(quantity);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-charcoal/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-6 border-b border-charcoal/10">
          <h2 className="font-playfair text-xl font-semibold text-charcoal">Reorder Item</h2>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-yellow-50 rounded-xl p-4">
            <h3 className="font-inter font-semibold text-charcoal">{item.name}</h3>
            <p className="text-sm text-charcoal/60 mt-1">
              Current: <span className="font-semibold text-red-600">{item.quantity}</span> {item.unit} 
              <span className="mx-2">•</span>
              Min: {item.min_quantity} {item.unit}
            </p>
            {item.supplier && (
              <p className="text-sm text-charcoal/60 mt-1">Supplier: {item.supplier}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-charcoal mb-1.5">Quantity to Order</label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              className="w-full px-4 py-3 bg-bone border border-charcoal/10 rounded-xl font-inter
                         focus:outline-none focus:ring-2 focus:ring-sage text-lg font-semibold"
            />
            {item.cost_per_unit && (
              <p className="text-sm text-charcoal/50 mt-2">
                Estimated cost: ${(quantity * item.cost_per_unit).toFixed(2)}
              </p>
            )}
          </div>

          {!item.supplier_url && (
            <div className="bg-sage/10 rounded-xl p-4">
              <p className="text-sm text-charcoal/70">
                <strong>Tip:</strong> Add a supplier URL to this item and clicking "Reorder Now" will open the order page automatically.
              </p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-charcoal/10 flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">
            Cancel
          </button>
          <button onClick={handleReorder} className="btn-primary flex-1 flex items-center justify-center gap-2">
            <Truck className="w-4 h-4" />
            {item.supplier_url ? 'Reorder Now' : 'Mark as Ordered'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Reorder List Modal - All Low Stock Items
const ReorderListModal = ({ items, onClose, onReorder, formatPrice }) => {
  const [reorderQuantities, setReorderQuantities] = useState(
    items.reduce((acc, item) => {
      acc[item.id] = item.min_quantity * 2 || 10;
      return acc;
    }, {})
  );
  const [orderedItems, setOrderedItems] = useState(new Set());

  const handleReorderItem = (item) => {
    if (item.supplier_url) {
      window.open(item.supplier_url, '_blank');
    }
    onReorder(item.id, reorderQuantities[item.id]);
    setOrderedItems(prev => new Set([...prev, item.id]));
  };

  const totalEstimatedCost = items.reduce((sum, item) => {
    if (orderedItems.has(item.id)) return sum;
    return sum + (reorderQuantities[item.id] * (item.cost_per_unit || 0));
  }, 0);

  const remainingItems = items.filter(i => !orderedItems.has(i.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-charcoal/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-charcoal/10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-playfair text-xl font-semibold text-charcoal flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-yellow-600" />
                Reorder List
              </h2>
              <p className="text-sm text-charcoal/60 mt-1">
                {remainingItems.length} items need reordering
              </p>
            </div>
            {totalEstimatedCost > 0 && (
              <div className="text-right">
                <p className="text-xs text-charcoal/50">Est. Total</p>
                <p className="font-semibold text-charcoal">{formatPrice(totalEstimatedCost)}</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {remainingItems.length > 0 ? (
            <div className="space-y-3">
              {remainingItems.map((item) => (
                <div key={item.id} className="bg-bone/50 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-inter font-semibold text-charcoal">{item.name}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          item.status === 'out_of_stock' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {item.quantity} left
                        </span>
                      </div>
                      <p className="text-sm text-charcoal/60">
                        {item.supplier || 'No supplier'} 
                        {item.cost_per_unit && ` • ${formatPrice(item.cost_per_unit)} each`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        value={reorderQuantities[item.id]}
                        onChange={(e) => setReorderQuantities(prev => ({
                          ...prev,
                          [item.id]: parseInt(e.target.value) || 1
                        }))}
                        className="w-20 px-3 py-2 bg-white border border-charcoal/10 rounded-lg font-inter text-center
                                   focus:outline-none focus:ring-2 focus:ring-sage"
                      />
                      <button
                        onClick={() => handleReorderItem(item)}
                        className="px-4 py-2 bg-sage text-white rounded-lg font-inter text-sm font-medium
                                   hover:bg-sage/90 flex items-center gap-2"
                      >
                        <Truck className="w-4 h-4" />
                        Order
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Check className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="font-inter font-medium text-charcoal mb-1">All items ordered!</h3>
              <p className="text-charcoal/50 text-sm">You've placed reorders for all low stock items.</p>
            </div>
          )}

          {orderedItems.size > 0 && remainingItems.length > 0 && (
            <div className="mt-6 pt-6 border-t border-charcoal/10">
              <p className="text-sm text-charcoal/50 mb-2">Recently Ordered</p>
              <div className="space-y-2">
                {items.filter(i => orderedItems.has(i.id)).map(item => (
                  <div key={item.id} className="flex items-center gap-2 text-sm text-green-600">
                    <Check className="w-4 h-4" />
                    <span>{item.name} - {reorderQuantities[item.id]} units ordered</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-charcoal/10">
          <button onClick={onClose} className="btn-secondary w-full">
            {orderedItems.size > 0 ? 'Done' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Inventory;
