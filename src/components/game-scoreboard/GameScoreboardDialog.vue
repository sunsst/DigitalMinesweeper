<template>
    <el-dialog v-model="model" :append-to-body="true" :fullscreen="true" @open="getAllSaves()">
        <div class="dialog">
            <el-card>
                <template #header>存档信息</template>

                <div>
                    <el-radio-group v-model="state.currentSave">
                        <template v-for="{ str }, i in state.saves">
                            <el-radio :value="i" size="large">{{ str }}</el-radio>
                        </template>
                    </el-radio-group>
                </div>
            </el-card>

            <el-card shadow="never" style=" min-width: 600px;">
                <template #header> 总计 </template>
                <div style="text-align: center;">
                    <el-row :gutter="20">
                        <el-col :span="8">
                            <el-statistic title="总回合数" :value="state.total.roundCount" />
                        </el-col>
                        <el-col :span="8">
                            <el-statistic title="引爆总次数" :value="state.total.explodeCount" />
                        </el-col>
                        <el-col :span="8">
                            <el-statistic title="中奖总次数" :value="state.total.badNumberCount" />
                        </el-col>
                    </el-row>

                    <el-row :gutter="20">
                        <el-col :span="8">
                            <el-statistic title="平均回合命中率" :value="getRoundHitRatio(state.total)" suffix="%"
                                :precision="2" />
                        </el-col>
                        <el-col :span="8">
                            <el-statistic title="平均引爆命中率" :value="getExplodeHitRatio(state.total)" suffix="%"
                                :precision="2" />
                        </el-col>
                        <el-col :span="8">
                            <el-statistic title="平均回合引爆个数" :value="getExplodeWithRound(state.total)" :precision="3" />
                        </el-col>
                    </el-row>
                </div>
            </el-card>


            <el-card shadow="never" body-class="badnumbers-card">
                <template #header> 幸运数字 </template>
                <el-space :size="20" wrap>
                    <template
                        v-for="([badNumber, count], i) in badNumberMap2Array(state.total.badNumbers).slice(0, 20)">
                        <template v-if="i < 3">
                            <el-badge :value="count" badge-style="background-color: #F56C6C">
                                <el-tag type="danger"> {{ badNumber + 1 }}</el-tag>
                            </el-badge>
                        </template>
                        <template v-else-if="i < 10">
                            <el-badge :value="count" badge-style="background-color: #E6A23C">
                                <el-tag type="warning"> {{ badNumber + 1 }}</el-tag>
                            </el-badge>
                        </template>
                        <template v-else>
                            <el-badge :value="count" badge-style="background-color: #67C23A">
                                <el-tag type="success"> {{ badNumber + 1 }}</el-tag>
                            </el-badge>
                        </template>
                    </template>
                </el-space>
            </el-card>

            <el-table :data="vars.players.value" max-height="80vh" :stripe="true" :border="true">
                <el-table-column type="expand" #default="tableData: { row: PlayerInfo }">
                    <div style="padding: 2px 10px;">
                        <el-space :size="20" wrap>
                            <template
                                v-for="([badNumber, count], i) in badNumberMap2Array(tableData.row.badNumbers).slice(0, 5)">
                                <span v-if="i == 0"> Ta的幸运数字：</span>
                                <el-badge :value="count" badge-style="background-color: #F56C6C">
                                    <el-tag type="danger"> {{ badNumber + 1 }}</el-tag>
                                </el-badge>
                            </template>
                        </el-space>
                    </div>
                </el-table-column>

                <el-table-column align="center" type="index" label="#" width="55" />

                <el-table-column align="center" prop="pid" label="ID" width="180" />
                <el-table-column align="center" prop="name" label="名称" min-width="200" />

                <el-table-column align="center" prop="explodeCount" label="引爆次数" width="150" :sortable="true" />
                <el-table-column align="center" prop="roundCount" label="回合次数" width="120" :sortable="true" />
                <el-table-column align="center" prop="badNumberCount" label="中奖次数" width="120" :sortable="true" />


                <el-table-column align="center" label="回合命中率" width="120" #default="tableData" :sortable="true"
                    :sort-by="vars.roundHitRatio.sort">
                    {{ vars.roundHitRatio.show(tableData.row) }}%
                </el-table-column>
                <el-table-column align="center" label="爆炸命中率" width="120" #default="tableData" :sortable="true"
                    :sort-method="vars.explodeHitRatio.sort">
                    {{ vars.explodeHitRatio.show(tableData.row) }}%
                </el-table-column>
                <el-table-column align="center" label="回合引爆数" width="120" #default="tableData" :sortable="true"
                    :sort-method="vars.explodeWithRound.sort">
                    {{ vars.explodeWithRound.show(tableData.row) }}
                </el-table-column>


                <el-table-column align="center" label="倒霉评分" width="120" #default="tableData" :sortable="true"
                    :sort-method="vars.score.sort">
                    {{ vars.score.show(tableData.row) }}
                </el-table-column>


                <template #empty>
                    <el-empty :image-size="60" description="无有效分数的玩家" />
                </template>
            </el-table>
        </div>
    </el-dialog>
