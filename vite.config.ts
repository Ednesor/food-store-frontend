// vite.config.ts
import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
    server: {
        proxy: {
            '/api': {
                target: 'http://localhost:8080',
                changeOrigin: true,
                secure: false,
            },
        },
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, './src'),
            '@/components': resolve(__dirname, './src/components'),
            '@/pages': resolve(__dirname, './src/pages'),
            '@/utils': resolve(__dirname, './src/utils'),
            '@/types': resolve(__dirname, './src/types'),
        },
    },
    build: {
        rollupOptions: {
            input: {
                // Punto de entrada principal
                main: resolve(__dirname, 'index.html'),

                // Tus otras páginas
                login: resolve(__dirname, 'src/pages/auth/login/login.html'),
                register: resolve(__dirname, 'src/pages/auth/register/register.html'),
                adminHome: resolve(__dirname, 'src/pages/admin/adminHome/adminHome.html'),
                storeHome: resolve(__dirname, 'src/pages/store/home/home.html'),
                productDetail: resolve(__dirname, 'src/pages/store/productDetail/productDetail.html')
            },
        },
    },
});