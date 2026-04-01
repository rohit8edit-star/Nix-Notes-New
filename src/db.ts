import Dexie, { type Table } from 'dexie';
import type { Note, Tag, AppSettings } from './types';

export class NixNotesDB extends Dexie {
  notes!: Table<Note>;
  tags!: Table<Tag>;
  settings!: Table<AppSettings>;

  constructor() {
    super('NixNotesDB');
    this.version(1).stores({
      notes: '++id, title, content, *tags, isPinned, isArchived, isPrivate, createdAt, updatedAt',
      tags: '++id, &name',
      settings: '++id'
    });
  }
}

export const db = new NixNotesDB();

// Initialize default settings if not exists
db.on('populate', () => {
  db.settings.add({
    id: 'app_settings',
    theme: 'system',
    viewMode: 'grid',
    isLocked: false,
    pin: '1234',
    isPinEnabled: true
  });
});
