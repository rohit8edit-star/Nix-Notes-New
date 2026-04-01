import React, { useState, useEffect, useRef } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { motion } from 'motion/react';
import { ArrowLeft, Pin, Archive, Trash2, Tag as TagIcon, X, Palette, ImageIcon } from 'lucide-react';
import type { Note } from '../types';
import { db } from '../db';
import { useLiveQuery } from 'dexie-react-hooks';
import { format } from 'date-fns';

interface NoteEditorProps {
  note: Note;
  onSave: (note: Note) => void;
  onClose: () => void;
}

export default function NoteEditor({ note, onSave, onClose }: NoteEditorProps) {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [tags, setTags] = useState<string[]>(note.tags);
  const [isPinned, setIsPinned] = useState(note.isPinned);
  const [isArchived, setIsArchived] = useState(note.isArchived);
  const [color, setColor] = useState(note.color || 'transparent');
  const [images, setImages] = useState<string[]>(note.images || []);
  const [showTagInput, setShowTagInput] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [newTag, setNewTag] = useState('');

  const allTags = useLiveQuery(() => db.tags.toArray()) || [];
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const colors = [
    { name: 'Default', value: 'transparent' },
    { name: 'Red', value: '#f28b82' },
    { name: 'Orange', value: '#fbbc04' },
    { name: 'Yellow', value: '#fff475' },
    { name: 'Green', value: '#ccff90' },
    { name: 'Teal', value: '#a7ffeb' },
    { name: 'Blue', value: '#cbf0f8' },
    { name: 'Dark Blue', value: '#aecbfa' },
    { name: 'Purple', value: '#d7aefb' },
    { name: 'Pink', value: '#fdcfe8' },
    { name: 'Brown', value: '#e6c9a8' },
    { name: 'Gray', value: '#e8eaed' },
  ];

  // Auto-save logic
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    
    timerRef.current = setTimeout(() => {
      onSave({
        ...note,
        title,
        content,
        tags,
        isPinned,
        isArchived,
        color,
        images,
        updatedAt: Date.now()
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [title, content, tags, isPinned, isArchived, color, images]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader: any = new FileReader();
      reader.onload = (event: any) => {
        const base64 = event.target.result;
        if (base64) {
          setImages((prev: string[]) => [...prev, base64]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleAddTag = (tagName: string) => {
    if (!tags.includes(tagName)) {
      setTags([...tags, tagName]);
    }
    setNewTag('');
    setShowTagInput(false);
  };

  const removeTag = (tagName: string) => {
    setTags(tags.filter(t => t !== tagName));
  };

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      ['clean']
    ],
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 bg-surface z-50 flex flex-col"
      style={{ backgroundColor: color !== 'transparent' ? color : undefined }}
    >
      {/* Toolbar */}
      <header className="p-4 flex items-center justify-between border-b border-outline/10">
        <div className="flex items-center gap-2">
          <button 
            onClick={onClose}
            className="p-2 hover:bg-surface-variant rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button 
            onClick={() => setIsPinned(!isPinned)}
            className={`p-2 rounded-full transition-colors ${isPinned ? 'text-primary bg-primary/10' : 'text-outline hover:bg-surface-variant'}`}
          >
            <Pin className={`w-6 h-6 ${isPinned ? 'fill-current' : ''}`} />
          </button>
          <button 
            onClick={() => setIsArchived(!isArchived)}
            className={`p-2 rounded-full transition-colors ${isArchived ? 'text-secondary bg-secondary/10' : 'text-outline hover:bg-surface-variant'}`}
          >
            <Archive className="w-6 h-6" />
          </button>
          <div className="relative">
            <button 
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="p-2 text-outline hover:bg-surface-variant rounded-full transition-colors"
            >
              <Palette className="w-6 h-6" />
            </button>
            {showColorPicker && (
              <div className="absolute right-0 top-full mt-2 p-2 bg-surface shadow-xl rounded-2xl grid grid-cols-4 gap-2 z-20 border border-outline/10">
                {colors.map(c => (
                  <button 
                    key={c.value}
                    onClick={() => { setColor(c.value); setShowColorPicker(false); }}
                    className="w-8 h-8 rounded-full border border-outline/20"
                    style={{ backgroundColor: c.value === 'transparent' ? 'white' : c.value }}
                    title={c.name}
                  />
                ))}
              </div>
            )}
          </div>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-outline hover:bg-surface-variant rounded-full transition-colors"
          >
            <ImageIcon className="w-6 h-6" />
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              multiple 
              accept="image/*" 
              onChange={handleImageUpload} 
            />
          </button>
        </div>
      </header>

      {/* Editor Area */}
      <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full">
        {/* Images Gallery */}
        {images.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-4 mb-4 no-scrollbar">
            {images.map((img, i) => (
              <div key={i} className="relative flex-shrink-0">
                <img src={img} className="h-32 w-auto rounded-xl shadow-md" alt="" />
                <button 
                  onClick={() => removeImage(i)}
                  className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <input 
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full text-4xl font-bold bg-transparent border-none focus:outline-none mb-6 placeholder:text-outline/30"
        />

        {/* Tags Display */}
        <div className="flex flex-wrap gap-2 mb-6">
          {tags.map(tag => (
            <span key={tag} className="flex items-center gap-1 px-3 py-1 bg-primary-container text-on-primary-container rounded-full text-sm font-medium">
              {tag}
              <button onClick={() => removeTag(tag)}>
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          <button 
            onClick={() => setShowTagInput(true)}
            className="px-3 py-1 border border-outline/30 text-outline rounded-full text-sm font-medium hover:bg-surface-variant transition-colors"
          >
            + Add Tag
          </button>
        </div>

        {showTagInput && (
          <div className="mb-6 p-4 bg-surface-variant/30 rounded-2xl">
            <div className="flex gap-2 mb-3">
              <input 
                autoFocus
                type="text"
                placeholder="New tag..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTag(newTag)}
                className="flex-1 bg-surface p-2 rounded-lg focus:outline-none"
              />
              <button 
                onClick={() => handleAddTag(newTag)}
                className="px-4 py-2 bg-primary text-white rounded-lg"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {allTags.filter(t => !tags.includes(t.name)).map(tag => (
                <button 
                  key={tag.id}
                  onClick={() => handleAddTag(tag.name)}
                  className="px-3 py-1 bg-surface hover:bg-primary/10 rounded-full text-sm"
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <ReactQuill 
          theme="snow"
          value={content}
          onChange={setContent}
          modules={modules}
          placeholder="Start typing your note..."
        />
      </div>

      {/* Footer Status */}
      <footer className="p-4 text-xs text-outline text-center border-t border-outline/10">
        Last edited: {format(note.updatedAt, 'MMM d, h:mm a')}
      </footer>
    </motion.div>
  );
}
