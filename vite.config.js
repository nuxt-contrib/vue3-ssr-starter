import vuePlugin from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [vuePlugin()],
  build: {
    minify: false,
  },
})
