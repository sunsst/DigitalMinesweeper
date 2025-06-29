<template>
    <el-button ref="button" :icon="Refresh" circle title="重开一局" @click="newGame()" />
</template>


<script setup lang="ts">
import { Refresh } from '@element-plus/icons-vue'
import { GameMain } from '../../game/game-main'
import { ElButton, ElMessage } from 'element-plus'
import { ref } from 'vue'


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


const button = ref<InstanceType<typeof ElButton>>()
defineExpose({
    button
})
</script>