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


    /**
     * 将玩家的分数信息归零
     */
    clearScore() {
        this.explodeCount = 0
        this.badNumbers.clear()
        this.roundCount = 0
        this.badNumberCount = 0
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
        else if (players.length == 1) return players[0].isPlaying ? players[0] : null


        // 确定起始位置
        let startI = 0, i = 0
        if (startPlayer instanceof PlayerInfo) {
            let rI = players.findIndex(p => p.pid == startPlayer.pid)
            // 当找到时跳过找到的那个
            if (rI >= 0) {
                startI = rI
                i = 1
            }
        }


        // 搜索下一个
        for (; i < players.length; i++) {
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

    /** 切换当前回合的玩家 */
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
     * 当修改了玩家信息后调用该方法触发列表更新
     */
    refreshPlayers() {
        this.state.players = [...this.state.players]
    }


    /**
     * 当前选择的正在游戏中的玩家
     */
    get currentPlayer() {
        return this.state.currentPlayer
    }

    /**
     * 设置为下一个正在游戏中的玩家
     * @returns 
     */
    setNextCurrentPlayer() {
        this.state.currentPlayer = this.findNextPlayingPlayer(this.currentPlayer)
        return this.state.currentPlayer
    }

    /**
     * 设置为第一个游戏中的玩家
     * @returns 
     */
    setFirstCurrentPlayer() {
        this.state.currentPlayer = this.findNextPlayingPlayer(null)
        return this.state.currentPlayer
    }

    clearScore() {
        for (const player of this.players) {
            player.clearScore()
        }
        this.refreshPlayers()
    }

    toObj() {
        return {
            players: this.state.players.map(player => ({
                pid: player.pid,
                name: player.name,
                explodeCount: player.explodeCount,
                badNumbers: Array.from(player.badNumbers.entries()),
                badNumberCount: player.badNumberCount,
                roundCount: player.roundCount,
                isPlaying: player.isPlaying
            })),
            currentPlayerPid: this.state.currentPlayer?.pid || null
        }
    }

    fromObj(obj: any) {
        this.state.players = obj.players.map((p: any) => {
            const player = new PlayerInfo(p.name, p.pid)
            player.explodeCount = p.explodeCount
            player.badNumbers = new Map(p.badNumbers)
            player.badNumberCount = p.badNumberCount
            player.roundCount = p.roundCount
            player.isPlaying = p.isPlaying
            return player
        })

        this.state.currentPlayer = obj.currentPlayerPid
            ? this.state.players.find(p => p.pid === obj.currentPlayerPid) || null
            : null
    }



    /**
     * 合并多个玩家列表
     * @param gamePlayers 
     * @returns 
     */
    static merge(...gamePlayers: (GamePlayers)[]) {
        let players: PlayerInfo[] = []
        let pid2index: Map<string, number> = new Map()
        for (const gp of gamePlayers) {
            for (const p of gp.players) {
                let index = pid2index.get(p.pid)
                if (index == null) {
                    index = players.length
                    pid2index.set(p.pid, index)
                    players.push(new PlayerInfo(p.name, p.pid))
                }
                players[index].addInfo(p)
            }
        }
        let gp = new GamePlayers()
        gp.changePlayers(players)
        return gp
    }
}