import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import commonjs from '@rollup/plugin-commonjs'
import { resolve } from 'path'
import commonjs2 from 'vite-plugin-commonjs';  

export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    // commonjs({
    //   include: [
    //     /node_modules\/(is-arrayish|simple-swizzle|color|@antv)/, // 扩展AntV相关模块[2,6](@ref)
    //     /@dagrejs\/graphlib/
    //   ],
    //   dynamicRequireTargets: [
    //     'node_modules/@antv/**/*.js', // 新增AntV模块处理[6](@ref)
    //     'node_modules/is-arrayish/**/*.js',
    //     'node_modules/simple-swizzle/**/*.js',
    //     'node_modules/color/**/*.js'
    //   ],
    //   requireReturnsDefault: 'preferred',
    //   transformMixedEsModules: true
    // }),
	commonjs2()
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@babel/runtime/regenerator': '@babel/runtime-corejs3/regenerator',
      // 修复matrix-util导出路径问题，确保transform能被正确导入
      '@antv': '@antv'
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api/, '')  // 保持路径重写[5](@ref)
      }
    },
    hmr: { overlay: false }
  },
  optimizeDeps: {
    include: [
      '@antv/g6@5.0.13', // 指定稳定版本[2](@ref)
      '@antv/matrix-util@4.0.2', // 匹配新版导出结构[2](@ref)
      '@antv/matrix-util', // 匹配新版导出结构[2](@ref)
      'dayjs',
      '@dagrejs/graphlib',
      '@antv/layout',
      'lodash',
      'is-arrayish'
    ],
    esbuildOptions: {
      define: {
        global: 'globalThis',
        __require: 'require'  // 兼容CommonJS模块[7](@ref)
      }
    }
  },
  build: {
    // commonjsOptions: {
    //   include: [
    //     /node_modules\/(is-arrayish|simple-swizzle|color|@antv)/, // 扩展匹配范围[6](@ref)
    //     /@dagrejs\/graphlib/,
    //     /dayjs/,
    //     /lodash/
    //   ],
    //   transformMixedEsModules: true,
    //   defaultIsModuleExports: 'auto'
    // },
    rollupOptions: {
      plugins: [
        // commonjs({
        //   include: /node_modules/,
        //   requireReturnsDefault: 'auto',
        //   dynamicRequireTargets: [
        //     'node_modules/@antv/**/*.js', // 显式包含AntV模块[6](@ref)
        //     'node_modules/is-arrayish/**/*.js',
        //     'node_modules/simple-swizzle/**/*.js',
        //     'node_modules/color/**/*.js'
        //   ]
        // })
      ],
      output: {
        manualChunks: {
          // 'lodash': ['lodash'],
          // 'g6': ['@antv/g6', '@antv/matrix-util'], // 合并AntV核心库[2](@ref)
          // 'color-utils': ['color', 'simple-swizzle', 'is-arrayish', 'tinycolor2']
        },
        // interop: 'compat'
      },
      onwarn(warning, warn) {
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE') return
        warn(warning)
      }
    }
  }
})