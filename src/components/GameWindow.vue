<template>
    <div class="game-window">
        <div class="game-box" ref="game-box"></div>
        <el-divider class="game-info">
            <el-text line-clamp=1 size="large">
                💣️x{{ refs.unexplodeCount }}
                🎮️#{{ refs.gameStatus }}
                {{ refs.playerNamePrefix }}@{{ refs.playerName }}
            </el-text>
        </el-divider>

        <el-space class="game-tool">
            <GameRefreshButton :game="game" />
            <GameConfigButton :game="game" />
            <GameScoreboardButton :game="game" />
            <GameSaveButton :game="game" />
            <GameBackStepButton :game="game" />
        </el-space>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, toRef, useTemplateRef } from 'vue'
import { GameMain, } from '../game/game-main'
import GameRefreshButton from './game-control-button/GameRefreshButton.vue'
import GameConfigButton from './game-control-button/GameConfigButton.vue'
import GameScoreboardButton from './game-control-button/GameScoreboardButton.vue'
import GameBackStepButton from './game-control-button/GameBackStepButton.vue'
import GameSaveButton from './game-control-button/GameSaveButton.vue'

const gameBox = useTemplateRef('game-box')
let game: GameMain = new GameMain()

/** 游戏状态映射到字符串 */
const gameStatus2String = {
    init: '准备',
    end: '结束',
    busy: '爆破',
    idle: '待选'
}

const refs = {
    /** 未爆炸的数量 */
    unexplodeCount: toRef(() => game.gameState.unexplodeCount),
    /** 游戏状态 */
    gameStatus: computed(() => gameStatus2String[game.gameState.gameStatus]),
    /** 玩家名称 */
    playerName: computed(() => game.playerList.currentPlayer?.name || '未设置玩家'),
    /** 玩家名称前缀符号 */
    playerNamePrefix: computed(() => game.gameState.gameStatus == 'end' ? "💥" : "🤯"),
}


onMounted(async () => {
    await game.init()
    if (game.canavas)
        gameBox.value?.appendChild(game.canavas)


    // 设置测试玩家
    // setTestPlayers(game, 20)
})

</script>


<style scoped>
.game-window {
    background-color: #FAFAFA;
    min-width: 100px;
    min-height: 100px;


    border: 4px solid #EBEEF5;
    border-radius: 4px;
    box-shadow: 0 0 10px #D4D7DE;
    padding-bottom: 10px;
}

.game-box:deep(canvas) {
    display: block;
}

.game-window .el-divider:v-deep(.el-divider__text) {
    background-color: #F5F7FA;
}

.game-tool {
    display: flex;
    flex-flow: row nowrap;
    padding: 0 10px;
}
</style>
