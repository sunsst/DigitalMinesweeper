<template>
    <div class="game-window">
        <div class="game-box" ref="gameBox"></div>
        <el-divider class="game-info">
            <el-text line-clamp=1 size="large" ref="ref6">
                💣️x{{ refs.unexplodeCount }}
                🎮️#{{ refs.gameStatus }}
                {{ refs.playerNamePrefix }}@{{ refs.playerName }}
            </el-text>
        </el-divider>

        <el-space class="game-tool">
            <GameRefreshButton ref="ref1" :game="game" />
            <GameConfigButton ref="ref2" :game="game" />
            <GameScoreboardButton ref="ref3" :game="game" />
            <GameSaveButton ref="ref4" :game="game" />
            <GameBackStepButton ref="ref5" :game="game" />
            <GameHelpInfoButton :start="() => { state.tour = true }" />
        </el-space>
    </div>

    <el-tour v-model="state.tour">
        <el-tour-step :target="ref1?.button?.ref" title="重新开始" description="重新开始一局游戏并存档一次。" />
        <el-tour-step :target="ref2?.button?.ref" title="配置选项" description="对玩家列表、棋盘参数进行修改。没有正在游玩的玩家将无法进行游戏，请先添加玩家。" />
        <el-tour-step :target="ref3?.button?.ref" title="计分板" description="在这里可以查看各个玩家的分数信息。" />
        <el-tour-step :target="ref4?.button?.ref" title="存档与重置" description="快速保存一次玩家信息，也可以重置所有玩家的分数信息。" />
        <el-tour-step :target="ref5?.button?.ref" title="游戏回溯" description="可以回溯到该局游戏的任意回合。" />
        <el-tour-step :target="ref6?.$el" title="简略信息" description="展示当前游戏的简略状态。" />
    </el-tour>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, toRef, } from 'vue'
import { GameMain, } from '../game/game-main'
import GameRefreshButton from './game-control-button/GameRefreshButton.vue'
import GameConfigButton from './game-control-button/GameConfigButton.vue'
import GameScoreboardButton from './game-control-button/GameScoreboardButton.vue'
import GameBackStepButton from './game-control-button/GameBackStepButton.vue'
import GameSaveButton from './game-control-button/GameSaveButton.vue'
import GameHelpInfoButton from './game-control-button/GameInfoButton.vue'
import type { ElText } from 'element-plus'

const gameBox = ref()
const ref1 = ref<InstanceType<typeof GameRefreshButton>>()
const ref2 = ref<InstanceType<typeof GameRefreshButton>>()
const ref3 = ref<InstanceType<typeof GameRefreshButton>>()
const ref4 = ref<InstanceType<typeof GameRefreshButton>>()
const ref5 = ref<InstanceType<typeof GameRefreshButton>>()
const ref6 = ref<InstanceType<typeof ElText>>()
const game: GameMain = new GameMain()

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


const state = reactive({
    tour: false
})



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

.game-box :deep(canvas) {
    display: block;
}

.game-window .el-divider :deep(.el-divider__text) {
    background-color: #FAFAFA;
}

.game-tool {
    display: flex;
    flex-flow: row nowrap;
    padding: 0 10px;
}
</style>
