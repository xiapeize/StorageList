import { S3Client, ListObjectsV2Command, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import type { _Object } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import type { StorageDriver, FileItem } from './types';

export class S3Driver implements StorageDriver {
  id: string;
  name: string;
  type = 's3' as const;
  private client: S3Client;
  private bucket: string;
  private endpoint: string;
  private region: string;

  constructor(id: string, name: string, config: Record<string, string>) {
    this.id = id;
    this.name = name;
    this.bucket = config.bucket || '';
    this.region = config.region || 'auto';
    this.endpoint = config.endpoint || '';

    const clientConfig: Record<string, unknown> = {
      region: this.region,
      credentials: {
        accessKeyId: config.accessKeyId || '',
        secretAccessKey: config.secretAccessKey || '',
      },
      forcePathStyle: config.forcePathStyle === 'true',
    };

    if (this.endpoint) {
      clientConfig.endpoint = this.endpoint.startsWith('http') ? this.endpoint : `https://${this.endpoint}`;
    }

    this.client = new S3Client(clientConfig as never);
  }

  private normalizePath(path: string): string {
    return path.replace(/^\/+/, '').replace(/\/+$/, '') || '';
  }

  private mapObject(obj: _Object, prefix: string): FileItem {
    const key = obj.Key || '';
    const name = key.replace(prefix, '').replace(/\/$/, '').split('/').pop() || key;
    const isDir = key.endsWith('/');
    return {
      id: key,
      name,
      path: key,
      size: obj.Size || 0,
      isDir,
      modified: obj.LastModified?.toISOString() || '',
      mimeType: isDir ? undefined : this.guessMimeType(name),
    };
  }

  private guessMimeType(name: string): string {
    const ext = name.split('.').pop()?.toLowerCase() || '';
    const map: Record<string, string> = {
      jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp',
      svg: 'image/svg+xml', mp4: 'video/mp4', mp3: 'audio/mpeg',
      pdf: 'application/pdf', json: 'application/json', txt: 'text/plain', html: 'text/html',
      css: 'text/css', js: 'application/javascript', zip: 'application/zip',
    };
    return map[ext] || 'application/octet-stream';
  }

  async listFiles(path: string): Promise<FileItem[]> {
    try {
      const prefix = this.normalizePath(path);
      const command = new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: prefix ? `${prefix}/` : '',
        Delimiter: '/',
      });

      const response = await this.client.send(command);
      const items: FileItem[] = [];

      // 目录
      response.CommonPrefixes?.forEach(cp => {
        const key = cp.Prefix || '';
        const name = key.replace(`${prefix}/`, '').replace(/\/$/, '');
        if (name) {
          items.push({
            id: key,
            name,
            path: key,
            size: 0,
            isDir: true,
            modified: '',
          });
        }
      });

      // 文件
      response.Contents?.forEach(obj => {
        if (obj.Key === `${prefix}/` || obj.Key === prefix) return;
        const item = this.mapObject(obj, prefix ? `${prefix}/` : '');
        if (item.name) items.push(item);
      });

      return items.sort((a, b) => {
        if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
    } catch (err) {
      console.error('S3 listFiles error:', err);
      throw err;
    }
  }

  async getDownloadUrl(item: FileItem): Promise<string> {
    // 直接构造 S3 对象 URL
    const key = item.path;
    if (this.endpoint) {
      const base = this.endpoint.startsWith('http') ? this.endpoint : `https://${this.endpoint}`;
      return `${base}/${this.bucket}/${encodeURIComponent(key)}`;
    }
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${encodeURIComponent(key)}`;
  }

  async uploadFile(path: string, file: File, onProgress?: (pct: number) => void): Promise<void> {
    const key = this.normalizePath(path) ? `${this.normalizePath(path)}/${file.name}` : file.name;

    const upload = new Upload({
      client: this.client,
      params: {
        Bucket: this.bucket,
        Key: key,
        Body: file,
        ContentType: file.type || 'application/octet-stream',
      },
    });

    upload.on('httpUploadProgress', (progress) => {
      if (progress.total && onProgress) {
        onProgress(Math.round((progress.loaded! / progress.total) * 100));
      }
    });

    await upload.done();
  }

  async deleteItem(item: FileItem): Promise<void> {
    if (item.isDir) {
      // 删除目录下所有文件
      const files = await this.listAllFiles(item.path);
      await Promise.all(files.map(f => this.deleteSingle(f.path)));
    } else {
      await this.deleteSingle(item.path);
    }
  }

  private async deleteSingle(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  private async listAllFiles(prefix: string): Promise<{ path: string }[]> {
    const command = new ListObjectsV2Command({
      Bucket: this.bucket,
      Prefix: prefix.endsWith('/') ? prefix : `${prefix}/`,
    });
    const response = await this.client.send(command);
    return (response.Contents || []).map(c => ({ path: c.Key || '' }));
  }

  async mkdir(path: string): Promise<void> {
    const key = this.normalizePath(path) + '/';
    await this.client.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: '',
    }));
  }

  async rename(item: FileItem, newName: string): Promise<void> {
    const parentParts = item.path.split('/');
    parentParts.pop();
    const newKey = [...parentParts, newName].join('/');

    if (item.isDir) {
      const files = await this.listAllFiles(item.path);
      for (const f of files) {
        const newPath = f.path.replace(item.path, newKey);
        await this.client.send(new PutObjectCommand({
          Bucket: this.bucket,
          Key: newPath,
          Body: '',
        }));
        await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: f.path }));
      }
    } else {
      // Copy + delete for rename
      await this.client.send(new PutObjectCommand({
        Bucket: this.bucket,
        Key: newKey,
        Body: '',
      }));
      await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: item.path }));
    }
  }

  async getFileContent(item: FileItem): Promise<Blob> {
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: item.path });
    const response = await this.client.send(command);
    return new Response(response.Body?.transformToWebStream()).blob();
  }
}