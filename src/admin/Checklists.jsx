import { useState, useEffect, useRef } from 'react';
import { 
  ClipboardCheck, 
  Plus, 
  Edit2, 
  Trash2, 
  Save,
  X,
  GripVertical,
  CheckCircle2,
  Circle,
  Star,
  RefreshCw,
  Copy,
  ChevronDown,
  ChevronUp,
  Printer
} from 'lucide-react';

const DEFAULT_CHECKLIST = {
  name: 'Standard Cleaning Checklist',
  items: [
    { id: 1, category: 'Kitchen', task: 'Clean countertops and backsplash', required: true },
    { id: 2, category: 'Kitchen', task: 'Wipe down appliance exteriors', required: true },
    { id: 3, category: 'Kitchen', task: 'Clean sink and fixtures', required: true },
    { id: 4, category: 'Kitchen', task: 'Wipe cabinet fronts', required: false },
    { id: 5, category: 'Kitchen', task: 'Empty trash', required: true },
    { id: 6, category: 'Kitchen', task: 'Mop/vacuum floors', required: true },
    { id: 7, category: 'Bathrooms', task: 'Clean and sanitize toilet', required: true },
    { id: 8, category: 'Bathrooms', task: 'Clean shower/tub', required: true },
    { id: 9, category: 'Bathrooms', task: 'Clean sink and vanity', required: true },
    { id: 10, category: 'Bathrooms', task: 'Clean mirrors', required: true },
    { id: 11, category: 'Bathrooms', task: 'Empty trash', required: true },
    { id: 12, category: 'Bathrooms', task: 'Mop floors', required: true },
    { id: 13, category: 'Living Areas', task: 'Dust all surfaces', required: true },
    { id: 14, category: 'Living Areas', task: 'Vacuum carpets/rugs', required: true },
    { id: 15, category: 'Living Areas', task: 'Mop hard floors', required: true },
    { id: 16, category: 'Living Areas', task: 'Dust ceiling fans', required: false },
    { id: 17, category: 'Living Areas', task: 'Wipe light switches', required: false },
    { id: 18, category: 'Bedrooms', task: 'Change linens (if provided)', required: false },
    { id: 19, category: 'Bedrooms', task: 'Make beds', required: true },
    { id: 20, category: 'Bedrooms', task: 'Dust furniture', required: true },
    { id: 21, category: 'Bedrooms', task: 'Vacuum/mop floors', required: true },
    { id: 22, category: 'General', task: 'Empty all trash cans', required: true },
    { id: 23, category: 'General', task: 'Wipe door handles', required: true },
    { id: 24, category: 'General', task: 'Final walkthrough', required: true },
  ],
};

const DEEP_CLEAN_CHECKLIST = {
  name: 'Deep Clean Checklist',
  items: [
    ...DEFAULT_CHECKLIST.items,
    { id: 25, category: 'Kitchen', task: 'Clean inside microwave', required: true },
    { id: 26, category: 'Kitchen', task: 'Clean inside oven (exterior if self-clean)', required: true },
    { id: 27, category: 'Kitchen', task: 'Clean inside refrigerator', required: false },
    { id: 28, category: 'Kitchen', task: 'Degrease stovetop and range hood', required: true },
    { id: 29, category: 'Bathrooms', task: 'Scrub tile grout', required: true },
    { id: 30, category: 'Bathrooms', task: 'Clean behind toilet', required: true },
    { id: 31, category: 'Living Areas', task: 'Clean baseboards', required: true },
    { id: 32, category: 'Living Areas', task: 'Clean window sills', required: true },
    { id: 33, category: 'Living Areas', task: 'Clean inside windows', required: false },
    { id: 34, category: 'Bedrooms', task: 'Vacuum under beds', required: true },
    { id: 35, category: 'Bedrooms', task: 'Clean closet floors', required: false },
  ],
};

