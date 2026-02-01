import { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  RefreshCw,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  Edit2,
  Trash2,
  CalendarOff,
  Star,
  AlertTriangle,
  X
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { formatDateForDB } from '../utils/scheduling';

const SERVICE_AREAS = [
  'St. Charles', 'Geneva', 'Batavia', 'Wayne', 
  'Campton Hills', 'Elburn', 'South Elgin', 'North Aurora'
];

const Cleaners = () => {
  const [cleaners, setCleaners] = useState([]);
  const [timeOff, setTimeOff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPTOModal, setShowPTOModal] = useState(false);
  const [selectedCleaner, setSelectedCleaner] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const today = formatDateForDB(new Date());
      
      const [cleanersRes, timeOffRes, jobsRes] = await Promise.all([
        supabase
          .from('cleaners')
          .select('*')
          .order('name'),
        supabase
          .from('cleaner_time_off')
          .select('*')
          .gte('end_date', today)
          .order('start_date'),
        supabase
          .from('jobs')
          .select('cleaner_id, status, customer_rating')
          .not('cleaner_id', 'is', null)
      ]);

      // Calculate stats for each cleaner
      const cleanersWithStats = (cleanersRes.data || []).map(cleaner => {
        const cleanerJobs = jobsRes.data?.filter(j => j.cleaner_id === cleaner.id) || [];
        const completedJobs = cleanerJobs.filter(j => j.status === 'completed');
        const ratings = completedJobs.map(j => j.customer_rating).filter(Boolean);
        const avgRating = ratings.length > 0 
          ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
          : null;
        
        const upcomingPTO = timeOffRes.data?.filter(p => p.cleaner_id === cleaner.id) || [];

        return {
          ...cleaner,
          jobsCount: completedJobs.length,
          avgRating,
          upcomingPTO,
        };
      });

      setCleaners(cleanersWithStats);
      setTimeOff(timeOffRes.data || []);
    } catch (error) {
      console.error('Error fetching cleaners:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCleanerStatus = async (cleaner) => {
    const newStatus = cleaner.status === 'active' ? 'inactive' : 'active';
    try {
      await supabase
        .from('cleaners')
        .update({ status: newStatus })
        .eq('id', cleaner.id);
      fetchData();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const deleteCleaner = async (cleanerId) => {
    if (!confirm('Are you sure you want to delete this cleaner?')) return;
    
    try {
      await supabase
        .from('cleaners')
        .delete()
        .eq('id', cleanerId);
      fetchData();
    } catch (error) {
      console.error('Error deleting cleaner:', error);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
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
            Cleaners
          </h1>
          <p className="text-charcoal/60 font-inter mt-1">
            {cleaners.filter(c => c.status === 'active').length} active cleaners
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Cleaner
          </button>
          <button onClick={fetchData} className="btn-secondary">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Upcoming PTO Alert */}
      {timeOff.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <h3 className="font-inter font-semibold text-yellow-800 flex items-center gap-2 mb-2">
            <CalendarOff className="w-5 h-5" />
            Upcoming Time Off
          </h3>
          <div className="space-y-2">
            {timeOff.slice(0, 3).map(pto => {
              const cleaner = cleaners.find(c => c.id === pto.cleaner_id);
              return (
                <p key={pto.id} className="text-sm text-yellow-700">
                  <strong>{cleaner?.name}:</strong> {formatDate(pto.start_date)} - {formatDate(pto.end_date)}
                  {pto.reason && ` (${pto.reason})`}
                </p>
              );
            })}
          </div>
        </div>
      )}

      {/* Cleaners Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cleaners.map(cleaner => (
          <div
            key={cleaner.id}
            className={`bg-white rounded-2xl border p-5 ${
              cleaner.status === 'active' ? 'border-charcoal/10' : 'border-charcoal/5 opacity-60'
            }`}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center
                  ${cleaner.status === 'active' ? 'bg-sage/10' : 'bg-charcoal/10'}
                `}>
                  <Users className={`w-6 h-6 ${
                    cleaner.status === 'active' ? 'text-sage' : 'text-charcoal/50'
                  }`} />
                </div>
                <div>
                  <h3 className="font-inter font-semibold text-charcoal">{cleaner.name}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    cleaner.status === 'active' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {cleaner.status}
                  </span>
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => { setSelectedCleaner(cleaner); setShowPTOModal(true); }}
                  className="p-2 hover:bg-charcoal/5 rounded-lg transition-colors"
                  title="Add PTO"
                >
                  <CalendarOff className="w-4 h-4 text-charcoal/50" />
                </button>
                <button
                  onClick={() => deleteCleaner(cleaner.id)}
                  className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
            </div>

            {/* Contact */}
            <div className="space-y-2 mb-4">
              <a href={`mailto:${cleaner.email}`} className="flex items-center gap-2 text-sm text-charcoal/70 hover:text-sage">
                <Mail className="w-4 h-4" />
                {cleaner.email}
              </a>
              <a href={`tel:${cleaner.phone}`} className="flex items-center gap-2 text-sm text-charcoal/70 hover:text-sage">
                <Phone className="w-4 h-4" />
                {cleaner.phone}
              </a>
            </div>

            {/* Service Areas */}
            <div className="mb-4">
              <p className="text-xs text-charcoal/50 mb-1">Service Areas</p>
              <div className="flex flex-wrap gap-1">
                {cleaner.service_areas?.length > 0 ? (
                  cleaner.service_areas.map(area => (
                    <span key={area} className="text-xs bg-sage/10 text-sage px-2 py-0.5 rounded">
                      {area}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-charcoal/40">No areas assigned</span>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 pt-4 border-t border-charcoal/10">
              <div className="flex items-center gap-1 text-sm text-charcoal/60">
                <Calendar className="w-4 h-4" />
                {cleaner.jobsCount} jobs
              </div>
              {cleaner.avgRating && (
                <div className="flex items-center gap-1 text-sm text-charcoal/60">
                  <Star className="w-4 h-4 text-yellow-500" />
                  {cleaner.avgRating}
                </div>
              )}
            </div>

            {/* Upcoming PTO */}
            {cleaner.upcomingPTO?.length > 0 && (
              <div className="mt-3 pt-3 border-t border-charcoal/10">
                <p className="text-xs text-yellow-600 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  PTO: {formatDate(cleaner.upcomingPTO[0].start_date)} - {formatDate(cleaner.upcomingPTO[0].end_date)}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="mt-4">
              <button
                onClick={() => toggleCleanerStatus(cleaner)}
                className={`w-full py-2 rounded-xl text-sm font-inter font-medium transition-colors ${
                  cleaner.status === 'active'
                    ? 'bg-charcoal/5 text-charcoal hover:bg-charcoal/10'
                    : 'bg-sage/10 text-sage hover:bg-sage/20'
                }`}
              >
                {cleaner.status === 'active' ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {cleaners.length === 0 && (
        <div className="bg-white rounded-2xl border border-charcoal/10 p-12 text-center">
          <Users className="w-12 h-12 text-charcoal/20 mx-auto mb-4" />
          <h3 className="font-inter font-medium text-charcoal mb-1">No cleaners yet</h3>
          <p className="text-charcoal/50 text-sm mb-4">Add your first cleaner to get started</p>
          <button onClick={() => setShowAddModal(true)} className="btn-primary">
            <Plus className="w-4 h-4 mr-2" />
            Add Cleaner
          </button>
        </div>
      )}

      {/* Add Cleaner Modal */}
      {showAddModal && (
        <AddCleanerModal
          onClose={() => setShowAddModal(false)}
          onAdd={() => { setShowAddModal(false); fetchData(); }}
        />
      )}

      {/* Add PTO Modal */}
      {showPTOModal && selectedCleaner && (
        <AddPTOModal
          cleaner={selectedCleaner}
          onClose={() => { setShowPTOModal(false); setSelectedCleaner(null); }}
          onAdd={() => { setShowPTOModal(false); setSelectedCleaner(null); fetchData(); }}
        />
      )}
    </div>
  );
};

// Add Cleaner Modal
const AddCleanerModal = ({ onClose, onAdd }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    service_areas: [],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const toggleArea = (area) => {
    setFormData(prev => ({
      ...prev,
      service_areas: prev.service_areas.includes(area)
        ? prev.service_areas.filter(a => a !== area)
        : [...prev.service_areas, area]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.phone) {
      setError('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const { error: insertError } = await supabase
        .from('cleaners')
        .insert({
          name: formData.name.trim(),
          email: formData.email.toLowerCase().trim(),
          phone: formData.phone.trim(),
          service_areas: formData.service_areas,
          status: 'active',
        });

      if (insertError) throw insertError;
      onAdd();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-charcoal/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-6 border-b border-charcoal/10">
          <h2 className="font-playfair text-xl font-semibold text-charcoal">Add Cleaner</h2>
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
              placeholder="Maria Rodriguez"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-charcoal mb-1.5">Email *</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 bg-bone border border-charcoal/10 rounded-xl font-inter
                         focus:outline-none focus:ring-2 focus:ring-sage"
              placeholder="maria@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-charcoal mb-1.5">Phone *</label>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-3 bg-bone border border-charcoal/10 rounded-xl font-inter
                         focus:outline-none focus:ring-2 focus:ring-sage"
              placeholder="(630) 555-1234"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">Service Areas</label>
            <div className="flex flex-wrap gap-2">
              {SERVICE_AREAS.map(area => (
                <button
                  key={area}
                  type="button"
                  onClick={() => toggleArea(area)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-inter transition-all ${
                    formData.service_areas.includes(area)
                      ? 'bg-sage text-white'
                      : 'bg-charcoal/5 text-charcoal/70 hover:bg-charcoal/10'
                  }`}
                >
                  {area}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 rounded-xl p-3 text-sm">{error}</div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? 'Adding...' : 'Add Cleaner'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Add PTO Modal
const AddPTOModal = ({ cleaner, onClose, onAdd }) => {
  const [formData, setFormData] = useState({
    start_date: '',
    end_date: '',
    reason: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.start_date || !formData.end_date) return;

    setSaving(true);
    try {
      await supabase.from('cleaner_time_off').insert({
        cleaner_id: cleaner.id,
        start_date: formData.start_date,
        end_date: formData.end_date,
        reason: formData.reason.trim() || null,
      });
      onAdd();
    } catch (err) {
      console.error('Error adding PTO:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-charcoal/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-6 border-b border-charcoal/10">
          <h2 className="font-playfair text-xl font-semibold text-charcoal">
            Add Time Off for {cleaner.name}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1.5">Start Date</label>
              <input
                type="date"
                required
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                min={formatDateForDB(new Date())}
                className="w-full px-4 py-3 bg-bone border border-charcoal/10 rounded-xl font-inter
                           focus:outline-none focus:ring-2 focus:ring-sage"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1.5">End Date</label>
              <input
                type="date"
                required
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                min={formData.start_date || formatDateForDB(new Date())}
                className="w-full px-4 py-3 bg-bone border border-charcoal/10 rounded-xl font-inter
                           focus:outline-none focus:ring-2 focus:ring-sage"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-charcoal mb-1.5">Reason (optional)</label>
            <input
              type="text"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="w-full px-4 py-3 bg-bone border border-charcoal/10 rounded-xl font-inter
                         focus:outline-none focus:ring-2 focus:ring-sage"
              placeholder="Vacation, sick leave, etc."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? 'Adding...' : 'Add Time Off'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Cleaners;
