import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Search, 
  Settings, 
  Pin, 
  Archive, 
  Trash2, 
  Grid, 
  List, 
  Tag as TagIcon,
  X,
  Menu,
  ArrowLeft,
  Lock,
  Unlock,
  Download,
  Upload,
  Image as ImageIcon,
  Palette
} from 'lucide-react';
import { db } from './db';
import type { Note, Tag, AppSettings } from './types';
import { format } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Logo from './components/Logo';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Components
import NoteEditor from './components/NoteEditor';
import NoteCard from './components/NoteCard';

export default function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState<'notes' | 'pinned' | 'archived' | 'settings'>('notes');
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAppLocked, setIsAppLocked] = useState(false);
  const [pinInput, setPinInput] = useState('');

  // Queries
  const notes = useLiveQuery(() => db.notes.toArray()) || [];
  const tags = useLiveQuery(() => db.tags.toArray()) || [];
  const appSettings = useLiveQuery(() => db.settings.get('app_settings')) || { 
    id: 'app_settings', 
    pin: '1234', 
    isPinEnabled: true,
    theme: 'system',
    viewMode: 'grid',
    isLocked: false
  } as AppSettings;

  // Filtered notes - MUST be before any early returns
  const filteredNotes = useMemo(() => {
    return notes.filter(note => {
      const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           note.content.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTag = !selectedTag || note.tags.includes(selectedTag);
      
      if (activeTab === 'pinned') return note.isPinned && !note.isArchived && matchesSearch && matchesTag;
      if (activeTab === 'archived') return note.isArchived && matchesSearch && matchesTag;
      return !note.isArchived && matchesSearch && matchesTag;
    }).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  }, [notes, searchQuery, selectedTag, activeTab]);

  const pinnedNotes = filteredNotes.filter(n => n.isPinned);
  const otherNotes = filteredNotes.filter(n => !n.isPinned);

  const handleUnlock = () => {
    if (pinInput === appSettings.pin) {
      setIsAppLocked(false);
      setPinInput('');
    } else {
      alert(`Incorrect PIN (Hint: ${appSettings.pin})`);
    }
  };

  const handleCreateNote = async () => {
    const newNote: Note = {
      title: '',
      content: '',
      tags: selectedTag ? [selectedTag] : [],
      isPinned: false,
      isArchived: false,
      isPrivate: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const id = await db.notes.add(newNote);
    setEditingNote({ ...newNote, id });
  };

  const handleSaveNote = async (note: Note) => {
    if (note.id) {
      await db.notes.update(note.id, {
        ...note,
        updatedAt: Date.now(),
      });
    }
  };

  const handleDeleteNote = async (id: number) => {
    await db.notes.delete(id);
  };

  const handleTogglePin = async (note: Note) => {
    if (note.id) {
      await db.notes.update(note.id, { isPinned: !note.isPinned });
    }
  };

  const handleToggleArchive = async (note: Note) => {
    if (note.id) {
      await db.notes.update(note.id, { isArchived: !note.isArchived });
    }
  };

  const handleExport = () => {
    const data = JSON.stringify(notes, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nix-notes-backup-${format(new Date(), 'yyyy-MM-dd')}.json`;
    a.click();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const importedNotes = JSON.parse(event.target?.result as string);
        await db.notes.bulkAdd(importedNotes);
        alert('Notes imported successfully!');
      } catch (err) {
        alert('Failed to import notes. Invalid file format.');
      }
    };
    reader.readAsText(file);
  };

  // Early returns AFTER all hooks
  if (isAppLocked) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6">
        <Logo className="w-24 h-24 mb-8" />
        <h1 className="text-2xl font-bold mb-8">Nix Notes Locked</h1>
        <div className="flex gap-4 mb-8">
          {[1, 2, 3, 4].map((_, i) => (
            <div 
              key={i}
              className={cn(
                "w-4 h-4 rounded-full border-2 border-primary transition-all",
                pinInput.length > i ? "bg-primary" : "bg-transparent"
              )}
            />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-4 max-w-xs w-full">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, 'OK'].map((num) => (
            <button
              key={num}
              onClick={() => {
                if (num === 'C') setPinInput('');
                else if (num === 'OK') handleUnlock();
                else if (pinInput.length < 4) setPinInput(pinInput + num);
              }}
              className="w-16 h-16 rounded-full bg-surface-variant flex items-center justify-center text-xl font-bold hover:bg-primary/10 active:scale-95 transition-all"
            >
              {num}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (editingNote) {
    return (
      <NoteEditor 
        note={editingNote} 
        onSave={handleSaveNote} 
        onClose={() => setEditingNote(null)} 
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      {/* Top Bar */}
      <header className="p-4 flex items-center gap-4 sticky top-0 bg-surface/80 backdrop-blur-md z-10">
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 hover:bg-surface-variant rounded-full transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
        
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-outline" />
          <input 
            type="text"
            placeholder="Search your notes"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-variant/50 py-3 pl-12 pr-4 rounded-full focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-lg"
          />
        </div>

        <button 
          onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          className="p-2 hover:bg-surface-variant rounded-full transition-colors"
        >
          {viewMode === 'grid' ? <List className="w-6 h-6" /> : <Grid className="w-6 h-6" />}
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 overflow-y-auto pb-24">
        {/* Filter Chips */}
        <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
          <button 
            onClick={() => setSelectedTag(null)}
            className={cn(
              "px-4 py-2 rounded-full whitespace-nowrap transition-all",
              !selectedTag ? "bg-primary-container text-on-primary-container font-medium" : "bg-surface-variant text-on-surface-variant"
            )}
          >
            All
          </button>
          {tags.map(tag => (
            <button 
              key={tag.id}
              onClick={() => setSelectedTag(tag.name)}
              className={cn(
                "px-4 py-2 rounded-full whitespace-nowrap transition-all",
                selectedTag === tag.name ? "bg-primary-container text-on-primary-container font-medium" : "bg-surface-variant text-on-surface-variant"
              )}
            >
              {tag.name}
            </button>
          ))}
        </div>

        {/* Notes Grid/List */}
        {activeTab === 'settings' ? (
          <div className="max-w-2xl mx-auto space-y-8">
            <h2 className="text-3xl font-bold mb-6">Settings</h2>
            
            <section className="bg-surface-variant/20 p-6 rounded-3xl border border-outline/10">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Lock className="w-5 h-5" /> Security
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">App PIN Lock</p>
                    <p className="text-sm text-outline">Current PIN: {appSettings.pin}</p>
                  </div>
                  <button 
                    onClick={() => {
                      const newPin = prompt('Enter new 4-digit PIN:', appSettings.pin);
                      if (newPin && newPin.length === 4) {
                        db.settings.put({ ...appSettings, pin: newPin });
                        alert('PIN updated successfully!');
                      } else if (newPin) {
                        alert('PIN must be 4 digits.');
                      }
                    }}
                    className="px-4 py-2 bg-primary text-on-primary rounded-full text-sm font-bold"
                  >
                    Change PIN
                  </button>
                </div>
              </div>
            </section>

            <section className="bg-surface-variant/20 p-6 rounded-3xl border border-outline/10">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-red-500" /> Danger Zone
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Clear All Data</p>
                    <p className="text-sm text-outline">Delete all notes and tags permanently.</p>
                  </div>
                  <button 
                    onClick={async () => {
                      if (confirm('Are you absolutely sure? This will delete ALL your notes and tags forever.')) {
                        await db.notes.clear();
                        await db.tags.clear();
                        alert('All data cleared.');
                      }
                    }}
                    className="px-4 py-2 bg-red-500 text-white rounded-full text-sm font-bold"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            </section>

            <div className="text-center text-outline text-sm opacity-50 pt-10">
              <Logo className="w-12 h-12 mx-auto mb-2 grayscale" />
              <p>Nix Notes v1.0.0</p>
              <p>Made with ❤️ for Android</p>
            </div>
          </div>
        ) : (
          <div className={cn(
            "gap-4",
            viewMode === 'grid' ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4" : "flex flex-col"
          )}>
          {pinnedNotes.length > 0 && (
            <div className="col-span-full">
              <h2 className="text-xs font-bold uppercase tracking-wider text-outline mb-2 px-2">Pinned</h2>
              <div className={cn(
                "gap-4",
                viewMode === 'grid' ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4" : "flex flex-col"
              )}>
                {pinnedNotes.map(note => (
                  <NoteCard 
                    key={note.id} 
                    note={note} 
                    onClick={() => setEditingNote(note)}
                    onTogglePin={() => handleTogglePin(note)}
                    onToggleArchive={() => handleToggleArchive(note)}
                    onDelete={() => handleDeleteNote(note.id!)}
                    viewMode={viewMode}
                  />
                ))}
              </div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-outline mt-6 mb-2 px-2">Others</h2>
            </div>
          )}
          
          {otherNotes.map(note => (
            <NoteCard 
              key={note.id} 
              note={note} 
              onClick={() => setEditingNote(note)}
              onTogglePin={() => handleTogglePin(note)}
              onToggleArchive={() => handleToggleArchive(note)}
              onDelete={() => handleDeleteNote(note.id!)}
              viewMode={viewMode}
            />
          ))}

          {filteredNotes.length === 0 && searchQuery === '' && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
              <Logo className="w-24 h-24 mb-6" />
              <h2 className="text-2xl font-bold mb-2">Welcome to Nix Notes</h2>
              <p className="text-outline max-w-xs mx-auto">
                Your premium, offline-first note taking experience. Tap the + button to start.
              </p>
            </div>
          )}

          {filteredNotes.length === 0 && searchQuery !== '' && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-outline opacity-50">
              <Search className="w-16 h-16 mb-4" />
              <p className="text-lg">No notes found for "{searchQuery}"</p>
            </div>
          )}
        </div>
        )}
      </main>

      {/* FAB */}
      <button 
        onClick={handleCreateNote}
        className="fixed bottom-6 right-6 w-16 h-16 bg-primary-container text-on-primary-container rounded-2xl shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
      >
        <Plus className="w-8 h-8" />
      </button>

      {/* Sidebar Drawer */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/50 z-20"
            />
            <motion.aside 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-80 bg-surface z-30 p-6 shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-8">
                <Logo className="w-10 h-10" />
                <h1 className="text-2xl font-bold">Nix Notes</h1>
              </div>

              <nav className="space-y-2">
                <SidebarItem 
                  icon={<Plus className="w-5 h-5" />} 
                  label="Notes" 
                  active={activeTab === 'notes'} 
                  onClick={() => { setActiveTab('notes'); setIsSidebarOpen(false); }} 
                />
                <SidebarItem 
                  icon={<Pin className="w-5 h-5" />} 
                  label="Pinned" 
                  active={activeTab === 'pinned'} 
                  onClick={() => { setActiveTab('pinned'); setIsSidebarOpen(false); }} 
                />
                <SidebarItem 
                  icon={<Archive className="w-5 h-5" />} 
                  label="Archive" 
                  active={activeTab === 'archived'} 
                  onClick={() => { setActiveTab('archived'); setIsSidebarOpen(false); }} 
                />
                <SidebarItem 
                  icon={<Settings className="w-5 h-5" />} 
                  label="Settings" 
                  active={activeTab === 'settings'} 
                  onClick={() => { setActiveTab('settings'); setIsSidebarOpen(false); }} 
                />
                <div className="h-px bg-outline/20 my-4" />
                <div className="flex items-center justify-between px-4 mb-2">
                  <span className="text-xs font-bold uppercase text-outline">Tags</span>
                  <button onClick={() => {
                    const name = prompt('New tag name:');
                    if (name) db.tags.add({ name });
                  }}>
                    <Plus className="w-4 h-4 text-primary" />
                  </button>
                </div>
                {tags.map(tag => (
                  <SidebarItem 
                    key={tag.id}
                    icon={<TagIcon className="w-5 h-5" />} 
                    label={tag.name} 
                    active={selectedTag === tag.name} 
                    onClick={() => { setSelectedTag(tag.name); setIsSidebarOpen(false); }} 
                  />
                ))}
                <div className="h-px bg-outline/20 my-4" />
                <SidebarItem 
                  icon={<Download className="w-5 h-5" />} 
                  label="Export Backup" 
                  onClick={handleExport} 
                />
                <label className="flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer hover:bg-surface-variant transition-colors">
                  <Upload className="w-5 h-5" />
                  <span className="font-medium">Import Backup</span>
                  <input type="file" className="hidden" onChange={handleImport} accept=".json" />
                </label>
                <div className="h-px bg-outline/20 my-4" />
                <SidebarItem 
                  icon={<Lock className="w-5 h-5" />} 
                  label="Lock App" 
                  onClick={() => { setIsAppLocked(true); setIsSidebarOpen(false); }} 
                />
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function SidebarItem({ icon, label, active, onClick }: { key?: React.Key, icon: React.ReactNode, label: string, active?: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-colors",
        active ? "bg-secondary-container text-on-secondary-container font-bold" : "hover:bg-surface-variant"
      )}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </button>
  );
}
