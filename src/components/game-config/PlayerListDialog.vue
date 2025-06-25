<template>
    <el-dialog v-model="model" title="玩家列表" width="80%" @open="updateTempPlayerList()" :append-to-body="true"
        top="10vh">
        <el-table :data="state.tempPlayers" style="width: 100%;" ref="table" max-height="70vh"
            :row-class-name="tableRowClassName">

            <el-table-column align="center" type="selection" width="40" />
            <el-table-column align="center" type="index" width="80" label="序号" />

            <el-table-column align="center" prop="pid" label="标识符" width="180" />

            <el-table-column prop="name" label="名称" />

            <el-table-column label="状态" #default="tableData" width="200">
                <el-space :size="5">
                    <el-tag v-if="isPlaying(tableData.row)" type="primary">游戏中</el-tag>
                    <el-tag v-if="isCurrentPlayer(tableData.row)" type="success">待选择</el-tag></el-space>
            </el-table-column>
            <template #empty>
                <el-empty :image-size="60" description="无玩家" />
            </template>
        </el-table>


        <template #footer>
            <div class="dialog-footer" style="line-height: 40px;">

                <template v-if="state.buttonBarStatus == 0">
                    <el-button title="不保存退出" @pointerdown="cancelUpdatePlayers()">取消</el-button>
                    <el-button title="保存并退出" @pointerdown="updatePlayers()">保存</el-button>
                </template>

                <template v-if="state.buttonBarStatus == 1">
                    <el-button title="添加一个玩家到列表中" @pointerdown="addPlayer()">新增</el-button>
                    <el-button title="修改选择的第一个玩家的名字" @pointerdown="renamePlayer()">改名</el-button>
                    <el-button title="移除所有选择的玩家" @pointerdown="removePlayer()">移除</el-button>
                    <el-button title="移除所有玩家" @pointerdown="removeAllPlayer()">移除所有</el-button>
                </template>

                <template v-if="state.buttonBarStatus == 2">
                    <el-button title="将第一个参与玩家选作待选玩家" @pointerdown="updateCurrentPlayer()">待选玩家</el-button>
                    <el-button title="将选择的所有玩家切换参与/未参与状态" @pointerdown="togglePlayingPlayers()">切换参与</el-button>
                </template>

                <template v-if="state.buttonBarStatus == 3">
                    <el-input-number v-model="state.moveNumber" style="margin-right: 20px;" :step="100" />
                    <el-button title="移动选择的玩家指定步数" @pointerdown="movePlayer(state.moveNumber)">移动玩家</el-button>
                    <el-button title="移动选择的玩家固定步数" @pointerdown="movePlayer(1)">下1</el-button>
                    <el-button title="移动选择的玩家固定步数" @pointerdown="movePlayer(-1)">上1</el-button>
                    <el-button title="移动选择的玩家固定步数" @pointerdown="movePlayer(5)">下5</el-button>
                    <el-button title="移动选择的玩家固定步数" @pointerdown="movePlayer(-5)">上5</el-button>
                    <el-button title="移动选择的玩家固定步数" @pointerdown="movePlayer(-5)">上5</el-button>
                    <el-button title="让正在游玩的玩家靠前" @pointerdown="sortPlayerListByStatus()">游玩靠前</el-button>
                </template>
                <el-button circle :icon="Switch" @pointerdown="switchButtons()" :title="siwtchButtonTitle" />
            </div>
        </template>
    </el-dialog>
</template>



<script setup lang="ts">
import { GameMain } from '../../game/game-main'
import { computed, nextTick, reactive, useTemplateRef } from 'vue'
import { GamePlayers, PlayerInfo } from '../../game/game-players'
import { ElMessage, ElMessageBox, ElTable, ElDialog } from 'element-plus'
import { Switch } from '@element-plus/icons-vue'

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
const tableElement = useTemplateRef('table')
const state = reactive({
    tempPlayers: new Array<PlayerInfo>(),
    tempCurrentPlayer: null as PlayerInfo | null,

    buttonBarStatus: 0,
    moveNumber: 100
})

const titles = ['默认', '增删改', '状态切换', '按钮状态']
const siwtchButtonTitle = computed(() => titles[state.buttonBarStatus])
function switchButtons() {
    state.buttonBarStatus = (state.buttonBarStatus + 1) % titles.length
}


/** 浅克隆当前的玩家列表 */
function updateTempPlayerList() {
    state.tempPlayers = [...game.players.players.map(p => p.shallowClone())]
    const currenPlayer = game.players.currentPlayer
    state.tempCurrentPlayer = state.tempPlayers.find(p => p.pid == currenPlayer?.pid) ?? null
    console.log(state.tempPlayers)
}

/** 根据玩家状态设置行类名 */
function tableRowClassName(rowInfo: { row: PlayerInfo }) {
    if (!rowInfo.row.isPlaying) return ''

    if (rowInfo.row.pid == state.tempCurrentPlayer?.pid) return 'current-player-row'
    return 'playing-row'
}

/** 判断正在游玩 */
function isPlaying(player: PlayerInfo) {
    return player.isPlaying
}

/** 判断待选择玩家 */
function isCurrentPlayer(player: PlayerInfo) {
    return player.pid == state.tempCurrentPlayer?.pid
}


/** 临时重命名玩家 */
async function renamePlayer() {
    const players = tableElement.value?.getSelectionRows() as PlayerInfo[] | null
    if (!players || players.length == 0) return
    let player = players[0]

    try {
        let pr = await ElMessageBox.prompt(`重命名@${player.name}`,
            {
                inputValidator: (v) => {
                    if (v.trim().length <= 0) return '空名称'
                    if (player.name == v) return '未改名'
                    return true
                },
                confirmButtonText: '提交',
                cancelButtonText: '取消',
                inputValue: player.name
            }
        )
        player.name = pr.value
        tableElement.value?.toggleRowSelection(player, false)
    } catch {
        ElMessage({
            type: 'info',
            message: '取消重命名',
        })
    }
}

