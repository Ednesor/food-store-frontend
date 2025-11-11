import type { ICategoria } from "@/types/ICategoria";
import type { IProduct } from "@/types/IProduct";
import type { IOrder } from "@/types/IOrders";
import { getCategories, getProducts, getOrders } from "@/utils/api";
import {setupAdminAuth} from "@/utils/auth"

/*
=========================================================
    REFERENCIAS AL DOM
=========================================================
*/
const categoryCount = document.getElementById("category-count") as HTMLSpanElement;
const productCount = document.getElementById("product-count") as HTMLSpanElement;
const orderCount = document.getElementById("order-count") as HTMLSpanElement;
const availableProductsCount = document.getElementById("available-products-count") as HTMLSpanElement;
const summaryText = document.getElementById("summary-text") as HTMLParagraphElement;

/*
=========================================================
    INICIALIZACIÓN DE LA PÁGINA
=========================================================
*/
document.addEventListener("DOMContentLoaded", initializeApp);

async function initializeApp() {
    setupAdminAuth();
    await loadAndRenderStats();
}

/*
=========================================================
    2. CARGA DE ESTADÍSTICAS
=========================================================
*/
async function loadAndRenderStats() {
    try {
        const [categories, products, orders] = await Promise.all([
            getCategories(),
            getProducts(),
            getOrders(),
        ]);

        // 3. PASAMOS LOS DATOS REALES
        renderStats(categories, products, orders);

    } catch (error) {
        console.error("Error al cargar las estadísticas:", error);
        summaryText.textContent = "Error al cargar los datos del dashboard.";
    }
}

/*
=========================================================
    3. RENDERIZADO DE ESTADÍSTICAS
=========================================================
*/
function renderStats(categories: ICategoria[], products: IProduct[], orders: IOrder[]) {
    const totalCategories = categories.length;
    const totalProducts = products.length;
    const totalOrders = orders.length;
    const availableProducts = products.filter(p => p.activo).length;

    categoryCount.textContent = String(totalCategories);
    productCount.textContent = String(totalProducts);
    orderCount.textContent = String(totalOrders);
    availableProductsCount.textContent = String(availableProducts);

    summaryText.textContent =
        `Hay ${totalCategories} categorías registradas, ${totalProducts} productos en total y ${totalOrders} pedidos.
        Actualmente ${availableProducts} productos están disponibles para la venta.`;
}