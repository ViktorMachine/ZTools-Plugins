/// <reference types="vite/client" />
/// <reference types="@ztools-center/ztools-api-types" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, never>, Record<string, never>, unknown>
  export default component
}

// IDE 配置类型
interface IDEConfig {
  code: string
  icon: string
  terminal: string
  command: string
  database: string
  timeout: string | number
}

// Preload services 类型声明（对应 public/preload/services.js）
interface Services {
  // 配置管理
  Config: {
    getKey(code: string): string
    get(code: string): IDEConfig
    save(config: IDEConfig): void
    newConfig(code: string): IDEConfig
  }

  // IDE 管理服务
  IDEService: {
    list(): IDEFeature[]
    add(config: IDEConfig): void
    remove(code: string): void
    initDefault(): void
  }

  // 数据库服务
  DbService: {
    getFiles(dbPath: string): Promise<string[]>
    deleteFile(dbPath: string, targetPath: string): Promise<boolean>
    deleteFiles(dbPath: string, targetPaths: string[]): Promise<number>
  }

  // 命令执行服务
  CmdService: {
    getShellEnv(terminal: string): Record<string, string>
    openFile(config: IDEConfig, fileUri: string): Promise<string>
  }

  // 图标服务
  IconService: {
    getIcon(ext: string): string
  }
}

// IDE 功能特性
interface IDEFeature {
  code: string
  explain: string
  icon: string
}

declare global {
  interface Window {
    services: Services
  }
}

export {}
