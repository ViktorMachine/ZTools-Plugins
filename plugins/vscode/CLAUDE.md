# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

ZTools 插件项目 - VSCode/类 VSCode IDE 历史项目搜索工具。基于 Vue 3 + Vite + TypeScript 构建。

## 常用命令

```bash
# 安装依赖
npm install

# 开发模式（热更新）
npm run dev

# 构建生产版本
npm run build
```

## 架构

### 插件入口路由

插件使用 `ztools.onPluginEnter` 事件驱动路由，四个功能入口定义在 `public/plugin.json`:

| code | 功能 | 触发命令 |
|------|------|----------|
| `vsc` | IDE 历史搜索 | 输入 `vsc` |
| `vsc-setting` | IDE 配置设置 | 输入 `vsc-setting` |
| `vsc-ide` | IDE 管理列表 | 输入 `vsc-ide` |
| `vsc-add-ide` | 新增 IDE | 输入 `vsc-add-ide` 或 `新增 IDE` |

### 核心模块

`public/preload/services.js` 通过 `window.services` 向渲染进程注入 Node.js 能力:

- **Config**: IDE 配置管理（读取/保存/创建默认配置）
- **IDEService**: IDE 功能管理（列表/新增/删除/初始化默认）
- **DbService**: VSCode state.vscdb 数据库操作（读取/删除历史记录）
- **CmdService**: 命令执行（获取 shell 环境、打开 IDE）
- **IconService**: 文件类型图标映射

### 前端组件

- `src/App.vue`: 路由控制器，根据 action.code 切换组件
- `src/VSCode/index.vue`: 主搜索界面（文件列表、键盘导航、pin 置顶、删除模式）
- `src/Setting/index.vue`: IDE 配置设置
- `src/IDE/index.vue`: IDE 管理列表
- `src/AddIDE/index.vue`: 新增 IDE 表单

### 数据库结构

VSCode 历史记录存储在 `state.vscdb`（SQLite），表 `ItemTable` 中 key 为 `history.recentlyOpenedPathsList` 的 JSON 数据。

### ZTools API

插件通过 `window.ztools` 对象调用宿主能力，核心 API:

- `ztools.onPluginEnter(callback)`: 插件激活事件
- `ztools.onPluginOut(callback)`: 插件退出事件
- `ztools.setSubInput(callback, placeholder, isFocus)`: 设置搜索框
- `ztools.dbStorage.setItem/getItem(key, value)`: 持久化存储
- `ztools.setFeature(feature)`: 动态添加功能
- `ztools.removeFeature(code)`: 删除功能
- `ztools.showNotification(body)`: 显示通知
- `ztools.hideMainWindow()`: 隐藏窗口
- `ztools.getPath(name)`: 获取系统路径（如 appData）

## 开发注意事项

1. **构建输出**: 框架代码编译到 `dist/` 目录，`plugin.json` 的 `main` 指向 `index.html`
2. **preload 脚本**: Node.js 依赖需放在 `public/preload/` 同级目录
3. **动态功能**: IDE 配置通过 `ztools.setFeature` 动态注册，支持运行时添加新 IDE
4. **跨平台 shell**: macOS/Linux 使用 `zsh -l -c` / `bash -l -c`，Windows 无需 shell 包装

## 相关文档

- ZTools 插件开发指南: `Developor.md`
- VSCode 插件 README: `vscode/README.md`