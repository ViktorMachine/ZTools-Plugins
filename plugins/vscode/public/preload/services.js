/**
 * ZTools VSCode 插件 - Node.js 服务扩展
 * 提供数据库读取、文件操作、命令执行等能力
 */

const fs = require('node:fs');
const path = require('node:path');
const { exec, execSync } = require('node:child_process');
const process = require('node:process');

// sql.js 路径
const sqlWasmDir = path.join(__dirname, 'sqljs');

// 初始化 sql.js
let initSqlJs = null;
function getInitSqlJs() {
  if (initSqlJs) return initSqlJs;
  const sqlWasmJsPath = path.join(sqlWasmDir, 'sql-wasm.js');
  const sqlWasmCode = fs.readFileSync(sqlWasmJsPath, 'utf8');
  initSqlJs = new Function('require', 'module', 'exports', sqlWasmCode + '\nreturn module.exports;')(require, { exports: {} }, {}).default || require;
  return initSqlJs;
}

/**
 * 配置管理
 */
const Config = {
  /**
   * 获取配置存储 key
   * @param {string} code - IDE 标识
   * @returns {string} 存储 key
   */
  getKey(code) {
    return `vscode.${code}`;
  },

  /**
   * 获取配置
   * @param {string} code - IDE 标识
   * @returns {object} 配置对象
   */
  get(code) {
    const key = this.getKey(code);
    return ztools.dbStorage.getItem(key) || {};
  },

  /**
   * 保存配置
   * @param {object} config - 配置对象
   */
  save(config) {
    const key = this.getKey(config.code);
    ztools.dbStorage.setItem(key, config);
  },

  /**
   * 创建默认配置
   * @param {string} code - IDE 标识
   * @returns {object} 默认配置
   */
  newConfig(code) {
    const shells = {
      'win32': '',
      'darwin': 'zsh -l -c',
      'linux': 'bash -l -c'
    };

    const appData = ztools.getPath('appData');
    const codeUpper = code.charAt(0).toUpperCase() + code.slice(1);

    return {
      code: code.toLowerCase(),
      icon: 'logo.png',
      terminal: shells[process.platform] || '',
      command: code.toLowerCase(),
      database: path.join(appData, codeUpper, 'User', 'globalStorage', 'state.vscdb'),
      timeout: '3000'
    };
  }
};

/**
 * IDE 管理服务
 */
const IDEService = {
  /**
   * 获取所有 IDE 列表
   * @returns {Array} IDE 配置列表
   */
  list() {
    const features = ztools.getFeatures() || [];
    return features.filter(f => f.code && !f.code.endsWith('-setting'));
  },

  /**
   * 新增 IDE
   * @param {object} config - IDE 配置
   */
  add(config) {
    // 添加主功能
    ztools.setFeature({
      code: config.code,
      explain: `IDE: ${config.code}`,
      cmds: [config.code],
      icon: config.icon
    });

    // 添加设置功能
    ztools.setFeature({
      code: `${config.code}-setting`,
      explain: `${config.code} 设置`,
      cmds: [`${config.code}-setting`],
      icon: config.icon
    });

    Config.save(config);
  },

  /**
   * 删除 IDE
   * @param {string} code - IDE 标识
   */
  remove(code) {
    ztools.removeFeature(`${code}-setting`);
    ztools.removeFeature(code);

    const key = Config.getKey(code);
    ztools.dbStorage.removeItem(key);
  },

  /**
   * 初始化默认 IDE
   */
  initDefault() {
    // VSCode
    const vscConfig = Config.newConfig('vsc');
    vscConfig.command = 'code';
    this.add(vscConfig);

    // Cursor
    const cursorConfig = Config.newConfig('cursor');
    cursorConfig.icon = 'preload/icon/cursor.png';
    this.add(cursorConfig);
  }
};

/**
 * 数据库服务 - 读取/删除 VSCode 历史记录
 */
