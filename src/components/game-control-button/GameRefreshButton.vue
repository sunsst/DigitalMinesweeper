<template>
    <el-button :icon="Refresh" circle title="重开一局" @click="newGame()" />
</template>


<script setup lang="ts">
import { Refresh } from '@element-plus/icons-vue'
import { GameMain } from '../../game/game-main'
import { ElMessage } from 'element-plus'


const { game } = defineProps({
    game: {
        required: true,
        type: GameMain
    }
})



function newGame() {
    game.newGame()
    game.saveGameNow()
    ElMessage({
        message: '已存档',
        type: 'info'
    })
}
</script>