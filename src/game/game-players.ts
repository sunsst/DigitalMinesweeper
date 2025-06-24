import { shallowReactive, shallowReadonly, } from "vue"
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
    /** 完整体验过的游戏局数 */
    gameCount: number = 0

    /** 玩家是否正在游玩 */
    isPlaying: boolean = false

    constructor(name: string, pid = makePlayerUid()) {
        this.name = name
        this.pid = pid
    }

    /**
     * 添加一个命中的倒霉数字
     * @param num 
     * @returns 
     */
    addBadNumber(num: number) {
        let n = (this.badNumbers.get(num) ?? 0) + 1
        this.badNumbers.set(num, n)
        return n
    }

    toJson() {
        return {
            pid: this.pid,
            name: this.name,
            explodeCount: this.explodeCount,
            badNumbers: Array.from(this.badNumbers.entries()),
            gameCount: this.gameCount,
            isPlaying: this.isPlaying
        }
    }

    /**
     * 从JSON数据反序列化
     * @param json 字符串或已解析的对象
     * @returns 成功返回PlayerInfo实例，失败返回null
     */
    static fromJson(json: string | object): PlayerInfo | null {
        try {
            // 如果是字符串则解析为对象
            const data = typeof json === 'string' ? JSON.parse(json) : json

            // 验证必要字段存在且类型正确
            if (!data ||
                typeof data.pid !== 'string' ||
                typeof data.name !== 'string' ||
                typeof data.explodeCount !== 'number' ||
                !Array.isArray(data.badNumbers) ||
                typeof data.gameCount !== 'number' ||
                typeof data.isPlaying !== 'boolean') {
                return null
            }

            // 创建实例
            const player = new PlayerInfo(data.name, data.pid)
            player.explodeCount = data.explodeCount
            player.gameCount = data.gameCount
            player.isPlaying = data.isPlaying

            // 转换Map类型
            if (Array.isArray(data.badNumbers)) {
                for (const entry of data.badNumbers) {
                    if (Array.isArray(entry) &&
                        entry.length === 2 &&
                        typeof entry[0] === 'number' &&
                        typeof entry[1] === 'number') {
                        player.badNumbers.set(entry[0], entry[1])
                    }
                }
            }

            return player
        } catch (error) {
            return null
        }
    }
}






export class GamePlayers {
    private state = shallowReactive({
        players: new Array<PlayerInfo>(),
        nowPlayer: null as (PlayerInfo | null)
    })

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
    }

    /**
     * 获取游戏的玩家列表
     * @returns 
     */
    get players() {
        return shallowReadonly(this.state.players)
    }


    /**
     * 搜索下一个正在游玩的玩家
     * @param startPlayer 
     * @returns 
     */
    private findNextPlayingPlayer(startPlayer: PlayerInfo | null = null): PlayerInfo | null {
        let players = this.state.players

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



    /**
     * 当前选择的正在游戏中的玩家
     */
    getNowPlayer() {
        if (this.state.nowPlayer == null) this.state.nowPlayer = this.findNextPlayingPlayer()
        else if (!this.state.nowPlayer.isPlaying) this.state.nowPlayer = this.findNextPlayingPlayer(this.state.nowPlayer)
        return this.state.nowPlayer
    }

    /**
     * 选择下一个正在游戏中的玩家
     */
    nextPlayer() {
        this.state.nowPlayer = this.findNextPlayingPlayer(this.getNowPlayer())
        return this.state.nowPlayer
    }

    /**
   * 序列化为 JSON 可转换对象
   * @returns 
   */
    toJson() {
        return {
            players: this.state.players.map(player => player.toJson()),
            nowPlayerPid: this.state.nowPlayer?.pid || null
        }
    }

    /**
     * 从 JSON 数据反序列化
     * @param json 字符串或已解析的对象
     * @returns
     */
    static fromJson(json: string | object): GamePlayers {
        // 创建 GamePlayers 实例
        const gamePlayers = new GamePlayers()
        try {
            // 如果是字符串则解析为对象
            const data = typeof json === 'string' ? JSON.parse(json) : json

            // 验证必要字段存在且类型正确
            if (!data ||
                !Array.isArray(data.players) ||
                (data.nowPlayerPid !== null && typeof data.nowPlayerPid !== 'string')) {
                return gamePlayers
            }

            // 反序列化玩家列表
            const players: PlayerInfo[] = []
            for (const playerJson of data.players) {
                const player = PlayerInfo.fromJson(playerJson)
                if (player) {
                    players.push(player)
                }
            }

            // 更新玩家列表
            gamePlayers.changePlayers(players)

            // 设置当前玩家
            if (data.nowPlayerPid) {
                gamePlayers.state.nowPlayer = players.find(p => p.pid === data.nowPlayerPid) || null
            }

            return gamePlayers
        } catch (error) {
            return gamePlayers
        }
    }
}