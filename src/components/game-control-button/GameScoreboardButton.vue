<template>
    <el-button ref="button" :icon="Histogram" circle title="计分板" @click="state.dialog = !state.dialog" />
    <GameScoreboardDialog v-model="state.dialog" :game="game" />
</template>


<script setup lang="ts">
import { Histogram } from '@element-plus/icons-vue'
import { GameMain } from '../../game/game-main'
import GameScoreboardDialog from '../game-scoreboard/GameScoreboardDialog.vue'
import { reactive, ref } from 'vue'
import type { ElButton } from 'element-plus'

defineProps({
    game: {
        required: true,
        type: GameMain
    }
})

const state = reactive({
    dialog: false
})

const button = ref<InstanceType<typeof ElButton>>()
defineExpose({
    button
})
</script>