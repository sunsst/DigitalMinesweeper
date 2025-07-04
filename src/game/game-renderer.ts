import { Application, Assets, Container, Sprite, Text } from "pixi.js"
import { randoms } from "../util/random-number"
import type { MineInfo } from "./game-mine"
import { playAudio } from "./game-audio"

/**
 * 该方法用于加载资源
 */
async function loadAssets() {
    const res = import.meta.glob("./res/*.svg", { eager: true })
    const manifest = {
        bundles: [
            {
                name: "mines",
                assets: Object.entries(res).map(e => {
                    return {
                        alias: e[0].slice('./res/'.length, -4),
                        src: (e[1] as any).default
                    }
                }
                ),
            },
        ],
    }

    await Assets.init({ manifest })
    await Assets.loadBundle('mines')


}

export interface GameRendererOption {
    /** 地雷精灵的大小 */
    mineSpriteSize: number
    /** 文本字体的大小 */
    fontSize: number
    /** 地雷精灵键空隙宽度 */
    space: number
}

/**
 * 默认的渲染器选项
 */
export const defaultRendererOptions: GameRendererOption = {
    mineSpriteSize: 48,
    fontSize: 12,
    space: 12
}

export class GameRenderer {
    /** 视口的宽度 */
    private width_: number = 600
    get width() { return this.width_ }
    /** 视口的高度 */
    private height_: number = 800
    get height() { return this.height_ }

    private app: Application

    /** 该容器用于放置地雷精灵 */
    private mineContainer: Container
    /** 该容器用于放置地雷序号文本 */
    private textContainer: Container
    /** 该容器用于放置特殊效果精灵 */
    private effectContainer: Container

    /** 地雷序号映射到地雷精灵的字典 */
    private mineNum2spriteMap: Map<number, Sprite>
    /** 地雷精灵Uid映射到地雷序号的字典 */
    private uid2MineNumMap: Map<number, number>

    /** 该回调函数将在某个地雷精灵被点击后触发，将传入点击地雷的序号 */
    onClickMine: (clickMineNumber: number) => void = () => { }


    /** 请使用工厂函数初始化 {@link newGameRenderer}  */
    constructor(allMineInfo: MineInfo[], opt: GameRendererOption = defaultRendererOptions) {
        // 初始化
        this.app = new Application()
        this.mineContainer = new Container({ x: 0, y: 0, pivot: { x: 0, y: 0 }, eventMode: 'static' })
        this.textContainer = new Container({ x: 0, y: 0, pivot: { x: 0, y: 0 } })
        this.effectContainer = new Container({ x: 0, y: 0, pivot: { x: 0, y: 0 }, zIndex: 10 })
        this.mineNum2spriteMap = new Map()
        this.uid2MineNumMap = new Map()

        // 添加元素
        this.app.stage.addChild(this.textContainer)
        this.app.stage.addChild(this.mineContainer)
        this.app.stage.addChild(this.effectContainer)

        // 监听点击事件
        this.mineContainer.on('pointerdown', async ev => {
            let n = this.uid2MineNumMap.get(ev.target.uid)
            if (n != null)
                this.onClickMine(n)
        })

        this.changeOption(allMineInfo, opt)
    }

    private inited_ = false

    /**
     * 初始化状态
     */
    get inited() {
        return this.inited_
    }


    /**
     * 游戏渲染器必须异步初始化一次
     */
    async init() {
        if (this.inited_) return
        await loadAssets()
        await this.app.init({
            width: this.width_,
            height: this.height_,
            background: "#FAFAFA"
        })
        this.inited_ = true
    }

    /** 
    * 获取渲染画布元素
    */
    get canvas() {
        return this.inited_ ? this.app.canvas : null
    }

