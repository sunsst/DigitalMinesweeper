import BOOM_AUDIO from './res/boom.mp3'
import SHOWBADNUMBER_AUDIO from './res/showBadNumber.mp3'

export type AudioType = 'boom' | 'showBadNumber'


let audios = {
    boom: () => { },
    showBadNumber: () => { }
}


/**
 * 播放一个音效
 * @param audioType 
 */
export function playAudio(audioType: AudioType) {
    audios[audioType]()
}


async function loadAudioBufferSource(url: any, ctx: AudioContext) {
    let res = await fetch(url)
    let res_arrbuf = await res.arrayBuffer()
    let audioBuf = await ctx.decodeAudioData(res_arrbuf)
    let time = 0
    return () => {
        if (Date.now() - time < 40) return
        else time = Date.now()

        let bufSrc = ctx.createBufferSource()
        bufSrc.buffer = audioBuf
        bufSrc.connect(ctx.destination)

        bufSrc.start()
    }
}

// 读取音频
window.addEventListener('click', async () => {
    try {
        let ctx = new AudioContext()
        audios.boom = await loadAudioBufferSource(BOOM_AUDIO, ctx)
        audios.showBadNumber = await loadAudioBufferSource(SHOWBADNUMBER_AUDIO, ctx)

        console.log('音频加载完成')
    } catch (e) {
        console.log('获取音频失败:', e)
    }
}, { once: true })