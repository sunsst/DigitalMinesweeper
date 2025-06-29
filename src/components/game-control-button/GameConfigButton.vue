<template>
    <el-dropdown>
        <el-button :icon="Setting" circle title="配置选项" />
        <template #dropdown>
            <el-dropdown-menu>
                <el-dropdown-item @click="openClosePlayerListDialog()">玩家列表</el-dropdown-item>
                <el-dropdown-item @click="openCloseChessboardDialog()">棋盘参数</el-dropdown-item>
            </el-dropdown-menu>
        </template>
    </el-dropdown>


    <PlayerList v-model="state.playerListDialog" :game="game" />
    <ChessboardConfigDialog v-model="state.chessboardDialog" :game="game" />
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

function openClosePlayerListDialog() {
    state.playerListDialog = !state.playerListDialog
}

function openCloseChessboardDialog() {
    state.chessboardDialog = !state.chessboardDialog
}

const state = shallowReactive({
    playerListDialog: false,
    chessboardDialog: false,
})

</script>