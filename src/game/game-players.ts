import { reactive, shallowReadonly, } from "vue"
import { randoms } from "../util/random-number"

/**
 * 十六进制秒级时间戳与十六进制16位随机数组合的字符串
 * @returns 
 */
function makePlayerUid() {
    return Math.floor(Date.now() / 1000).toString(16) + '-' + randoms.getOneInRange(Math.pow(2, 16)).toString(16)
}

export class PlayerInfo {
    readonly pid: string
    /** 玩家的名字 */
    name: string

    /** 引爆地雷的总数量 */
    explodeCount: number = 0
    /** 倒霉数字的中奖记录 */
    badNumbers: Map<number, number> = new Map()
    /** 倒霉数字中奖计数 */
    badNumberCount: number = 0

    /** 玩家经过的回合次数 */
    roundCount: number = 0

    /** 玩家是否正在游玩 */
    isPlaying: boolean = false

    constructor(name: string, pid = makePlayerUid()) {
        this.name = name
        this.pid = pid
    }


    /**
     * 将另一个玩家的参数累加到自己分数信息中
     * @param player 
     */
    addInfo(player: PlayerInfo) {
        this.explodeCount += player.explodeCount
        this.roundCount += player.roundCount
        this.badNumberCount += player.badNumberCount
        for (const [k, v] of player.badNumbers) {
            this.badNumbers.set(k, (this.badNumbers.get(k) ?? 0) + v)
        }
    }

    /**
     * 添加一个命中的倒霉数字
     * @param num 
     * @returns 
     */
    addBadNumber(num: number) {
        let n = (this.badNumbers.get(num) ?? 0) + 1
        this.badNumbers.set(num, n)
        this.badNumberCount++
        return n
    }

    /** 浅克隆玩家信息 */
    shallowClone() {
        const player = new PlayerInfo(this.name, this.pid)
        player.explodeCount = this.explodeCount
        player.badNumbers = this.badNumbers
        player.roundCount = this.roundCount
        player.isPlaying = this.isPlaying
        return player
    }

}




export class GamePlayers {
    private state = reactive({
        players: new Array<PlayerInfo>(),
        currentPlayer: null as (PlayerInfo | null)
    })



    /**
     * 在列表中搜索下一个正在游玩的玩家
     * @param players 
     * @param startPlayer 
     * @returns 
     */
    static findNextPlayingPlayer(players: PlayerInfo[], startPlayer: PlayerInfo | null = null): PlayerInfo | null {
        // 特殊处理
        if (players.length == 0) return null
        else if (players.length == 1) return players[0]


        // 确定起始位置
        let startI = 0
        if (startPlayer instanceof PlayerInfo) {
            startI = players.findIndex(p => p.pid == startPlayer.pid)
            if (startI < 0) startI = 0
        }

        // 搜索下一个
        for (let i = 1; i < players.length; i++) {
            let p = players[(startI + i) % players.length]
            if (p.isPlaying) return p
        }
        return null
    }

    private findNextPlayingPlayer(startPlayer: PlayerInfo | null = null): PlayerInfo | null {
        return GamePlayers.findNextPlayingPlayer(this.state.players, startPlayer)
    }


    /**
     * 切换游戏的玩家列表
     * @param players 
     */
    changePlayers(players: PlayerInfo[]) {
        let st = new Set<string>()
        this.state.players = players.filter(p => {
            if (st.has(p.pid)) return
            st.add(p.pid)
            return true
        })
        if (this.state.currentPlayer == null) this.state.currentPlayer = this.findNextPlayingPlayer()
        else if (!this.state.currentPlayer.isPlaying) this.state.currentPlayer = this.findNextPlayingPlayer(this.state.currentPlayer)
    }

    changeCurrentPlayer(player: PlayerInfo | null) {
        if (player != null) {
            let p = this.state.players.find(p => p.pid == player.pid) ?? null
            this.state.currentPlayer = p?.isPlaying ? p : null
        } else {
            this.state.currentPlayer = null
        }
    }

    /**
     * 获取游戏的玩家列表
     * @returns 
     */
    get players() {
        return shallowReadonly(this.state.players)
    }


    /**
     * 当前选择的正在游戏中的玩家
     */
    get currentPlayer() {
        return this.state.currentPlayer
    }

    /**
     * 选择下一个正在游戏中的玩家
     */
    nextPlayer() {
        this.state.currentPlayer = this.findNextPlayingPlayer(this.currentPlayer)
        return this.state.currentPlayer
    }


}