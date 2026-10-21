import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ShelfLocationBadge } from '../../components/common/ShelfLocationBadge';
import { Modal } from '../../components/common/Modal';
import { 
  CheckSquare, Search, Edit3, MapPin, CheckCircle2, 
  AlertCircle, Building, Layers, PlusCircle, Save 
} from 'lucide-react';

export function BookInventoryPage() {
  const [copies, setCopies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCopy, setEditingCopy] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);

  const [editForm, setEditForm] = useState({
    building: '',
    floor: '',
    rack: '',
    shelf: '',
    status: '',
    condition: ''
  });

  useEffect(() => {
    fetchInventory();
  }, []);

  async function fetchInventory() {
    setLoading(true);
    try {
      // Fetch books and flatten copies
      const res = await api.get('/books/search', { q: '' });
      if (res.success && res.books) {
        // Collect detailed copies
        const copyList = [];
        for (const b of res.books.slice(0, 10)) {
          const detail = await api.get(`/books/${b.id}`);
          if (detail.success && detail.book?.copies) {
            detail.book.copies.forEach(c => {
              copyList.push({
                ...c,
                book_title: detail.book.title,
                book_isbn: detail.book.isbn,
                book_author: detail.book.author
              });
            });
          }
        }
        setCopies(copyList);
      }
    } catch (err) {
      console.error('Failed to load inventory:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleOpenEdit(copy) {
    setEditingCopy(copy);
    setEditForm({
      building: copy.building || 'Building A',
      floor: copy.floor || 'Floor 2',
      rack: copy.rack || 'Rack A1',
      shelf: copy.shelf || 'Shelf 1',
      status: copy.status || 'AVAILABLE',
      condition: copy.condition || 'GOOD'
    });
  }

  async function handleSaveLocation(e) {
    e.preventDefault();
    if (!editingCopy) return;

    try {
      const res = await api.put(`/admin/copies/${editingCopy.id}/location`, editForm);
      if (res.success) {
        setActionMessage({ type: 'success', text: `Copy ${editingCopy.id} location updated successfully.` });
        setEditingCopy(null);
        await fetchInventory();
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to update copy location.' });
    }
  }

  const filteredCopies = copies.filter(c => 
    c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.book_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.rack.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in max-w-6xl mx-auto">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Physical Inventory & Shelf Management</h2>
        <p className="text-xs text-slate-500 mt-1">
          Exact physical barcode tracking, Building / Floor / Rack / Shelf coordinate configuration, and copy condition audit
        </p>
      </div>

      {/* Action Notification */}
      {actionMessage && (
        <div className={`p-4 rounded-2xl border flex items-center justify-between text-xs font-semibold ${
          actionMessage.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'
        }`}>
          <div className="flex items-center gap-2">
            {actionMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
            <span>{actionMessage.text}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
      )}

      {/* Inventory Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400 shrink-0" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Filter copies by Barcode (e.g. DBMS-001), Title, or Rack location (e.g. Rack A12)..."
          className="flex-1 text-xs text-slate-900 bg-transparent focus:outline-none font-medium"
        />
        <span className="text-xs text-slate-400 font-semibold shrink-0">
          Showing {filteredCopies.length} copies
        </span>
      </div>

      {/* Copies Table */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900">Registered Physical Book Copies</h3>

        {loading ? (
          <p className="text-xs text-slate-400 py-8 text-center animate-pulse">Loading physical inventory records...</p>
        ) : filteredCopies.length === 0 ? (
          <p className="text-xs text-slate-400 py-8 text-center">No copies match your search.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <th className="py-2.5 px-3">Barcode / Copy ID</th>
                  <th className="py-2.5 px-3">Book Title</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Exact Physical Shelf Location</th>
                  <th className="py-2.5 px-3">Condition</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCopies.map(copy => (
                  <tr key={copy.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">{copy.id}</td>
                    <td className="py-3 px-3 font-medium text-slate-800 max-w-xs truncate">{copy.book_title}</td>
                    <td className="py-3 px-3">
                      <StatusBadge status={copy.status} className="text-[10px]" />
                    </td>
                    <td className="py-3 px-3">
                      <ShelfLocationBadge location={copy} size="xs" />
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-600">{copy.condition}</td>
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(copy)}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-slate-100 hover:bg-sky-50 text-slate-700 hover:text-sky-700 border border-slate-200 font-bold transition-colors"
                      >
                        <Edit3 className="w-3 h-3" />
                        Edit Location
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Location & Status Modal */}
      {editingCopy && (
        <Modal
          isOpen={true}
          onClose={() => setEditingCopy(null)}
          title={`Edit Copy Location: ${editingCopy.id}`}
          maxWidth="max-w-lg"
        >
          <form onSubmit={handleSaveLocation} className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="font-bold text-slate-900">{editingCopy.book_title}</span>
              <p className="text-[11px] text-slate-500 mt-0.5">By {editingCopy.book_author} (ISBN: {editingCopy.book_isbn})</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Building</label>
                <input
                  type="text"
                  required
                  value={editForm.building}
                  onChange={(e) => setEditForm({ ...editForm, building: e.target.value })}
                  placeholder="e.g. Building A"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Floor</label>
                <input
                  type="text"
                  required
                  value={editForm.floor}
                  onChange={(e) => setEditForm({ ...editForm, floor: e.target.value })}
                  placeholder="e.g. Floor 2"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Rack</label>
                <input
                  type="text"
                  required
                  value={editForm.rack}
                  onChange={(e) => setEditForm({ ...editForm, rack: e.target.value })}
                  placeholder="e.g. Rack A12"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Shelf</label>
                <input
                  type="text"
                  required
                  value={editForm.shelf}
                  onChange={(e) => setEditForm({ ...editForm, shelf: e.target.value })}
                  placeholder="e.g. Shelf 4"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Copy Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium"
                >
                  <option value="AVAILABLE">AVAILABLE (On Shelf)</option>
                  <option value="ISSUED">ISSUED (Checked Out)</option>
                  <option value="RESERVED">RESERVED (Hold at Desk)</option>
                  <option value="MISSING">MISSING (Investigating)</option>
                  <option value="DAMAGED">DAMAGED (Repair)</option>
                  <option value="MAINTENANCE">MAINTENANCE</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Physical Condition</label>
                <select
                  value={editForm.condition}
                  onChange={(e) => setEditForm({ ...editForm, condition: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium"
                >
                  <option value="GOOD">Good / Crisp</option>
                  <option value="FAIR">Fair (Normal Wear)</option>
                  <option value="DAMAGED">Damaged</option>
                </select>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingCopy(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                Save Changes
              </button>
            </div>
          </form>
        </Modal>
      )}

    </div>
  );
}
