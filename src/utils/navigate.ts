/**
 * Utilidades para la navegación.
 * Centraliza las rutas de la aplicación.
 */

export const PATHS = {
    // Autenticación
    LOGIN: '/src/pages/auth/login/login.html',
    REGISTER: '/src/pages/auth/register/register.html',

    // Cliente (Store)
    STORE_HOME: '/src/pages/store/home/home.html',
    STORE_CART: '/src/pages/store/cart/cart.html',
    STORE_PRODUCT_DETAIL: (id: number) => `/src/pages/store/productDetail/productDetail.html?id=${id}`,

    // Cliente (Área Cliente)
    CLIENT_ORDERS: '/src/pages/client/orders/orders.html',

    // Admin
    ADMIN_HOME: '/src/pages/admin/adminHome/adminHome.html',
    ADMIN_CATEGORIES: '/src/pages/admin/categories/categories.html',
    ADMIN_PRODUCTS: '/src/pages/admin/products/products.html',
    ADMIN_ORDERS: '/src/pages/admin/orders/orders.html',
};

/**
 * Redirige al usuario a una ruta específica.
 * @param path - La ruta a la que se debe navegar (usar PATHS).
 */
export function navigateTo(path: string): void {
    window.location.href = path;
}