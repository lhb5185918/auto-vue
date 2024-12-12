<template>
    <h3>
        条件渲染
    </h3>
    <div v-if="flag">渲染</div>
    <div v-else>渲染不成功</div>
    <div v-if="type==='a'">a</div>
    <div v-else-if="type ==='b'">b</div>
    <div v-else-if="type === 'c'">c</div>
    <div v-else>not</div>
    <div v-show="flag">渲染不成功</div>

</template>


<script>
import { registerRuntimeCompiler } from 'vue';

export default {
    data() { 
        return {
            flag: true,
            type: "c"
        }
    }
}
</script>