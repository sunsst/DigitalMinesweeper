<template>
    <el-button :icon="Refresh" circle title="重开一局" @pointerdown="game.newGame()" />
</template>


<script setup lang="ts">
import { Refresh } from '@element-plus/icons-vue'
import { GameMain } from '../../game/game-main'

defineProps({
    game: {
        required: true,
        type: GameMain
    }
})
</script>