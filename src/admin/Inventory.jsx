import { useState, useEffect, useMemo } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Filter,
  AlertTriangle,
  TrendingDown,
  RefreshCw,
  Download,
  Edit2,
  Trash2,
  X,
  Save,
  ShoppingCart,
  Droplets,
  Sparkles,
  CheckCircle2,
  Clock,
  DollarSign,
  ExternalLink,
  BarChart3,
  History,
  Minus
} from 'lucide-react';
import { formatPrice } from '../utils/pricingLogic';

// Branch Basics product catalog
const BRANCH_BASICS_PRODUCTS = [
  { 
    id: 'bb-concentrate', 
    name: 'Branch Basics Concentrate', 
    brand: 'Branch Basics',
    category: 'concentrate',
    defaultUnit: 'bottle',
    defaultSize: '33 oz',
    defaultCost: 49.00,
    reorderUrl: 'https://branchbasics.com/products/the-concentrate',
    description: 'Multi-purpose plant and mineral-based concentrate',
    usagePerClean: 0.5, // oz per cleaning
  },
  { 
    id: 'bb-oxygen-boost', 
    name: 'Oxygen Boost', 
    brand: 'Branch Basics',
    category: 'additive',
    defaultUnit: 'bag',
    defaultSize: '2 lb',
    defaultCost: 25.00,
    reorderUrl: 'https://branchbasics.com/products/oxygen-boost',
    description: 'Sodium percarbonate for stain removal and whitening',
    usagePerClean: 0.25,
  },
  { 
    id: 'bb-starter-kit', 
    name: 'Starter Kit', 
    brand: 'Branch Basics',
    category: 'kit',
    defaultUnit: 'kit',
    defaultSize: '1 kit',
    defaultCost: 79.00,
    reorderUrl: 'https://branchbasics.com/products/starter-kit',
    description: 'Complete kit with bottles and concentrate',
    usagePerClean: 0,
  },
  { 
    id: 'bb-bathroom-bottle', 
    name: 'Bathroom Spray Bottle', 
    brand: 'Branch Basics',
    category: 'equipment',
    defaultUnit: 'bottle',
    defaultSize: '16 oz',
    defaultCost: 7.00,
    reorderUrl: 'https://branchbasics.com/products/plastic-spray-bottles',
    description: 'Refillable spray bottle for bathroom cleaner',
    usagePerClean: 0,
  },
  { 
    id: 'bb-allpurpose-bottle', 
    name: 'All-Purpose Spray Bottle', 
    brand: 'Branch Basics',
    category: 'equipment',
    defaultUnit: 'bottle',
    defaultSize: '16 oz',
    defaultCost: 7.00,
    reorderUrl: 'https://branchbasics.com/products/plastic-spray-bottles',
    description: 'Refillable spray bottle for all-purpose cleaner',
    usagePerClean: 0,
  },
  { 
    id: 'bb-streak-free-bottle', 
    name: 'Streak-Free Spray Bottle', 
    brand: 'Branch Basics',
    category: 'equipment',
    defaultUnit: 'bottle',
    defaultSize: '16 oz',
    defaultCost: 7.00,
    reorderUrl: 'https://branchbasics.com/products/plastic-spray-bottles',
    description: 'Refillable spray bottle for glass cleaner',
    usagePerClean: 0,
  },
  { 
    id: 'bb-foaming-wash', 
    name: 'Foaming Wash Bottle', 
    brand: 'Branch Basics',
    category: 'equipment',
    defaultUnit: 'bottle',
    defaultSize: '8 oz',
    defaultCost: 7.00,
    reorderUrl: 'https://branchbasics.com/products/foaming-wash-bottle',
    description: 'Foaming pump bottle for hand wash',
    usagePerClean: 0,
  },
];

