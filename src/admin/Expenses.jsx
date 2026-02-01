import { useState, useEffect, useMemo } from 'react';
import { 
  Receipt, 
  Plus, 
  Search, 
  Filter,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Download,
  Trash2,
  Edit2,
  X,
  Save,
  Car,
  Droplets,
  Package,
  Users,
  Building,
  CreditCard,
  MoreVertical
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { formatPrice } from '../utils/pricingLogic';

const EXPENSE_CATEGORIES = [
  { value: 'supplies', label: 'Cleaning Supplies', icon: Droplets, color: 'bg-blue-100 text-blue-600' },
  { value: 'equipment', label: 'Equipment', icon: Package, color: 'bg-purple-100 text-purple-600' },
  { value: 'vehicle', label: 'Vehicle/Gas', icon: Car, color: 'bg-yellow-100 text-yellow-600' },
  { value: 'labor', label: 'Labor/Payroll', icon: Users, color: 'bg-green-100 text-green-600' },
  { value: 'insurance', label: 'Insurance', icon: Building, color: 'bg-red-100 text-red-600' },
  { value: 'marketing', label: 'Marketing', icon: TrendingUp, color: 'bg-pink-100 text-pink-600' },
  { value: 'software', label: 'Software/Tools', icon: CreditCard, color: 'bg-indigo-100 text-indigo-600' },
  { value: 'other', label: 'Other', icon: Receipt, color: 'bg-gray-100 text-gray-600' },
];

const ExpenseModal = ({ expense, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    description: expense?.description || '',
    amount: expense?.amount || '',
    category: expense?.category || 'supplies',
    date: expense?.date || new Date().toISOString().split('T')[0],
    vendor: expense?.vendor || '',
    notes: expense?.notes || '',
    receipt_url: expense?.receipt_url || '',
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      const expenseData = {
        ...formData,
        amount: parseFloat(formData.amount),
      };

      if (expense?.id) {
        // Update existing
        const { data, error } = await supabase
          .from('expenses')
          .update(expenseData)
          .eq('id', expense.id)
          .select()
          .single();
        
        if (error) throw error;
        onSave(data);
      } else {
        // Create new
        const { data, error } = await supabase
          .from('expenses')
          .insert([expenseData])
          .select()
          .single();
        
        if (error) throw error;
        onSave(data);
      }
      onClose();
    } catch (error) {
      console.error('Error saving expense:', error);
      // If table doesn't exist, save to localStorage
      const localExpenses = JSON.parse(localStorage.getItem('expenses') || '[]');
      const newExpense = {
        ...formData,
        id: expense?.id || Date.now(),
        amount: parseFloat(formData.amount),
        created_at: new Date().toISOString(),
      };
      
      if (expense?.id) {
        const index = localExpenses.findIndex(e => e.id === expense.id);
        if (index >= 0) localExpenses[index] = newExpense;
      } else {
        localExpenses.push(newExpense);
      }
      
      localStorage.setItem('expenses', JSON.stringify(localExpenses));
      onSave(newExpense);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-charcoal/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-6 border-b border-charcoal/10 flex items-center justify-between">
          <h2 className="font-playfair text-xl font-semibold text-charcoal">
            {expense?.id ? 'Edit Expense' : 'Add Expense'}
          </h2>
          <button onClick={onClose} className="p-2 text-charcoal/50 hover:text-charcoal rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1.5 font-inter">
              Description *
            </label>
            <input
              type="text"
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="What did you purchase?"
              className="w-full px-4 py-2.5 bg-bone/50 border border-charcoal/10 rounded-xl font-inter
                         focus:outline-none focus:ring-2 focus:ring-sage"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1.5 font-inter">
                Amount *
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal/50">$</span>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                  className="w-full pl-8 pr-4 py-2.5 bg-bone/50 border border-charcoal/10 rounded-xl font-inter
                             focus:outline-none focus:ring-2 focus:ring-sage"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1.5 font-inter">
                Date *
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-2.5 bg-bone/50 border border-charcoal/10 rounded-xl font-inter
                           focus:outline-none focus:ring-2 focus:ring-sage"
              />
            </div>
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
              {EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-charcoal mb-1.5 font-inter">
              Vendor
            </label>
            <input
              type="text"
              value={formData.vendor}
              onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
              placeholder="Where did you buy it?"
              className="w-full px-4 py-2.5 bg-bone/50 border border-charcoal/10 rounded-xl font-inter
                         focus:outline-none focus:ring-2 focus:ring-sage"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-charcoal mb-1.5 font-inter">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              placeholder="Any additional details..."
              className="w-full px-4 py-2.5 bg-bone/50 border border-charcoal/10 rounded-xl font-inter
                         focus:outline-none focus:ring-2 focus:ring-sage resize-none"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={isSaving} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [timeRange, setTimeRange] = useState('30d');
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Try to fetch from Supabase
      const { data: expenseData } = await supabase
        .from('expenses')
        .select('*')
        .order('date', { ascending: false });

      const { data: bookingData } = await supabase
        .from('bookings')
        .select('*')
        .in('status', ['confirmed', 'completed']);

      // Handle expenses
      if (expenseData && expenseData.length > 0) {
        setExpenses(expenseData);
      } else {
        // Fall back to localStorage
        const localExpenses = JSON.parse(localStorage.getItem('expenses') || '[]');
        setExpenses(localExpenses);
      }

      // Handle bookings
      if (bookingData && bookingData.length > 0) {
        setBookings(bookingData);
      } else {
        const localBookings = JSON.parse(localStorage.getItem('bookings') || '[]');
        setBookings(localBookings.filter(b => ['confirmed', 'completed'].includes(b.status)));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      const localExpenses = JSON.parse(localStorage.getItem('expenses') || '[]');
      const localBookings = JSON.parse(localStorage.getItem('bookings') || '[]');
      setExpenses(localExpenses);
      setBookings(localBookings.filter(b => ['confirmed', 'completed'].includes(b.status)));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveExpense = (expense) => {
    if (editingExpense) {
      setExpenses(prev => prev.map(e => e.id === expense.id ? expense : e));
    } else {
      setExpenses(prev => [expense, ...prev]);
    }
    setEditingExpense(null);
  };

  const handleDeleteExpense = async (id) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    
    try {
      await supabase.from('expenses').delete().eq('id', id);
    } catch {
      // Delete from localStorage
      const localExpenses = JSON.parse(localStorage.getItem('expenses') || '[]');
      localStorage.setItem('expenses', JSON.stringify(localExpenses.filter(e => e.id !== id)));
    }
    
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  // Calculate date range
  const getDateRange = () => {
    const now = new Date();
    let startDate;
    
    switch (timeRange) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'ytd':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(0);
    }
    
    return { startDate, endDate: now };
  };

  // Filter and calculate metrics
  const metrics = useMemo(() => {
    const { startDate, endDate } = getDateRange();
    
    const filteredExpenses = expenses.filter(e => {
      const date = new Date(e.date);
      const inRange = date >= startDate && date <= endDate;
      const matchesCategory = categoryFilter === 'all' || e.category === categoryFilter;
      const matchesSearch = !searchQuery || 
        e.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.vendor?.toLowerCase().includes(searchQuery.toLowerCase());
      return inRange && matchesCategory && matchesSearch;
    });

    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

    // Calculate revenue for same period
    const periodBookings = bookings.filter(b => {
      const date = new Date(b.created_at);
      return date >= startDate && date <= endDate;
    });
    const totalRevenue = periodBookings.reduce((sum, b) => sum + (b.first_clean_price || 0), 0);

    // By category
    const byCategory = filteredExpenses.reduce((acc, e) => {
      const cat = e.category || 'other';
      acc[cat] = (acc[cat] || 0) + (e.amount || 0);
      return acc;
    }, {});

    const profit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? ((profit / totalRevenue) * 100).toFixed(1) : 0;

    return {
      expenses: filteredExpenses,
      totalExpenses,
      totalRevenue,
      profit,
      profitMargin,
      byCategory,
    };
  }, [expenses, bookings, timeRange, categoryFilter, searchQuery]);

  const exportExpenses = () => {
    const headers = ['Date', 'Description', 'Category', 'Vendor', 'Amount', 'Notes'];
    const rows = metrics.expenses.map(e => [
      e.date,
      e.description,
      e.category,
      e.vendor,
      e.amount,
      e.notes,
    ]);

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell || ''}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expenses-${new Date().toISOString().split('T')[0]}.csv`;
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
            Expenses
          </h1>
          <p className="text-charcoal/60 font-inter mt-1">
            Track your business expenses and profit
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={exportExpenses} className="btn-secondary flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </button>
          <button onClick={() => { setEditingExpense(null); setShowModal(true); }} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Expense
          </button>
        </div>
      </div>

      {/* Profit Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-charcoal/5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <p className="font-playfair text-2xl font-semibold text-green-600">
            {formatPrice(metrics.totalRevenue)}
          </p>
          <p className="text-sm text-charcoal/50 font-inter">Revenue</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-charcoal/5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-100 rounded-lg">
              <TrendingDown className="w-5 h-5 text-red-600" />
            </div>
          </div>
          <p className="font-playfair text-2xl font-semibold text-red-600">
            {formatPrice(metrics.totalExpenses)}
          </p>
          <p className="text-sm text-charcoal/50 font-inter">Expenses</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-charcoal/5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-sage/20 rounded-lg">
              <DollarSign className="w-5 h-5 text-sage" />
            </div>
          </div>
          <p className={`font-playfair text-2xl font-semibold ${metrics.profit >= 0 ? 'text-sage' : 'text-red-600'}`}>
            {formatPrice(metrics.profit)}
          </p>
          <p className="text-sm text-charcoal/50 font-inter">Net Profit</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-charcoal/5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Receipt className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className={`font-playfair text-2xl font-semibold ${metrics.profitMargin >= 20 ? 'text-green-600' : 'text-yellow-600'}`}>
            {metrics.profitMargin}%
          </p>
          <p className="text-sm text-charcoal/50 font-inter">Profit Margin</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-charcoal/5 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/40" />
            <input
              type="text"
              placeholder="Search expenses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-bone/50 border border-charcoal/10 rounded-xl
                         font-inter text-sm focus:outline-none focus:ring-2 focus:ring-sage"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2.5 bg-bone/50 border border-charcoal/10 rounded-xl
                       font-inter text-sm focus:outline-none focus:ring-2 focus:ring-sage"
          >
            <option value="all">All Categories</option>
            {EXPENSE_CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2.5 bg-bone/50 border border-charcoal/10 rounded-xl
                       font-inter text-sm focus:outline-none focus:ring-2 focus:ring-sage"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="ytd">Year to date</option>
            <option value="all">All time</option>
          </select>
        </div>
      </div>

      {/* Expense by Category */}
      <div className="bg-white rounded-2xl shadow-sm border border-charcoal/5 p-6">
        <h2 className="font-playfair text-lg font-semibold text-charcoal mb-4">
          Expenses by Category
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {EXPENSE_CATEGORIES.map((cat) => {
            const amount = metrics.byCategory[cat.value] || 0;
            const Icon = cat.icon;
            return (
              <div key={cat.value} className="p-4 bg-bone/50 rounded-xl">
                <div className={`w-8 h-8 rounded-lg ${cat.color} flex items-center justify-center mb-2`}>
                  <Icon className="w-4 h-4" />
                </div>
                <p className="font-playfair text-lg font-semibold text-charcoal">
                  {formatPrice(amount)}
                </p>
                <p className="text-xs text-charcoal/50 font-inter">{cat.label}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Expense List */}
      <div className="bg-white rounded-2xl shadow-sm border border-charcoal/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-bone/50 border-b border-charcoal/10">
              <tr>
                <th className="text-left px-4 py-3 font-inter text-sm font-semibold text-charcoal">Date</th>
                <th className="text-left px-4 py-3 font-inter text-sm font-semibold text-charcoal">Description</th>
                <th className="text-left px-4 py-3 font-inter text-sm font-semibold text-charcoal hidden md:table-cell">Category</th>
                <th className="text-left px-4 py-3 font-inter text-sm font-semibold text-charcoal hidden sm:table-cell">Vendor</th>
                <th className="text-right px-4 py-3 font-inter text-sm font-semibold text-charcoal">Amount</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {metrics.expenses.length > 0 ? (
                metrics.expenses.map((expense) => {
                  const category = EXPENSE_CATEGORIES.find(c => c.value === expense.category);
                  const Icon = category?.icon || Receipt;
                  return (
                    <tr key={expense.id} className="border-b border-charcoal/5 hover:bg-bone/30">
                      <td className="px-4 py-3 font-inter text-sm text-charcoal">
                        {new Date(expense.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-inter text-sm text-charcoal">{expense.description}</p>
                        {expense.notes && (
                          <p className="text-xs text-charcoal/50 truncate max-w-[200px]">{expense.notes}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-inter ${category?.color || 'bg-gray-100 text-gray-600'}`}>
                          <Icon className="w-3 h-3" />
                          {category?.label || 'Other'}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-inter text-sm text-charcoal/70 hidden sm:table-cell">
                        {expense.vendor || '-'}
                      </td>
                      <td className="px-4 py-3 text-right font-inter font-semibold text-charcoal">
                        {formatPrice(expense.amount)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <button
                            onClick={() => { setEditingExpense(expense); setShowModal(true); }}
                            className="p-1.5 text-charcoal/50 hover:text-sage hover:bg-sage/10 rounded-lg"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteExpense(expense.id)}
                            className="p-1.5 text-charcoal/50 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <Receipt className="w-12 h-12 text-charcoal/30 mx-auto mb-3" />
                    <p className="font-inter text-charcoal/50">No expenses found</p>
                    <button
                      onClick={() => setShowModal(true)}
                      className="mt-3 text-sage hover:text-charcoal font-inter text-sm"
                    >
                      Add your first expense
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <ExpenseModal
          expense={editingExpense}
          onClose={() => { setShowModal(false); setEditingExpense(null); }}
          onSave={handleSaveExpense}
        />
      )}
    </div>
  );
};

export default Expenses;
