const MAX_UINT32 = Math.pow(2, 32)


/**
 * 随机数生成工具
 */
export class RandomNumberUtil {
    protected readonly BUFFER_SIZE = 10
    protected randomBuffer = new Uint32Array(this.BUFFER_SIZE)
    protected bufferIndex: number = this.BUFFER_SIZE

    protected resetRandomNums() {
        window.crypto.getRandomValues(this.randomBuffer)
    }

    /**
     * 返回一个[0,1)区间的随机浮点数
     */
    getOne() {
        if (this.bufferIndex >= this.BUFFER_SIZE) {
            this.resetRandomNums()
            this.bufferIndex = 0
        }

        let v = this.randomBuffer[this.bufferIndex] / MAX_UINT32
        this.bufferIndex++
        return v
    }

    /**
     * 返回一个[0,limit)区间的随机整数
     */
    getOneInRange(limit: number) {
        return Math.floor(this.getOne() * limit)
    }


    /**
     * 返回多个随机数
     * @param n 随机数数量
     * @param transform 执行过程中转换随机数，参数参考{@link getOne}
     * @returns 
     */
    getMany(n: number, transform: (r: number) => number = r => r) {
        let arr: number[] = []

        while (arr.length < n) {
            arr.push(transform(this.getOne()))
        }
        return arr
    }

    /**
     * 返回多个不等的随机数
     * 
     * 注意：当n和transform设计得不合理时会导致循环次数过多甚至无限循环
     * @param n 随机数数量
     * @param transform 执行过程中转换随机数，参数参考{@link getOne}
     * @returns 
     */
    getManyDifferent(n: number, transform: (r: number) => number = r => r) {
        const st = new Set<number>()
        while (st.size < n) {
            let v = transform(this.getOne())
            st.add(v)
        }
        return st
    }


    /**
     * 该方法根据生成的随机数对调数组元素达成打乱数组的效果
     * @param arr 将被原地打乱的数组
     * @returns 返回值是输入的数组
     */
    disorderedArray<T>(arr: T[]): T[] {
        const l = arr.length
        if (l <= 1) return arr
        let randoms = this.getMany(l * 2, r => Math.floor(r * l))
        for (let i = 0; i < randoms.length; i += 2) {
            let v = arr[randoms[i]]
            arr[randoms[i]] = arr[randoms[i + 1]]
            arr[randoms[i + 1]] = v
        }
        return arr
    }
}

/**
 * 默认实例
 */
export const randoms = new RandomNumberUtil()

