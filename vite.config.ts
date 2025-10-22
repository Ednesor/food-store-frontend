// vite.config.ts
import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
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
            },
        },
    },
});