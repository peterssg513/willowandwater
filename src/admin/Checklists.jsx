import { useState, useEffect } from 'react';
import { 
  ClipboardList, 
  Plus, 
  RefreshCw, 
  Edit2, 
  Trash2, 
  ChevronDown, 
  ChevronUp,
  GripVertical,
  Check,
  X,
  Save,
  Loader2,
  Home,
  Bath,
  Bed,
  Sofa,
  Sparkles
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const CHECKLIST_TYPES = [
  { id: 'standard', label: 'Standard Clean', color: 'bg-sage' },
  { id: 'deep', label: 'Deep Clean', color: 'bg-blue-500' },
  { id: 'move_in_out', label: 'Move In/Out', color: 'bg-purple-500' },
  { id: 'post_construction', label: 'Post Construction', color: 'bg-orange-500' },
  { id: 'custom', label: 'Custom', color: 'bg-charcoal' },
];

const ROOMS = [
  { id: 'Kitchen', icon: Home },
  { id: 'Bathroom', icon: Bath },
  { id: 'Bedroom', icon: Bed },
  { id: 'Living Room', icon: Sofa },
  { id: 'General', icon: Sparkles },
];

const Checklists = () => {
  const [checklists, setChecklists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedChecklist, setExpandedChecklist] = useState(null);
  const [editingChecklist, setEditingChecklist] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchChecklists();
  }, []);

  const fetchChecklists = async () => {
    setLoading(true);
    try {
      const { data: checklistsData, error: checklistsError } = await supabase
        .from('cleaning_checklists')
        .select('*')
        .order('checklist_type')
        .order('name');

      if (checklistsError) throw checklistsError;

      // Fetch items for each checklist
      const { data: itemsData, error: itemsError } = await supabase
        .from('checklist_items')
        .select('*')
        .order('room')
        .order('sort_order');

      if (itemsError) throw itemsError;

      // Group items by checklist
      const checklistsWithItems = checklistsData.map(checklist => ({
        ...checklist,
        items: itemsData.filter(item => item.checklist_id === checklist.id),
      }));

      setChecklists(checklistsWithItems);
    } catch (error) {
      console.error('Error fetching checklists:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteChecklist = async (checklistId) => {
    if (!confirm('Are you sure you want to delete this checklist? All items will be removed.')) return;
    
    try {
      await supabase.from('cleaning_checklists').delete().eq('id', checklistId);
      fetchChecklists();
    } catch (error) {
      console.error('Error deleting checklist:', error);
    }
  };

  const toggleDefault = async (checklist) => {
    try {
      // First, remove default from other checklists of same type
      await supabase
        .from('cleaning_checklists')
        .update({ is_default: false })
        .eq('checklist_type', checklist.checklist_type);
      
      // Then set this one as default
      await supabase
        .from('cleaning_checklists')
        .update({ is_default: true })
        .eq('id', checklist.id);
      
      fetchChecklists();
    } catch (error) {
      console.error('Error updating default:', error);
    }
  };

  const getTypeConfig = (type) => {
    return CHECKLIST_TYPES.find(t => t.id === type) || CHECKLIST_TYPES[4];
  };

  // Group items by room
  const groupItemsByRoom = (items) => {
    const grouped = {};
    ROOMS.forEach(room => {
      const roomItems = items.filter(item => item.room === room.id);
      if (roomItems.length > 0) {
        grouped[room.id] = roomItems;
      }
    });
    return grouped;
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
            Cleaning Checklists
          </h1>
          <p className="text-charcoal/60 font-inter mt-1">
            Manage cleaning checklists for your cleaners
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Checklist
          </button>
          <button onClick={fetchChecklists} className="btn-secondary">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Checklist Types Legend */}
      <div className="flex flex-wrap gap-2">
        {CHECKLIST_TYPES.map(type => (
          <span key={type.id} className="flex items-center gap-2 text-sm text-charcoal/70">
            <span className={`w-3 h-3 rounded-full ${type.color}`} />
            {type.label}
          </span>
        ))}
      </div>

      {/* Checklists */}
      <div className="space-y-4">
        {checklists.map(checklist => {
          const typeConfig = getTypeConfig(checklist.checklist_type);
          const isExpanded = expandedChecklist === checklist.id;
          const groupedItems = groupItemsByRoom(checklist.items || []);

          return (
            <div
              key={checklist.id}
              className="bg-white rounded-2xl border border-charcoal/10 overflow-hidden"
            >
              {/* Checklist Header */}
              <div
                className="p-5 flex items-center justify-between cursor-pointer hover:bg-charcoal/5 transition-colors"
                onClick={() => setExpandedChecklist(isExpanded ? null : checklist.id)}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-10 rounded-full ${typeConfig.color}`} />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-inter font-semibold text-charcoal">{checklist.name}</h3>
                      {checklist.is_default && (
                        <span className="text-xs bg-sage/10 text-sage px-2 py-0.5 rounded-full">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-charcoal/50">
                      {checklist.items?.length || 0} items • {typeConfig.label}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditingChecklist(checklist); }}
                    className="p-2 hover:bg-charcoal/10 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4 text-charcoal/50" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteChecklist(checklist.id); }}
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-charcoal/30" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-charcoal/30" />
                  )}
                </div>
              </div>

              {/* Expanded Items */}
              {isExpanded && (
                <div className="border-t border-charcoal/10 p-5 bg-bone/50">
                  {Object.keys(groupedItems).length > 0 ? (
                    <div className="space-y-6">
                      {ROOMS.map(room => {
                        const items = groupedItems[room.id];
                        if (!items) return null;
                        const RoomIcon = room.icon;

                        return (
                          <div key={room.id}>
                            <h4 className="font-inter font-medium text-charcoal flex items-center gap-2 mb-3">
                              <RoomIcon className="w-4 h-4 text-sage" />
                              {room.id}
                            </h4>
                            <div className="space-y-2 ml-6">
                              {items.map(item => (
                                <div
                                  key={item.id}
                                  className="flex items-start gap-3 text-sm"
                                >
                                  <div className="w-5 h-5 rounded border border-charcoal/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <Check className="w-3 h-3 text-charcoal/30" />
                                  </div>
                                  <div>
                                    <p className="text-charcoal">{item.task}</p>
                                    {item.notes && (
                                      <p className="text-charcoal/50 text-xs mt-0.5">{item.notes}</p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-charcoal/50 text-center py-4">
                      No items in this checklist. Click Edit to add items.
                    </p>
                  )}

                  {/* Set as Default */}
                  {!checklist.is_default && (
                    <button
                      onClick={() => toggleDefault(checklist)}
                      className="mt-4 text-sm text-sage hover:underline"
                    >
                      Set as default for {typeConfig.label}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {checklists.length === 0 && (
        <div className="bg-white rounded-2xl border border-charcoal/10 p-12 text-center">
          <ClipboardList className="w-12 h-12 text-charcoal/20 mx-auto mb-4" />
          <h3 className="font-inter font-medium text-charcoal mb-1">No checklists yet</h3>
          <p className="text-charcoal/50 text-sm mb-4">Create your first cleaning checklist</p>
          <button onClick={() => setShowAddModal(true)} className="btn-primary">
            <Plus className="w-4 h-4 mr-2" />
            New Checklist
          </button>
        </div>
      )}

      {/* Add/Edit Checklist Modal */}
      {(showAddModal || editingChecklist) && (
        <ChecklistModal
          checklist={editingChecklist}
          onClose={() => { setShowAddModal(false); setEditingChecklist(null); }}
          onSave={() => { setShowAddModal(false); setEditingChecklist(null); fetchChecklists(); }}
        />
      )}
    </div>
  );
};

// Checklist Modal (Add/Edit)
const ChecklistModal = ({ checklist, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: checklist?.name || '',
    description: checklist?.description || '',
    checklist_type: checklist?.checklist_type || 'standard',
  });
  const [items, setItems] = useState([]);
  const [saving, setSaving] = useState(false);
  const [activeRoom, setActiveRoom] = useState('Kitchen');
  const [newTask, setNewTask] = useState('');

  useEffect(() => {
    if (checklist?.items) {
      setItems(checklist.items);
    }
  }, [checklist]);

  const addItem = () => {
    if (!newTask.trim()) return;
    
    const newItem = {
      id: `new-${Date.now()}`,
      room: activeRoom,
      task: newTask.trim(),
      sort_order: items.filter(i => i.room === activeRoom).length,
      is_required: true,
      isNew: true,
    };
    
    setItems([...items, newItem]);
    setNewTask('');
  };

  const removeItem = (itemId) => {
    setItems(items.filter(i => i.id !== itemId));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setSaving(true);
    try {
      let checklistId = checklist?.id;

      if (checklist) {
        // Update existing checklist
        await supabase
          .from('cleaning_checklists')
          .update({
            name: formData.name.trim(),
            description: formData.description.trim() || null,
            checklist_type: formData.checklist_type,
          })
          .eq('id', checklist.id);
      } else {
        // Create new checklist
        const { data: newChecklist, error } = await supabase
          .from('cleaning_checklists')
          .insert({
            name: formData.name.trim(),
            description: formData.description.trim() || null,
            checklist_type: formData.checklist_type,
          })
          .select()
          .single();

        if (error) throw error;
        checklistId = newChecklist.id;
      }

      // Handle items
      if (checklist) {
        // Delete removed items
        const existingIds = checklist.items?.map(i => i.id) || [];
        const currentIds = items.filter(i => !i.isNew).map(i => i.id);
        const deletedIds = existingIds.filter(id => !currentIds.includes(id));
        
        if (deletedIds.length > 0) {
          await supabase.from('checklist_items').delete().in('id', deletedIds);
        }
      }

      // Insert new items
      const newItems = items.filter(i => i.isNew).map(i => ({
        checklist_id: checklistId,
        room: i.room,
        task: i.task,
        sort_order: i.sort_order,
        is_required: i.is_required,
        notes: i.notes || null,
      }));

      if (newItems.length > 0) {
        await supabase.from('checklist_items').insert(newItems);
      }

      onSave();
    } catch (error) {
      console.error('Error saving checklist:', error);
      alert('Failed to save checklist');
    } finally {
      setSaving(false);
    }
  };

  const groupedItems = {};
  ROOMS.forEach(room => {
    groupedItems[room.id] = items.filter(i => i.room === room.id);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-charcoal/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-charcoal/10 flex-shrink-0">
          <h2 className="font-playfair text-xl font-semibold text-charcoal">
            {checklist ? 'Edit Checklist' : 'New Checklist'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
          {/* Checklist Info */}
          <div className="p-6 space-y-4 flex-shrink-0 border-b border-charcoal/10">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1.5">Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-bone border border-charcoal/10 rounded-xl font-inter
                             focus:outline-none focus:ring-2 focus:ring-sage"
                  placeholder="Standard Clean"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1.5">Type</label>
                <select
                  value={formData.checklist_type}
                  onChange={(e) => setFormData({ ...formData, checklist_type: e.target.value })}
                  className="w-full px-4 py-3 bg-bone border border-charcoal/10 rounded-xl font-inter
                             focus:outline-none focus:ring-2 focus:ring-sage"
                >
                  {CHECKLIST_TYPES.map(type => (
                    <option key={type.id} value={type.id}>{type.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1.5">Description (optional)</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 bg-bone border border-charcoal/10 rounded-xl font-inter
                           focus:outline-none focus:ring-2 focus:ring-sage"
                placeholder="Our regular recurring cleaning checklist"
              />
            </div>
          </div>

          {/* Items Section */}
          <div className="flex-1 overflow-auto p-6">
            {/* Room Tabs */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              {ROOMS.map(room => {
                const RoomIcon = room.icon;
                const count = groupedItems[room.id]?.length || 0;
                return (
                  <button
                    key={room.id}
                    type="button"
                    onClick={() => setActiveRoom(room.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-inter whitespace-nowrap transition-all
                      ${activeRoom === room.id 
                        ? 'bg-sage text-white' 
                        : 'bg-charcoal/5 text-charcoal/70 hover:bg-charcoal/10'
                      }`}
                  >
                    <RoomIcon className="w-4 h-4" />
                    {room.id}
                    {count > 0 && (
                      <span className={`text-xs px-1.5 rounded-full ${
                        activeRoom === room.id ? 'bg-white/20' : 'bg-charcoal/10'
                      }`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Add Item */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem())}
                className="flex-1 px-4 py-3 bg-bone border border-charcoal/10 rounded-xl font-inter
                           focus:outline-none focus:ring-2 focus:ring-sage"
                placeholder={`Add task for ${activeRoom}...`}
              />
              <button
                type="button"
                onClick={addItem}
                className="btn-primary"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Items List */}
            <div className="space-y-2">
              {groupedItems[activeRoom]?.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 bg-bone rounded-xl group"
                >
                  <GripVertical className="w-4 h-4 text-charcoal/30 cursor-grab" />
                  <div className="w-5 h-5 rounded border border-charcoal/20 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-charcoal/30" />
                  </div>
                  <span className="flex-1 text-charcoal">{item.task}</span>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="p-1.5 hover:bg-red-100 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <X className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              ))}
              
              {groupedItems[activeRoom]?.length === 0 && (
                <p className="text-charcoal/40 text-sm text-center py-8">
                  No items for {activeRoom}. Add some tasks above.
                </p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-charcoal/10 flex gap-3 flex-shrink-0">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Checklist
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Checklists;
