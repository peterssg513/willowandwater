import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Check, 
  Loader2, 
  AlertTriangle, 
  ClipboardList,
  MapPin,
  Phone,
  Clock,
  Calendar,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Circle,
  Home,
  Sparkles
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const ROOM_ICONS = {
  'Kitchen': '🍳',
  'Bathroom': '🚿',
  'Bedroom': '🛏️',
  'Living Room': '🛋️',
  'General': '✨',
};

const CleanerChecklist = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const jobId = searchParams.get('job');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [job, setJob] = useState(null);
  const [checklist, setChecklist] = useState(null);
  const [progress, setProgress] = useState({});
  const [expandedRooms, setExpandedRooms] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (token && jobId) {
      validateAndFetch();
    } else {
      setError('Invalid link. Please use the link from your schedule email.');
      setLoading(false);
    }
  }, [token, jobId]);

  const validateAndFetch = async () => {
    try {
      // Validate magic link token
      const { data: linkData, error: linkError } = await supabase
        .from('cleaner_magic_links')
        .select('*')
        .eq('token', token)
        .single();

      if (linkError || !linkData) {
        throw new Error('Invalid or expired link');
      }

      if (new Date(linkData.expires_at) < new Date()) {
        throw new Error('This link has expired. Please request a new schedule email.');
      }

      // Fetch job with customer and checklist
      const { data: jobData, error: jobError } = await supabase
        .from('jobs')
        .select(`
          *,
          customers (
            name,
            address,
            city,
            phone,
            access_type,
            access_instructions
          ),
          cleaners (
            name
          ),
          cleaning_checklists (
            id,
            name
          )
        `)
        .eq('id', jobId)
        .single();

      if (jobError || !jobData) {
        throw new Error('Job not found');
      }

      setJob(jobData);

      // Get checklist - use job's assigned checklist or default
      let checklistId = jobData.checklist_id;
      
      if (!checklistId) {
        // Get default checklist for job type (standard for now)
        const { data: defaultChecklist } = await supabase
          .from('cleaning_checklists')
          .select('id')
          .eq('checklist_type', 'standard')
          .eq('is_default', true)
          .single();
        
        checklistId = defaultChecklist?.id;
      }

      if (checklistId) {
        // Fetch checklist with items
        const { data: checklistData } = await supabase
          .from('cleaning_checklists')
          .select('*')
          .eq('id', checklistId)
          .single();

        const { data: itemsData } = await supabase
          .from('checklist_items')
          .select('*')
          .eq('checklist_id', checklistId)
          .order('room')
          .order('sort_order');

        if (checklistData) {
          setChecklist({
            ...checklistData,
            items: itemsData || [],
          });

          // Fetch existing progress
          const { data: progressData } = await supabase
            .from('job_checklist_progress')
            .select('*')
            .eq('job_id', jobId);

          const progressMap = {};
          (progressData || []).forEach(p => {
            progressMap[p.checklist_item_id] = p;
          });
          setProgress(progressMap);

          // Expand all rooms by default
          const rooms = {};
          (itemsData || []).forEach(item => {
            rooms[item.room] = true;
          });
          setExpandedRooms(rooms);
        }
      }

      // Mark link as used
      await supabase
        .from('cleaner_magic_links')
        .update({ used_at: new Date().toISOString() })
        .eq('id', linkData.id);

    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleItem = async (itemId) => {
    const currentProgress = progress[itemId];
    const newCompleted = !currentProgress?.completed;
    
    setSaving(true);
    try {
      if (currentProgress?.id) {
        // Update existing progress
        await supabase
          .from('job_checklist_progress')
          .update({
            completed: newCompleted,
            completed_at: newCompleted ? new Date().toISOString() : null,
          })
          .eq('id', currentProgress.id);
      } else {
        // Create new progress entry
        const { data: newProgress } = await supabase
          .from('job_checklist_progress')
          .insert({
            job_id: jobId,
            checklist_id: checklist.id,
            checklist_item_id: itemId,
            completed: true,
            completed_at: new Date().toISOString(),
          })
          .select()
          .single();
        
        if (newProgress) {
          setProgress(prev => ({
            ...prev,
            [itemId]: newProgress,
          }));
          return;
        }
      }

      setProgress(prev => ({
        ...prev,
        [itemId]: {
          ...currentProgress,
          completed: newCompleted,
          completed_at: newCompleted ? new Date().toISOString() : null,
        },
      }));
    } catch (err) {
      console.error('Error updating progress:', err);
    } finally {
      setSaving(false);
    }
  };

  const toggleRoom = (room) => {
    setExpandedRooms(prev => ({
      ...prev,
      [room]: !prev[room],
    }));
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };

  const groupItemsByRoom = (items) => {
    const grouped = {};
    items.forEach(item => {
      if (!grouped[item.room]) {
        grouped[item.room] = [];
      }
      grouped[item.room].push(item);
    });
    return grouped;
  };

  const calculateProgress = () => {
    if (!checklist?.items?.length) return { completed: 0, total: 0, percent: 0 };
    const completed = Object.values(progress).filter(p => p?.completed).length;
    const total = checklist.items.length;
    return {
      completed,
      total,
      percent: Math.round((completed / total) * 100),
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bone flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-sage" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-bone flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h1 className="font-playfair text-2xl font-semibold text-charcoal mb-2">
            Oops!
          </h1>
          <p className="text-charcoal/60">{error}</p>
        </div>
      </div>
    );
  }

  const customer = job?.customers;
  const progressStats = calculateProgress();
  const groupedItems = checklist ? groupItemsByRoom(checklist.items) : {};

  return (
    <div className="min-h-screen bg-bone">
      {/* Header */}
      <div className="bg-white border-b border-charcoal/10 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-playfair text-xl font-semibold text-charcoal">
                Willow & Water
              </h1>
              <p className="text-sm text-charcoal/60">Cleaning Checklist</p>
            </div>
            {saving && (
              <Loader2 className="w-5 h-5 animate-spin text-sage" />
            )}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Job Info Card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="font-inter font-semibold text-charcoal text-lg">
                {customer?.name}
              </h2>
              <p className="text-charcoal/60 text-sm flex items-center gap-1 mt-1">
                <Calendar className="w-4 h-4" />
                {formatDate(job?.scheduled_date)}
              </p>
              <p className="text-charcoal/60 text-sm flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {job?.scheduled_time === 'morning' ? '9am - 12pm' : '1pm - 5pm'}
              </p>
            </div>
            <div className="text-right">
              <div className={`text-2xl font-bold ${
                progressStats.percent === 100 ? 'text-green-600' : 'text-sage'
              }`}>
                {progressStats.percent}%
              </div>
              <p className="text-xs text-charcoal/50">
                {progressStats.completed}/{progressStats.total} done
              </p>
            </div>
          </div>

          {/* Address & Phone */}
          <div className="space-y-2 pt-4 border-t border-charcoal/10">
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(customer?.address + ', ' + customer?.city)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-2 text-sm text-charcoal hover:text-sage"
            >
              <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
              {customer?.address}, {customer?.city}
            </a>
            <a
              href={`tel:${customer?.phone}`}
              className="flex items-center gap-2 text-sm text-charcoal hover:text-sage"
            >
              <Phone className="w-4 h-4" />
              {customer?.phone}
            </a>
          </div>

          {/* Access Instructions */}
          {customer?.access_instructions && (
            <div className="mt-4 p-3 bg-sage/10 rounded-xl">
              <p className="text-sm font-medium text-charcoal">
                🔑 Access: {customer?.access_type?.replace('_', ' ')}
              </p>
              <p className="text-sm text-charcoal/70 mt-1">
                {customer?.access_instructions}
              </p>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-charcoal">Progress</span>
            <span className="text-sm text-charcoal/60">
              {progressStats.completed} of {progressStats.total} tasks
            </span>
          </div>
          <div className="h-3 bg-charcoal/10 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                progressStats.percent === 100 ? 'bg-green-500' : 'bg-sage'
              }`}
              style={{ width: `${progressStats.percent}%` }}
            />
          </div>
        </div>

        {/* Checklist */}
        {checklist ? (
          <div className="space-y-3">
            {Object.entries(groupedItems).map(([room, items]) => {
              const roomCompleted = items.filter(i => progress[i.id]?.completed).length;
              const isExpanded = expandedRooms[room];
              const isRoomComplete = roomCompleted === items.length;

              return (
                <div key={room} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  {/* Room Header */}
                  <button
                    onClick={() => toggleRoom(room)}
                    className="w-full p-4 flex items-center justify-between hover:bg-charcoal/5 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{ROOM_ICONS[room] || '📋'}</span>
                      <div className="text-left">
                        <h3 className="font-inter font-semibold text-charcoal">{room}</h3>
                        <p className="text-xs text-charcoal/50">
                          {roomCompleted}/{items.length} completed
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isRoomComplete && (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      )}
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-charcoal/30" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-charcoal/30" />
                      )}
                    </div>
                  </button>

                  {/* Room Items */}
                  {isExpanded && (
                    <div className="border-t border-charcoal/10">
                      {items.map(item => {
                        const isCompleted = progress[item.id]?.completed;
                        return (
                          <button
                            key={item.id}
                            onClick={() => toggleItem(item.id)}
                            className={`w-full p-4 flex items-start gap-3 text-left transition-colors border-b border-charcoal/5 last:border-0
                              ${isCompleted ? 'bg-green-50' : 'hover:bg-charcoal/5'}
                            `}
                          >
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors
                              ${isCompleted 
                                ? 'bg-green-500 border-green-500' 
                                : 'border-charcoal/30 hover:border-sage'
                              }
                            `}>
                              {isCompleted && <Check className="w-4 h-4 text-white" />}
                            </div>
                            <div className="flex-1">
                              <p className={`font-inter ${
                                isCompleted ? 'text-charcoal/50 line-through' : 'text-charcoal'
                              }`}>
                                {item.task}
                              </p>
                              {item.notes && (
                                <p className="text-xs text-charcoal/50 mt-1">{item.notes}</p>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
            <ClipboardList className="w-12 h-12 text-charcoal/20 mx-auto mb-4" />
            <p className="text-charcoal/60">No checklist assigned to this job.</p>
          </div>
        )}

        {/* Completion Message */}
        {progressStats.percent === 100 && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <h3 className="font-inter font-semibold text-green-800 mb-1">
              All Done! 🎉
            </h3>
            <p className="text-green-700 text-sm">
              Great job! All tasks have been completed.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CleanerChecklist;
