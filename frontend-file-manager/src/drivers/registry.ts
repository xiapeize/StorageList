import type { StorageConfig, StorageDriver, StorageTypeInfo } from './types';
import { S3Driver } from './s3';
import { WebDAVDriver } from './webdav';

export const STORAGE_TYPES: StorageTypeInfo[] = [
  {
    type: 's3',
    label: 'S3 / 兼容存储',
    icon: 'storage',
    description: 'Amazon S3 或兼容 S3 协议的对象存储（Cloudflare R2, MinIO, 阿里云OSS等）',
    fields: [
      { key: 'endpoint', label: 'Endpoint', type: 'text', required: false, placeholder: 'https://s3.amazonaws.com（留空使用默认）' },
      { key: 'region', label: 'Region', type: 'text', required: false, placeholder: 'auto / us-east-1' },
      { key: 'bucket', label: 'Bucket', type: 'text', required: true, placeholder: 'my-bucket' },
      { key: 'accessKeyId', label: 'Access Key ID', type: 'text', required: true, placeholder: 'AKIA...' },
      { key: 'secretAccessKey', label: 'Secret Access Key', type: 'password', required: true, placeholder: '...' },
      { key: 'forcePathStyle', label: 'Path Style', type: 'select', required: false, options: [
        { label: 'Virtual Hosted (默认)', value: 'false' },
        { label: 'Path Style', value: 'true' },
      ]},
    ],
  },
  {
    type: 'webdav',
    label: 'WebDAV',
    icon: 'globe',
    description: 'WebDAV 协议存储（Nextcloud, OwnCloud, 坚果云等）',
    fields: [
      { key: 'url', label: 'URL', type: 'text', required: true, placeholder: 'https://dav.example.com/remote.php/dav/files/user' },
      { key: 'username', label: '用户名', type: 'text', required: true, placeholder: '用户名' },
      { key: 'password', label: '密码', type: 'password', required: true, placeholder: '密码' },
    ],
  },
];

export function createDriver(config: StorageConfig): StorageDriver {
  switch (config.type) {
    case 's3':
      return new S3Driver(config.id, config.name, config.config);
    case 'webdav':
      return new WebDAVDriver(config.id, config.name, config.config);
    default:
      throw new Error(`Unknown storage type: ${config.type}`);
  }
}