const ChecklistEditor = ({ checklist, onSave, onClose }) => {
  const [name, setName] = useState(checklist?.name || 'New Checklist');
  const [items, setItems] = useState(checklist?.items || []);
  const [newTask, setNewTask] = useState({ category: 'General', task: '', required: true });
  const [expandedCategories, setExpandedCategories] = useState(new Set(['Kitchen', 'Bathrooms', 'Living Areas', 'Bedrooms', 'General']));

  const categories = ['Kitchen', 'Bathrooms', 'Living Areas', 'Bedrooms', 'General'];

  const addItem = () => {
    if (!newTask.task.trim()) return;
    setItems([...items, { ...newTask, id: Date.now() }]);
    setNewTask({ category: newTask.category, task: '', required: true });
  };

  const removeItem = (id) => {
    setItems(items.filter(i => i.id !== id));
  };

  const toggleRequired = (id) => {
    setItems(items.map(i => i.id === id ? { ...i, required: !i.required } : i));
  };

  const toggleCategory = (category) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const itemsByCategory = categories.reduce((acc, cat) => {
    acc[cat] = items.filter(i => i.category === cat);
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-charcoal/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-charcoal/10 flex items-center justify-between">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="font-playfair text-xl font-semibold text-charcoal bg-transparent border-none 
                       focus:outline-none focus:ring-0 w-full"
            placeholder="Checklist Name"
          />
          <button onClick={onClose} className="p-2 text-charcoal/50 hover:text-charcoal rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Add New Item */}
          <div className="mb-6 p-4 bg-bone/50 rounded-xl">
            <h3 className="font-inter font-semibold text-charcoal mb-3">Add Task</h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={newTask.category}
                onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
                className="px-3 py-2 bg-white border border-charcoal/10 rounded-lg font-inter text-sm"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <input
                type="text"
                value={newTask.task}
                onChange={(e) => setNewTask({ ...newTask, task: e.target.value })}
                placeholder="Task description..."
                className="flex-1 px-3 py-2 bg-white border border-charcoal/10 rounded-lg font-inter text-sm"
                onKeyPress={(e) => e.key === 'Enter' && addItem()}
              />
              <button onClick={addItem} className="btn-primary text-sm px-4">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Items by Category */}
          <div className="space-y-4">
            {categories.map(category => (
              <div key={category} className="border border-charcoal/10 rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full flex items-center justify-between p-4 bg-bone/30 hover:bg-bone/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-inter font-semibold text-charcoal">{category}</span>
                    <span className="text-xs text-charcoal/50 bg-charcoal/10 px-2 py-0.5 rounded-full">
                      {itemsByCategory[category].length}
                    </span>
                  </div>
                  {expandedCategories.has(category) ? (
                    <ChevronUp className="w-4 h-4 text-charcoal/50" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-charcoal/50" />
                  )}
                </button>
                
                {expandedCategories.has(category) && (
                  <div className="p-2">
                    {itemsByCategory[category].length > 0 ? (
                      itemsByCategory[category].map(item => (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 p-2 hover:bg-bone/30 rounded-lg group"
                        >
                          <button
                            onClick={() => toggleRequired(item.id)}
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                              item.required ? 'border-sage bg-sage' : 'border-charcoal/30'
                            }`}
                          >
                            {item.required && <CheckCircle2 className="w-3 h-3 text-white" />}
                          </button>
                          <span className="flex-1 font-inter text-sm text-charcoal">{item.task}</span>
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            item.required ? 'bg-sage/10 text-sage' : 'bg-charcoal/10 text-charcoal/50'
                          }`}>
                            {item.required ? 'Required' : 'Optional'}
                          </span>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="p-1 text-charcoal/30 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-charcoal/50 py-4 text-sm">No tasks in this category</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-charcoal/10 flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={() => onSave({ name, items })} className="btn-primary flex-1 flex items-center justify-center gap-2">
            <Save className="w-4 h-4" />
            Save Checklist
          </button>
        </div>
      </div>
    </div>
  );
};

// Printable Checklist Component
const PrintableChecklist = ({ checklist, onClose }) => {
  const printRef = useRef(null);
  
  const categories = ['Kitchen', 'Bathrooms', 'Living Areas', 'Bedrooms', 'General'];
  const itemsByCategory = categories.reduce((acc, cat) => {
    acc[cat] = checklist.items.filter(i => i.category === cat);
    return acc;
  }, {});

  const handlePrint = () => {
    const printContent = printRef.current;
    const printWindow = window.open('', '_blank');
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${checklist.name} - Willow & Water</title>
          <style>
            @page { margin: 0.5in; }
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              color: #333;
              line-height: 1.4;
              padding: 20px;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
              padding-bottom: 15px;
              border-bottom: 2px solid #71797E;
            }
            .logo { 
              font-family: Georgia, serif;
              font-size: 24px;
              font-weight: 600;
              color: #71797E;
              margin-bottom: 5px;
            }
            .checklist-name { 
              font-size: 18px;
              color: #36454F;
              margin-bottom: 8px;
            }
            .meta {
              display: flex;
              justify-content: space-between;
              font-size: 12px;
              color: #666;
              margin-top: 10px;
            }
            .meta-item { display: flex; gap: 5px; }
            .category {
              margin-bottom: 20px;
              break-inside: avoid;
            }
            .category-header {
              background: #f5f5f5;
              padding: 8px 12px;
              font-weight: 600;
              font-size: 14px;
              color: #36454F;
              border-radius: 4px;
              margin-bottom: 8px;
            }
            .task {
              display: flex;
              align-items: flex-start;
              gap: 12px;
              padding: 8px 0;
              border-bottom: 1px solid #eee;
            }
            .task:last-child { border-bottom: none; }
            .checkbox {
              width: 18px;
              height: 18px;
              border: 2px solid #71797E;
              border-radius: 3px;
              flex-shrink: 0;
              margin-top: 1px;
            }
            .task-text {
              flex: 1;
              font-size: 13px;
            }
            .required-badge {
              font-size: 10px;
              padding: 2px 6px;
              background: #71797E;
              color: white;
              border-radius: 10px;
              flex-shrink: 0;
            }
            .optional-badge {
              font-size: 10px;
              padding: 2px 6px;
              background: #e5e5e5;
              color: #666;
              border-radius: 10px;
              flex-shrink: 0;
            }
            .footer {
              margin-top: 30px;
              padding-top: 15px;
              border-top: 1px solid #ddd;
              font-size: 11px;
              color: #888;
              text-align: center;
            }
            .signature-section {
              margin-top: 30px;
              display: flex;
              gap: 40px;
            }
            .signature-box {
              flex: 1;
            }
            .signature-line {
              border-bottom: 1px solid #333;
              margin-bottom: 5px;
              height: 30px;
            }
            .signature-label {
              font-size: 11px;
              color: #666;
            }
            .notes-section {
              margin-top: 25px;
            }
            .notes-header {
              font-size: 12px;
              font-weight: 600;
              color: #36454F;
              margin-bottom: 8px;
            }
            .notes-lines {
              border: 1px solid #ddd;
              border-radius: 4px;
              padding: 10px;
              min-height: 80px;
            }
            .notes-line {
              border-bottom: 1px solid #eee;
              height: 24px;
            }
            .notes-line:last-child { border-bottom: none; }
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const requiredCount = checklist.items.filter(i => i.required).length;
  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-charcoal/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-charcoal/10 flex items-center justify-between bg-bone/30">
          <h2 className="font-playfair text-lg font-semibold text-charcoal">
            Print Preview
          </h2>
          <div className="flex items-center gap-2">
            <button 
              onClick={handlePrint}
              className="btn-primary flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Print Checklist
            </button>
            <button onClick={onClose} className="p-2 text-charcoal/50 hover:text-charcoal rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Print Preview */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-100">
          <div 
            ref={printRef}
            className="bg-white shadow-lg mx-auto max-w-2xl p-8"
            style={{ minHeight: '11in' }}
          >
            {/* Printable Content */}
            <div className="header">
              <div className="logo">Willow & Water</div>
              <div className="checklist-name">{checklist.name}</div>
              <div className="meta">
                <div className="meta-item">
                  <span>Date:</span>
                  <span style={{ borderBottom: '1px solid #333', minWidth: '150px' }}>{today}</span>
                </div>
                <div className="meta-item">
                  <span>Cleaner:</span>
                  <span style={{ borderBottom: '1px solid #333', minWidth: '150px' }}></span>
                </div>
              </div>
              <div className="meta" style={{ marginTop: '8px' }}>
                <div className="meta-item">
                  <span>Client:</span>
                  <span style={{ borderBottom: '1px solid #333', minWidth: '200px' }}></span>
                </div>
                <div className="meta-item">
                  <span>Address:</span>
                  <span style={{ borderBottom: '1px solid #333', minWidth: '200px' }}></span>
                </div>
              </div>
            </div>

            {/* Tasks by Category */}
            {categories.map(category => {
              const categoryItems = itemsByCategory[category];
              if (categoryItems.length === 0) return null;
              
              return (
                <div key={category} className="category">
                  <div className="category-header">{category}</div>
                  {categoryItems.map(item => (
                    <div key={item.id} className="task">
                      <div className="checkbox"></div>
                      <div className="task-text">{item.task}</div>
                      {item.required ? (
                        <span className="required-badge">Required</span>
                      ) : (
                        <span className="optional-badge">Optional</span>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}

            {/* Notes Section */}
            <div className="notes-section">
              <div className="notes-header">Notes / Special Instructions</div>
              <div className="notes-lines">
                <div className="notes-line"></div>
                <div className="notes-line"></div>
                <div className="notes-line"></div>
              </div>
            </div>

            {/* Signature Section */}
            <div className="signature-section">
              <div className="signature-box">
                <div className="signature-line"></div>
                <div className="signature-label">Cleaner Signature</div>
              </div>
              <div className="signature-box">
                <div className="signature-line"></div>
                <div className="signature-label">Date Completed</div>
              </div>
            </div>

            {/* Footer */}
            <div className="footer">
              Willow & Water Organic Cleaning • Fox Valley, IL • willowandwatercleaning.com
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Checklists = () => {
  const [checklists, setChecklists] = useState([]);
  const [editingChecklist, setEditingChecklist] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [printingChecklist, setPrintingChecklist] = useState(null);

  useEffect(() => {
    // Load from localStorage
    const saved = localStorage.getItem('cleaningChecklists');
    if (saved) {
      setChecklists(JSON.parse(saved));
    } else {
      // Initialize with defaults
      const defaults = [DEFAULT_CHECKLIST, DEEP_CLEAN_CHECKLIST];
      setChecklists(defaults);
      localStorage.setItem('cleaningChecklists', JSON.stringify(defaults));
    }
  }, []);

  const saveChecklist = (checklist) => {
    let updated;
    if (editingChecklist) {
      updated = checklists.map(c => c.name === editingChecklist.name ? checklist : c);
    } else {
      updated = [...checklists, checklist];
    }
    setChecklists(updated);
    localStorage.setItem('cleaningChecklists', JSON.stringify(updated));
    setShowEditor(false);
    setEditingChecklist(null);
  };

  const deleteChecklist = (name) => {
    if (!confirm('Are you sure you want to delete this checklist?')) return;
    const updated = checklists.filter(c => c.name !== name);
    setChecklists(updated);
    localStorage.setItem('cleaningChecklists', JSON.stringify(updated));
  };

  const duplicateChecklist = (checklist) => {
    const duplicate = {
      ...checklist,
      name: `${checklist.name} (Copy)`,
      items: checklist.items.map(i => ({ ...i, id: Date.now() + Math.random() })),
    };
    const updated = [...checklists, duplicate];
    setChecklists(updated);
    localStorage.setItem('cleaningChecklists', JSON.stringify(updated));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-playfair text-2xl sm:text-3xl font-semibold text-charcoal">
            Cleaning Checklists
          </h1>
          <p className="text-charcoal/60 font-inter mt-1">
            Standardize your cleaning quality with checklists
          </p>
        </div>
        <button 
          onClick={() => { setEditingChecklist(null); setShowEditor(true); }}
          className="btn-primary flex items-center gap-2 self-start"
        >
          <Plus className="w-4 h-4" />
          Create Checklist
        </button>
      </div>

      {/* Info Box */}
      <div className="bg-sage/5 border border-sage/20 rounded-xl p-4">
        <div className="flex gap-3">
          <ClipboardCheck className="w-5 h-5 text-sage flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-inter font-medium text-charcoal mb-1">Quality Control</h3>
            <p className="text-sm text-charcoal/70">
              Create checklists for your team to follow during each cleaning. Mark items as required or optional. 
              Share these with your cleaners via the team communication features.
            </p>
          </div>
        </div>
      </div>

      {/* Checklist Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        {checklists.map((checklist) => {
          const requiredCount = checklist.items.filter(i => i.required).length;
          const categories = [...new Set(checklist.items.map(i => i.category))];
          
          return (
            <div 
              key={checklist.name}
              className="bg-white rounded-2xl shadow-sm border border-charcoal/5 overflow-hidden"
            >
              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-playfair text-lg font-semibold text-charcoal mb-1">
                      {checklist.name}
                    </h3>
                    <p className="text-sm text-charcoal/50 font-inter">
                      {checklist.items.length} tasks • {requiredCount} required
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPrintingChecklist(checklist)}
                      className="p-2 text-charcoal/50 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                      title="Print"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => duplicateChecklist(checklist)}
                      className="p-2 text-charcoal/50 hover:text-sage hover:bg-sage/10 rounded-lg"
                      title="Duplicate"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => { setEditingChecklist(checklist); setShowEditor(true); }}
                      className="p-2 text-charcoal/50 hover:text-sage hover:bg-sage/10 rounded-lg"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteChecklist(checklist.name)}
                      className="p-2 text-charcoal/50 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Categories */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {categories.map(cat => (
                    <span 
                      key={cat}
                      className="px-2 py-1 bg-bone/50 rounded text-xs font-inter text-charcoal/70"
                    >
                      {cat}
                    </span>
                  ))}
                </div>

                {/* Preview of tasks */}
                <div className="space-y-1.5">
                  {checklist.items.slice(0, 4).map(item => (
                    <div key={item.id} className="flex items-center gap-2 text-sm">
                      <div className={`w-3 h-3 rounded-full ${item.required ? 'bg-sage' : 'bg-charcoal/20'}`} />
                      <span className="text-charcoal/70 truncate">{item.task}</span>
                    </div>
                  ))}
                  {checklist.items.length > 4 && (
                    <p className="text-xs text-charcoal/50 pl-5">
                      +{checklist.items.length - 4} more tasks
                    </p>
                  )}
                </div>
              </div>

              <div className="border-t border-charcoal/10 p-4 bg-bone/30 flex gap-3">
                <button
                  onClick={() => { setEditingChecklist(checklist); setShowEditor(true); }}
                  className="flex-1 text-center text-sage hover:text-charcoal font-inter text-sm transition-colors"
                >
                  View & Edit
                </button>
                <div className="w-px bg-charcoal/10" />
                <button
                  onClick={() => setPrintingChecklist(checklist)}
                  className="flex-1 text-center text-blue-600 hover:text-charcoal font-inter text-sm transition-colors flex items-center justify-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  Print
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {checklists.length === 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-charcoal/5 p-12 text-center">
          <ClipboardCheck className="w-12 h-12 text-charcoal/30 mx-auto mb-4" />
          <h3 className="font-playfair text-xl font-semibold text-charcoal mb-2">
            No checklists yet
          </h3>
          <p className="text-charcoal/60 font-inter mb-4">
            Create your first cleaning checklist to standardize quality
          </p>
          <button
            onClick={() => setShowEditor(true)}
            className="btn-primary"
          >
            Create Checklist
          </button>
        </div>
      )}

      {/* Editor Modal */}
      {showEditor && (
        <ChecklistEditor
          checklist={editingChecklist}
          onSave={saveChecklist}
          onClose={() => { setShowEditor(false); setEditingChecklist(null); }}
        />
      )}

      {/* Print Preview Modal */}
      {printingChecklist && (
        <PrintableChecklist
          checklist={printingChecklist}
          onClose={() => setPrintingChecklist(null)}
        />
      )}
    </div>
  );
};

export default Checklists;
