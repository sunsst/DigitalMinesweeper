<template>
    <el-button :icon="InfoFilled" circle title="查看帮助" @click="helpInfo()" />
</template>


<script setup lang="ts">
import { InfoFilled } from '@element-plus/icons-vue'
import { ElMessageBox } from 'element-plus'



function helpInfo() {
    ElMessageBox.alert("游戏开始前点击第二个设置按钮，选择玩家列表，点击右下角的切换按钮，切换按钮组，然后新增玩家，设置玩家加入游戏即可正式开始")
}
</script>