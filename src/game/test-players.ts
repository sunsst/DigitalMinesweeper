import { randoms } from "../util/random-number"
import type { GameMain } from "./game-main"
import { PlayerInfo } from "./game-players"

const names = ["小可爱", "青柠衬酸", "还未如愿", "打碎面具", "我又不是星星发什么光", "橘柚香", "谁敢勾我夫我必让她哭", "六句迷人诗", "ζ蔚蓝°", "___向日葵╮微笑", "可乐丶不渴", "ˇ起颩るㄝ", "爱你如初", "今世我陪你白发苍苍", "心亡泪凉っ", "漓殇う", "顏夕の未歌", "自娱自乐自我闹っ", "给劳资TMD滚！", "萌妹子不装萌 >。ヘ", "猫贪余温", "莫道红颜依何处", "中二癌晚期少年", "情话是骗子说傻子听的゛", "此籹子不需要谁来怜惜", "超级无敌小机智", "我不上你的当", "化蝶灬飞", "踏花游湖", "久孤", "余生长醉", "中毒的爱情", "肆无忌惮゛戒情戒爱づ", "九耀星璇", "不及眉间朱砂尽", "不规则的美╮", "范二姑涼歡樂多°", "巴黎铁塔上盛开的繁华 *", "    你的她貌美如狗~", "        珊瑚是深海的記憶ㄟ", "陌上﹏烟雨瑶", "感情最狗", "仙女提刀战情场", "只是小伤口用时间包扎", "抹茶少女", "住在白日梦里的小情人", "娇呻喘息", "感情废物", "岛屿失梦", "南幕影歇"]

export function setTestPlayers(game: GameMain, len: number) {
    randoms.disorderedArray(names)
    let players = names.slice(0, len).map(name => new PlayerInfo(name))

    // 正在游戏的玩家
    let n = Math.min(names.length, Math.floor((randoms.getOne() * 0.4 + 0.4) * len))
    for (let i = 0; i < n; i++) {
        players[i].isPlaying = true
    }


    randoms.disorderedArray(players)
    n = Math.floor((randoms.getOne() * 0.6 + 0.4) * len)

    for (let i = 0; i < n; i++) {
        const player = players[i]
        // 点击次数200内的随机值
        player.roundCount = Math.floor(200 * randoms.getOne() + 1)

        // 命中次数，控制在点击次数0.8以下
        let badNumbers = randoms.getMany(randoms.getOneInRange(player.roundCount * 0.8), r => Math.floor(r * game.gameState.total))
        for (const r of badNumbers) {
            player.addBadNumber(r)
        }

        // 引爆次数，控制在点击次数与棋盘总数的一半以下
        player.explodeCount = randoms.getMany(player.roundCount, r => Math.floor(r * game.gameState.total / 2)).reduce((v, n) => v + n)
    }

    randoms.disorderedArray(players)
    game.players.changePlayers(players)
}

