<template>
  <div class="add-ide-container">
    <div class="search-box">
      <input
        v-model="ideCode"
        type="text"
        placeholder="请输入 IDE code"
        @input="handleInput"
      />
    </div>

    <div class="preview-item" v-if="ideCode" @click="handleAdd">
      <div class="preview-title">{{ ideCode }}</div>
      <div class="preview-desc">回车新建 IDE</div>
    </div>

    <div class="empty-tip" v-else>
      请输入 IDE 名称（最好是 terminal 命令，例如 cursor）
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const ideCode = ref('')

const handleInput = () => {
  // 输入由 v-model 自动处理
}

const handleAdd = () => {
  if (!ideCode.value.trim()) {
    ztools.showNotification('请输入 IDE 名称')
    return
  }

  const code = ideCode.value.trim().toLowerCase()
  const config = window.services.Config.newConfig(code)

  window.services.IDEService.add(config)
  ztools.showNotification(`创建成功，请输入 ${code}-setting 调整配置`)
  ztools.hideMainWindow()
}

onMounted(() => {
  ztools.setSubInput((input: { text: string }) => {
    ideCode.value = input.text
  }, '请输入 IDE code', true)
})
</script>

<style scoped>
.add-ide-container {
  padding: 10px;
}

.search-box {
  padding: 8px;
  background: var(--bg-color, #fff);
  border-bottom: 1px solid var(--border-color, #eee);
}

.search-box input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--border-color, #ddd);
  border-radius: 4px;
  background: var(--input-bg, #f5f5f5);
  color: var(--text-color, #333);
}

.preview-item {
  display: flex;
  flex-direction: column;
  padding: 12px;
  margin-top: 10px;
  background: var(--item-bg, #f5f5f5);
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
}

.preview-item:hover {
  background: var(--hover-bg, #e0e0e0);
}

.preview-title {
  font-weight: 500;
  color: var(--text-color, #333);
}

.preview-desc {
  font-size: 12px;
  color: var(--secondary-text, #999);
}

.empty-tip {
  text-align: center;
  padding: 20px;
  color: var(--secondary-text, #999);
  margin-top: 10px;
}
</style>