/** 临时移除玩家 */
function removePlayer() {
    const selectPlayers = tableElement.value?.getSelectionRows() as PlayerInfo[] | null
    if (!selectPlayers || selectPlayers.length == 0) return

    let filterPlayers = state.tempPlayers.filter(p => {
        if (selectPlayers.indexOf(p) == -1) return true
        p.isPlaying = false
    })
    state.tempCurrentPlayer = GamePlayers.findNextPlayingPlayer(state.tempPlayers, state.tempCurrentPlayer)
    state.tempPlayers = filterPlayers
}

/** 临时移除所有玩家 */
async function removeAllPlayer() {
    try {
        await ElMessageBox.confirm('你确定要删除所有的玩家？', {
            confirmButtonText: '提交',
            cancelButtonText: '取消',
        })
        state.tempPlayers = []
        state.tempCurrentPlayer = null
    } catch {
        ElMessage({
            type: 'info',
            message: '取消删除所有玩家',
        })
    }
}

/** 临时新增玩家 */
async function addPlayer() {
    try {
        let pr = await ElMessageBox.prompt(`添加玩家`,
            {
                inputValidator: (v) => {
                    if (v.trim().length <= 0) return '空名称'
                    return true
                },
                confirmButtonText: '提交',
                cancelButtonText: '取消',
                inputValue: '路人甲'
            }
        )
        state.tempPlayers.push(new PlayerInfo(pr.value))
    } catch {
        ElMessage({
            type: 'info',
            message: '取消添加玩家',
        })
    }
}

/** 临时切换游戏玩家的游戏状态 */
function togglePlayingPlayers() {
    const table = tableElement.value
    if (table == null) return
    const selectPlayers = table.getSelectionRows() as PlayerInfo[]
    if (!selectPlayers || selectPlayers.length == 0) return

    for (const p of selectPlayers) {
        p.isPlaying = !p.isPlaying
        table.toggleRowSelection(p, false)
    }


    if (state.tempCurrentPlayer == null || !state.tempCurrentPlayer.isPlaying) {
        state.tempCurrentPlayer = GamePlayers.findNextPlayingPlayer(state.tempPlayers, state.tempCurrentPlayer)
    }
}

/** 更新当前玩家 */
function updateCurrentPlayer() {
    const table = tableElement.value
    if (table == null) return
    const players = table.getSelectionRows() as PlayerInfo[]

    for (const player of players) {
        table.toggleRowSelection(player)
        if (!player.isPlaying || player.pid == state.tempCurrentPlayer?.pid) continue
        state.tempCurrentPlayer = player
        return
    }
}

/** 移动玩家位置 */
function movePlayer(moveNumber: number) {
    if (moveNumber == 0) return
    const table = tableElement.value
    if (!table) return

    const selectPlayers = table.getSelectionRows() as PlayerInfo[]
    if (selectPlayers.length == 0) return

    // 创建选中行集合便于快速查找
    const selectedSet = new Set(selectPlayers)

    // 分离非选中行和选中行，并记录选中行前非选中行数
    const nonSelected: PlayerInfo[] = []
    const selectedInfo: { p: PlayerInfo, pre: number }[] = []

    for (const p of state.tempPlayers) {
        if (selectedSet.has(p))
            selectedInfo.push({ p: p, pre: nonSelected.length })
        else
            nonSelected.push(p)
    }

    // 创建插入位置映射
    const insertions: PlayerInfo[][] = Array.from({ length: nonSelected.length + 1 }).map(() => [])

    // 计算每个选中行的插入位置
    selectedInfo.forEach(info => {
        let insertPos = info.pre + moveNumber
        insertPos = Math.max(0, Math.min(insertPos, nonSelected.length))
        insertions[insertPos].push(info.p)
    })

    // 构建新数组
    const newPlayers: PlayerInfo[] = []
    for (let i = 0; i < nonSelected.length; i++) {
        newPlayers.push(...insertions[i])
        newPlayers.push(nonSelected[i])
    }
    newPlayers.push(...insertions[nonSelected.length])

    state.tempPlayers = newPlayers

    // 恢复选中状态
    nextTick(() => {
        selectPlayers.forEach(p => table.toggleRowSelection(p, true))
    })
}


/** 根据玩家的状态重新排序 */
function sortPlayerListByStatus() {
    const table = tableElement.value
    if (!table) return

    const selectPlayers = table.getSelectionRows() as PlayerInfo[]

    state.tempPlayers = state.tempPlayers.sort((a, b) => (a.isPlaying ? -1 : 1) - (b.isPlaying ? -1 : 1))


    // 恢复选中状态
    nextTick(() => {
        selectPlayers.forEach(p => table.toggleRowSelection(p, true))
    })
}

/** 不应用临时更改 */
function cancelUpdatePlayers() {
    model.value = false
    ElMessage({ type: 'info', message: '玩家列表未更新' })
}

/** 应用临时更改 */
function updatePlayers() {
    model.value = false
    game.players.changePlayers(state.tempPlayers)
    game.players.changeCurrentPlayer(state.tempCurrentPlayer)
    console.log(game.players.players)
    console.log(game.players.currentPlayer)


    ElMessage({ type: 'success', message: '玩家列表已更新' })
}

</script>

<style>
.el-table .playing-row {
    --el-table-tr-bg-color: rgb(239.8, 248.9, 235.3);
}

.el-table .current-player-row {
    --el-table-tr-bg-color: rgb(224.6, 242.8, 215.6);
}
</style>