import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { 
  FolderDown, Search, PlusCircle, Download, FileText, 
  HelpCircle, Sparkles, Star, CheckCircle2, AlertCircle, UploadCloud, ChevronDown 
} from 'lucide-react';
import { Modal } from '../../components/common/Modal';

export function AcademicResourcesPage() {
  const { user } = useAuth();
  const [resources, setResources] = useState([]);
  const [search, setSearch] = useState('');
  const [activeChip, setActiveChip] = useState('All');
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);

  // Upload Form State
  const [uploadData, setUploadData] = useState({
    title: '',
    description: '',
    resource_type: 'NOTES',
    department_id: user?.department_id || 'DEPT_IT',
    semester: user?.semester || 4,
    file: null
  });

  const filterChips = ['All', 'Notes', 'Question Papers', 'Books (PDF)', 'Study Materials'];

  useEffect(() => {
    fetchResources();
  }, [activeChip]);

  async function fetchResources() {
    setLoading(true);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (activeChip === 'Notes') params.resource_type = 'NOTES';
      if (activeChip === 'Question Papers') params.resource_type = 'QUESTION_PAPER';
      if (activeChip === 'Books (PDF)') params.resource_type = 'BOOK_PDF';
      if (activeChip === 'Study Materials') params.resource_type = 'STUDY_MATERIAL';

      const res = await api.get('/resources', params);
      if (res.success) {
        setResources(res.resources || []);
      }
    } catch (err) {
      console.error('Failed to load resources:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleDownload(resItem) {
    window.open(resItem.file_path || '#', '_blank');
    setActionMessage(`Downloading "${resItem.title}"...`);
    setTimeout(() => setActionMessage(null), 3000);
  }

  async function handleUploadSubmit(e) {
    e.preventDefault();
    if (!uploadData.title.trim()) {
      alert('Please enter a title for the resource.');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('title', uploadData.title.trim());
      formData.append('description', uploadData.description.trim());
      formData.append('resource_type', uploadData.resource_type);
      formData.append('department_id', uploadData.department_id);
      formData.append('semester', uploadData.semester);
      formData.append('copyright_confirmed', '1');

      if (uploadData.file) {
        formData.append('file', uploadData.file);
      }

      const res = await api.upload('/resources/upload', formData);
      if (res.success) {
        setActionMessage(res.message || 'PDF Resource uploaded successfully and visible to all!');
        setShowUploadModal(false);
        setUploadData({
          title: '',
          description: '',
          resource_type: 'NOTES',
          department_id: user?.department_id || 'DEPT_IT',
          semester: user?.semester || 4,
          file: null
        });
        await fetchResources();
      }
    } catch (err) {
      alert(err.message || 'Failed to upload resource. Please check file format.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in max-w-6xl mx-auto font-sans">
      
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Academic Resources
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Download lecture notes, previous university question papers, and study guides
          </p>
        </div>
      </div>

      {/* Notification */}
      {actionMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold animate-in slide-in-from-top flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>{actionMessage}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-slate-400 hover:text-slate-200">✕</button>
        </div>
      )}

      {/* Search & Upload Bar matching screenshot */}
      <div className="bg-white dark:bg-[#161F30] rounded-3xl border border-slate-200 dark:border-[#233044] p-5 shadow-xl space-y-4">
        
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchResources()}
              placeholder="Search notes, papers, books..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-[#0B111E] border border-slate-200 dark:border-[#233044] text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-amber-500 transition-colors"
            />
            <Search className="w-4 h-4 text-amber-500 absolute left-3.5 top-3" />
          </div>

          <button
            type="button"
            onClick={() => setShowUploadModal(true)}
            className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all hover:scale-105"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Upload Resource</span>
          </button>
        </div>

        {/* Filter Chips matching screenshot */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 dark:border-[#233044]/60">
          {filterChips.map(chip => (
            <button
              key={chip}
              type="button"
              onClick={() => setActiveChip(chip)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeChip === chip
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-100 dark:bg-[#0B111E] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-[#233044]'
              }`}
            >
              {chip}
            </button>
          ))}
        </div>

      </div>

      {/* Resource List Cards */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-16 text-center space-y-2">
            <div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin mx-auto" />
            <p className="text-xs text-slate-400">Loading resources...</p>
          </div>
        ) : resources.length > 0 ? (
          resources.map(item => (
            <div
              key={item.id}
              className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#161F30] border border-slate-200 dark:border-[#233044] hover:border-amber-500/50 shadow-sm flex items-center justify-between gap-4 transition-colors"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                    {item.title}
                  </h4>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-0.5">
                    <span>Uploaded by {item.uploader_name || 'Scholar'} ({item.department_code || 'IT'} - Sem {item.semester || 4})</span>
                    <span>•</span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#0B111E] text-[10px] font-bold text-amber-500 uppercase">
                      {item.resource_type ? item.resource_type.replace(/_/g, ' ') : 'Notes'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <div className="hidden sm:flex items-center gap-3 text-xs text-slate-400 font-medium">
                  <span>📥 {item.download_count || 0} downloads</span>
                  <span className="text-amber-500 font-bold">★ {item.avg_rating || 5.0}</span>
                </div>

                <button
                  type="button"
                  onClick={() => handleDownload(item)}
                  className="p-2.5 rounded-xl bg-slate-100 dark:bg-[#0B111E] hover:bg-amber-500 hover:text-slate-950 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#233044] transition-colors"
                  title="Download / View File"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="p-12 rounded-3xl bg-white dark:bg-[#161F30] border border-slate-200 dark:border-[#233044] text-center space-y-3">
            <FolderDown className="w-10 h-10 text-slate-400 mx-auto" />
            <p className="text-sm font-bold text-slate-400">No resources found in this category.</p>
            <p className="text-xs text-slate-500">Be the first to upload and share study materials!</p>
          </div>
        )}
      </div>

      {/* Upload Modal with REAL PDF Upload */}
      <Modal isOpen={showUploadModal} onClose={() => setShowUploadModal(false)} title="Upload Academic Study Material">
        <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs font-sans">
          <p className="text-slate-400">Upload notes, question papers, or PDF books to share with fellow students and faculty.</p>
          
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Resource Title *</label>
            <input
              type="text"
              required
              value={uploadData.title}
              onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
              placeholder="e.g. DBMS Unit 4 Relational Algebra Notes"
              className="w-full p-3 rounded-xl bg-slate-100 dark:bg-[#0B111E] border border-slate-200 dark:border-[#233044] text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500 font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Category Type</label>
              <div className="relative">
                <select
                  value={uploadData.resource_type}
                  onChange={(e) => setUploadData({ ...uploadData, resource_type: e.target.value })}
                  className="w-full appearance-none p-3 rounded-xl bg-slate-100 dark:bg-[#0B111E] border border-slate-200 dark:border-[#233044] text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:border-amber-500"
                >
                  <option value="NOTES">Lecture Notes</option>
                  <option value="QUESTION_PAPER">Question Paper</option>
                  <option value="BOOK_PDF">Book / Reference PDF</option>
                  <option value="STUDY_MATERIAL">Study Material</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3.5 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Semester</label>
              <div className="relative">
                <select
                  value={uploadData.semester}
                  onChange={(e) => setUploadData({ ...uploadData, semester: Number(e.target.value) })}
                  className="w-full appearance-none p-3 rounded-xl bg-slate-100 dark:bg-[#0B111E] border border-slate-200 dark:border-[#233044] text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:border-amber-500"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                    <option key={s} value={s}>Semester {s}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3.5 pointer-events-none" />
              </div>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Upload PDF / Document File</label>
            <div className="border-2 border-dashed border-slate-200 dark:border-[#233044] rounded-2xl p-4 text-center hover:border-amber-500 transition-colors">
              <UploadCloud className="w-8 h-8 text-amber-500 mx-auto mb-1" />
              <input
                type="file"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                onChange={(e) => setUploadData({ ...uploadData, file: e.target.files[0] })}
                className="w-full text-xs text-slate-500 file:mr-4 file:py-1.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-500 file:text-slate-950 hover:file:bg-amber-600 cursor-pointer"
              />
              <p className="text-[10px] text-slate-400 mt-1">Accepted formats: PDF, DOC, DOCX, PPT (Max 25MB)</p>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Description</label>
            <textarea
              rows={2}
              value={uploadData.description}
              onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
              placeholder="Brief summary of units, topics, or question paper year..."
              className="w-full p-3 rounded-xl bg-slate-100 dark:bg-[#0B111E] border border-slate-200 dark:border-[#233044] text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500 font-medium"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowUploadModal(false)}
              className="px-4 py-2 rounded-xl text-slate-500 font-bold hover:text-slate-700 dark:hover:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all hover:scale-105 disabled:opacity-50"
            >
              {uploading ? 'Uploading PDF...' : 'Publish to Library'}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
