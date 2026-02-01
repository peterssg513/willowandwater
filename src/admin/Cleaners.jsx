import { useState, useEffect } from 'react';
import { 
  UserPlus, 
  Edit2, 
  Trash2, 
  Mail, 
  Phone,
  Calendar,
  MapPin,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  X,
  Save,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const DAYS_OF_WEEK = [
  { value: 'monday', label: 'Mon' },
  { value: 'tuesday', label: 'Tue' },
  { value: 'wednesday', label: 'Wed' },
  { value: 'thursday', label: 'Thu' },
  { value: 'friday', label: 'Fri' },
  { value: 'saturday', label: 'Sat' },
  { value: 'sunday', label: 'Sun' },
];

const SERVICE_AREAS = [
  { value: 'st-charles', label: 'St. Charles' },
  { value: 'geneva', label: 'Geneva' },
  { value: 'batavia', label: 'Batavia' },
  { value: 'wayne', label: 'Wayne' },
  { value: 'campton-hills', label: 'Campton Hills' },
  { value: 'elburn', label: 'Elburn' },
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active', color: 'bg-green-100 text-green-700' },
  { value: 'inactive', label: 'Inactive', color: 'bg-gray-100 text-gray-700' },
  { value: 'on_leave', label: 'On Leave', color: 'bg-yellow-100 text-yellow-700' },
];

const CleanerModal = ({ cleaner, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: cleaner?.name || '',
    email: cleaner?.email || '',
    phone: cleaner?.phone || '',
    status: cleaner?.status || 'active',
    available_days: cleaner?.available_days || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    service_areas: cleaner?.service_areas || SERVICE_AREAS.map(a => a.value),
    notes: cleaner?.notes || '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');

    try {
      if (cleaner?.id) {
        // Update existing cleaner
        const { error: updateError } = await supabase
          .from('cleaners')
          .update(formData)
          .eq('id', cleaner.id);

        if (updateError) throw updateError;
        
        const updatedCleaner = { ...cleaner, ...formData };
        onSave(updatedCleaner);
      } else {
        // Create new cleaner
        const { data, error: insertError } = await supabase
          .from('cleaners')
          .insert([formData])
          .select()
          .single();

        if (insertError) throw insertError;
        
        if (data) {
          onSave(data);
        }
      }
      onClose();
    } catch (err) {
      console.error('Error saving cleaner:', err);
      setError('Failed to save cleaner. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleDay = (day) => {
    setFormData((prev) => ({
      ...prev,
      available_days: prev.available_days.includes(day)
        ? prev.available_days.filter((d) => d !== day)
        : [...prev.available_days, day],
    }));
  };

  const toggleArea = (area) => {
    setFormData((prev) => ({
      ...prev,
      service_areas: prev.service_areas.includes(area)
        ? prev.service_areas.filter((a) => a !== area)
        : [...prev.service_areas, area],
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-charcoal/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-charcoal/10 px-6 py-4 flex items-center justify-between">
          <h2 className="font-playfair text-xl font-semibold text-charcoal">
            {cleaner?.id ? 'Edit Cleaner' : 'Add New Cleaner'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-charcoal/50 hover:text-charcoal hover:bg-charcoal/5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Name */}
          <div>
            <label className="block font-inter text-sm font-medium text-charcoal mb-1.5">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Sarah Johnson"
              className="w-full px-4 py-3 bg-bone/50 border border-charcoal/10 rounded-xl font-inter
                         focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block font-inter text-sm font-medium text-charcoal mb-1.5">
              Email Address *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="sarah@willowandwater.com"
              className="w-full px-4 py-3 bg-bone/50 border border-charcoal/10 rounded-xl font-inter
                         focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block font-inter text-sm font-medium text-charcoal mb-1.5">
              Phone Number
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="(630) 555-0101"
              className="w-full px-4 py-3 bg-bone/50 border border-charcoal/10 rounded-xl font-inter
                         focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block font-inter text-sm font-medium text-charcoal mb-1.5">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-4 py-3 bg-bone/50 border border-charcoal/10 rounded-xl font-inter
                         focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Available Days */}
          <div>
            <label className="block font-inter text-sm font-medium text-charcoal mb-2">
              Available Days
            </label>
            <div className="flex flex-wrap gap-2">
              {DAYS_OF_WEEK.map((day) => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleDay(day.value)}
                  className={`px-3 py-2 rounded-lg font-inter text-sm transition-colors ${
                    formData.available_days.includes(day.value)
                      ? 'bg-sage text-white'
                      : 'bg-bone/50 text-charcoal/70 hover:bg-bone'
                  }`}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>

          {/* Service Areas */}
          <div>
            <label className="block font-inter text-sm font-medium text-charcoal mb-2">
              Service Areas
            </label>
            <div className="flex flex-wrap gap-2">
              {SERVICE_AREAS.map((area) => (
                <button
                  key={area.value}
                  type="button"
                  onClick={() => toggleArea(area.value)}
                  className={`px-3 py-2 rounded-lg font-inter text-sm transition-colors ${
                    formData.service_areas.includes(area.value)
                      ? 'bg-sage text-white'
                      : 'bg-bone/50 text-charcoal/70 hover:bg-bone'
                  }`}
                >
                  {area.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block font-inter text-sm font-medium text-charcoal mb-1.5">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              placeholder="Any additional notes about this team member..."
              className="w-full px-4 py-3 bg-bone/50 border border-charcoal/10 rounded-xl font-inter
                         focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent resize-none"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-inter">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isSaving}
              className="btn-primary flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {cleaner?.id ? 'Save Changes' : 'Add Cleaner'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const DeleteConfirmModal = ({ cleaner, onClose, onConfirm }) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('cleaners')
        .delete()
        .eq('id', cleaner.id);

      if (error) throw error;
      
      onConfirm(cleaner.id);
      onClose();
    } catch (err) {
      console.error('Error deleting cleaner:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-charcoal/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="font-playfair text-xl font-semibold text-charcoal mb-2">
            Remove Team Member?
          </h2>
          <p className="text-charcoal/60 font-inter mb-6">
            Are you sure you want to remove <strong>{cleaner.name}</strong> from the team? 
            This action cannot be undone.
          </p>
          <div className="flex justify-center gap-3">
            <button onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button 
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-inter 
                         font-medium transition-colors flex items-center gap-2"
            >
              {isDeleting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Removing...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Remove
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const CleanerCard = ({ cleaner, onEdit, onDelete }) => {
  const statusConfig = STATUS_OPTIONS.find(s => s.value === cleaner.status) || STATUS_OPTIONS[0];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-charcoal/5 p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-sage/10 flex items-center justify-center">
            <span className="font-playfair text-xl font-semibold text-sage">
              {cleaner.name?.[0]?.toUpperCase() || '?'}
            </span>
          </div>
          <div>
            <h3 className="font-inter font-semibold text-charcoal">{cleaner.name}</h3>
            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-inter ${statusConfig.color}`}>
              {statusConfig.label}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(cleaner)}
            className="p-2 text-charcoal/50 hover:text-sage hover:bg-sage/10 rounded-lg transition-colors"
            title="Edit"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(cleaner)}
            className="p-2 text-charcoal/50 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Remove"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Contact Info */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm">
          <Mail className="w-4 h-4 text-charcoal/40" />
          <a href={`mailto:${cleaner.email}`} className="text-charcoal/70 hover:text-sage truncate">
            {cleaner.email}
          </a>
        </div>
        {cleaner.phone && (
          <div className="flex items-center gap-2 text-sm">
            <Phone className="w-4 h-4 text-charcoal/40" />
            <a href={`tel:${cleaner.phone}`} className="text-charcoal/70 hover:text-sage">
              {cleaner.phone}
            </a>
          </div>
        )}
      </div>

      {/* Available Days */}
      <div className="mb-4">
        <p className="text-xs text-charcoal/50 font-inter mb-2 flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          Available Days
        </p>
        <div className="flex flex-wrap gap-1">
          {DAYS_OF_WEEK.map((day) => (
            <span
              key={day.value}
              className={`px-2 py-0.5 rounded text-xs font-inter ${
                cleaner.available_days?.includes(day.value)
                  ? 'bg-sage/10 text-sage'
                  : 'bg-charcoal/5 text-charcoal/30'
              }`}
            >
              {day.label}
            </span>
          ))}
        </div>
      </div>

      {/* Service Areas */}
      <div>
        <p className="text-xs text-charcoal/50 font-inter mb-2 flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          Service Areas
        </p>
        <div className="flex flex-wrap gap-1">
          {SERVICE_AREAS.map((area) => (
            <span
              key={area.value}
              className={`px-2 py-0.5 rounded text-xs font-inter ${
                cleaner.service_areas?.includes(area.value)
                  ? 'bg-blue-50 text-blue-600'
                  : 'bg-charcoal/5 text-charcoal/30'
              }`}
            >
              {area.label}
            </span>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="mt-4 pt-4 border-t border-charcoal/10 flex items-center justify-between text-xs text-charcoal/50">
        <span>{cleaner.total_assignments || 0} total assignments</span>
        {cleaner.last_assigned_at && (
          <span>
            Last: {new Date(cleaner.last_assigned_at).toLocaleDateString()}
          </span>
        )}
      </div>
    </div>
  );
};

const Cleaners = () => {
  const [cleaners, setCleaners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCleaner, setEditingCleaner] = useState(null);
  const [deletingCleaner, setDeletingCleaner] = useState(null);

  useEffect(() => {
    fetchCleaners();
  }, []);

  const fetchCleaners = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cleaners')
        .select('*')
        .order('name');

      if (error) throw error;
      setCleaners(data || []);
    } catch (error) {
      console.error('Error fetching cleaners:', error);
      setCleaners([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (cleaner) => {
    setEditingCleaner(cleaner);
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingCleaner(null);
    setShowModal(true);
  };

  const handleSave = (cleaner) => {
    if (editingCleaner) {
      setCleaners((prev) => prev.map((c) => (c.id === cleaner.id ? cleaner : c)));
    } else {
      setCleaners((prev) => [...prev, cleaner]);
    }
  };

  const handleDelete = (cleanerId) => {
    setCleaners((prev) => prev.filter((c) => c.id !== cleanerId));
  };

  const activeCleaners = cleaners.filter((c) => c.status === 'active');
  const inactiveCleaners = cleaners.filter((c) => c.status !== 'active');

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
            Team Members
          </h1>
          <p className="text-charcoal/60 font-inter mt-1">
            Manage your cleaning team
          </p>
        </div>
        <button onClick={handleAdd} className="btn-primary flex items-center gap-2 self-start">
          <UserPlus className="w-4 h-4" />
          Add Team Member
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-charcoal/5">
          <p className="text-2xl font-playfair font-semibold text-charcoal">{cleaners.length}</p>
          <p className="text-sm text-charcoal/50 font-inter">Total Members</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-charcoal/5">
          <p className="text-2xl font-playfair font-semibold text-green-600">{activeCleaners.length}</p>
          <p className="text-sm text-charcoal/50 font-inter">Active</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-charcoal/5">
          <p className="text-2xl font-playfair font-semibold text-yellow-600">
            {cleaners.filter(c => c.status === 'on_leave').length}
          </p>
          <p className="text-sm text-charcoal/50 font-inter">On Leave</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-charcoal/5">
          <p className="text-2xl font-playfair font-semibold text-charcoal/50">
            {cleaners.filter(c => c.status === 'inactive').length}
          </p>
          <p className="text-sm text-charcoal/50 font-inter">Inactive</p>
        </div>
      </div>

      {/* Active Team Members */}
      {activeCleaners.length > 0 && (
        <div>
          <h2 className="font-inter font-semibold text-charcoal mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Active Team Members ({activeCleaners.length})
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeCleaners.map((cleaner) => (
              <CleanerCard
                key={cleaner.id}
                cleaner={cleaner}
                onEdit={handleEdit}
                onDelete={setDeletingCleaner}
              />
            ))}
          </div>
        </div>
      )}

      {/* Inactive/On Leave Members */}
      {inactiveCleaners.length > 0 && (
        <div>
          <h2 className="font-inter font-semibold text-charcoal/70 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-charcoal/50" />
            Inactive / On Leave ({inactiveCleaners.length})
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {inactiveCleaners.map((cleaner) => (
              <CleanerCard
                key={cleaner.id}
                cleaner={cleaner}
                onEdit={handleEdit}
                onDelete={setDeletingCleaner}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {cleaners.length === 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-charcoal/5 p-12 text-center">
          <div className="w-16 h-16 bg-sage/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserPlus className="w-8 h-8 text-sage" />
          </div>
          <h3 className="font-playfair text-xl font-semibold text-charcoal mb-2">
            No team members yet
          </h3>
          <p className="text-charcoal/60 font-inter mb-6">
            Add your first team member to start managing schedules
          </p>
          <button onClick={handleAdd} className="btn-primary">
            Add Team Member
          </button>
        </div>
      )}

      {/* Modals */}
      {showModal && (
        <CleanerModal
          cleaner={editingCleaner}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}

      {deletingCleaner && (
        <DeleteConfirmModal
          cleaner={deletingCleaner}
          onClose={() => setDeletingCleaner(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
};

export default Cleaners;
