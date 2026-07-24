export interface FileItem {
  id: string;
  name: string;
  path: string;
  size: number;
  isDir: boolean;
  modified: string;
  mimeType?: string;
  thumbnail?: string;
}

export interface StorageConfig {
  id: string;
  name: string;
  type: 's3' | 'webdav' | 'native';
  icon?: string;
  config: Record<string, string>;
  mountPath: string;
}

export interface StorageDriver {
  id: string;
  name: string;
  type: StorageConfig['type'];
  listFiles(path: string): Promise<FileItem[]>;
  getDownloadUrl(item: FileItem): Promise<string>;
  uploadFile(path: string, file: File, onProgress?: (pct: number) => void): Promise<void>;
  deleteItem(item: FileItem): Promise<void>;
  mkdir(path: string): Promise<void>;
  rename(item: FileItem, newName: string): Promise<void>;
  getFileContent?(item: FileItem): Promise<Blob>;
  getThumbnailUrl?(item: FileItem): Promise<string>;
}

export type StorageType = StorageConfig['type'];

export interface StorageTypeInfo {
  type: StorageType;
  label: string;
  icon: string;
  fields: StorageField[];
  description: string;
}

export interface StorageField {
  key: string;
  label: string;
  type: 'text' | 'password' | 'number' | 'select';
  required: boolean;
  placeholder?: string;
  options?: { label: string; value: string }[];
}