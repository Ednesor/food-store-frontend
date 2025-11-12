import type { ICategoria } from "@/types/ICategoria";
import type { IProduct } from "@/types/IProduct";
import { getCategories, getProducts } from "@/utils/api"
import { setupClientAuth } from "@/utils/auth";
import { navigateTo, PATHS } from "@/utils/navigate";
import { checkAndShowWelcomeMessage } from "@/utils/notifications";

/*
==============================
    REFERENCIAS AL DOM
==============================
*/
const categoryList = document.getElementById("category-list") as HTMLUListElement;
const productGrid = document.getElementById("product-grid") as HTMLDivElement;
const productCount = document.getElementById("product-count") as HTMLSpanElement;
const sortSelect = document.getElementById("sort-select") as HTMLSelectElement;
const searchBar = document.getElementById("search-bar") as HTMLInputElement;
const contentTitle = document.getElementById("content-title") as HTMLHeadingElement;

/*
==============================
    VARIABLES DE ESTADO
==============================
*/
// Guardan los datos maestros de la API para no pedirlos en cada filtro.
let allProducts: IProduct[] = [];
let allCategories: ICategoria[] = [];

/*
=========================================================
    INICIALIZACIÓN DE LA PÁGINA
=========================================================
*/
// Flujo principal al cargar la página.
document.addEventListener("DOMContentLoaded", initializeApp);

async function initializeApp() {
    setupClientAuth();
    checkAndShowWelcomeMessage();
    await loadAndRenderInitialData();
    setupEventListeners();
}

/*
==============================
    2. CARGA DE DATOS INICIAL
==============================
*/
// Carga productos y categorías en paralelo desde la API y los muestra en pantalla.
async function loadAndRenderInitialData() {
    // Usamos Promise.allSettled para que una petición fallida no cancele la otra.
    const results = await Promise.allSettled([
        getCategories(),
        getProducts(),
    ]);

    // Verificamos el resultado de las CATEGORÍAS
    const categoriesResult = results[0];
    if (categoriesResult.status === 'fulfilled') {
        // Si la promesa se cumplió, usamos su valor.
        allCategories = categoriesResult.value;
        renderCategories(allCategories);
    } else {
        // Si la promesa falló, mostramos el error específico.
        console.error("Error al cargar categorías:", categoriesResult.reason);
        categoryList.innerHTML = `<li style="color: var(--danger)">Error al cargar</li>`;
    }

    // Verificamos el resultado de los PRODUCTOS
    const productsResult = results[1];
    if (productsResult.status === 'fulfilled') {
        // Si la promesa se cumplió, usamos su valor.
        allProducts = productsResult.value;
    } else {
        // Si la promesa falló, mostramos el error específico.
        console.error("Error al cargar productos:", productsResult.reason);
        productGrid.innerHTML = `<p style="color: var(--danger)">No se pudieron cargar los productos.</p>`;
    }

    // Al final, llamamos a la función de renderizado.
    applyFiltersAndRender();
}

/*
==============================
    3. CONFIGURACIÓN DE EVENT LISTENERS
==============================
*/
// Asigna los listeners para los filtros, búsqueda y categorías. Cada acción actualiza la vista.
function setupEventListeners() {
    searchBar.addEventListener("input", applyFiltersAndRender);
    sortSelect.addEventListener("change", applyFiltersAndRender);

    categoryList.addEventListener("click", (event) => {
        const clickedLi = (event.target as HTMLElement).closest('li');

        if (clickedLi) {
            categoryList.querySelector(".active")?.classList.remove("active");
            clickedLi.classList.add("active");
            contentTitle.textContent = clickedLi.textContent?.trim() || "Todos los Productos";
            applyFiltersAndRender();
        }
    });
}

/*
=========================================================
    4. FUNCIÓN MAESTRA DE FILTRADO Y RENDERIZADO
=========================================================
*/
// Orquesta el filtrado, búsqueda y ordenamiento de productos antes de renderizarlos.
function applyFiltersAndRender() {
    let filteredProducts = [...allProducts];

    const activeCategoryElement = categoryList.querySelector("li.active") as HTMLLIElement;
    if (activeCategoryElement && activeCategoryElement.dataset.id) {
        const categoryId = parseInt(activeCategoryElement.dataset.id, 10);
        filteredProducts = filteredProducts.filter(p => p.categoria.id === categoryId);
    }

    const searchQuery = searchBar.value.toLowerCase().trim();
    if (searchQuery) {
        filteredProducts = filteredProducts.filter(p =>
            p.nombre.toLowerCase().includes(searchQuery) ||
            p.categoria.nombre.toLowerCase().includes(searchQuery)
        );
    }

    const sortValue = sortSelect.value;
    switch (sortValue) {
        case "price-asc": filteredProducts.sort((a, b) => a.precio - b.precio); break;
        case "price-desc": filteredProducts.sort((a, b) => b.precio - a.precio); break;
        case "name-asc": filteredProducts.sort((a, b) => a.nombre.localeCompare(b.nombre)); break;
        case "name-desc": filteredProducts.sort((a, b) => b.nombre.localeCompare(a.nombre)); break;
    }

    renderProducts(filteredProducts);
}

/*
=========================================================
    5. FUNCIONES DE RENDERIZADO
=========================================================
*/
// Dibuja la lista de categorías en el <ul> del DOM.
function renderCategories(categories: ICategoria[]): void {
    categoryList.innerHTML = "";
    const allItem = document.createElement("li");
    allItem.textContent = "Todas las categorías";
    allItem.classList.add("active");
    categoryList.appendChild(allItem);

    categories.forEach((cat) => {
        const li = document.createElement("li");
        li.dataset.id = String(cat.id);
        li.innerHTML = `
            <img 
                src="${cat.urlImagen || 'https://via.placeholder.com/32.png?text=S/I'}" 
                alt="${cat.nombre}" 
                class="category-image"
            >
            <span class="category-name">${cat.nombre}</span>
        `;
        categoryList.appendChild(li);
    });
}

// Dibuja las tarjetas de producto en la grilla del DOM a partir de una lista.
function renderProducts(productsToRender: IProduct[]): void {
    productGrid.innerHTML = "";
    productCount.textContent = `${productsToRender.length} producto${productsToRender.length !== 1 ? "s" : ""}`;

    if (productsToRender.length === 0) {
        productGrid.innerHTML = `<p style="text-align:center; color: var(--text-secondary)">No se encontraron productos.</p>`;
        return;
    }

    productsToRender.forEach((p) => {
        const card = document.createElement("div");
        card.className = "product-card";
        card.innerHTML = `
        <img src="${p.urlImagen || "https://via.placeholder.com/300x200.png?text=Sin+Imagen"}" alt="${p.nombre}">
        <div class="info">
            <h4>${p.nombre}</h4>
            <p class="desc">${p.categoria?.nombre ?? "Sin categoría"}</p>
            <span class="price">$${p.precio.toFixed(2)}</span>
            <span class="status-badge ${p.activo ? "status-available" : "status-unavailable"}">
                ${p.activo ? "Disponible" : "Agotado"}
            </span>
        </div>
    `;
        card.addEventListener("click", () => {
            // Esto llevará a una página de detalle de producto
            navigateTo(PATHS.STORE_PRODUCT_DETAIL(p.id))
        });
        productGrid.appendChild(card);
    });
}