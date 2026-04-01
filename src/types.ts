export interface Note {
  id?: number;
  title: string;
  content: string;
  tags: string[];
  isPinned: boolean;
  isArchived: boolean;
  isPrivate: boolean;
  createdAt: number;
  updatedAt: number;
  color?: string;
  images?: string[]; // Base64 or Blob URLs
}

export interface Tag {
  id?: number;
  name: string;
}

export interface AppSettings {
  id?: string | number;
  theme: 'light' | 'dark' | 'system';
  viewMode: 'grid' | 'list';
  isLocked: boolean;
  pin: string;
  isPinEnabled?: boolean;
}
