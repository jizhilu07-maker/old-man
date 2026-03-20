export default {
  root: '.',
  build: {
    minify: 'terser',
    cssMinify: true,
    rollupOptions: {
      input: {
        main: 'index.html'
      },
      output: {
        manualChunks: undefined // 保持简单，不分块
      },
      external: ['script.js', 'data/api-config.js'] // 将传统脚本作为外部资源
    },
    outDir: 'dist',
    assetsDir: 'assets',
    copyPublicDir: true // 复制public目录（如果有）
  },
  server: {
    port: 3000,
    open: true
  }
};