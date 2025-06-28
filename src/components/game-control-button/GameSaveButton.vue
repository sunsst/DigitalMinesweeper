<template>
    <el-dropdown>
        <el-button :icon="DocumentChecked" circle title="保存游戏" />
        <template #dropdown>
            <el-dropdown-menu>
                <el-dropdown-item><el-button text @pointerdown="saveGame()">临时保存</el-button></el-dropdown-item>
                <el-dropdown-item><el-button text @pointerdown="clearAll()">计分重置</el-button></el-dropdown-item>
            </el-dropdown-menu>
        </template>
    </el-dropdown>

</template>

<script setup lang="ts">
import { DocumentChecked } from '@element-plus/icons-vue'
import { GameMain } from '../../game/game-main'
import { ElMessage, ElMessageBox } from 'element-plus'

const { game } = defineProps({
    game: { required: true, type: GameMain }
})



/**
 * 保存游戏
 */
function saveGame() {
    game.saveGameNow()
    ElMessage({
        type: 'success',
        message: `已存档`
    })
}


/**
 * 清理所有存档
 */
async function clearAll() {

    try {
        await ElMessageBox.confirm('你确定要重置计分？', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
        })
        game.clearAllSaves()
        ElMessage({
            type: 'success',
            message: `已清理所有存档`
        })
    } catch {
        ElMessage({
            type: 'info',
            message: '取消重置',
        })
    }

}

</script>