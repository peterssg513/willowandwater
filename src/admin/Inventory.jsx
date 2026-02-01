import { useState, useEffect } from 'react';
import { 
  Package, 
  Plus, 
  RefreshCw,
  AlertTriangle,
  ExternalLink,
  Minus,
  Edit2,
  Trash2,
  Search
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { formatPrice } from '../utils/pricingLogic';

const CATEGORIES = ['supplies', 'equipment', 'consumables', 'other'];

const Inventory = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .order('status', { ascending: true })
        .order('name');

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId, delta) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    const newQuantity = Math.max(0, item.quantity + delta);
    
    try {
      await supabase
        .from('inventory')
        .update({ quantity: newQuantity })
        .eq('id', itemId);
      
      setItems(prev => prev.map(i => 
        i.id === itemId 
          ? { ...i, quantity: newQuantity, status: getStatus(newQuantity, i.reorder_threshold) }
          : i
      ));
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };

  const getStatus = (quantity, threshold) => {
    if (quantity <= 0) return 'out_of_stock';
    if (quantity <= threshold) return 'low_stock';
    return 'in_stock';
  };

  const deleteItem = async (itemId) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    try {
      await supabase.from('inventory').delete().eq('id', itemId);
      setItems(prev => prev.filter(i => i.id !== itemId));
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = !searchQuery || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const lowStockItems = items.filter(i => i.status === 'low_stock' || i.status === 'out_of_stock');

  const getStatusBadge = (status) => {
    const styles = {
      in_stock: 'bg-green-100 text-green-700',
      low_stock: 'bg-yellow-100 text-yellow-700',
      out_of_stock: 'bg-red-100 text-red-700',
    };
    const labels = {
      in_stock: 'In Stock',
      low_stock: 'Low Stock',
      out_of_stock: 'Out of Stock',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
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
          <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Item
          </button>
          <button onClick={fetchInventory} className="btn-secondary">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <h3 className="font-inter font-semibold text-yellow-800 flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5" />
            {lowStockItems.length} item{lowStockItems.length !== 1 ? 's' : ''} need reordering
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {lowStockItems.map(item => (
              <div key={item.id} className="flex items-center justify-between bg-white rounded-lg p-3">
                <div>
                  <p className="font-inter font-medium text-charcoal text-sm">{item.name}</p>
                  <p className="text-xs text-yellow-700">
                    {item.quantity} {item.unit} left
                  </p>
                </div>
                {item.purchase_url && (
                  <a
                    href={item.purchase_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-3 py-1.5 bg-sage text-white rounded-lg text-xs hover:bg-sage/90"
                  >
                    Order <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-charcoal/5 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/40" />
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-2 bg-bone border border-charcoal/10 rounded-xl
                         font-inter focus:outline-none focus:ring-2 focus:ring-sage"
            />
          </div>
          
          {/* Category Filter */}
          <div className="flex gap-2">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-4 py-2 rounded-xl text-sm font-inter transition-all ${
                categoryFilter === 'all' 
                  ? 'bg-sage text-white' 
                  : 'bg-charcoal/5 text-charcoal/70 hover:bg-charcoal/10'
              }`}
            >
              All
            </button>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-4 py-2 rounded-xl text-sm font-inter capitalize transition-all ${
                  categoryFilter === cat 
                    ? 'bg-sage text-white' 
                    : 'bg-charcoal/5 text-charcoal/70 hover:bg-charcoal/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-charcoal/5 overflow-hidden">
        {filteredItems.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-charcoal/10">
                  <th className="text-left p-4 font-inter font-semibold text-charcoal">Item</th>
                  <th className="text-left p-4 font-inter font-semibold text-charcoal">Category</th>
                  <th className="text-center p-4 font-inter font-semibold text-charcoal">Quantity</th>
                  <th className="text-center p-4 font-inter font-semibold text-charcoal">Status</th>
                  <th className="text-center p-4 font-inter font-semibold text-charcoal">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal/5">
                {filteredItems.map(item => (
                  <tr key={item.id} className="hover:bg-bone/30">
                    <td className="p-4">
                      <p className="font-inter font-medium text-charcoal">{item.name}</p>
                      {item.cost_per_unit && (
                        <p className="text-xs text-charcoal/50">
                          {formatPrice(item.cost_per_unit)}/{item.unit}
                        </p>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-charcoal/60 capitalize">{item.category}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-charcoal/5 
                                     hover:bg-charcoal/10 transition-colors"
                        >
                          <Minus className="w-4 h-4 text-charcoal" />
                        </button>
                        <span className="w-12 text-center font-inter font-semibold text-charcoal">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-charcoal/5 
                                     hover:bg-charcoal/10 transition-colors"
                        >
                          <Plus className="w-4 h-4 text-charcoal" />
                        </button>
                      </div>
                      <p className="text-xs text-charcoal/40 text-center mt-1">
                        Reorder at {item.reorder_threshold}
                      </p>
                    </td>
                    <td className="p-4 text-center">
                      {getStatusBadge(item.status)}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        {item.purchase_url && (
                          <a
                            href={item.purchase_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 hover:bg-sage/10 rounded-lg transition-colors"
                            title="Order"
                          >
                            <ExternalLink className="w-4 h-4 text-sage" />
                          </a>
                        )}
                        <button
                          onClick={() => setEditingItem(item)}
                          className="p-2 hover:bg-charcoal/5 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4 text-charcoal/50" />
                        </button>
                        <button
                          onClick={() => deleteItem(item.id)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <Package className="w-12 h-12 text-charcoal/20 mx-auto mb-4" />
            <h3 className="font-inter font-medium text-charcoal mb-1">No items found</h3>
            <p className="text-charcoal/50 text-sm mb-4">
              {searchQuery || categoryFilter !== 'all' 
                ? 'Try adjusting your filters' 
                : 'Add your first inventory item'
              }
            </p>
            {!searchQuery && categoryFilter === 'all' && (
              <button onClick={() => setShowAddModal(true)} className="btn-primary">
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </button>
            )}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || editingItem) && (
        <InventoryModal
          item={editingItem}
          onClose={() => { setShowAddModal(false); setEditingItem(null); }}
          onSave={() => { setShowAddModal(false); setEditingItem(null); fetchInventory(); }}
        />
      )}
    </div>
  );
};

// Inventory Modal
const InventoryModal = ({ item, onClose, onSave }) => {
  const isEditing = !!item;
  const [formData, setFormData] = useState({
    name: item?.name || '',
    category: item?.category || 'supplies',
    quantity: item?.quantity ?? 0,
    unit: item?.unit || 'units',
    reorder_threshold: item?.reorder_threshold ?? 5,
    reorder_quantity: item?.reorder_quantity ?? 10,
    purchase_url: item?.purchase_url || '',
    cost_per_unit: item?.cost_per_unit || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) {
      setError('Name is required');
      return;
    }

    setSaving(true);
    try {
      const data = {
        name: formData.name.trim(),
        category: formData.category,
        quantity: parseInt(formData.quantity) || 0,
        unit: formData.unit.trim() || 'units',
        reorder_threshold: parseInt(formData.reorder_threshold) || 5,
        reorder_quantity: parseInt(formData.reorder_quantity) || 10,
        purchase_url: formData.purchase_url.trim() || null,
        cost_per_unit: formData.cost_per_unit ? parseFloat(formData.cost_per_unit) : null,
      };

      if (isEditing) {
        await supabase.from('inventory').update(data).eq('id', item.id);
      } else {
        await supabase.from('inventory').insert(data);
      }

      onSave();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-charcoal/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-charcoal/10">
          <h2 className="font-playfair text-xl font-semibold text-charcoal">
            {isEditing ? 'Edit Item' : 'Add Inventory Item'}
          </h2>
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
              placeholder="All-Purpose Cleaner"
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
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat} className="capitalize">{cat}</option>
                ))}
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
                placeholder="bottles, packs, etc."
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1.5">Quantity</label>
              <input
                type="number"
                min="0"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="w-full px-4 py-3 bg-bone border border-charcoal/10 rounded-xl font-inter
                           focus:outline-none focus:ring-2 focus:ring-sage"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1.5">Reorder At</label>
              <input
                type="number"
                min="0"
                value={formData.reorder_threshold}
                onChange={(e) => setFormData({ ...formData, reorder_threshold: e.target.value })}
                className="w-full px-4 py-3 bg-bone border border-charcoal/10 rounded-xl font-inter
                           focus:outline-none focus:ring-2 focus:ring-sage"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1.5">Cost/Unit</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.cost_per_unit}
                onChange={(e) => setFormData({ ...formData, cost_per_unit: e.target.value })}
                className="w-full px-4 py-3 bg-bone border border-charcoal/10 rounded-xl font-inter
                           focus:outline-none focus:ring-2 focus:ring-sage"
                placeholder="$"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-charcoal mb-1.5">Purchase URL</label>
            <input
              type="url"
              value={formData.purchase_url}
              onChange={(e) => setFormData({ ...formData, purchase_url: e.target.value })}
              className="w-full px-4 py-3 bg-bone border border-charcoal/10 rounded-xl font-inter
                         focus:outline-none focus:ring-2 focus:ring-sage"
              placeholder="https://amazon.com/..."
            />
            <p className="text-xs text-charcoal/50 mt-1">Link to reorder this item</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 rounded-xl p-3 text-sm">{error}</div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? 'Saving...' : isEditing ? 'Update' : 'Add Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Inventory;
