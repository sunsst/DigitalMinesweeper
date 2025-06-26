<template>
    <el-button :icon="Histogram" circle title="重开一局" @pointerdown="state.dialog = !state.dialog" />
    <GameScoreboardDialog v-model="state.dialog" :game="game" />
</template>


<script setup lang="ts">
import { Histogram } from '@element-plus/icons-vue'
import { GameMain } from '../../game/game-main'
import GameScoreboardDialog from '../game-scoreboard/GameScoreboardDialog.vue'
import { reactive } from 'vue'

defineProps({
    game: {
        required: true,
        type: GameMain
    }
})

const state = reactive({
    dialog: false
})

</script>