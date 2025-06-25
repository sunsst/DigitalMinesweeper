<template>
    <el-dropdown>
        <el-button :icon="Setting" circle title="配置选项" />
        <template #dropdown>
            <el-dropdown-menu>
                <el-dropdown-item><el-button text
                        @pointerdown="configState.playerListDialog = !configState.playerListDialog">玩家列表</el-button></el-dropdown-item>
                <el-dropdown-item><el-button text
                        @pointerdown="configState.chessboardDialog = !configState.chessboardDialog">棋盘参数</el-button></el-dropdown-item>
            </el-dropdown-menu>
        </template>
    </el-dropdown>


    <PlayerList v-model="configState.playerListDialog" :game="game" />
    <ChessboardConfigDialog v-model="configState.chessboardDialog" :game="game" />
</template>

<script setup lang="ts">
import { Setting } from '@element-plus/icons-vue'
import { GameMain } from '../../game/game-main'
import { shallowReactive } from 'vue'
import PlayerList from '../game-config/PlayerListDialog.vue'
import ChessboardConfigDialog from '../game-config/ChessboardConfigDialog.vue'

const { game } = defineProps({
    game: { required: true, type: GameMain }
})

const configState = shallowReactive({
    playerListDialog: false,
    chessboardDialog: false,
})

</script>