// Additional common supplies
const COMMON_SUPPLIES = [
  { id: 'microfiber-cloths', name: 'Microfiber Cloths', brand: 'Generic', category: 'equipment', defaultUnit: 'pack', defaultSize: '12 pack', defaultCost: 15.00, usagePerClean: 0 },
  { id: 'sponges', name: 'Cleaning Sponges', brand: 'Generic', category: 'consumable', defaultUnit: 'pack', defaultSize: '6 pack', defaultCost: 8.00, usagePerClean: 0.2 },
  { id: 'scrub-brushes', name: 'Scrub Brushes', brand: 'Generic', category: 'equipment', defaultUnit: 'each', defaultSize: '1', defaultCost: 5.00, usagePerClean: 0 },
  { id: 'toilet-brush', name: 'Toilet Brushes', brand: 'Generic', category: 'equipment', defaultUnit: 'each', defaultSize: '1', defaultCost: 8.00, usagePerClean: 0 },
  { id: 'mop-heads', name: 'Mop Heads', brand: 'Generic', category: 'equipment', defaultUnit: 'each', defaultSize: '1', defaultCost: 12.00, usagePerClean: 0 },
  { id: 'vacuum-bags', name: 'Vacuum Bags', brand: 'Generic', category: 'consumable', defaultUnit: 'pack', defaultSize: '5 pack', defaultCost: 20.00, usagePerClean: 0.1 },
  { id: 'trash-bags', name: 'Trash Bags', brand: 'Generic', category: 'consumable', defaultUnit: 'box', defaultSize: '50 count', defaultCost: 15.00, usagePerClean: 0.5 },
  { id: 'gloves', name: 'Cleaning Gloves', brand: 'Generic', category: 'consumable', defaultUnit: 'box', defaultSize: '100 count', defaultCost: 12.00, usagePerClean: 1 },
];

const CATEGORIES = [
  { value: 'all', label: 'All Items' },
  { value: 'concentrate', label: 'Concentrates' },
  { value: 'additive', label: 'Additives' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'consumable', label: 'Consumables' },
  { value: 'kit', label: 'Kits' },
];

