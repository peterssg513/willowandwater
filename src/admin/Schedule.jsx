import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar,
  Clock,
  MapPin,
  User,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Filter
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { formatPrice } from '../utils/pricingLogic';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const FULL_DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const Schedule = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('week'); // 'day' | 'week' | 'month'
  const [jobs, setJobs] = useState([]);
  const [cleaners, setCleaners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);

  // Get date range based on view
  const dateRange = useMemo(() => {
    const start = new Date(currentDate);
    const end = new Date(currentDate);
    
    if (view === 'day') {
      return { start, end };
    } else if (view === 'week') {
      start.setDate(start.getDate() - start.getDay());
      end.setDate(start.getDate() + 6);
      return { start, end };
    } else {
      start.setDate(1);
      end.setMonth(end.getMonth() + 1);
      end.setDate(0);
      return { start, end };
    }
  }, [currentDate, view]);

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const startStr = dateRange.start.toISOString().split('T')[0];
      const endStr = dateRange.end.toISOString().split('T')[0];

      const [jobsRes, cleanersRes] = await Promise.all([
        supabase
          .from('jobs')
          .select(`
            *,
            customers (name, address, city, phone),
            cleaners (name, phone)
          `)
          .gte('scheduled_date', startStr)
          .lte('scheduled_date', endStr)
          .not('status', 'in', '("cancelled","no_show")')
          .order('scheduled_date')
          .order('scheduled_time'),
        supabase
          .from('cleaners')
          .select('*')
          .eq('status', 'active')
      ]);

      setJobs(jobsRes.data || []);
      setCleaners(cleanersRes.data || []);
    } catch (error) {
      console.error('Error fetching schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigate = (direction) => {
    const newDate = new Date(currentDate);
    if (view === 'day') {
      newDate.setDate(newDate.getDate() + direction);
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() + (direction * 7));
    } else {
      newDate.setMonth(newDate.getMonth() + direction);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const assignCleaner = async (jobId, cleanerId) => {
    try {
      await supabase
        .from('jobs')
        .update({ cleaner_id: cleanerId, status: 'confirmed' })
        .eq('id', jobId);
      
      await supabase.from('activity_log').insert({
        entity_type: 'job',
        entity_id: jobId,
        action: 'assigned',
        actor_type: 'admin',
        details: { cleaner_id: cleanerId }
      });

      fetchData();
      setSelectedJob(null);
    } catch (error) {
      console.error('Error assigning cleaner:', error);
    }
  };

  const getJobsByDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return jobs.filter(j => j.scheduled_date === dateStr);
  };

  const formatDateHeader = () => {
    if (view === 'day') {
      return currentDate.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      });
    } else if (view === 'week') {
      return `${dateRange.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${dateRange.end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    } else {
      return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
  };

  // Generate week days
  const weekDays = useMemo(() => {
    const days = [];
    const start = new Date(dateRange.start);
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      days.push(day);
    }
    return days;
  }, [dateRange]);

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
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
            Schedule
          </h1>
          <p className="text-charcoal/60 font-inter mt-1">
            {jobs.length} job{jobs.length !== 1 ? 's' : ''} scheduled
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchData} className="btn-secondary">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* View Controls */}
      <div className="bg-white rounded-2xl shadow-sm border border-charcoal/5 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-charcoal/5 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-charcoal" />
            </button>
            <button
              onClick={goToToday}
              className="px-3 py-1.5 text-sm font-inter font-medium text-sage 
                         hover:bg-sage/10 rounded-lg transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => navigate(1)}
              className="p-2 hover:bg-charcoal/5 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-charcoal" />
            </button>
            <span className="ml-2 font-playfair font-semibold text-charcoal">
              {formatDateHeader()}
            </span>
          </div>

          {/* View Toggle */}
          <div className="flex items-center bg-charcoal/5 rounded-lg p-1">
            {['day', 'week', 'month'].map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`
                  px-4 py-1.5 text-sm font-inter font-medium rounded-md capitalize transition-all
                  ${view === v ? 'bg-white text-charcoal shadow-sm' : 'text-charcoal/60 hover:text-charcoal'}
                `}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Week View */}
      {view === 'week' && (
        <div className="bg-white rounded-2xl shadow-sm border border-charcoal/5 overflow-hidden">
          {/* Day Headers */}
          <div className="grid grid-cols-7 border-b border-charcoal/10">
            {weekDays.map((day, idx) => (
              <div
                key={idx}
                className={`p-3 text-center border-r border-charcoal/5 last:border-r-0
                  ${isToday(day) ? 'bg-sage/5' : ''}
                `}
              >
                <p className="text-xs text-charcoal/50 font-inter">{DAY_NAMES[day.getDay()]}</p>
                <p className={`text-lg font-semibold ${isToday(day) ? 'text-sage' : 'text-charcoal'}`}>
                  {day.getDate()}
                </p>
              </div>
            ))}
          </div>

          {/* Job Grid */}
          <div className="grid grid-cols-7 min-h-[400px]">
            {weekDays.map((day, idx) => {
              const dayJobs = getJobsByDate(day);
              const morningJobs = dayJobs.filter(j => j.scheduled_time === 'morning');
              const afternoonJobs = dayJobs.filter(j => j.scheduled_time === 'afternoon');

              return (
                <div
                  key={idx}
                  className={`border-r border-charcoal/5 last:border-r-0 p-2 space-y-2
                    ${isToday(day) ? 'bg-sage/5' : ''}
                    ${day.getDay() === 0 || day.getDay() === 6 ? 'bg-charcoal/5' : ''}
                  `}
                >
                  {morningJobs.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs text-charcoal/40 font-inter">Morning</p>
                      {morningJobs.map(job => (
                        <JobCard key={job.id} job={job} onClick={() => setSelectedJob(job)} />
                      ))}
                    </div>
                  )}
                  {afternoonJobs.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs text-charcoal/40 font-inter">Afternoon</p>
                      {afternoonJobs.map(job => (
                        <JobCard key={job.id} job={job} onClick={() => setSelectedJob(job)} />
                      ))}
                    </div>
                  )}
                  {dayJobs.length === 0 && (
                    <p className="text-xs text-charcoal/30 text-center py-4">No jobs</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Day View */}
      {view === 'day' && (
        <div className="bg-white rounded-2xl shadow-sm border border-charcoal/5 overflow-hidden">
          <div className="divide-y divide-charcoal/5">
            {['morning', 'afternoon'].map(timeSlot => {
              const slotJobs = jobs.filter(j => 
                j.scheduled_date === currentDate.toISOString().split('T')[0] &&
                j.scheduled_time === timeSlot
              );

              return (
                <div key={timeSlot} className="p-4">
                  <h3 className="font-inter font-semibold text-charcoal capitalize mb-3">
                    {timeSlot} ({timeSlot === 'morning' ? '9am - 12pm' : '1pm - 5pm'})
                  </h3>
                  {slotJobs.length > 0 ? (
                    <div className="space-y-3">
                      {slotJobs.map(job => (
                        <div
                          key={job.id}
                          onClick={() => setSelectedJob(job)}
                          className="p-4 bg-bone/50 rounded-xl cursor-pointer hover:bg-bone transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-inter font-semibold text-charcoal">
                                {job.customers?.name}
                              </p>
                              <p className="text-sm text-charcoal/60 flex items-center gap-1 mt-1">
                                <MapPin className="w-4 h-4" />
                                {job.customers?.city}
                              </p>
                            </div>
                            <div className="text-right">
                              {job.cleaner_id ? (
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                  {job.cleaners?.name}
                                </span>
                              ) : (
                                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3" />
                                  Unassigned
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-charcoal/40 text-sm">No jobs scheduled</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Month View */}
      {view === 'month' && (
        <div className="bg-white rounded-2xl shadow-sm border border-charcoal/5 overflow-hidden">
          <div className="grid grid-cols-7 border-b border-charcoal/10">
            {DAY_NAMES.map(day => (
              <div key={day} className="p-2 text-center text-xs font-inter font-medium text-charcoal/50">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {(() => {
              const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
              const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
              const cells = [];
              
              // Padding for first week
              for (let i = 0; i < firstDay.getDay(); i++) {
                cells.push(<div key={`pad-${i}`} className="p-2 min-h-[80px] bg-charcoal/5" />);
              }
              
              // Days of month
              for (let day = 1; day <= lastDay.getDate(); day++) {
                const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                const dayJobs = getJobsByDate(date);
                
                cells.push(
                  <div
                    key={day}
                    className={`p-2 min-h-[80px] border-b border-r border-charcoal/5
                      ${isToday(date) ? 'bg-sage/5' : ''}
                      ${date.getDay() === 0 || date.getDay() === 6 ? 'bg-charcoal/5' : ''}
                    `}
                  >
                    <p className={`text-sm font-medium mb-1 ${isToday(date) ? 'text-sage' : 'text-charcoal'}`}>
                      {day}
                    </p>
                    {dayJobs.slice(0, 2).map(job => (
                      <div
                        key={job.id}
                        onClick={() => setSelectedJob(job)}
                        className={`text-xs p-1 rounded mb-1 truncate cursor-pointer
                          ${job.cleaner_id ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}
                        `}
                      >
                        {job.customers?.name?.split(' ')[0]}
                      </div>
                    ))}
                    {dayJobs.length > 2 && (
                      <p className="text-xs text-charcoal/50">+{dayJobs.length - 2} more</p>
                    )}
                  </div>
                );
              }
              
              return cells;
            })()}
          </div>
        </div>
      )}

      {/* Job Detail Modal */}
      {selectedJob && (
        <JobDetailModal
          job={selectedJob}
          cleaners={cleaners}
          onClose={() => setSelectedJob(null)}
          onAssign={assignCleaner}
        />
      )}
    </div>
  );
};

// Job Card Component
const JobCard = ({ job, onClick }) => (
  <div
    onClick={onClick}
    className={`p-2 rounded-lg text-xs cursor-pointer transition-colors
      ${job.cleaner_id 
        ? 'bg-green-50 hover:bg-green-100 border border-green-200' 
        : 'bg-yellow-50 hover:bg-yellow-100 border border-yellow-200'
      }
    `}
  >
    <p className="font-medium text-charcoal truncate">{job.customers?.name}</p>
    <p className="text-charcoal/60 truncate">{job.customers?.city}</p>
    {job.cleaner_id ? (
      <p className="text-green-600 mt-1">{job.cleaners?.name}</p>
    ) : (
      <p className="text-yellow-600 mt-1 flex items-center gap-1">
        <AlertTriangle className="w-3 h-3" />
        Unassigned
      </p>
    )}
  </div>
);

// Job Detail Modal
const JobDetailModal = ({ job, cleaners, onClose, onAssign }) => {
  const [selectedCleaner, setSelectedCleaner] = useState(job.cleaner_id || '');

  const handleAssign = () => {
    if (selectedCleaner) {
      onAssign(job.id, selectedCleaner);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-charcoal/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-6 border-b border-charcoal/10">
          <h2 className="font-playfair text-xl font-semibold text-charcoal">Job Details</h2>
        </div>

        <div className="p-6 space-y-4">
          {/* Customer Info */}
          <div>
            <h3 className="text-sm text-charcoal/50 mb-1">Customer</h3>
            <p className="font-inter font-semibold text-charcoal">{job.customers?.name}</p>
            <p className="text-sm text-charcoal/60">{job.customers?.address}</p>
            <p className="text-sm text-charcoal/60">{job.customers?.city}</p>
            {job.customers?.phone && (
              <a href={`tel:${job.customers.phone}`} className="text-sm text-sage hover:underline">
                {job.customers.phone}
              </a>
            )}
          </div>

          {/* Schedule */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-sage" />
              <span className="text-sm text-charcoal">
                {new Date(job.scheduled_date).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric'
                })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-sage" />
              <span className="text-sm text-charcoal capitalize">
                {job.scheduled_time}
              </span>
            </div>
          </div>

          {/* Price */}
          <div className="bg-sage/5 rounded-xl p-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-charcoal/60">Job Price</span>
              <span className="font-semibold text-charcoal">{formatPrice(job.final_price)}</span>
            </div>
          </div>

          {/* Cleaner Assignment */}
          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">
              Assign Cleaner
            </label>
            <select
              value={selectedCleaner}
              onChange={(e) => setSelectedCleaner(e.target.value)}
              className="w-full px-4 py-3 bg-bone border border-charcoal/10 rounded-xl font-inter
                         focus:outline-none focus:ring-2 focus:ring-sage"
            >
              <option value="">Select a cleaner...</option>
              {cleaners.map(cleaner => (
                <option key={cleaner.id} value={cleaner.id}>
                  {cleaner.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="p-6 border-t border-charcoal/10 flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">
            Close
          </button>
          <button
            onClick={handleAssign}
            disabled={!selectedCleaner}
            className="btn-primary flex-1 disabled:opacity-50"
          >
            {job.cleaner_id ? 'Reassign' : 'Assign'} Cleaner
          </button>
        </div>
      </div>
    </div>
  );
};

export default Schedule;
