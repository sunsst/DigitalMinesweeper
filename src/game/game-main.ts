import { reactive, readonly, shallowReadonly } from "vue"
import { randoms } from "../util/random-number"
import { defaultRendererOptions, GameRenderer, type GameRendererOption } from "./game-renderer"
import type { MineInfo } from "./game-mine"
import { GamePlayers } from "./game-players"


export type GameStatus = 'init' | 'busy' | 'idle' | 'end'

interface Step {
    total: number
    explodeNumbers: number[]
    badNumber: number | null
    pid: string
}


const dateStringRe = /mine-save-([0-9]{4}-[0-9]{2}-[0-9]{2})/
function getDateString() {
    let date = new Date()
    return `mine-save-${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${(date.getDate()).toString().padStart(2, '0')}`
}

const oldTotalSaveKey = 'old-total-save'

function parseDateString(str: string) {
    let r = dateStringRe.exec(str)
    if (r == null) return null
    let t = Date.parse(r[1])
    return Number.isNaN(t) ? null : t
}

function getAllSaveKyes() {
    let saveKeys = []
    for (let i = 0; i < localStorage.length; i++) {
        let k = localStorage.key(i)
        if (k == null) continue
        let time = parseDateString(k)
        if (time == null) continue
        saveKeys.push({
            key: k,
            time: time
        })
    }
    return saveKeys.sort((a, b) => b.time - a.time)
}

export class GameMain {
    /** 地雷列表 */
    private mines: MineInfo[] = []
    /** 游戏渲染器 */
    private renderer: GameRenderer
    /** 游戏玩家列表 */
    readonly playerList = new GamePlayers()
    /** 倒霉数字 */
    private badNumber: number = 0
    /** 游戏步骤记录 */
    private steps: Step[] = []
    /** 游戏开始每局游戏进行一次临时备份用于回溯 */
    private backupAtStart: any = null

    private state = reactive({
        /** 游戏的状态 */
        gameStatus: 'init' as GameStatus,
        /** 未爆炸的地雷数量 */
        unexplodeCount: 0,
        /** 列数 */
        column: 0,
        /** 总数 */
        total: 0,
        /** 就存档最大数量 */
        oldSaveMaxNum: 3,
        /** 渲染器选项 */
        rendererOption: readonly(defaultRendererOptions),
        /** 保存时用到的日期字符串 */
        dateStr: getDateString(),
    })

    /**
     * 游戏的主类
     * @param column 棋盘的列数
     * @param total 棋盘的地雷总数
     * @param rendererOption 渲染器选项
     */
    constructor(column: number = 10, total: number = 100, rendererOption: GameRendererOption = defaultRendererOptions) {
        this.renderer = new GameRenderer([])
        this.renderer.onClickMine = this.onClickMine.bind(this)
        this.changeOption(column, total, rendererOption)

        let saves = getAllSaveKyes()
        if (saves.length > 0) {
            let k = saves[0].key
            this.loadGameSave(k)

            if (k != this.state.dateStr) this.playerList.clearScore()
        }
    }




    /**
     * 加载一个存档的玩家信息
     * @param k 
     * @returns 
     */
    static loadPlayersInfo(k: string) {
        try {
            let v = localStorage.getItem(k)
            if (v == null) return null
            let saveObj = JSON.parse(v)
            if (typeof (saveObj) != 'object' || typeof (saveObj.playerList) != 'object') return null
            let players = new GamePlayers()
            players.fromObj(saveObj.playerList)
            console.log(k, '玩家列表加载完成')
            return players
        } catch (e) {
            console.log('加载玩家信息时出现错误：', e)
            return null
        }
    }

    /**
     * 获取所有不含自身的旧存档键名
     * @returns 
     */
    getOldSaveKeys() {
        let keys = getAllSaveKyes().filter(save => {
            return save.key != this.state.dateStr
        })
        return keys
    }


    /**
     * 加载当前所有玩家信息
     */
    loadTotalPlayerInfo() {
        let oldSaves = this.getOldSaveKeys().map(k => GameMain.loadPlayersInfo(k.key))
        oldSaves.push(GameMain.loadOldTotalPlayerInfo())
        return GamePlayers.merge(this.playerList, ...oldSaves.filter(s => s != null))
    }

    /**
     * 加载已删除旧存档的总合信息
     * @returns 
     */
    private static loadOldTotalPlayerInfo() {
        try {
            let v = localStorage.getItem(oldTotalSaveKey)
            if (v == null) return null
            let saveObj = JSON.parse(v)
            if (typeof (saveObj) != 'object') return null
            let players = new GamePlayers()
            players.fromObj(saveObj.playerList)
            return players
        } catch (e) {
            return null
        }
    }

