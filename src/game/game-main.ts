import { shallowReactive, shallowReadonly } from "vue"
import { randoms } from "../util/random-number"
import { defaultRendererOptions, GameRenderer, type GameRendererOption } from "./game-renderer"
import type { MineInfo } from "./game-mine"
import { GamePlayers } from "./game-players"


export type GameStatus = 'init' | 'busy' | 'idle' | 'end'



export class GameMain {
    readonly column: number
    /** 地雷列表 */
    private mines: MineInfo[]
    /** 游戏渲染器 */
    private renderer: GameRenderer
    /** 游戏玩家列表 */
    private gamePlayers = new GamePlayers()
    /** 倒霉数字 */
    private badNumber: number


    private state = shallowReactive({
        /** 游戏的状态 */
        gameStatus: 'init' as GameStatus,
        /** 未爆炸的地雷数量 */
        totalUnexplodeMine: 0
    })

    /** 返回当前回合的玩家 */
    getNowPlayer = this.gamePlayers.getNowPlayer.bind(this.gamePlayers)

    /**
     * 游戏主类
     * @param column 棋盘的列数
     * @param total 棋盘地雷总数
     * @param rendererOption 渲染器选项
     */
    constructor(column: number = 10, total: number = 100, rendererOption: GameRendererOption = defaultRendererOptions) {
        this.column = column

        this.mines = Array.from({ length: total }).map((_, n) => {
            return {
                num: n,
                x: n % column,
                y: Math.floor(n / column),
                exploded: false,
            }
        })

        this.renderer = new GameRenderer(this.mines, rendererOption)
        this.renderer.onClickMine = this.onClickMine.bind(this)

        this.badNumber = randoms.getOneInRange(total)

        this.state.totalUnexplodeMine = total
    }

    /**
     * 游戏画布
     */
    get canvas() {
        return this.renderer.canvas
    }

    /**
     * 游戏的一些状态
     */
    get gameState() {
        return shallowReadonly(this.state)
    }

    /**
     * 使用该方法初始化后再调用其它方法
     */
    async init() {
        await this.renderer.init()
        this.newGame()
    }


    /**
     * 新开一局游戏
     */
    newGame() {
        this.state.gameStatus = 'init'

        for (const m of this.mines) m.exploded = false
        this.renderer.resetAllMines()

        this.state.totalUnexplodeMine = this.mines.length
        this.badNumber = randoms.getOneInRange(this.mines.length)

        this.state.gameStatus = 'idle'
        console.log(`新游戏倒霉数字：${this.badNumber}`)
    }

    private async onClickMine(mineNum: number) {
        if (mineNum < 0 || mineNum > this.mines.length) {
            console.log('此次点击无效：地雷ID无效', mineNum)
            return
        }
        const player = this.gamePlayers.getNowPlayer()
        if (!player) {
            console.log('此次点击无效：当前无玩家', player)
            return
        }
        if (this.state.gameStatus != 'idle') {
            console.log('此次点击无效：当前游戏状态正忙', this.state.gameStatus)
            return
        }
        this.state.gameStatus = 'busy'



        // 统计前后数量
        const before: number[] = [], after: number[] = []
        for (const mine of this.mines) {
            if (mine.exploded) continue
            if (mine.num < mineNum) before.push(mine.num)
            else if (mine.num > mineNum) after.push(mine.num)
        }

        // 计算爆炸结果
        const chooseBefore = before.length == after.length ? (randoms.getOne() < 0.5) : (before.length < after.length)
        const selectMineIds = [mineNum, ...(chooseBefore ? before.reverse() : after)]
        for (const id of selectMineIds) this.mines[id].exploded = true
        const end = selectMineIds.indexOf(this.badNumber) != -1



        // 统计信息
        if (selectMineIds.indexOf(this.badNumber)) {
            player.badNumbers.set(this.badNumber, (player.badNumbers.get(this.badNumber) ?? 0) + 1)
        }
        console.log('此次点击：', { '玩家': player, '点击位置': mineNum, '引爆的地雷': selectMineIds })

        // 演出效果
        await this.renderer.explodeMines(...selectMineIds)
        // 爆炸计数
        player.explodeCount += selectMineIds.length
        this.state.totalUnexplodeMine -= selectMineIds.length

        if (end) {
            await this.renderer.explodeMines(...randoms.disorderedArray(this.mines.filter(m => !m.exploded).map(m => m.num)))
            await new Promise(res => setTimeout(res, 500)) //等待500ms后继续

            this.renderer.showBadMine(this.badNumber)
            this.state.gameStatus = 'end'

            // 游戏结束后统计
            for (const p of this.gamePlayers.players) p.gameCount++
            player.addBadNumber(this.badNumber)
        } else {
            this.gamePlayers.nextPlayer()
            this.state.gameStatus = 'idle'
        }
    }
}

