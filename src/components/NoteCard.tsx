import React from 'react';
import { motion } from 'motion/react';
import { Pin, Archive, Trash2, Tag as TagIcon } from 'lucide-react';
import type { Note } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface NoteCardProps {
  key?: React.Key;
  note: Note;
  onClick: () => void;
  onTogglePin: () => void;
  onToggleArchive: () => void;
  onDelete: () => void;
  viewMode: 'grid' | 'list';
}

export default function NoteCard({ note, onClick, onTogglePin, onToggleArchive, onDelete, viewMode }: NoteCardProps) {
  // Strip HTML for preview
  const previewContent = note.content.replace(/<[^>]*>/g, ' ').substring(0, 150);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4 }}
      className={cn(
        "group relative border border-outline/10 rounded-2xl p-4 cursor-pointer hover:brightness-95 transition-all overflow-hidden",
        viewMode === 'list' ? "flex flex-row items-center gap-4" : "flex flex-col"
      )}
      style={{ backgroundColor: note.color !== 'transparent' ? note.color : 'rgba(var(--surface-variant), 0.3)' }}
      onClick={onClick}
    >
      {/* Image Preview Grid */}
      {note.images && note.images.length > 0 && viewMode === 'grid' && (
        <div className="mb-3 -mx-4 -mt-4 h-32 overflow-hidden">
          <img src={note.images[0]} className="w-full h-full object-cover" alt="" />
        </div>
      )}

      {/* Image Preview List */}
      {note.images && note.images.length > 0 && viewMode === 'list' && (
        <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden">
          <img src={note.images[0]} className="w-full h-full object-cover" alt="" />
        </div>
      )}

      {/* Note Content */}
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-lg mb-1 truncate">{note.title || 'Untitled'}</h3>
        <p className="text-on-surface-variant text-sm line-clamp-3 mb-3">
          {previewContent || 'No content'}
        </p>
        
        {/* Tags */}
        <div className="flex flex-wrap gap-1">
          {note.tags.map(tag => (
            <span key={tag} className="text-[10px] font-bold uppercase bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Actions Overlay */}
      <div className={cn(
        "flex gap-1 transition-opacity",
        viewMode === 'grid' ? "mt-4 opacity-0 group-hover:opacity-100" : "opacity-100"
      )}>
        <button 
          onClick={(e) => { e.stopPropagation(); onTogglePin(); }}
          className={cn(
            "p-2 rounded-full hover:bg-primary/10 transition-colors",
            note.isPinned ? "text-primary" : "text-outline"
          )}
        >
          <Pin className={cn("w-4 h-4", note.isPinned && "fill-current")} />
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); onToggleArchive(); }}
          className={cn(
            "p-2 rounded-full hover:bg-secondary/10 transition-colors",
            note.isArchived ? "text-secondary" : "text-outline"
          )}
        >
          <Archive className="w-4 h-4" />
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="p-2 rounded-full hover:bg-red-500/10 text-outline hover:text-red-500 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Pinned Indicator (always visible) */}
      {note.isPinned && viewMode === 'grid' && (
        <div className="absolute top-2 right-2 text-primary">
          <Pin className="w-4 h-4 fill-current" />
        </div>
      )}
    </motion.div>
  );
}