// Add/Edit Item Modal
const ItemModal = ({ item, productCatalog, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    productId: item?.productId || '',
    name: item?.name || '',
    brand: item?.brand || '',
    category: item?.category || 'consumable',
    quantity: item?.quantity || 1,
    unit: item?.unit || 'each',
    size: item?.size || '',
    costPerUnit: item?.costPerUnit || 0,
    reorderPoint: item?.reorderPoint || 2,
    reorderUrl: item?.reorderUrl || '',
    notes: item?.notes || '',
    isCustom: item?.isCustom || false,
  });
  const [isSaving, setIsSaving] = useState(false);

  // Auto-fill from product catalog
  const handleProductSelect = (productId) => {
    const product = productCatalog.find(p => p.id === productId);
    if (product) {
      setFormData({
        ...formData,
        productId,
        name: product.name,
        brand: product.brand,
        category: product.category,
        unit: product.defaultUnit,
        size: product.defaultSize,
        costPerUnit: product.defaultCost,
        reorderUrl: product.reorderUrl || '',
        isCustom: false,
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    const inventoryItem = {
      id: item?.id || `inv-${Date.now()}`,
      ...formData,
      lastUpdated: new Date().toISOString(),
    };
    
    onSave(inventoryItem);
    setIsSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-charcoal/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-charcoal/10 flex items-center justify-between">
          <h2 className="font-playfair text-xl font-semibold text-charcoal">
            {item?.id ? 'Edit Item' : 'Add Inventory Item'}
          </h2>
          <button onClick={onClose} className="p-2 text-charcoal/50 hover:text-charcoal rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Quick Add from Catalog */}
          {!item?.id && (
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1.5 font-inter">
                Quick Add from Catalog
              </label>
              <select
                value={formData.productId}
                onChange={(e) => handleProductSelect(e.target.value)}
                className="w-full px-4 py-2.5 bg-sage/5 border border-sage/30 rounded-xl font-inter
                           focus:outline-none focus:ring-2 focus:ring-sage"
              >
                <option value="">Select a product or add custom...</option>
                <optgroup label="Branch Basics">
                  {BRANCH_BASICS_PRODUCTS.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </optgroup>
                <optgroup label="Common Supplies">
                  {COMMON_SUPPLIES.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </optgroup>
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-charcoal mb-1.5 font-inter">
                Product Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value, isCustom: true })}
                placeholder="e.g., Branch Basics Concentrate"
                className="w-full px-4 py-2.5 bg-bone/50 border border-charcoal/10 rounded-xl font-inter
                           focus:outline-none focus:ring-2 focus:ring-sage"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal mb-1.5 font-inter">
                Brand
              </label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                placeholder="e.g., Branch Basics"
                className="w-full px-4 py-2.5 bg-bone/50 border border-charcoal/10 rounded-xl font-inter
                           focus:outline-none focus:ring-2 focus:ring-sage"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal mb-1.5 font-inter">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2.5 bg-bone/50 border border-charcoal/10 rounded-xl font-inter
                           focus:outline-none focus:ring-2 focus:ring-sage"
              >
                <option value="concentrate">Concentrate</option>
                <option value="additive">Additive</option>
                <option value="equipment">Equipment</option>
                <option value="consumable">Consumable</option>
                <option value="kit">Kit</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal mb-1.5 font-inter">
                Quantity *
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.5"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2.5 bg-bone/50 border border-charcoal/10 rounded-xl font-inter
                           focus:outline-none focus:ring-2 focus:ring-sage"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal mb-1.5 font-inter">
                Unit
              </label>
              <input
                type="text"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                placeholder="bottle, pack, each..."
                className="w-full px-4 py-2.5 bg-bone/50 border border-charcoal/10 rounded-xl font-inter
                           focus:outline-none focus:ring-2 focus:ring-sage"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal mb-1.5 font-inter">
                Size
              </label>
              <input
                type="text"
                value={formData.size}
                onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                placeholder="33 oz, 12 pack..."
                className="w-full px-4 py-2.5 bg-bone/50 border border-charcoal/10 rounded-xl font-inter
                           focus:outline-none focus:ring-2 focus:ring-sage"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal mb-1.5 font-inter">
                Cost per Unit ($)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.costPerUnit}
                onChange={(e) => setFormData({ ...formData, costPerUnit: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2.5 bg-bone/50 border border-charcoal/10 rounded-xl font-inter
                           focus:outline-none focus:ring-2 focus:ring-sage"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal mb-1.5 font-inter">
                Reorder Point
              </label>
              <input
                type="number"
                min="0"
                value={formData.reorderPoint}
                onChange={(e) => setFormData({ ...formData, reorderPoint: parseInt(e.target.value) || 0 })}
                placeholder="Alert when below this"
                className="w-full px-4 py-2.5 bg-bone/50 border border-charcoal/10 rounded-xl font-inter
                           focus:outline-none focus:ring-2 focus:ring-sage"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-charcoal mb-1.5 font-inter">
                Reorder URL
              </label>
              <input
                type="url"
                value={formData.reorderUrl}
                onChange={(e) => setFormData({ ...formData, reorderUrl: e.target.value })}
                placeholder="https://..."
                className="w-full px-4 py-2.5 bg-bone/50 border border-charcoal/10 rounded-xl font-inter
                           focus:outline-none focus:ring-2 focus:ring-sage"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-charcoal mb-1.5 font-inter">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
                placeholder="Any additional notes..."
                className="w-full px-4 py-2.5 bg-bone/50 border border-charcoal/10 rounded-xl font-inter
                           focus:outline-none focus:ring-2 focus:ring-sage resize-none"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {item?.id ? 'Save Changes' : 'Add Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Adjust Quantity Modal
const AdjustQuantityModal = ({ item, onClose, onSave }) => {
  const [adjustment, setAdjustment] = useState(0);
  const [reason, setReason] = useState('received');

  const handleSave = () => {
    const newQuantity = Math.max(0, item.quantity + adjustment);
    onSave({
      ...item,
      quantity: newQuantity,
      lastUpdated: new Date().toISOString(),
      lastAdjustment: {
        amount: adjustment,
        reason,
        date: new Date().toISOString(),
      },
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-charcoal/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <h2 className="font-playfair text-xl font-semibold text-charcoal mb-4">
          Adjust Quantity
        </h2>
        <p className="text-sm text-charcoal/60 font-inter mb-4">
          {item.name} - Current: {item.quantity} {item.unit}
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1.5 font-inter">
              Reason
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-4 py-2.5 bg-bone/50 border border-charcoal/10 rounded-xl font-inter"
            >
              <option value="received">Received new stock</option>
              <option value="used">Used for cleaning</option>
              <option value="damaged">Damaged/Expired</option>
              <option value="correction">Inventory correction</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-charcoal mb-1.5 font-inter">
              Adjustment
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setAdjustment(a => a - 1)}
                className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
              >
                <Minus className="w-5 h-5" />
              </button>
              <input
                type="number"
                value={adjustment}
                onChange={(e) => setAdjustment(parseInt(e.target.value) || 0)}
                className="flex-1 px-4 py-2.5 bg-bone/50 border border-charcoal/10 rounded-xl font-inter text-center text-lg font-semibold"
              />
              <button
                type="button"
                onClick={() => setAdjustment(a => a + 1)}
                className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            <p className="text-center text-sm text-charcoal/60 mt-2">
              New quantity: <strong>{Math.max(0, item.quantity + adjustment)}</strong> {item.unit}
            </p>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleSave} className="btn-primary flex-1">Update</button>
        </div>
      </div>
    </div>
  );
};

// Inventory Item Card
const InventoryCard = ({ item, onEdit, onAdjust, onDelete, onReorder }) => {
  const isLowStock = item.quantity <= item.reorderPoint;
  const isOutOfStock = item.quantity === 0;

  const categoryIcons = {
    concentrate: Droplets,
    additive: Sparkles,
    equipment: Package,
    consumable: ShoppingCart,
    kit: Package,
  };
  const Icon = categoryIcons[item.category] || Package;

  return (
    <div className={`bg-white rounded-2xl shadow-sm border p-5 ${
      isOutOfStock ? 'border-red-300 bg-red-50/30' :
      isLowStock ? 'border-yellow-300 bg-yellow-50/30' :
      'border-charcoal/5'
    }`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${
            isOutOfStock ? 'bg-red-100 text-red-600' :
            isLowStock ? 'bg-yellow-100 text-yellow-600' :
            'bg-sage/10 text-sage'
          }`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-inter font-semibold text-charcoal">{item.name}</h3>
            <p className="text-xs text-charcoal/50">{item.brand} • {item.size}</p>
          </div>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => onEdit(item)}
            className="p-1.5 text-charcoal/40 hover:text-charcoal hover:bg-charcoal/5 rounded-lg"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(item)}
            className="p-1.5 text-charcoal/40 hover:text-red-600 hover:bg-red-50 rounded-lg"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-2xl font-playfair font-semibold text-charcoal">
            {item.quantity}
          </p>
          <p className="text-xs text-charcoal/50">{item.unit}</p>
        </div>
        <button
          onClick={() => onAdjust(item)}
          className="px-3 py-1.5 bg-charcoal/5 hover:bg-charcoal/10 rounded-lg text-sm font-inter font-medium text-charcoal transition-colors"
        >
          Adjust
        </button>
      </div>

      {/* Status */}
      {isOutOfStock && (
        <div className="flex items-center gap-2 text-red-600 text-sm font-inter mb-3">
          <AlertTriangle className="w-4 h-4" />
          Out of stock!
        </div>
      )}
      {isLowStock && !isOutOfStock && (
        <div className="flex items-center gap-2 text-yellow-600 text-sm font-inter mb-3">
          <TrendingDown className="w-4 h-4" />
          Low stock (reorder at {item.reorderPoint})
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-charcoal/10">
        <span className="text-sm text-charcoal/60">
          {formatPrice(item.costPerUnit)}/unit
        </span>
        {item.reorderUrl && (
          <a
            href={item.reorderUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-sage/10 text-sage hover:bg-sage/20 
                       rounded-lg text-sm font-inter font-medium transition-colors"
          >
            <ShoppingCart className="w-4 h-4" />
            Reorder
          </a>
        )}
      </div>
    </div>
  );
};

const Inventory = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [adjustingItem, setAdjustingItem] = useState(null);

  // Combined product catalog for quick-add
  const productCatalog = [...BRANCH_BASICS_PRODUCTS, ...COMMON_SUPPLIES];

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = () => {
    setLoading(true);
    try {
      const saved = localStorage.getItem('inventory');
      if (saved) {
        setInventory(JSON.parse(saved));
      } else {
        // Initialize with some default Branch Basics items
        const defaults = [
          { ...BRANCH_BASICS_PRODUCTS[0], id: 'inv-1', quantity: 3, reorderPoint: 2, lastUpdated: new Date().toISOString() },
          { ...BRANCH_BASICS_PRODUCTS[1], id: 'inv-2', quantity: 2, reorderPoint: 1, lastUpdated: new Date().toISOString() },
          { ...COMMON_SUPPLIES[0], id: 'inv-3', quantity: 5, reorderPoint: 2, lastUpdated: new Date().toISOString() },
          { ...COMMON_SUPPLIES[6], id: 'inv-4', quantity: 2, reorderPoint: 1, lastUpdated: new Date().toISOString() },
        ].map(item => ({
          ...item,
          costPerUnit: item.defaultCost,
          unit: item.defaultUnit,
          size: item.defaultSize,
        }));
        setInventory(defaults);
        localStorage.setItem('inventory', JSON.stringify(defaults));
      }
    } catch (error) {
      console.error('Error loading inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveInventory = (items) => {
    setInventory(items);
    localStorage.setItem('inventory', JSON.stringify(items));
  };

  const handleSaveItem = (item) => {
    let updated;
    if (inventory.find(i => i.id === item.id)) {
      updated = inventory.map(i => i.id === item.id ? item : i);
    } else {
      updated = [...inventory, item];
    }
    saveInventory(updated);
    setEditingItem(null);
    setShowModal(false);
  };

  const handleDeleteItem = (item) => {
    if (window.confirm(`Delete ${item.name} from inventory?`)) {
      const updated = inventory.filter(i => i.id !== item.id);
      saveInventory(updated);
    }
  };

  const handleAdjustQuantity = (item) => {
    const updated = inventory.map(i => i.id === item.id ? item : i);
    saveInventory(updated);
    setAdjustingItem(null);
  };

  // Filter inventory
  const filteredInventory = useMemo(() => {
    let filtered = [...inventory];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.brand?.toLowerCase().includes(query)
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(item => item.category === categoryFilter);
    }

    return filtered.sort((a, b) => {
      // Sort: out of stock first, then low stock, then by name
      if (a.quantity === 0 && b.quantity > 0) return -1;
      if (b.quantity === 0 && a.quantity > 0) return 1;
      const aLow = a.quantity <= a.reorderPoint;
      const bLow = b.quantity <= b.reorderPoint;
      if (aLow && !bLow) return -1;
      if (bLow && !aLow) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [inventory, searchQuery, categoryFilter]);

  // Stats
  const stats = useMemo(() => {
    const totalValue = inventory.reduce((sum, item) => sum + (item.quantity * item.costPerUnit), 0);
    const lowStockCount = inventory.filter(item => item.quantity <= item.reorderPoint && item.quantity > 0).length;
    const outOfStockCount = inventory.filter(item => item.quantity === 0).length;
    
    return {
      totalItems: inventory.length,
      totalValue,
      lowStockCount,
      outOfStockCount,
    };
  }, [inventory]);

  const exportInventory = () => {
    const headers = ['Name', 'Brand', 'Category', 'Quantity', 'Unit', 'Size', 'Cost', 'Reorder Point', 'Value'];
    const rows = inventory.map(item => [
      item.name,
      item.brand,
      item.category,
      item.quantity,
      item.unit,
      item.size,
      item.costPerUnit,
      item.reorderPoint,
      item.quantity * item.costPerUnit,
    ]);

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell || ''}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
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
            Manage cleaning supplies and equipment
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={loadInventory} className="btn-secondary flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button onClick={exportInventory} className="btn-secondary flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </button>
          <button 
            onClick={() => { setEditingItem(null); setShowModal(true); }} 
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </button>
        </div>
      </div>

      {/* Alerts */}
      {(stats.outOfStockCount > 0 || stats.lowStockCount > 0) && (
        <div className={`rounded-xl p-4 ${
          stats.outOfStockCount > 0 ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'
        }`}>
          <div className="flex items-start gap-3">
            <AlertTriangle className={`w-5 h-5 mt-0.5 ${
              stats.outOfStockCount > 0 ? 'text-red-600' : 'text-yellow-600'
            }`} />
            <div>
              <p className={`font-inter font-medium ${
                stats.outOfStockCount > 0 ? 'text-red-800' : 'text-yellow-800'
              }`}>
                {stats.outOfStockCount > 0 && `${stats.outOfStockCount} item${stats.outOfStockCount > 1 ? 's' : ''} out of stock`}
                {stats.outOfStockCount > 0 && stats.lowStockCount > 0 && ' • '}
                {stats.lowStockCount > 0 && `${stats.lowStockCount} item${stats.lowStockCount > 1 ? 's' : ''} running low`}
              </p>
              <p className="text-sm text-charcoal/60 mt-1">
                Click "Reorder" on items to quickly purchase more
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-charcoal/5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-sage/10 rounded-lg">
              <Package className="w-5 h-5 text-sage" />
            </div>
          </div>
          <p className="font-playfair text-2xl font-semibold text-charcoal">{stats.totalItems}</p>
          <p className="text-sm text-charcoal/50 font-inter">Total Items</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-charcoal/5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <p className="font-playfair text-2xl font-semibold text-green-600">{formatPrice(stats.totalValue)}</p>
          <p className="text-sm text-charcoal/50 font-inter">Inventory Value</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-charcoal/5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <TrendingDown className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
          <p className="font-playfair text-2xl font-semibold text-yellow-600">{stats.lowStockCount}</p>
          <p className="text-sm text-charcoal/50 font-inter">Low Stock</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-charcoal/5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
          </div>
          <p className="font-playfair text-2xl font-semibold text-red-600">{stats.outOfStockCount}</p>
          <p className="text-sm text-charcoal/50 font-inter">Out of Stock</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-charcoal/5 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/40" />
            <input
              type="text"
              placeholder="Search inventory..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-bone/50 border border-charcoal/10 rounded-xl
                         font-inter text-sm focus:outline-none focus:ring-2 focus:ring-sage"
            />
          </div>
          <div className="relative">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2.5 bg-bone/50 border border-charcoal/10 rounded-xl
                         font-inter text-sm focus:outline-none focus:ring-2 focus:ring-sage"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/40 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Branch Basics Quick Add */}
      <div className="bg-gradient-to-r from-sage/10 to-sage/5 rounded-2xl p-5 border border-sage/20">
        <div className="flex items-center gap-3 mb-3">
          <img 
            src="https://cdn.shopify.com/s/files/1/0550/7294/8844/files/Branch_Basics_Horizontal_Logo_500x.png" 
            alt="Branch Basics" 
            className="h-6 opacity-80"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <span className="font-inter font-medium text-charcoal">Branch Basics Products</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {BRANCH_BASICS_PRODUCTS.slice(0, 4).map((product) => {
            const exists = inventory.find(i => i.productId === product.id);
            return (
              <button
                key={product.id}
                onClick={() => {
                  if (exists) {
                    setEditingItem(exists);
                    setShowModal(true);
                  } else {
                    setEditingItem({ productId: product.id });
                    setShowModal(true);
                  }
                }}
                className={`px-3 py-2 rounded-lg text-sm font-inter font-medium transition-colors flex items-center gap-2 ${
                  exists 
                    ? 'bg-sage/20 text-sage hover:bg-sage/30' 
                    : 'bg-white text-charcoal hover:bg-sage/10'
                }`}
              >
                {exists ? <CheckCircle2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {product.name}
              </button>
            );
          })}
          <a
            href="https://branchbasics.com/collections/all"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 bg-white text-charcoal hover:bg-sage/10 rounded-lg text-sm font-inter font-medium transition-colors flex items-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            Shop All
          </a>
        </div>
      </div>

      {/* Inventory Grid */}
      {filteredInventory.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredInventory.map((item) => (
            <InventoryCard
              key={item.id}
              item={item}
              onEdit={(item) => { setEditingItem(item); setShowModal(true); }}
              onAdjust={(item) => setAdjustingItem(item)}
              onDelete={handleDeleteItem}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-charcoal/5 p-12 text-center">
          <Package className="w-12 h-12 text-charcoal/30 mx-auto mb-4" />
          <h3 className="font-playfair text-xl font-semibold text-charcoal mb-2">
            {searchQuery || categoryFilter !== 'all' ? 'No items found' : 'No inventory yet'}
          </h3>
          <p className="text-charcoal/60 font-inter mb-4">
            {searchQuery || categoryFilter !== 'all' 
              ? 'Try adjusting your search or filter' 
              : 'Start by adding your cleaning supplies'}
          </p>
          {!searchQuery && categoryFilter === 'all' && (
            <button 
              onClick={() => { setEditingItem(null); setShowModal(true); }}
              className="btn-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add First Item
            </button>
          )}
        </div>
      )}

      {/* Modals */}
      {showModal && (
        <ItemModal
          item={editingItem}
          productCatalog={productCatalog}
          onClose={() => { setShowModal(false); setEditingItem(null); }}
          onSave={handleSaveItem}
        />
      )}

      {adjustingItem && (
        <AdjustQuantityModal
          item={adjustingItem}
          onClose={() => setAdjustingItem(null)}
          onSave={handleAdjustQuantity}
        />
      )}
    </div>
  );
};

export default Inventory;
