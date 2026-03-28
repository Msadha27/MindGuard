import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

icons: [
  {
    src: '/icon.png',
    sizes: '192x192',
    type: 'image/png',
  }
]
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
