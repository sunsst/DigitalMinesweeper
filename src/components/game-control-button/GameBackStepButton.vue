<template>
    <el-dropdown>
        <el-button :icon="DArrowLeft" circle title="回退游戏" />
        <template #dropdown>
            <el-dropdown-menu>
                <el-dropdown-item><el-button text @pointerdown="backOne()">回退一步</el-button></el-dropdown-item>
                <el-dropdown-item><el-button text @pointerdown="backAll()">本局初始</el-button></el-dropdown-item>
            </el-dropdown-menu>
        </template>
    </el-dropdown>

</template>

<script setup lang="ts">
import { DArrowLeft } from '@element-plus/icons-vue'
import { GameMain } from '../../game/game-main'
import { ElMessage } from 'element-plus'

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

</script>