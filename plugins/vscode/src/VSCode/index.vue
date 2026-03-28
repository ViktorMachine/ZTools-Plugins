<template>
  <div class="vscode-container" ref="containerRef">
    <!-- 删除模式提示 -->
    <div v-if="isRemoveMode" class="remove-mode-bar">
      <span class="remove-icon">🗑️</span>
      <span>删除模式：点击项目可删除历史记录</span>
    </div>

    <!-- 文件列表 -->
    <div class="file-list" v-if="sortedFiles.length > 0" ref="listRef">
      <div
        class="file-item"
        :class="{
          'active': activeIndex === index,
          'pinned': isPinned(file.path)
        }"
        v-for="(file, index) in sortedFiles"
        :key="file.path"
        @click="handleSelect(file)"
        @mouseenter="activeIndex = index"
      >
        <img :src="getIconUrl(file.ext)" class="file-icon" alt="" />
        <div class="file-info">
          <div class="file-title">
            <span v-if="isPinned(file.path)" class="pin-icon">📌</span>
            {{ file.name }}
          </div>
          <div class="file-path">{{ formatPath(file.displayPath) }}</div>
        </div>
        <div class="file-action">
          <span v-if="isRemoveMode" class="action-delete">删除</span>
          <span v-else class="action-open">打开</span>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div class="empty-state" v-else-if="!loading">
      <div class="empty-icon">📂</div>
      <div class="empty-text">{{ searchWord ? '未找到匹配的项目' : '暂无历史项目' }}</div>
      <div class="empty-hint" v-if="!searchWord && files.length === 0">请检查 IDE 配置是否正确</div>
    </div>

    <!-- 加载状态 -->
    <div class="loading-state" v-if="loading">
      <div class="loading-spinner"></div>
      <div>加载中...</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'

interface FileItem {
  path: string
  name: string
  displayPath: string
  ext: string
}

const props = defineProps<{
  enterAction: any
}>()

const containerRef = ref<HTMLElement | null>(null)
const listRef = ref<HTMLElement | null>(null)
const searchWord = ref('')
const files = ref<FileItem[]>([])
const loading = ref(false)
const activeIndex = ref(0)
const pinnedPaths = ref<string[]>([])
const isRemoveMode = computed(() => searchWord.value.includes('-rm'))
const config = ref<any>({})

// 扩展名到图标文件名的映射
const extIconMap: Record<string, string> = {
  '.js': 'js',
  '.ts': 'ts',
  '.vue': 'vue',
  '.jsx': 'js',
  '.tsx': 'ts',
  '.html': 'html',
  '.css': 'css',
  '.scss': 'css',
  '.less': 'css',
  '.json': 'json',
  '.md': 'md',
  '.py': 'py',
  '.java': 'java',
  '.go': 'go',
  '.cpp': 'cpp',
  '.c': 'c',
  '.cs': 'cs',
  '.php': 'php',
  '.sh': 'sh',
  '.xml': 'xml',
  '.yaml': 'yaml',
  '.yml': 'yaml',
  '.remote': 'remote',
  '.code-workspace': 'vscode'
}

// 过滤后的文件列表
const filteredFiles = computed(() => {
  let result = files.value
  const word = searchWord.value.replace(/-rm/g, '').trim()

  if (word) {
    word.split(/\s+/g).forEach(keyword => {
      if (keyword.trim()) {
        result = result.filter(file =>
          file.displayPath.toLowerCase().includes(keyword.trim().toLowerCase())
        )
      }
    })
  }

  return result
})

// 排序后的文件列表（pin 的项目在顶部）
const sortedFiles = computed(() => {
  const pinned = filteredFiles.value.filter(f => isPinned(f.path))
  const unpinned = filteredFiles.value.filter(f => !isPinned(f.path))
  return [...pinned, ...unpinned]
})

// 判断是否已 pin
const isPinned = (path: string): boolean => {
  return pinnedPaths.value.includes(path)
}

// 切换 pin 状态
const togglePin = (path: string) => {
  if (isPinned(path)) {
    pinnedPaths.value = pinnedPaths.value.filter(p => p !== path)
  } else {
    pinnedPaths.value = [path, ...pinnedPaths.value]
  }
  savePinnedPaths()
}