    /**
     * 清理所有存档只保留玩家信息
     */
    clearAllSaves() {
        localStorage.removeItem(oldTotalSaveKey)
        for (const k of getAllSaveKyes()) {
            localStorage.removeItem(k.key)
        }
        this.playerList.clearScore()
        this.newGame()
        this.saveGameNow()
    }

    /**
     * 一个固定名称的存档用来保存已删除旧存档的总合信息
     * @param players 
     */
    private static saveOldTotalPlayerInfo(players: GamePlayers) {
        let oldTotalPlayerList = GameMain.loadOldTotalPlayerInfo()
        if (oldTotalPlayerList == null) {
            localStorage.setItem(oldTotalSaveKey, JSON.stringify(players.toObj()))
        } else {
            let mergeList = GamePlayers.merge(oldTotalPlayerList, players)
            localStorage.setItem(oldTotalSaveKey, JSON.stringify(mergeList.toObj()))
        }
    }

    /**
     * 加载游戏存档
     * @param k 
     * @param loadPlayer 
     * @returns 
     */
    private loadGameSave(k: string, loadPlayer = true) {
        try {
            let v = localStorage.getItem(k)
            if (v == null) return false
            let saveObj = JSON.parse(v)
            if (typeof (saveObj) != 'object') return false
            console.log(k, '存档加载完成')
            this.fromObj(saveObj, loadPlayer)
        } catch (e) {
            console.log('加载存档时出现错误：', e)
            return false
        }
        return true
    }

    /**
     * 直接保存当前游戏
     */
    saveGameNow() {
        this.saveGame(this.state.oldSaveMaxNum)
    }

    /**
     * 保存一个游戏存档
     * @param oldSaveMaxNum 
     * @returns 
     */
    private saveGame(oldSaveMaxNum: number) {
        oldSaveMaxNum = Math.max(0, oldSaveMaxNum)
        try {
            let obj = this.toObj()
            localStorage.setItem(this.state.dateStr, JSON.stringify(obj))

            /** 隔夜重新积分 */
            let newDate = getDateString()
            if (newDate != this.state.dateStr) {
                this.state.dateStr = newDate
                this.playerList.clearScore()
            }

            /** 删除过旧的存档 */
            let keys = this.getOldSaveKeys()
            keys = keys.splice(oldSaveMaxNum)
            for (const key of keys) {
                let p = GameMain.loadPlayersInfo(key.key)
                localStorage.removeItem(key.key)
                if (p) GameMain.saveOldTotalPlayerInfo(p)
            }
            console.log(this.state.dateStr, '已存档')
            return true
        } catch (e) {
            console.log('保存存档时出现错误：', e)
            return false
        }
    }

    /**
     * 正式使用前请调用该初始化方法
     */
    async init() {
        if (!this.renderer.inited) {
            await this.renderer.init()
            this.renderer.resetAllMines(this.mines)
        }
    }

    /**
     * 修改游戏配置项
     * @param column 棋盘的列数
     * @param total 棋盘的地雷总数
     * @param rendererOption 渲染器选项
     */
    changeOption(column: number = 10, total: number = 100, rendererOption: GameRendererOption = defaultRendererOptions) {
        this.state.column = column
        this.state.total = total
        this.state.rendererOption = readonly(rendererOption)

        this.mines = Array.from({ length: total }).map((_, n) => {
            return {
                num: n,
                x: n % column,
                y: Math.floor(n / column),
                exploded: false,
            }
        })

        this.renderer.changeOption(this.mines, rendererOption)

        this.badNumber = randoms.getOneInRange(total)

        this.state.unexplodeCount = total

        this.newGame()
    }

    /**
     * 获取游戏渲染器画布元素，在未初始化前是null
     */
    get canavas() {
        return this.renderer.canvas
    }

    /**
     * 游戏的一些状态
     */
    get gameState() {
        return shallowReadonly(this.state)
    }


    /**
     * 新开一局游戏
     */
    newGame() {
        this.state.gameStatus = 'init'

        for (const m of this.mines) m.exploded = false
        this.renderer.resetAllMines(this.mines)

        this.state.unexplodeCount = this.mines.length
        this.state.gameStatus = 'idle'

        this.updateBadNumber()

        this.steps = []

    }

    private updateBadNumber() {
        let arr = this.mines.filter(m => !m.exploded)
        if (arr.length == 0) return
        this.badNumber = arr[randoms.getOneInRange(arr.length)].num
        console.log(`新游戏倒霉数字：${this.badNumber}`)

    }

