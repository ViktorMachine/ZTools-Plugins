<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import VSCode from './VSCode/index.vue'
import Setting from './Setting/index.vue'
import IDE from './IDE/index.vue'
import AddIDE from './AddIDE/index.vue'

const route = ref('')
const enterAction = ref<any>({})

// 判断是否为设置页面
const isSetting = computed(() => route.value.endsWith('-setting'))

onMounted(() => {
  console.log('[App] mounted, waiting for onPluginEnter...')

  // 使用全局 ztools 对象
  ztools.onPluginEnter((action: any) => {
    console.log('[App] onPluginEnter triggered:', action)
    route.value = action.code || ''
    enterAction.value = action
  })

  ztools.onPluginOut(() => {
    console.log('[App] onPluginOut triggered')
    route.value = ''
  })
})
</script>

<template>
  <div class="app-container">
    <!-- 调试信息 -->
    <div v-if="!route" class="debug-info">
      等待插件激活... (当前 route: "{{ route }}")
    </div>

    <!-- IDE 主搜索页面（动态匹配所有非 setting 结尾的 code） -->
    <VSCode v-else-if="!isSetting && route !== 'vsc-ide' && route !== 'vsc-add-ide'" :enter-action="enterAction" />
    <!-- 设置页面 -->
    <Setting v-else-if="isSetting" :enter-action="enterAction" />
    <!-- IDE 管理页面 -->
    <IDE v-else-if="route === 'vsc-ide'" :enter-action="enterAction" />
    <!-- 新增 IDE 页面 -->
    <AddIDE v-else-if="route === 'vsc-add-ide'" :enter-action="enterAction" />
  </div>
</template>

<style scoped>
.app-container {
  min-height: 100vh;
}
.debug-info {
  padding: 20px;
  text-align: center;
  color: #999;
}
</style>