// 保存 pin 列表
const savePinnedPaths = () => {
  const key = `vscode.${config.value.code}.pins`
  ztools.dbStorage.setItem(key, JSON.parse(JSON.stringify(pinnedPaths.value)))
}

// 加载 pin 列表
const loadPinnedPaths = () => {
  const key = `vscode.${config.value.code}.pins`
  const saved = ztools.dbStorage.getItem(key)
  pinnedPaths.value = saved || []
}

// 获取图标 URL
const getIconUrl = (ext: string): string => {
  const iconName = extIconMap[ext.toLowerCase()]
  if (iconName) {
    return `preload/icon/${iconName}.svg`
  }
  return 'preload/icon/folder.svg'
}

// 格式化路径显示
const formatPath = (path: string): string => {
  let formatted = path.replace(/^file:\/\/\//, '')
  if (formatted.length > 60) {
    const parts = formatted.split(/[/\\]/)
    if (parts.length > 3) {
      return '...' + parts.slice(-3).join('/')
    }
  }
  return formatted
}

// 获取扩展名
const getExtension = (path: string): string => {
  if (path.includes('.code-workspace')) return '.code-workspace'
  const match = path.match(/\.[^.]+$/)
  return match ? match[0].toLowerCase() : ''
}

// 获取 IDE 配置
const loadConfig = () => {
  const code = props.enterAction?.code
  if (!code) return false

  let loaded = window.services.Config.get(code)
  if (!loaded || !loaded.code) {
    loaded = window.services.Config.newConfig(code)
    window.services.Config.save(loaded)
  }
  config.value = loaded
  return true
}

// 加载历史文件
const loadFiles = async () => {
  if (!config.value.database) return

  loading.value = true
  try {
    const rawFiles = await window.services.DbService.getFiles(config.value.database)
    files.value = rawFiles.map((path: string) => {
      const decodedPath = decodeURIComponent(path)
      const name = decodedPath.split('/').pop() || decodedPath.split('\\').pop() || decodedPath
      const ext = path.includes('remote') ? '.remote' : getExtension(decodedPath)
      return { path, name, displayPath: decodedPath, ext }
    })
    // 加载 pin 列表
    loadPinnedPaths()
    // 重置激活索引
    activeIndex.value = 0
  } catch (error: any) {
    ztools.showNotification(`加载失败: ${error.message}`)
  } finally {
    loading.value = false
  }
}

// 处理选择
const handleSelect = async (file: FileItem) => {
  if (isRemoveMode.value) {
    const confirmed = confirm(`确定要删除历史记录吗？\n\n${file.name}`)
    if (!confirmed) return

    try {
      const success = await window.services.DbService.deleteFile(config.value.database, file.path)
      if (success) {
        // 如果删除的是 pin 项目，从 pin 列表移除
        if (isPinned(file.path)) {
          pinnedPaths.value = pinnedPaths.value.filter(p => p !== file.path)
          savePinnedPaths()
        }
        ztools.showNotification(`已删除: ${file.name}`)
        await loadFiles()
      }
    } catch (error: any) {
      ztools.showNotification(`删除失败: ${error.message}`)
    }
  } else {
    try {
      await window.services.CmdService.openFile(config.value, file.path)
      ztools.hideMainWindow()
    } catch (error: any) {
      ztools.showNotification(`打开失败: ${error.message}`)
    }
  }
}

// 滚动到激活项
const scrollToActive = () => {
  nextTick(() => {
    if (!listRef.value) return
    const items = listRef.value.querySelectorAll('.file-item')
    const activeItem = items[activeIndex.value]
    if (activeItem) {
      activeItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  })
}

// 键盘事件处理
const handleKeydown = (e: KeyboardEvent) => {
  const list = sortedFiles.value
  if (list.length === 0) return

  // 上下键导航
  if (e.key === 'ArrowUp') {
    e.preventDefault()
    activeIndex.value = activeIndex.value > 0 ? activeIndex.value - 1 : list.length - 1
    scrollToActive()
  } else if (e.key === 'ArrowDown') {
    e.preventDefault()
    activeIndex.value = activeIndex.value < list.length - 1 ? activeIndex.value + 1 : 0
    scrollToActive()
  } else if (e.key === 'Enter') {
    // Ctrl+Enter: pin/unpin
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      const file = list[activeIndex.value]
      if (file && !isRemoveMode.value) {
        togglePin(file.path)
        ztools.showNotification(isPinned(file.path) ? `已置顶: ${file.name}` : `已取消置顶: ${file.name}`)
      }
    } else {
      // 普通 Enter: 打开
      e.preventDefault()
      const file = list[activeIndex.value]
      if (file) {
        handleSelect(file)
      }
    }
  }
}

// 监听 enterAction 变化
watch(() => props.enterAction, (newVal) => {
  if (newVal?.code && loadConfig()) {
    loadFiles()
  }
}, { immediate: true })

// 监听搜索词变化，重置激活索引
watch(searchWord, () => {
  activeIndex.value = 0
})

onMounted(() => {
  if (loadConfig()) {
    loadFiles()
  }

  ztools.setSubInput((input: { text: string }) => {
    searchWord.value = input.text
  }, '输入关键词搜索,Ctrl+Enter置顶,-rm删除模式', true)

  // 添加键盘事件监听
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.vscode-container {
  padding: 0;
  min-height: 100%;
  background: transparent;
}

/* 删除模式提示条 */
.remove-mode-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: rgba(255, 77, 79, 0.1);
  border-bottom: 1px solid rgba(255, 77, 79, 0.2);
  color: #ff4d4f;
  font-size: 13px;
}

.remove-icon {
  font-size: 16px;
}

/* 文件列表 */
.file-list {
  padding: 4px 0;
}

.file-item {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  cursor: pointer;
  transition: background 0.1s;
  border-radius: 4px;
  margin: 2px 8px;
}

.file-item:hover,
.file-item.active {
  background: var(--hover-bg, rgba(0, 0, 0, 0.04));
}

.file-item.active {
  background: rgba(24, 144, 255, 0.08);
}

.file-item:active {
  background: var(--active-bg, rgba(0, 0, 0, 0.08));
}

/* Pin 项目样式 */
.file-item.pinned {
  background: rgba(250, 173, 20, 0.08);
}

.file-item.pinned:hover,
.file-item.pinned.active {
  background: rgba(250, 173, 20, 0.12);
}

/* 图标 - 无背景色 */
.file-icon {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  margin-right: 12px;
  object-fit: contain;
  background: transparent;
}

/* 文件信息 */
.file-info {
  flex: 1;
  min-width: 0;
}

.file-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-color, inherit);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 2px;
}

