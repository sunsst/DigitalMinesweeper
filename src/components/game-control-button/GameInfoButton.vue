<template>
    <el-button :icon="InfoFilled" circle title="查看帮助" @click="start()" />
</template>


<script setup lang="ts">
import { InfoFilled } from '@element-plus/icons-vue'
import type { PropType } from 'vue'


let { start } = defineProps({
    start: {
        type: Function as PropType<() => void>,
        required: true
    }
})
</script>