    /**
     * 在使用前请初始化该方法
     * @param allMineInfo 要渲染的地雷信息
     * @param opt 渲染选项
     */
    changeOption(allMineInfo: MineInfo[], opt: GameRendererOption = defaultRendererOptions) {
        this.textContainer.removeChildren()
        this.mineContainer.removeChildren()
        this.effectContainer.removeChildren()


        // 生成并添加地雷元素
        let maxX = 0
        let maxY = 0
        for (const mineInfo of allMineInfo) {
            if (mineInfo.x > maxX) maxX = mineInfo.x
            if (mineInfo.y > maxY) maxY = mineInfo.y

            let x = mineInfo.x * (opt.space + opt.mineSpriteSize) + opt.space
            let y = mineInfo.y * (opt.mineSpriteSize + opt.fontSize + opt.space) + opt.space

            const mineSprite = new Sprite({ width: opt.mineSpriteSize, height: opt.mineSpriteSize, x: x, y: y })
            const numberText = new Text({ text: mineInfo.num + 1, style: { fontSize: opt.fontSize }, x: x, y: y + opt.mineSpriteSize })

            numberText.x = x + opt.mineSpriteSize / 2 - numberText.width / 2

            this.mineNum2spriteMap.set(mineInfo.num, mineSprite)
            this.uid2MineNumMap.set(mineSprite.uid, mineInfo.num)

            this.mineContainer.addChild(mineSprite)
            this.textContainer.addChild(numberText)
        }

        // 计算长宽
        this.width_ = (maxX + 1) * (opt.space + opt.mineSpriteSize) + opt.space
        this.height_ = (maxY + 1) * (opt.mineSpriteSize + opt.fontSize + opt.space) + opt.space

        if (this.inited_) {
            this.app.renderer.resize(this.width_, this.height_)
        }
    }




    /**
     * 重置地雷状态
     * @param sp 
     */
    private resetMine(sp: Sprite) {
        sp.visible = true
        sp.eventMode = 'static'
        sp.texture = Assets.get('mine')
    }

    /**
     * 重置所有地雷状态
     */
    resetAllMines(mines: MineInfo[]) {
        if (!this.inited_) return
        for (const mine of mines) {
            let sp = this.mineNum2spriteMap.get(mine.num)
            if (sp == null) continue

            if (mine.exploded) {
                sp.visible = false
                sp.eventMode = 'none'
            } else {
                this.resetMine(sp)
            }
        }
    }

    /**
     * 展示倒霉数字对应的地雷
     * @param badNumber 
     * @returns 
     */
    showBadMine(badNumber: number) {
        const sp = this.mineNum2spriteMap.get(badNumber)
        if (!sp) return
        this.resetMine(sp)
        sp.texture = Assets.get('badmine')
        playAudio('showBadNumber')
    }

    /**
     * 引爆地雷列表中的地雷，按列表顺序逐个引爆
     * @param mineNums
     * @returns 
     */
    explodeMines(...mineNums: number[]) {
        // 随机生成爆炸间隔参数
        let explodeInterval = randoms.getOne() * 30 + 40, totalTime = (randoms.getOne() + 1) * 1000
        if (mineNums.length * explodeInterval > totalTime)
            explodeInterval = totalTime / mineNums.length

        return new Promise<void>(ref => {
            let i = 0
            const interval = setInterval(() => {
                let ii = i
                i++
                if (ii >= mineNums.length)
                    clearInterval(interval)

                let sp = this.mineNum2spriteMap.get(mineNums[ii])
                if (sp == null)
                    return

                // 屏蔽事件和可见性
                sp.eventMode = 'none'
                sp.visible = false

                // 生成爆炸的特效精灵
                const boomsp = new Sprite({
                    x: sp.x,
                    y: sp.y,
                    width: sp.width,
                    height: sp.height,
                    texture: Assets.get('boom')
                })
                this.effectContainer.addChild(boomsp)

                // 播放音效
                playAudio('boom')

                // 到时间后移除特效精灵，在最后一个特效精灵消失后返回
                setTimeout(() => {
                    boomsp.removeFromParent()
                    if (ii == mineNums.length - 1)
                        ref()
                }, explodeInterval * (1 + randoms.getOne()))
            }, explodeInterval)
        })
    }
}
