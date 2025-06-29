<template>
    <el-dialog v-model="model" title="棋盘参数" style="min-width: 300px;" :append-to-body="true" top="10vh"
        @open="updateState()">

        <el-form ref="formRef" :model="state" label-width="auto" :inline="true">
            <el-form-item label="棋盘列数：">
                <el-input-number v-model="state.tempColumn" :min="1" :max="100" />
            </el-form-item>
            <el-form-item label="总地雷数：">
                <el-input-number v-model="state.tempTotal" :min="100" :max="1000" />
            </el-form-item>
            <!-- 补充的配置项 -->
            <el-form-item label="精灵大小：">
                <el-input-number v-model="state.tempSpriteSize" :min="10" :max="100" />
            </el-form-item>
            <el-form-item label="字体大小：">
                <el-input-number v-model="state.tempFontSize" :min="10" :max="50" />
            </el-form-item>
            <el-form-item label="间隔大小：">
                <el-input-number v-model="state.tempSpace" :min="0" :max="50" />
            </el-form-item>
        </el-form>

        <el-descriptions title="修改结果">
            <el-descriptions-item label="总地雷数：">{{ state.tempTotal }}</el-descriptions-item>
            <el-descriptions-item label="列数：">{{ state.tempColumn }}</el-descriptions-item>
            <el-descriptions-item label="行数：">{{ calcRow }}</el-descriptions-item>
            <el-descriptions-item label="精灵大小：">{{ state.tempSpriteSize }}px</el-descriptions-item>
            <el-descriptions-item label="字体大小：">{{ state.tempFontSize }}px</el-descriptions-item>
            <el-descriptions-item label="间隔大小：">{{ state.tempSpace }}px</el-descriptions-item>

            <el-descriptions-item label="棋盘宽度：">
                {{ calcWidth.width }}px
            </el-descriptions-item>
            <el-descriptions-item label=" 棋盘高度：">
                {{ calcHeight.height }}px
            </el-descriptions-item>
            <el-descriptions-item label="视口宽度：">
                {{ state.windowWidth }}px
                <el-tag type="danger" v-if="calcWidth.isOverflow">溢出风险</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="视口高度：">
                {{ state.windowheight }}px
                <el-tag type="danger" v-if="calcHeight.isOverflow">溢出风险</el-tag>
            </el-descriptions-item>
        </el-descriptions>

        <template #footer>
            <div class="dialog-footer" style="line-height: 40px;">
                <el-button title="不保存退出" @click="resetDefaultArgs()">重置参数</el-button>
                <el-button title="不保存退出" @click="cancelUpdatePlayers()">取消</el-button>
                <el-button title="保存并退出" @click="updatePlayers()">保存</el-button>
            </div>
        </template>
    </el-dialog>
</template>

<script setup lang="ts">
import { GameMain } from '../../game/game-main'
import { ElDialog, ElMessage, ElMessageBox } from 'element-plus'
import { computed, onMounted, onUnmounted, reactive } from 'vue'

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


const state = reactive({
    /** 棋盘地雷列数 */
    tempColumn: 0,
    /** 棋盘地雷总数 */
    tempTotal: 0,
    /** 棋盘地雷精灵大小 */
    tempSpriteSize: 0,
    /** 棋盘字体大小 */
    tempFontSize: 0,
    /** 棋盘精灵间隔大小 */
    tempSpace: 0,

    windowWidth: 0,
    windowheight: 0,
})

let resizeListener = () => {
    state.windowWidth = window.innerWidth
    state.windowheight = window.innerHeight
}
onMounted(() => {
    resizeListener()
    window.addEventListener('resize', resizeListener)
})
onUnmounted(() => {
    window.removeEventListener('resize', resizeListener)
})

/** 棋盘行数 */
const calcRow = computed(() => Math.ceil(state.tempTotal / state.tempColumn))
/** 棋盘像素宽度 */
const calcWidth = computed(() => {
    let w = (state.tempColumn + 1) * (state.tempSpriteSize + state.tempSpace) + state.tempSpace
    return {
        isOverflow: w > state.windowWidth,
        width: w
    }
})
/** 棋盘像素高度 */
const calcHeight = computed(() => {
    let h = (calcRow.value + 1) * (state.tempSpriteSize + state.tempFontSize + state.tempSpace) + state.tempSpace
    return {
        isOverflow: h > state.windowheight,
        height: h
    }
})


/** 更新棋盘状态参数 */
function updateState() {
    state.tempColumn = game.gameState.column
    state.tempTotal = game.gameState.total
    let opt = game.gameState.rendererOption
    state.tempFontSize = opt.fontSize
    state.tempSpace = opt.space
    state.tempSpriteSize = opt.mineSpriteSize
}

function resetDefaultArgs() {
    model.value = false
    let total = game.gameState.total
    game.changeOption()
    ElMessage({ type: 'success', message: `棋盘参数已重置${total == game.gameState.total ? '' : '，棋盘大小已修改，这将导致计分板部分数值失真'}` })
}

/** 不应用临时更改 */
function cancelUpdatePlayers() {
    model.value = false
    ElMessage({ type: 'info', message: '棋盘参数未更新' })
}

/** 应用临时更改 */
function updatePlayers() {
    model.value = false
    if (state.tempTotal != game.gameState.total) {
        ElMessageBox.alert('修改棋盘大小会导致积分板部分数值失真')
    }

    game.changeOption(state.tempColumn, state.tempTotal, {
        fontSize: state.tempFontSize,
        mineSpriteSize: state.tempSpriteSize,
        space: state.tempSpace
    })
    ElMessage({ type: 'success', message: '棋盘参数已更新' })
}
</script>