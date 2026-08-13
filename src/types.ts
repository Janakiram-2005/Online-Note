export type BlockType =
  | 'paragraph'
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'bullet'
  | 'numbered'
  | 'todo'
  | 'quote'
  | 'code'
  | 'divider'
  | 'image'
  | 'table'
  | 'callout';

export interface NoteBlock {
  id: string;
  type: BlockType;
  content: string;
  checked?: boolean;
  language?: string;
  imageUrl?: string;
  caption?: string;
  calloutIcon?: string;
  tableData?: string[][]; // 2D array of table cells
}

export interface NoteDocument {
  id: string;
  driveFileId?: string;
  title: string;
  icon?: string;
  coverImage?: string;
  folderId?: string | null;
  createdAt: string;
  updatedAt: string;
  isFavorite?: boolean;
  isTrashed?: boolean;
  shareToken?: string;
  isPublicShared?: boolean;
  blocks: NoteBlock[];
}

export interface NoteFolder {
  id: string;
  driveFolderId?: string;
  name: string;
  icon?: string;
  parentId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceMetadata {
  favorites: string[];
  recentDocs: string[];
  folders: NoteFolder[];
  autoSaveInterval: number; // in ms
  theme: 'light' | 'dark' | 'system';
  pinConfigured: boolean;
  driveConnected: boolean;
  driveUserEmail?: string;
}

export interface SaveStatus {
  state: 'saved' | 'saving' | 'offline' | 'error';
  lastSavedAt?: string;
  message?: string;
}