</template>


<script setup lang="ts">
import { GameMain } from '../../game/game-main'
import { ElDialog } from 'element-plus'
import { GamePlayers, PlayerInfo } from '../../game/game-players'
import { computed, reactive, watch } from 'vue'

const model = defineModel({
    required: true,
    type: Boolean
})
const { game } = defineProps({
    game: {
        required: true,
        type: GameMain
    }
})

/** 每回合命中倒霉数字的概率 */
function getRoundHitRatio(p: PlayerInfo) {
    return p.badNumberCount / p.roundCount
}

/** 每次引爆地雷命中倒霉数字的概率 */
function getExplodeHitRatio(p: PlayerInfo) {
    return p.badNumberCount / p.explodeCount
}

/** 每回合引爆的地雷数量 */
function getExplodeWithRound(p: PlayerInfo) {
    return p.explodeCount / p.roundCount
}

/**
 * 获取玩家的倒霉评分
 * @param player 
 */
function getPlayerScore(player: PlayerInfo) {
    if (player.badNumberCount == 0) return 0

    let explodeRatio = (player.explodeCount / player.roundCount) / game.gameState.total
    let score =
        player.badNumberCount / player.roundCount * 0.5 +
        player.badNumberCount / player.explodeCount * 0.3 +
        1.0 / (1.0 + 10.0 * explodeRatio) * 0.2
    score = 10 * Math.min(score, 1.0)
    return Math.round(score * 10) / 10
}

const vars = {
    players: computed(() => {
        let plist
        if (state.currentSave >= state.saves.length) plist = game.playerList
        else plist = state.saves[state.currentSave].f()
        return plist.players.filter(p => p.roundCount > 0)
    }),
    roundHitRatio: {
        show: (p: PlayerInfo) => (Math.round(getRoundHitRatio(p) * 10000) / 100),
        sort: (a: PlayerInfo, b: PlayerInfo) => getRoundHitRatio(a) - getRoundHitRatio(b)
    },
    explodeHitRatio: {
        show: (p: PlayerInfo) => Math.round(getExplodeHitRatio(p) * 10000) / 100,
        sort: (a: PlayerInfo, b: PlayerInfo) => getExplodeHitRatio(a) - getExplodeHitRatio(b)
    },

    explodeWithRound: {
        show: (p: PlayerInfo) => Math.round(getExplodeWithRound(p) * 1000) / 1000,
        sort: (a: PlayerInfo, b: PlayerInfo) => getExplodeWithRound(a) - getExplodeWithRound(b)
    },

    score: {
        show: (p: PlayerInfo) => getPlayerScore(p),
        sort: (a: PlayerInfo, b: PlayerInfo) => getPlayerScore(a) - getPlayerScore(b)
    },
}




/**
 * 将倒霉数字的字典转换成数组
 * @param numbers 
 */
function badNumberMap2Array(numbers: Map<number, number>) {
    return Array.from(numbers.entries()).sort((a, b) => b[1] - a[1])
}


interface OneSave {
    str: string,
    f: (() => GamePlayers)
}

let emptyPlayerList = new GamePlayers()
let getNowPlayerList = () => game.playerList
let getTotalPlayerList = () => game.loadTotalPlayerInfo()
function getAllSaves() {
    let saves = game.getOldSaveKeys()
    state.saves = [{
        str: '总计',
        f: getTotalPlayerList
    }, {
        str: '当前',
        f: getNowPlayerList
    }, ...saves.map(save => {
        return {
            str: new Date(save.time).toLocaleDateString(),
            f: () => GameMain.loadPlayersInfo(save.key) ?? emptyPlayerList
        }
    })
    ]
}


const state = reactive({
    total: new PlayerInfo('', ''),
    saves: [] as OneSave[],
    currentSave: 1,
})

watch(() => vars.players.value,
    players => {
        let total = new PlayerInfo('', '')
        for (const p of players) {
            total.addInfo(p)
        }
        state.total = total
    },
    { immediate: true })



</script>

<style scoped>
.dialog {
    padding-bottom: 10px;
}

.dialog>* {
    margin: 40px 0;
}
</style>

<style>
.badnumbers-card {
    max-height: 100px;
    overflow: auto;
}
</style>