const DbService = {
  /**
   * 获取历史文件列表
   * @param {string} dbPath - 数据库路径
   * @returns {Promise<Array>} 文件路径列表
   */
  async getFiles(dbPath) {
    const initSql = getInitSqlJs();
    const SQL = await initSql({ locateFile: (file) => path.join(sqlWasmDir, file) });
    const dbData = fs.readFileSync(dbPath);
    const db = new SQL.Database(dbData);

    const sql = "select value from ItemTable where key = 'history.recentlyOpenedPathsList'";
    const results = db.exec(sql);

    if (!results || results.length === 0 || !results[0].values[0]) {
      throw new Error('数据获取失败，请检查数据库配置');
    }

    const res = results[0].values[0].toString();
    const data = JSON.parse(res);

    db.close();

    return data.entries.map((entry) => {
      if (typeof entry === 'string') return entry;
      return entry.fileUri || entry.folderUri || entry.workspace?.configPath;
    });
  },

  /**
   * 删除历史记录
   * @param {string} dbPath - 数据库路径
   * @param {string} targetPath - 要删除的路径
   * @returns {Promise<boolean>} 是否删除成功
   */
  async deleteFile(dbPath, targetPath) {
    const initSql = getInitSqlJs();
    const SQL = await initSql({ locateFile: (file) => path.join(sqlWasmDir, file) });
    const dbData = fs.readFileSync(dbPath);
    const db = new SQL.Database(dbData);

    const sql = "select value from ItemTable where key = 'history.recentlyOpenedPathsList'";
    const results = db.exec(sql);

    if (!results || results.length === 0) {
      throw new Error('未找到历史记录数据');
    }

    const res = results[0].values[0].toString();
    const data = JSON.parse(res);

    const originalLength = data.entries.length;
    data.entries = data.entries.filter((entry) => {
      if (typeof entry === 'string') return entry !== targetPath;
      const entryPath = entry.fileUri || entry.folderUri || entry.workspace?.configPath;
      return entryPath !== targetPath;
    });

    if (data.entries.length === originalLength) {
      db.close();
      return false;
    }

    const updatedJson = JSON.stringify(data);
    db.run("UPDATE ItemTable SET value = ? WHERE key = 'history.recentlyOpenedPathsList'", [updatedJson]);

    const buffer = db.export();
    fs.writeFileSync(dbPath, buffer);
    db.close();

    return true;
  },

  /**
   * 批量删除历史记录
   * @param {string} dbPath - 数据库路径
   * @param {Array} targetPaths - 要删除的路径数组
   * @returns {Promise<number>} 删除数量
   */
  async deleteFiles(dbPath, targetPaths) {
    const initSql = getInitSqlJs();
    const SQL = await initSql({ locateFile: (file) => path.join(sqlWasmDir, file) });
    const dbData = fs.readFileSync(dbPath);
    const db = new SQL.Database(dbData);

    const sql = "select value from ItemTable where key = 'history.recentlyOpenedPathsList'";
    const results = db.exec(sql);

    if (!results || results.length === 0) {
      throw new Error('未找到历史记录数据');
    }

    const res = results[0].values[0].toString();
    const data = JSON.parse(res);

    const originalLength = data.entries.length;
    data.entries = data.entries.filter((entry) => {
      if (typeof entry === 'string') return !targetPaths.includes(entry);
      const entryPath = entry.fileUri || entry.folderUri || entry.workspace?.configPath;
      return !targetPaths.includes(entryPath);
    });

    const deletedCount = originalLength - data.entries.length;

    if (deletedCount > 0) {
      const updatedJson = JSON.stringify(data);
      db.run("UPDATE ItemTable SET value = ? WHERE key = 'history.recentlyOpenedPathsList'", [updatedJson]);
      const buffer = db.export();
      fs.writeFileSync(dbPath, buffer);
    }

    db.close();
    return deletedCount;
  }
};

/**
 * 命令执行服务
 */
const CmdService = {
  /**
   * 获取 shell 环境变量
   * @param {string} terminal - 终端类型
   * @returns {object} 环境变量对象
   */
  getShellEnv(terminal) {
    if (ztools.isWindows()) {
      return process.env;
    }

    const shell = terminal.split(' ')[0].trim() || process.env.SHELL;
    const envStr = execSync(`${shell} -i -c "env"`).toString();

    const env = { ...process.env };
    envStr.split('\n').forEach(line => {
      const [key, value] = line.split('=', 2);
      if (key && value) env[key] = value;
    });

    return env;
  },

  /**
   * 执行打开 IDE 命令
   * @param {object} config - IDE 配置
   * @param {string} fileUri - 文件 URI
   * @returns {Promise<string>} 执行结果
   */
  async openFile(config, fileUri) {
    let code = config.command;
    if (code.trim().includes(' ')) code = `"${code}"`;

    const cmds = [code];
    if (fileUri.includes('.code-workspace')) {
      cmds.push('--file-uri');
    } else {
      cmds.push('--folder-uri');
    }
    cmds.push(`"${fileUri}"`);

    let cmd = cmds.join(' ');

    const terminal = config.terminal;
    if (terminal && terminal.trim()) {
      cmd = `${terminal} "env; ${cmd}"`;
    }

    const timeout = parseInt(config.timeout) || 3000;
    const env = this.getShellEnv(terminal);

    return new Promise((resolve, reject) => {
      exec(cmd, {
        timeout: timeout,
        windowsHide: true,
        encoding: 'utf-8',
        env: env
      }, (err, stdout, stderr) => {
        if (err) return reject(err.message + stdout);
        if (stderr) return reject(stderr + stdout);
        resolve(stdout);
      });
    });
  }
};

/**
 * 图标服务
 */
const IconService = {
  /**
   * 获取图标路径
   * @param {string} ext - 文件扩展名
   * @returns {string} 图标路径
   */
  getIcon(ext) {
    const iconDir = path.join(__dirname, 'icon');
    try {
      const icons = fs.readdirSync(iconDir);

      const icon = icons.find((i) => {
        return '.' + i.split('.')[0] === ext.toLowerCase();
      });

      if (!icon && !ext) return 'preload/icon/folder.svg';
      if (!icon && ext) return 'preload/icon/file.svg';
      return `preload/icon/${icon}`;
    } catch (e) {
      console.error('[IconService] 读取图标目录失败:', e);
      return 'logo.png';
    }
  }
};

// 通过 window 对象向渲染进程注入 nodejs 能力
window.services = {
  Config,
  IDEService,
  DbService,
  CmdService,
  IconService
};