.pin-icon {
  margin-right: 4px;
  font-size: 12px;
}

.file-path {
  font-size: 12px;
  color: #999;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 操作按钮 */
.file-action {
  flex-shrink: 0;
  margin-left: 12px;
}

.action-open,
.action-delete {
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
}

.action-open {
  background: rgba(24, 144, 255, 0.1);
  color: #1890ff;
}

.action-delete {
  background: rgba(255, 77, 79, 0.1);
  color: #ff4d4f;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: var(--secondary-text, rgba(0, 0, 0, 0.45));
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-text {
  font-size: 14px;
  margin-bottom: 8px;
}

.empty-hint {
  font-size: 12px;
  opacity: 0.6;
}

/* 加载状态 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: var(--secondary-text, rgba(0, 0, 0, 0.45));
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(0, 0, 0, 0.1);
  border-top-color: #1890ff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 12px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 暗色模式适配 */
@media (prefers-color-scheme: dark) {
  .file-path {
    color: #666;
  }

  .remove-mode-bar {
    background: rgba(255, 77, 79, 0.15);
  }

  .file-item:hover,
  .file-item.active {
    background: rgba(255, 255, 255, 0.08);
  }

  .file-item.active {
    background: rgba(24, 144, 255, 0.15);
  }

  .file-item.pinned {
    background: rgba(250, 173, 20, 0.12);
  }

  .file-item.pinned:hover,
  .file-item.pinned.active {
    background: rgba(250, 173, 20, 0.18);
  }

  .action-open {
    background: rgba(24, 144, 255, 0.15);
  }

  .action-delete {
    background: rgba(255, 77, 79, 0.15);
  }

  .loading-spinner {
    border-color: rgba(255, 255, 255, 0.1);
    border-top-color: #1890ff;
  }
}
</style>