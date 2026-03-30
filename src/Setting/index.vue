<template>
  <div class="setting-container">
    <form @submit.prevent="handleSave" class="setting-form">
      <div class="form-group">
        <label>code</label>
        <div class="input-wrapper">
          <input v-model="config.code" type="text" required disabled />
          <span class="tip">IDE 唯一标识，例如 vsc/cursor</span>
        </div>
      </div>

      <div class="form-group">
        <label>图标</label>
        <div class="input-wrapper">
          <div class="input-row">
            <input v-model="config.icon" type="text" placeholder="logo.png" />
            <button type="button" class="select-btn" @click="selectIcon">选择</button>
          </div>
          <span class="tip">图标路径，建议使用 png 格式</span>
        </div>
      </div>

      <div class="form-group">
        <label>终端环境</label>
        <div class="input-wrapper">
          <input v-model="config.terminal" type="text" placeholder="Windows 用户留空" />
          <span class="tip">终端类型: zsh -l -c / bash -l -c，Windows 用户留空</span>
        </div>
      </div>

      <div class="form-group">
        <label>执行命令</label>
        <div class="input-wrapper">
          <input v-model="config.command" type="text" required placeholder="code / cursor" />
          <span class="tip">IDE 的执行命令，确保已在终端测试过</span>
        </div>
      </div>

      <div class="form-group">
        <label>数据库路径</label>
        <div class="input-wrapper">
          <div class="input-row">
            <input v-model="config.database" type="text" placeholder="state.vscdb 路径" />
            <button type="button" class="select-btn" @click="selectDatabase">选择</button>
          </div>
          <span class="tip">IDE 数据库文件 (state.vscdb)</span>
        </div>
      </div>

      <div class="form-group">
        <label>超时时间(ms)</label>
        <div class="input-wrapper">
          <input v-model.number="config.timeout" type="number" min="1000" placeholder="3000" />
          <span class="tip">命令执行的超时时间，默认 3000ms</span>
        </div>
      </div>

      <div class="form-footer">
        <button type="submit" class="save-btn">保存设置</button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'

const props = defineProps<{
  enterAction: any
}>()

const config = ref<any>({
  code: '',
  icon: 'logo.png',
  terminal: '',
  command: '',
  database: '',
  timeout: '3000'
})

const isLoaded = ref(false)

// 选择图标文件
const selectIcon = () => {
  const result = ztools.showOpenDialog({
    title: '选择图标文件',
    filters: [{ name: '图片', extensions: ['png', 'jpg', 'svg'] }],
    properties: ['openFile']
  })
  if (result && result[0]) {
    config.value.icon = result[0]
  }
}

// 选择数据库文件
const selectDatabase = () => {
  const result = ztools.showOpenDialog({
    title: '选择数据库文件',
    filters: [{ name: '数据库', extensions: ['vscdb'] }],
    properties: ['openFile']
  })
  if (result && result[0]) {
    config.value.database = result[0]
  }
}

const loadConfig = () => {
  // 从 action.code 中提取实际的 IDE code
  // 例如 "vsc-setting" -> "vsc"
  const actionCode = props.enterAction?.code
  if (!actionCode) {
    console.log('[Setting] 等待 enterAction...')
    return
  }

  const ideCode = actionCode.replace('-setting', '')
  console.log('[Setting] 加载配置:', ideCode)

  const loaded = window.services.Config.get(ideCode)
  console.log('[Setting] 已有配置:', loaded)

  if (loaded && loaded.code) {
    config.value = { ...loaded }
  } else {
    // 创建默认配置
    config.value = window.services.Config.newConfig(ideCode)
    console.log('[Setting] 新建默认配置:', config.value)
  }
  isLoaded.value = true
}

const handleSave = () => {
  // 验证必填字段
  if (!config.value.code) {
    alert('code 不能为空')
    return
  }
  if (!config.value.command) {
    alert('执行命令不能为空')
    return
  }

  // 转换为纯对象（解决 Vue 响应式对象无法克隆的问题）
  const plainConfig = JSON.parse(JSON.stringify(config.value))
  plainConfig.timeout = String(plainConfig.timeout || '3000')

  console.log('[Setting] 保存配置:', plainConfig)

  try {
    // 保存配置到存储
    window.services.Config.save(plainConfig)
    console.log('[Setting] 配置已保存到存储')

    // 更新 feature
    ztools.setFeature({
      code: plainConfig.code,
      explain: `IDE: ${plainConfig.code}`,
      cmds: [plainConfig.code],
      icon: plainConfig.icon || 'logo.png'
    })

    // 更新 setting feature
    ztools.setFeature({
      code: `${plainConfig.code}-setting`,
      explain: `${plainConfig.code} 设置`,
      cmds: [`${plainConfig.code}-setting`],
      icon: plainConfig.icon || 'logo.png'
    })

    ztools.showNotification(`${plainConfig.code} 配置已保存`)
    ztools.hideMainWindow()
  } catch (error: any) {
    console.error('[Setting] 保存失败:', error)
    alert(`保存失败: ${error.message || error}`)
  }
}

// 监听 enterAction 变化
watch(() => props.enterAction, (newVal) => {
  if (newVal?.code) {
    console.log('[Setting] enterAction 变化:', newVal)
    loadConfig()
  }
}, { immediate: true })

onMounted(() => {
  console.log('[Setting] mounted, enterAction:', props.enterAction)
  loadConfig()
})
</script>

<style scoped>
.setting-container {
  padding: 20px;
  max-height: 500px;
  overflow-y: auto;
}

.setting-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  gap: 12px;
}

.form-group label {
  flex: 0 0 100px;
  font-weight: 500;
  color: var(--text-color, #333);
  padding-top: 8px;
}

.input-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.input-row {
  display: flex;
  gap: 8px;
}

.input-row input {
  flex: 1;
}

.input-wrapper input {
  padding: 8px 12px;
  border: 1px solid var(--border-color, #ddd);
  border-radius: 4px;
  background: var(--input-bg, #fff);
  color: var(--text-color, #333);
}

.input-wrapper input:focus {
  border-color: #4CAF50;
  outline: none;
}

.input-wrapper input:disabled {
  background: var(--disabled-bg, #f5f5f5);
  cursor: not-allowed;
}

.input-wrapper .tip {
  font-size: 12px;
  color: var(--secondary-text, #999);
}

.select-btn {
  padding: 8px 16px;
  background: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  white-space: nowrap;
}

.select-btn:hover {
  background: #e0e0e0;
}

.form-footer {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid var(--border-color, #eee);
}

.save-btn {
  width: 100%;
  padding: 12px;
  background: #506d84;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

.save-btn:hover {
  background: #3d5a73;
}
</style>