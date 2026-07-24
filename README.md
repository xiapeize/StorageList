# FileManager - 前端网盘管理器

纯前端多存储文件管理器，在浏览器中管理 S3、WebDAV 等存储。配置通过 API 服务端存储，多设备自动同步。UI 风格参照 AList。

## 特性

- **多存储支持** - S3 兼容存储（AWS S3 / Cloudflare R2 / MinIO 等）、WebDAV
- **多设备同步** - 配置存储在服务端 API，换设备登录即可同步
- **认证保护** - 默认账户 admin / p@ssw0rd，可在设置中修改密码
- **AList 风格 UI** - 左侧存储挂载列表、文件列表/网格双视图、面包屑导航
- **文件操作** - 浏览、下载、上传（拖拽）、删除、重命名、新建文件夹
- **文件预览** - 图片、视频、音频、PDF 在线预览
- **一键部署** - 支持 Vercel（含 API）/ Cloudflare Pages

## 快速开始

```bash
npm install
npm run dev      # 本地开发
npm run build    # 生产构建
```

## 部署

### Vercel（推荐，含 API）

直接导入 Git 仓库，Vercel 自动检测 Vite 项目并部署 API 函数。`vercel.json` 已内置 SPA 路由配置。

> API 使用文件存储（`data/data.json`），适合单实例部署。如需高可用，建议改用 Vercel KV 或 Upstash Redis。

### Cloudflare Pages

由于 Cloudflare Pages Functions 不支持 Node.js `fs` 模块，需将 `lib/store.ts` 改为 Workers KV 存储：

- 构建命令：`npm run build`
- 输出目录：`dist`
- 绑定 KV namespace 用于配置存储

## 使用说明

1. 打开页面，使用默认账户 **admin / p@ssw0rd** 登录
2. 点击左侧 **「+ 添加存储」**，选择类型并填写连接信息
3. 点击左侧挂载的存储即可浏览文件
4. **双击文件夹**进入，**双击文件**预览/下载
5. **右键文件**可下载、重命名、删除
6. **拖拽文件**到页面区域即可上传
7. 在设置中可**修改密码**、导出/导入配置

## 存储配置说明

### S3 兼容存储

| 字段 | 必填 | 说明 |
|------|------|------|
| Endpoint | 否 | S3 服务地址，留空使用 AWS 默认 |
| Region | 否 | 区域，如 `us-east-1`、`auto` |
| Bucket | 是 | 存储桶名称 |
| Access Key ID | 是 | 访问密钥 ID |
| Secret Access Key | 是 | 访问密钥 |
| Path Style | 否 | MinIO 等需选 Path Style |

> S3 Bucket 需要配置 CORS 允许浏览器跨域请求。

### WebDAV

| 字段 | 必填 | 说明 |
|------|------|------|
| URL | 是 | WebDAV 服务地址 |
| 用户名 | 是 | 登录用户名 |
| 密码 | 是 | 登录密码 |

> WebDAV 服务端需允许 CORS 及 PROPFIND / MKCOL / MOVE 等 HTTP 方法。

## 架构

```
┌─────────────────────────────────┐
│  前端 (React + Vite)            │
│  登录 → 配置管理 → 文件浏览      │
└──────────┬──────────────────────┘
           │ /api/*
┌──────────▼──────────────────────┐
│  API (Hono / Vercel Functions)  │
│  POST /api/auth/login           │
│  PUT  /api/auth/password        │
│  GET  /api/config               │
│  POST /api/config               │
└──────────┬──────────────────────┘
           │
┌──────────▼──────────────────────┐
│  数据存储 (data/data.json)       │
│  { users, storages }            │
└─────────────────────────────────┘
```

## 技术栈

- **React 19** + **TypeScript** 前端
- **Vite** 构建工具
- **Zustand** 状态管理
- **Hono** API 框架（Vercel Functions）
- **JWT** 认证（HMAC-SHA256）
- **AWS SDK v3** S3 浏览器端驱动
- **原生 Fetch API** WebDAV 驱动

## 扩展存储类型

在 `src/drivers/` 下新增驱动类，实现 `StorageDriver` 接口，并在 `registry.ts` 中注册即可。

```ts
// src/drivers/googledrive.ts
export class GoogleDriveDriver implements StorageDriver {
  // 实现 listFiles, getDownloadUrl, uploadFile, deleteItem, mkdir, rename
}
```

## License

MIT