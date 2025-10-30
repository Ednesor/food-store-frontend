import type { ICategoria } from "@/types/ICategoria";
import type { IProduct } from "@/types/IProduct";
import { getCategories, getProducts } from "@/utils/api"

/*
==============================
    REFERENCIAS AL DOM
==============================
*/
const userDisplay = document.getElementById("user-display");
const adminLink = document.getElementById("admin-link");
const logoutBtn = document.getElementById("logout-btn");
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
    setupAuth();
    await loadAndRenderInitialData();
    setupEventListeners();
}

/*
==============================
    1. LÓGICA DE AUTENTICACIÓN
==============================
*/
function setupAuth() {
    const userSession = localStorage.getItem('user');
    if (userSession) {
        const user = JSON.parse(userSession);
        if (userDisplay) userDisplay.textContent = `${user.name} ${user.lastname}`;
        if (adminLink && user.role !== 'ADMIN') adminLink.style.display = 'none';
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (event) => {
                event.preventDefault();
                localStorage.removeItem('user');
                window.location.href = '../../auth/login/login.html';
            });
        }
    } else {
        window.location.href = '../../auth/login/login.html';
    }
}

/*
==============================
    2. CARGA DE DATOS INICIAL
==============================
*/
// Carga productos y categorías en paralelo desde la API y los muestra en pantalla.
async function loadAndRenderInitialData() {
    try {
        const [categories, products] = await Promise.all([
            getCategories(),
            getProducts(),
        ]);

        // // --- USA LOS DATOS MOCK EN SU LUGAR ---
        // console.log(" MODO DE PRUEBA: Usando datos mock locales. ");
        // const [categories, products] = await Promise.all([
        //     Promise.resolve(mockCategories),
        //     Promise.resolve(mockProducts),
        // ]);

        // Guarda los datos en las variables globales.
        allCategories = categories;
        allProducts = products;

        // Llama a las funciones para dibujar los datos en la UI.
        renderCategories(allCategories);
        applyFiltersAndRender();

    } catch (error) {
        console.error("❌ Error al cargar datos iniciales:", error);
        productGrid.innerHTML = `<p style="color: var(--danger)">No se pudieron cargar los productos. Revisa la consola para más detalles.</p>`;
    }
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

    // Usa delegación de eventos para manejar clics en las categorías.
    categoryList.addEventListener("click", (event) => {
        const target = event.target as HTMLElement;
        if (target.tagName === "LI") {
            categoryList.querySelector(".active")?.classList.remove("active");
            target.classList.add("active");
            contentTitle.textContent = target.textContent || "Todos los Productos";
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
    // 1. Inicia con la lista completa de productos.
    let filteredProducts = [...allProducts];

    // 2. Aplica el filtro de categoría activa.
    const activeCategoryElement = categoryList.querySelector("li.active") as HTMLLIElement;
    if (activeCategoryElement && activeCategoryElement.dataset.id) {
        const categoryId = parseInt(activeCategoryElement.dataset.id, 10);
        filteredProducts = filteredProducts.filter(p => p.categoriaId === categoryId);
    }

    // 3. Aplica el filtro por texto de búsqueda.
    const searchQuery = searchBar.value.toLowerCase().trim();
    if (searchQuery) {
        filteredProducts = filteredProducts.filter(p =>
            p.nombre.toLowerCase().includes(searchQuery) ||
            p.categoria.toLowerCase().includes(searchQuery)
        );
    }

    // 4. Aplica el criterio de ordenamiento seleccionado.
    const sortValue = sortSelect.value;
    switch (sortValue) {
        case "price-asc": filteredProducts.sort((a, b) => a.precio - b.precio); break;
        case "price-desc": filteredProducts.sort((a, b) => b.precio - a.precio); break;
        case "name-asc": filteredProducts.sort((a, b) => a.nombre.localeCompare(b.nombre)); break;
        case "name-desc": filteredProducts.sort((a, b) => b.nombre.localeCompare(a.nombre)); break;
    }

    // 5. Renderiza el resultado final en el DOM.
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
        li.textContent = cat.nombre;
        li.dataset.id = String(cat.id);
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
            <p class="desc">${p.categoria ?? "Sin categoría"}</p>
            <span class="price">$${p.precio.toFixed(2)}</span>
            <span class="status-badge ${p.estado ? "status-available" : "status-unavailable"}">
                ${p.estado ? "Disponible" : "Agotado"}
            </span>
        </div>
    `;
        card.addEventListener("click", () => {
            window.location.href = `../productDetail/productDetail.html?id=${p.id}`;
        });
        productGrid.appendChild(card);
    });
}



// =========================================================
// =================== MOCK DATA (PARA PRUEBAS) ============
// =========================================================

// const mockCategories: ICategoria[] = [
//     { id: 1, nombre: "Pizzas", descripcion: "Las mejores pizzas artesanales.", urlImagen: "..." },
//     { id: 2, nombre: "Hamburguesas", descripcion: "Hamburguesas caseras con carne premium.", urlImagen: "..." },
//     { id: 3, nombre: "Bebidas", descripcion: "Gaseosas, aguas y jugos.", urlImagen: "..." },
//     { id: 4, nombre: "Postres", descripcion: "El toque dulce para terminar tu comida.", urlImagen: "..." }
// ];



// const mockProducts: IProduct[] = [
//     { id: 101, urlImagen: "https://images.pexels.com/photos/315755/pexels-photo-315755.jpeg", nombre: "Pizza Muzzarella", precio: 3200.00, categoria: "Pizzas", stock: 15, estado: true, categoriaId: 1 },
//     { id: 102, urlImagen: "https://images.pexels.com/photos/845811/pexels-photo-845811.jpeg", nombre: "Pizza Napolitana", precio: 3500.00, categoria: "Pizzas", stock: 10, estado: true, categoriaId: 1 },
//     { id: 103, urlImagen: "https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg", nombre: "Hamburguesa Clásica", precio: 2800.00, categoria: "Hamburguesas", stock: 20, estado: true, categoriaId: 2 },
//     { id: 104, urlImagen: "https://images.pexels.com/photos/2282532/pexels-photo-2282532.jpeg", nombre: "Hamburguesa Doble Cheddar", precio: 3400.00, categoria: "Hamburguesas", stock: 0, estado: false, categoriaId: 2 },
//     { id: 106, urlImagen: "https://images.pexels.com/photos/416528/pexels-photo-416528.jpeg", nombre: "Agua sin Gas 500ml", precio: 600.00, categoria: "Bebidas", stock: 40, estado: true, categoriaId: 3 },
//     // 👇 ESTE PRODUCTO NO TIENE IMAGEN PARA PROBAR EL FALLBACK
//     { id: 107, urlImagen: "", nombre: "Flan Casero", precio: 1200.00, categoria: "Postres", stock: 12, estado: true, categoriaId: 4 },
//     { id: 108, urlImagen: "https://images.pexels.com/photos/14101389/pexels-photo-14101389.jpeg", nombre: "Pizza Fugazzeta", precio: 3600.00, categoria: "Pizzas", stock: 8, estado: true, categoriaId: 1 },
//     { id: 109, urlImagen: "https://images.pexels.com/photos/1269033/pexels-photo-1269033.jpeg", nombre: "Cerveza Lager 1L", precio: 1500.00, categoria: "Bebidas", stock: 0, estado: false, categoriaId: 3 }
// ];