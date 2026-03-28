# VSCode 历史搜索

> 简单好用的 VSCode/类 VSCode IDE 历史项目搜索插件

这是一个使用 **Vue 3 + Vite + TypeScript** 构建的 ZTools 插件。

## 功能特性

- **历史项目搜索** - 搜索所有基于 VSCode 开发的 IDE 历史项目
- **多 IDE 支持** - 支持 VSCode、Cursor 等所有基于 VSCode 的 IDE
- **快速打开** - 回车即可在对应 IDE 中打开项目
- **删除历史** - 输入 `-rm` 激活删除模式，可删除历史记录
- **IDE 管理** - 动态添加/删除/配置 IDE

## 使用说明

### 基本使用

- 输入 `vsc` 搜索 VSCode 历史项目
- 输入关键词过滤项目
- 回车打开选中项目

### 删除模式

- 输入 `-rm` 激活删除模式
- 点击项目可删除对应历史记录

### IDE 管理

- 输入 `vsc-ide` 查看/删除已配置的 IDE
- 输入 `vsc-add-ide` 新增 IDE
- 输入 `{ide}-setting` 配置 IDE（如 `vsc-setting`）

## 项目结构

```
.
├── public/
│   ├── logo.png              # 插件图标
│   ├── plugin.json           # 插件配置
│   └── preload/              # Preload 脚本
│       ├── services.js       # Node.js 服务
│       ├── icon/             # 文件类型图标
│       └── sqljs/            # sql.js 库
├── src/
│   ├── main.ts               # 入口文件
│   ├── App.vue               # 路由组件
│   ├── VSCode/               # 主搜索组件
│   ├── Setting/              # 设置页面组件
│   ├── IDE/                  # IDE 管理组件
│   └── AddIDE/               # 新增 IDE 组件
├── index.html
├── vite.config.js
├── tsconfig.json
└── package.json
```

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

## 配置说明

IDE 配置字段：

| 字段 | 说明 |
|------|------|
| code | IDE 唯一标识（如 vsc、cursor） |
| icon | 图标路径 |
| terminal | 终端环境（macOS/Linux: zsh/bash，Windows 空） |
| command | 执行命令（如 code、cursor） |
| database | 数据库路径（state.vscdb） |
| timeout | 超时时间（ms） |

## 相关资源

- [ZTools 官方文档](https://ztoolscenter.github.io/ZTools-doc)
- [Vue 3 文档](https://vuejs.org/)
- [Vite 文档](https://vitejs.dev/)

## 开源协议

MIT License