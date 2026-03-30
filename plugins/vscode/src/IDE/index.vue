<template>
  <div class="ide-container">
    <div class="ide-tip">点击项目可删除对应的 IDE 配置</div>

    <div class="ide-list">
      <div
        class="ide-item"
        v-for="ide in ideList"
        :key="ide.code"
        @click="handleRemove(ide)"
      >
        <img :src="ide.icon || 'logo.png'" class="ide-icon" alt="icon" />
        <div class="ide-info">
          <div class="ide-name">{{ ide.code }}</div>
          <div class="ide-desc">{{ ide.explain }}</div>
        </div>
      </div>
    </div>

    <div class="empty-tip" v-if="ideList.length === 0">
      暂无 IDE 配置，请输入 vsc-add-ide 新增
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface IDEItem {
  code: string
  explain: string
  icon: string
}

const ideList = ref<IDEItem[]>([])

const loadIDEList = () => {
  ideList.value = window.services.IDEService.list()
}

const handleRemove = (ide: IDEItem) => {
  if (ideList.value.length <= 1) {
    alert('至少需要保留一个 IDE')
    return
  }

  const confirmed = confirm(`是否删除 ${ide.code} IDE？`)
  if (!confirmed) return

  window.services.IDEService.remove(ide.code)
  ztools.showNotification(`${ide.code} 删除成功`)
  loadIDEList()
}

onMounted(() => {
  loadIDEList()

  // 如果没有 IDE，初始化默认
  if (ideList.value.length === 0) {
    window.services.IDEService.initDefault()
    loadIDEList()
  }
})
</script>

<style scoped>
.ide-container {
  padding: 10px;
}

.ide-tip {
  padding: 8px 12px;
  background: var(--tip-bg, #f0f0f0);
  color: var(--secondary-text, #999);
  font-size: 12px;
  border-radius: 4px;
  margin-bottom: 10px;
}

.ide-list {
  margin-top: 10px;
}

.ide-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid var(--border-color, #eee);
  cursor: pointer;
  transition: background 0.2s;
}

.ide-item:hover {
  background: var(--hover-bg, #f0f0f0);
}

.ide-icon {
  width: 32px;
  height: 32px;
  margin-right: 12px;
  border-radius: 4px;
}

.ide-info {
  flex: 1;
}

.ide-name {
  font-weight: 500;
  color: var(--text-color, #333);
}

.ide-desc {
  font-size: 12px;
  color: var(--secondary-text, #999);
}

.empty-tip {
  text-align: center;
  padding: 40px;
  color: var(--secondary-text, #999);
}
</style>