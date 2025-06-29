<template>
    <el-dropdown>
        <el-button ref="button" :icon="DArrowLeft" circle title="回退游戏" />
        <template #dropdown>
            <el-dropdown-menu>
                <el-dropdown-item @click="backOne()">回退一步</el-dropdown-item>
                <el-dropdown-item @click="backAll()">本局初始</el-dropdown-item>
            </el-dropdown-menu>
        </template>
    </el-dropdown>

</template>

<script setup lang="ts">
import { DArrowLeft } from '@element-plus/icons-vue'
import { GameMain } from '../../game/game-main'
import { ElButton, ElMessage } from 'element-plus'
import { ref } from 'vue'

const { game } = defineProps({
    game: { required: true, type: GameMain }
})



/**
 * 回退一步
 */
function backOne() {
    let { before, after } = game.rollbackSteps(1)
    ElMessage({
        type: 'info',
        message: `回退一步，已从第${before}步回溯到${after}步，倒霉数字已刷新`
    })
}

/**
 * 回退到这局游戏开始
 */
function backAll() {
    let { before, after } = game.rollbackSteps(-1)
    ElMessage({
        type: 'info',
        message: `恢复初始，已从第${before}步回溯到${after}步，倒霉数字已刷新`
    })
}

const button = ref<InstanceType<typeof ElButton>>()
defineExpose({
    button
})
</script>