    /**
     * 将游戏状态回滚到指定步数之前的状态
     * @param stepsBack 要回退的步数（从当前状态向前回溯），设置为负数则回退所有步骤
     * @returns 
     */
    rollbackSteps(stepsBack: number = 1): { before: number, after: number } {


        let res = {
            before: this.steps.length,
            after: this.steps.length
        }

        if (!this.backupAtStart || stepsBack == 0) return res

        // 回退到初始状态
        let steps = this.steps
        this.fromObj(this.backupAtStart)
        this.steps = steps

        // 调整数组
        for (let i = 0; i < this.steps.length; i++) {
            if (this.steps[i].total != this.mines.length) {
                this.steps = this.steps.slice(0, i)
                console.log(111)

                break
            }
            if (this.steps[i].badNumber != null) {
                this.steps = this.steps.slice(0, i + 1)
                console.log(222)

                break
            }
        }



        // 不恢复步骤
        if (stepsBack < 0) {
            this.steps = []
            stepsBack = 1
        }

        // 当前的状态是steps+1步，但还未点击
        // 回退一步则是回退到steps最后一步，且还未点击
        let n = Math.max(0, this.steps.length - stepsBack + 1)
        for (let i = 0; i < n; i++) {
            let step = this.steps[i]


            // 最后一步不需要爆炸
            if (i + 1 == n) {
                const player = this.playerList.players.find(p => step.pid == p.pid)
                if (player != null)
                    this.playerList.changeCurrentPlayer(player)
                continue
            }


            // 恢复已爆炸的地雷
            for (const mineNum of step.explodeNumbers) {
                this.mines[mineNum].exploded = true
            }

            // 恢复玩家状态
            const player = this.playerList.players.find(p => step.pid == p.pid)
            if (player) {
                player.explodeCount += step.explodeNumbers.length
                player.roundCount++
            }

        }
        res.after = n - 1
        this.steps = this.steps.slice(0, n - 1)
        this.renderer.resetAllMines(this.mines)

        return res
    }


    private async onClickMine(mineNum: number) {
        if (mineNum < 0 || mineNum > this.mines.length) {
            console.log('此次点击无效：地雷ID无效', mineNum)
            return
        }
        const player = this.playerList.currentPlayer
        if (!player) {
            console.log('此次点击无效：当前无玩家', player)
            return
        }
        if (this.state.gameStatus != 'idle') {
            console.log('此次点击无效：当前游戏状态正忙', this.state.gameStatus)
            return
        }
        this.state.gameStatus = 'busy'

        // 进行初次备份
        if (this.steps.length == 0) this.backupAtStart = this.toObj()

        // 统计前后数量
        const before: number[] = [], after: number[] = []
        for (const mine of this.mines) {
            if (mine.exploded) continue
            if (mine.num < mineNum) before.push(mine.num)
            else if (mine.num > mineNum) after.push(mine.num)
        }

        // 计算爆炸结果
        const chooseBefore = before.length == after.length ? (randoms.getOne() < 0.5) : (before.length < after.length)
        const explodeMineNums = [mineNum, ...(chooseBefore ? before.reverse() : after)]
        for (const id of explodeMineNums) this.mines[id].exploded = true
        const end = explodeMineNums.indexOf(this.badNumber) != -1



        // 统计信息
        console.log('此次点击：', { '玩家': player, '点击位置': mineNum, '引爆的地雷': explodeMineNums })
        const step = {
            badNumber: end ? this.badNumber : null,
            explodeNumbers: explodeMineNums,
            pid: player.pid,
            total: this.state.total
        }
        this.steps.push(step)
        if (end)
            player.addBadNumber(this.badNumber)
        player.explodeCount += explodeMineNums.length
        player.roundCount++
        this.playerList.refreshPlayers()


        // 演出效果
        await this.renderer.explodeMines(...explodeMineNums)
        this.state.unexplodeCount -= explodeMineNums.length
        if (end) {
            await this.renderer.explodeMines(...randoms.disorderedArray(this.mines.filter(m => !m.exploded).map(m => m.num)))
            await new Promise(res => setTimeout(res, 500)) //等待500ms后继续

            this.renderer.showBadMine(this.badNumber)
            this.state.gameStatus = 'end'
        } else {
            this.playerList.setNextCurrentPlayer()
            this.state.gameStatus = 'idle'
        }
    }



    toObj() {
        return {
            state: {
                column: this.state.column,
                total: this.state.total,
                rendererOption: this.state.rendererOption
            },
            playerList: this.playerList.toObj(),
        }
    }

    fromObj(obj: any, loadPlayer = true) {
        // 恢复地雷状态
        this.changeOption(obj.state.column, obj.state.total, obj.state.rendererOption)

        // 恢复玩家状态
        if (loadPlayer)
            this.playerList.fromObj(obj.playerList)

        // 重置渲染器
        this.renderer.resetAllMines(this.mines)
    }
}

