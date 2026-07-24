import type { StorageDriver, FileItem } from './types';

export class WebDAVDriver implements StorageDriver {
  id: string;
  name: string;
  type = 'webdav' as const;
  private baseUrl: string;
  private username: string;
  private password: string;

  constructor(id: string, name: string, config: Record<string, string>) {
    this.id = id;
    this.name = name;
    this.baseUrl = (config.url || '').replace(/\/+$/, '');
    this.username = config.username || '';
    this.password = config.password || '';
  }

  private get headers(): Record<string, string> {
    const h: Record<string, string> = { 'Depth': '1' };
    if (this.username) {
      h['Authorization'] = 'Basic ' + btoa(`${this.username}:${this.password}`);
    }
    return h;
  }

  private getUrl(path: string): string {
    const p = path.replace(/^\/+/, '');
    return p ? `${this.baseUrl}/${encodeURI(p)}` : this.baseUrl;
  }

  private parseXML(xmlStr: string): Document {
    const parser = new DOMParser();
    return parser.parseFromString(xmlStr, 'text/xml');
  }

  private parsePropfind(xmlDoc: Document, basePath: string): FileItem[] {
    const responses = xmlDoc.getElementsByTagNameNS('DAV:', 'response');
    const items: FileItem[] = [];

    for (let i = 0; i < responses.length; i++) {
      const resp = responses[i];
      const hrefEl = resp.getElementsByTagNameNS('DAV:', 'href')[0];
      if (!hrefEl) continue;

      const fullHref = hrefEl.textContent || '';
      // 相对路径
      let relPath = fullHref;
      try {
        relPath = decodeURIComponent(new URL(fullHref).pathname);
      } catch {
        relPath = decodeURIComponent(fullHref);
      }
      // 去掉 baseUrl 前缀
      const baseUrlPath = new URL(this.baseUrl).pathname.replace(/\/+$/, '');
      let itemPath = relPath.replace(baseUrlPath, '').replace(/\/+$/, '') || '/';
      if (!itemPath.startsWith('/')) itemPath = '/' + itemPath;

      // 跳过自身
      if (itemPath === basePath || itemPath === basePath.replace(/\/+$/, '')) continue;

      const name = itemPath.split('/').pop() || '';
      const props = resp.getElementsByTagNameNS('DAV:', 'prop')[0];
      if (!props) continue;

      const resType = props.getElementsByTagNameNS('DAV:', 'resourcetype')[0];
      const isDir = !!resType?.getElementsByTagNameNS('DAV:', 'collection')[0];
      const sizeEl = props.getElementsByTagNameNS('DAV:', 'getcontentlength')[0];
      const modEl = props.getElementsByTagNameNS('DAV:', 'getlastmodified')[0];
      const typeEl = props.getElementsByTagNameNS('DAV:', 'getcontenttype')[0];

      items.push({
        id: itemPath,
        name: name || itemPath,
        path: itemPath,
        size: parseInt(sizeEl?.textContent || '0'),
        isDir,
        modified: modEl?.textContent || '',
        mimeType: typeEl?.textContent || undefined,
      });
    }

    return items.sort((a, b) => {
      if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }

  async listFiles(path: string): Promise<FileItem[]> {
    const url = this.getUrl(path);
    const body = `<?xml version="1.0" encoding="utf-8"?>
<D:propfind xmlns:D="DAV:">
  <D:prop>
    <D:displayname/>
    <D:getcontentlength/>
    <D:getlastmodified/>
    <D:resourcetype/>
    <D:getcontenttype/>
  </D:prop>
</D:propfind>`;

    const resp = await fetch(url, {
      method: 'PROPFIND',
      headers: { ...this.headers, 'Content-Type': 'application/xml' },
      body,
    });

    if (!resp.ok) throw new Error(`WebDAV PROPFIND failed: ${resp.status}`);
    const xml = await resp.text();
    const doc = this.parseXML(xml);
    return this.parsePropfind(doc, path);
  }

  async getDownloadUrl(item: FileItem): Promise<string> {
    return this.getUrl(item.path);
  }

  async uploadFile(path: string, file: File, onProgress?: (pct: number) => void): Promise<void> {
    const url = this.getUrl(path) + '/' + encodeURIComponent(file.name);
    const resp = await fetch(url, {
      method: 'PUT',
      headers: {
        ...this.headers,
        'Content-Type': file.type || 'application/octet-stream',
      },
      body: file,
    });
    if (!resp.ok) throw new Error(`WebDAV PUT failed: ${resp.status}`);
    onProgress?.(100);
  }

  async deleteItem(item: FileItem): Promise<void> {
    const url = this.getUrl(item.path);
    const resp = await fetch(url, { method: 'DELETE', headers: this.headers });
    if (!resp.ok) throw new Error(`WebDAV DELETE failed: ${resp.status}`);
  }

  async mkdir(path: string): Promise<void> {
    const url = this.getUrl(path);
    const resp = await fetch(url, {
      method: 'MKCOL',
      headers: this.headers,
    });
    if (!resp.ok) throw new Error(`WebDAV MKCOL failed: ${resp.status}`);
  }

  async rename(item: FileItem, newName: string): Promise<void> {
    const parentParts = item.path.split('/');
    parentParts.pop();
    const dest = [...parentParts, newName].join('/');

    const url = this.getUrl(item.path);
    const destUrl = this.getUrl(dest);
    const resp = await fetch(url, {
      method: 'MOVE',
      headers: {
        ...this.headers,
        'Destination': destUrl,
      },
    });
    if (!resp.ok) throw new Error(`WebDAV MOVE failed: ${resp.status}`);
  }

  async getFileContent(item: FileItem): Promise<Blob> {
    const url = this.getUrl(item.path);
    const resp = await fetch(url, { headers: this.headers });
    if (!resp.ok) throw new Error(`WebDAV GET failed: ${resp.status}`);
    return resp.blob();
  }
}