<template>
    <el-container>
        <el-header>💣数字扫雷💣️</el-header>
        <el-main>
            <GameWindow></GameWindow>
        </el-main>
    </el-container>
</template>

<script setup lang="ts">
import GameWindow from './components/GameWindow.vue'
</script>


<style scoped>
.el-header {
    background-color: #F5F7FA;
    border-bottom: 4px dashed #E4E7ED;
    color: #303133;
    font-weight: bold;
    font-size: 1.2em;

    display: flex;
    align-items: center;
    justify-content: center;

    box-shadow: 0 0 10px #DCDFE6
}

.el-main {
    display: flex;
    flex-flow: column nowrap;
    justify-content: start;
    align-items: center;

    text-align: center;
}
</style>