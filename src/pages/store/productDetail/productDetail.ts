import { getProductById } from "@/utils/api";
import { setupClientAuth } from "@/utils/auth";
import type { IProduct } from "@/types/IProduct";
import { addToCart } from "@/utils/cart";

// Referencias al DOM
const detailContainer = document.getElementById("detail-container") as HTMLElement;

// Estado
let currentProduct: IProduct | null = null;

// Inicialización
document.addEventListener("DOMContentLoaded", initializeApp);

/**
 * Flujo principal al cargar la página.
 */
async function initializeApp() {
    setupClientAuth(); // Configura header y seguridad
    await loadProduct(); // Carga el producto desde la API
}

/**
 * Obtiene el ID de la URL, busca el producto y lo renderiza.
 */
async function loadProduct() {
    // 1. Obtener el ID del producto desde la URL
    const params = new URLSearchParams(window.location.search);
    const productId = params.get("id");

    // 2. Validar si hay un ID
    if (!productId || isNaN(Number(productId))) {
        renderError("Producto no encontrado o ID inválido.");
        return;
    }

    // 3. Buscar el producto en la API
    try {
        currentProduct = await getProductById(Number(productId));
        renderProduct(currentProduct);
        // 4. LLAMAMOS A LOS LISTENERS DESPUÉS DE RENDERIZAR
        setupEventListeners();
    } catch (error) {
        console.error("Error al cargar el producto:", error);
        renderError("No se pudo cargar el producto. Intente nuevamente.");
    }
}

/**
 * Dibuja el HTML del producto en el contenedor principal.
 */
function renderProduct(product: IProduct) {
    if (!product) {
        renderError("Producto no disponible.");
        return;
    }

    const { nombre, descripcion, precio, urlImagen, stock, activo, categoria } = product;

    // Determinar el estado del producto
    const statusBadge = activo
        ? `<span class="status-badge status-available">Disponible</span>`
        : `<span class="status-badge status-unavailable">No Disponible</span>`;

    // Generar el HTML
    detailContainer.innerHTML = `
        <div class="detail-grid">
            <section class="image-container">
                <img src="${urlImagen || 'https://via.placeholder.com/450.png?text=Sin+Imagen'}" alt="${nombre}">
            </section>

            <section class="info-container">
                <span class="category-name">${categoria.nombre}</span>
                <h2>${nombre}</h2>

                <div class="status-container">
                    ${statusBadge}
                </div>
                
                <span class="price">$${precio.toFixed(2)}</span>
                
                <p class="description">${descripcion}</p>

                <div class="actions-container">
                    <span class="stock">Disponibles: ${stock}</span>
                    
                    <div class="quantity-selector">
                        <button id="qty-decrease" ${!activo || stock === 0 ? 'disabled' : ''}>-</button>
                        <input type="number" id="qty-input" value="1" min="1" max="${stock}" ${!activo || stock === 0 ? 'disabled' : ''}>
                        <button id="qty-increase" ${!activo || stock === 0 ? 'disabled' : ''}>+</button>
                    </div>

                    <div class="actions-buttons">
                        <button id="add-to-cart-btn" class="btn btn-primary" ${!activo || stock === 0 ? 'disabled' : ''}>
                            ${activo && stock > 0 ? 'Agregar al Carrito' : 'No Disponible'}
                        </button>
                        <button id="back-btn" class="btn btn-secondary">Volver</button>
                    </div>
                </div>
            </section>
        </div>
    `;
}

/**
 * Muestra un mensaje de error en el contenedor.
 */
function renderError(message: string) {
    detailContainer.innerHTML = `
        <p style="color: var(--danger); text-align: center;">${message}</p>
        <a href="/src/pages/store/home/home.html" class="btn btn-secondary" style="margin: 0 auto; display: block; width: fit-content;">
            Volver al inicio
        </a>
    `;
}

/**
 * Configura los event listeners para los botones.
 */
function setupEventListeners() {
    // 1. Botón "Volver"
    const backBtn = document.getElementById("back-btn");
    backBtn?.addEventListener("click", () => {
        window.location.href = '/src/pages/store/home/home.html';
    });

    // 2. Referencias a los elementos de cantidad y carrito
    const qtyInput = document.getElementById("qty-input") as HTMLInputElement;
    const qtyDecrease = document.getElementById("qty-decrease") as HTMLButtonElement;
    const qtyIncrease = document.getElementById("qty-increase") as HTMLButtonElement;
    const addToCartBtn = document.getElementById("add-to-cart-btn") as HTMLButtonElement;

    if (!currentProduct || !qtyInput || !qtyDecrease || !qtyIncrease || !addToCartBtn) {
        return;
    }

    const stock = currentProduct.stock;

    /**
     * Valida y actualiza el valor del input, y habilita/deshabilita
     * los botones + y - según corresponda.
     */
    function validateAndUpdateButtons(newValue: number) {
        let qty = newValue;

        // Validar límites
        if (isNaN(qty) || qty < 1) {
            qty = 1;
        }
        if (qty > stock) {
            qty = stock;
        }

        // Actualizar el valor del input
        qtyInput.value = String(qty);

        // Actualizar estado de botones + / -
        // Botón '-' se deshabilita si la cantidad es 1
        qtyDecrease.disabled = (qty === 1);
        // Botón '+' se deshabilita si la cantidad es igual al stock
        qtyIncrease.disabled = (qty === stock);
    }

    // 3. Listener para '-'
    qtyDecrease.addEventListener("click", () => {
        let qty = parseInt(qtyInput.value, 10);
        validateAndUpdateButtons(qty - 1);
    });

    // 4. Listener para '+'
    qtyIncrease.addEventListener("click", () => {
        let qty = parseInt(qtyInput.value, 10);
        validateAndUpdateButtons(qty + 1);
    });

    // 5. Listener para 'input' (valida en tiempo real al teclear)
    qtyInput.addEventListener("input", () => {
        let qty = parseInt(qtyInput.value, 10);
        validateAndUpdateButtons(qty);
    });
    
    // 6. Listener para 'change' (por si pegan un valor y salen)
    qtyInput.addEventListener("change", () => {
        let qty = parseInt(qtyInput.value, 10);
        validateAndUpdateButtons(qty);
    });

    // 7. Listener para "Agregar al Carrito" (CON VALIDACIÓN)
    addToCartBtn.addEventListener("click", () => {
        // Volvemos a validar la cantidad final
        let quantity = parseInt(qtyInput.value, 10);
        
        if (isNaN(quantity) || quantity < 1) {
            quantity = 1;
        }
        
        // **VALIDACIÓN DE STOCK**
        if (quantity > stock) {
            alert(`No puedes agregar ${quantity} items. El stock máximo es ${stock}.`);
            quantity = stock;
            validateAndUpdateButtons(stock); // Sincronizar input y botones
            return; // Detenemos la acción
        }

        if (currentProduct) {
            addToCart(currentProduct, quantity);
        }
    });

    // 8. Llamada inicial para setear el estado de los botones (ej: '-' deshabilitado)
    validateAndUpdateButtons(parseInt(qtyInput.value, 10));
}