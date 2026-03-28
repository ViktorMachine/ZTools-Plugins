# ZTools 插件开发指南

## 简介

ZTools 是一个强大、可扩展的插件系统。本文档将帮助你了解如何开发 ZTools 插件。

---

## 文件结构

插件必需包含 `plugin.json` 入口文件。标准的插件目录结构如下：

```
/{plugin}
├── plugin.json    # 插件配置文件（必需）
├── preload.js     # 预加载脚本
├── index.html     # 主页面
├── index.js       # 主脚本
├── index.css      # 样式文件
├── logo.png       # 插件图标
└── dist/          # 编译输出目录（框架项目）
```

### 重要说明

1. **标准前端文件**：ZTools 仅支持标准前端文件，框架代码需编译输出至 `dist` 文件夹
2. **打包注意**：不要直接打包项目根目录
3. **第三方依赖**：
   - 前端库：正常编译即可
   - Node.js 第三方依赖：应当保证你的模块存在于 `preload.js` 同级目录

---

## 插件配置 (plugin.json)

`plugin.json` 是插件的配置入口文件，用于定义插件的基本信息和功能。

---

## 预加载脚本 (preload.js)

`preload.js` 用于加载 Node.js 模块和执行初始化逻辑。

---

## 插件 API

ZTools 通过 `window.ztools` 对象暴露各种能力供插件调用。

### 基础信息

| 方法 | 说明 |
|------|------|
| `ztools.getAppName()` | 获取应用标识 |
| `ztools.isMacOs()` | 检查是否为 macOS 系统 |

### 通知提示

```javascript
ztools.showNotification(body)
```

显示通知提示。

**参数：**
- `body`: 通知内容

### 事件处理

#### 插件激活事件

```javascript
ztools.onPluginEnter(callback)
```

当插件被激活时触发回调。

**参数：**
- `callback`: 回调函数

### 搜索界面

```javascript
ztools.setSubInput(onChange, placeholder, isFocus)
```

设置搜索子输入框。

**参数：**
- `onChange`: 输入变化回调
- `placeholder`: 占位文本
- `isFocus`: 是否获取焦点

### 数据持久化

#### 数据库存储

```javascript
ztools.db.put(doc)
```

保存文档记录。

**参数：**
- `doc`: 要保存的文档对象

#### 简化存储

```javascript
ztools.dbStorage.setItem(key, value)
```

设置键值对存储。

**参数：**
- `key`: 键名
- `value`: 值

### 动态功能

```javascript
ztools.setFeature(feature)
```

动态调整插件功能。

**参数：**
- `feature`: 功能配置对象

### 剪贴板管理

#### 获取历史记录

```javascript
ztools.clipboard.getHistory(page, pageSize, filter)
```

获取剪贴板历史记录。

**参数：**
- `page`: 页码
- `pageSize`: 每页数量
- `filter`: 过滤条件

### 文件系统

```javascript
ztools.getPath(name)
```

获取指定目录路径。

**参数：**
- `name`: 目录名称

### 窗口管理

#### 创建窗口

```javascript
ztools.createBrowserWindow(url, options, callback)
```

创建浏览器窗口。

**参数：**
- `url`: 窗口 URL
- `options`: 窗口选项
- `callback`: 回调函数

#### 获取屏幕信息

```javascript
ztools.getPrimaryDisplay()
```

获取主显示器信息。

### 外部应用

```javascript
ztools.shellOpenExternal(url)
```

使用外部应用打开 URL。

**参数：**
- `url`: 要打开的 URL

### 页面导航

```javascript
ztools.redirect(label, payload)
```

页面跳转导航。

**参数：**
- `label`: 目标标签
- `payload`: 携带的数据

### AI 集成

```javascript
ztools.ai(option, streamCallback)
```

调用 AI 模型。

**参数：**
- `option`: AI 调用选项
- `streamCallback`: 流式回调函数（支持流式输出）

---

## 开发建议

1. 使用标准前端技术栈（HTML/CSS/JavaScript）
2. 如使用框架（Vue/React 等），确保正确编译输出到 `dist` 目录
3. 合理使用数据持久化 API 存储用户数据
4. 利用 AI 集成能力增强插件功能
5. 遵循插件目录结构规范，确保 `plugin.json` 配置正确