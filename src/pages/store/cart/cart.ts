import { setupClientAuth, getUser } from "@/utils/auth";
import { getProducts, createOrder } from "@/utils/api";
import { getCart, removeFromCart, updateItemQuantity, clearCart } from "@/utils/cart";
import type { ICartItem } from "@/types/ICart";
import type { IProduct } from "@/types/IProduct";
import type { IOrderCreate, IDetallePedidoCreate } from "@/types/IOrders";
import { navigateTo, PATHS } from "@/utils/navigate";
import { showNotification } from "@/utils/notifications";
import { showConfirmation } from "@/utils/confirmation";

// Referencias al DOM
const cartContainer = document.getElementById("cart-container") as HTMLDivElement;
const cartItemsList = document.getElementById("cart-items-list") as HTMLTableSectionElement;
const emptyCartMessage = document.getElementById("empty-cart-message") as HTMLDivElement;

// Referencias del Resumen
const summarySubtotal = document.getElementById("summary-subtotal") as HTMLSpanElement;
const summaryShipping = document.getElementById("summary-shipping") as HTMLSpanElement;
const summaryTotal = document.getElementById("summary-total") as HTMLSpanElement;

// Referencias de Botones
const checkoutBtn = document.getElementById("checkout-btn") as HTMLButtonElement;
const clearCartBtn = document.getElementById("clear-cart-btn") as HTMLButtonElement;

// Referencias al modal de checkout 
const checkoutModal = document.getElementById("checkout-modal") as HTMLDivElement;
const checkoutForm = document.getElementById("checkout-form") as HTMLFormElement;
const cancelModalBtn = document.getElementById("close-modal-btn") as HTMLButtonElement;
const checkoutTotalDisplay = document.getElementById("checkout-total-display") as HTMLSpanElement;


const SHIPPING_COST = 500;

// 3. VARIABLE PARA GUARDAR LA INFO DE LA API (INCLUYENDO STOCK)
let allProducts: IProduct[] = [];

// Inicialización
document.addEventListener("DOMContentLoaded", async () => {
    setupClientAuth(); // Configura el header y la sesión

    // 4. PRIMERO OBTENEMOS LOS PRODUCTOS DE LA API
    try {
        allProducts = await getProducts();
    } catch (error) {
        console.error("Error al cargar productos para validar stock:", error);
        cartItemsList.innerHTML = "<p>Error al cargar productos</p>";
        return;
    }

    // 5. AHORA RENDERIZAMOS EL CARRITO Y LUEGO LOS LISTENERS
    loadAndRenderCart();
    setupEventListeners();
});

/**
 * Define el tipo de dato que usaremos para renderizar,
 * combinando el carrito (quantity) y el producto (stock).
 */
interface ICartDetail extends ICartItem {
    stock: number;
    activo: boolean;
}

/**
 * Carga el carrito desde localStorage y lo "cruza" con
 * los datos de la API (allProducts) para obtener el stock.
 */
function loadAndRenderCart() {
    const cart = getCart();

    if (cart.length === 0) {
        // Carrito vacío
        cartContainer.classList.add("hidden");
        emptyCartMessage.classList.remove("hidden");
        checkoutBtn.disabled = true;
        clearCartBtn.disabled = true;
    } else {
        // Carrito con items
        cartContainer.classList.remove("hidden");
        emptyCartMessage.classList.add("hidden");

        // 6. "CRUZAMOS" LOS DATOS DEL CARRITO CON LOS DE LA API
        const cartDetails: ICartDetail[] = cart.map(item => {
            const product = allProducts.find(p => p.id === item.id);
            return {
                ...item, // id, nombre, precio, urlImagen, quantity
                stock: product ? product.stock : 0, // Obtenemos el stock real
                activo: product ? product.activo : false // Obtenemos el estado real
            };
        });

        renderCartItems(cartDetails);
        renderSummary(cartDetails); // Usamos cartDetails para el subtotal

        checkoutBtn.disabled = false;
        clearCartBtn.disabled = false;
    }
}

/**
 * Dibuja los items del carrito en la lista.
 */
function renderCartItems(cart: ICartDetail[]) {
    cartItemsList.innerHTML = ""; // Limpiar lista

    cart.forEach(item => {
        const itemElement = document.createElement("div");
        itemElement.className = "cart-item";
        itemElement.dataset.productId = String(item.id);

        // 7. VALIDAMOS EL ESTADO Y STOCK PARA LOS BOTONES
        const maxStock = item.stock;
        const isAvailable = item.activo && maxStock > 0;
        const isMaxQuantity = item.quantity >= maxStock;

        // Si la cantidad en el carrito es MAYOR que el stock (ej: admin bajó el stock)
        // Mostramos una alerta visual
        const stockError = item.quantity > maxStock ? 'stock-error' : '';

        itemElement.innerHTML = `
            <img src="${item.urlImagen || 'https://via.placeholder.com/80.png?text=S/I'}" alt="${item.nombre}" class="cart-item-img">
            
            <div class="cart-item-info">
                <h4>${item.nombre}</h4>
                <span class="price">$${item.precio.toFixed(2)} c/u</span>
                ${stockError ? `<span class="cart-item-remove">¡Stock insuficiente! (Máx: ${maxStock})</span>` : ''}
            </div>
            
            <div class="cart-item-controls">
                <span class="cart-item-total">$${(item.precio * item.quantity).toFixed(2)}</span>
                
                <div class="quantity-selector">
                    <button class="qty-decrease" title="Restar 1" ${!isAvailable ? 'disabled' : ''}>-</button>
                    <input type="number" class="qty-input" value="${item.quantity}" min="1" max="${maxStock}" ${!isAvailable ? 'disabled' : ''}>
                    <button class="qty-increase" title="Sumar 1" ${isMaxQuantity || !isAvailable ? 'disabled' : ''}>+</button>
                </div>
                
                <button class="cart-item-remove">Quitar</button>
            </div>
        `;
        cartItemsList.appendChild(itemElement);
    });
}

/**
 * Calcula y muestra el resumen de costos.
 */
function renderSummary(cart: ICartDetail[]) {
    const subtotal = cart.reduce((acc, item) => acc + (item.precio * item.quantity), 0);
    const total = subtotal + SHIPPING_COST;

    summarySubtotal.textContent = `$${subtotal.toFixed(2)}`;
    summaryShipping.textContent = `$${SHIPPING_COST.toFixed(2)}`;
    summaryTotal.textContent = `$${total.toFixed(2)}`;
}

/**
 * Configura los listeners.
 */
function setupEventListeners() {
    clearCartBtn.addEventListener("click", async () => {
        const didConfirm = await showConfirmation(
            "¿Estás seguro de que quieres vaciar el carrito?",
            "Vaciar Carrito",
            "Vaciar"
        );
        if (didConfirm) {
            clearCart();
            showNotification("Carrito vaciado con éxito.", 'success');
            loadAndRenderCart();
        }
    });

    cartItemsList.addEventListener("click", async (event) => {
        const target = event.target as HTMLElement;
        const itemElement = target.closest<HTMLDivElement>(".cart-item");
        if (!itemElement || !itemElement.dataset.productId) return;

        const productId = Number(itemElement.dataset.productId);
        const input = itemElement.querySelector(".qty-input") as HTMLInputElement;
        let currentQuantity = Number(input.value);

        // 9. BUSCAMOS EL STOCK DEL PRODUCTO
        const product = allProducts.find(p => p.id === productId);
        if (!product) return; // No debería pasar
        const stock = product.stock;

        if (target.classList.contains("cart-item-remove")) {
            const didConfirm = await showConfirmation(
                `¿Quieres eliminar "${product.nombre}" del carrito?`,
                "Quitar Producto",
                "Quitar"
            );
            if (didConfirm) {
                removeFromCart(productId);
                showNotification(`"${product.nombre}" quitado del carrito.`, 'success');
                loadAndRenderCart();
            }
        }

        if (target.classList.contains("qty-decrease")) {
            currentQuantity--; // Restamos
            if (currentQuantity <= 0) {
                const didConfirm = await showConfirmation(
                    "¿Quieres eliminar este producto del carrito?", "Quitar Producto", "Quitar");
                if (didConfirm) {
                    removeFromCart(productId);
                    showNotification("Producto eliminado con éxito", 'success')
                }
            } else {
                updateItemQuantity(productId, currentQuantity);
            }
            loadAndRenderCart();
        }

        if (target.classList.contains("qty-increase")) {
            // 10. VALIDAMOS EL BOTÓN '+' CONTRA EL STOCK
            if (currentQuantity < stock) {
                currentQuantity++; // Solo sumamos si es menor al stock
                updateItemQuantity(productId, currentQuantity);
            } else {
                showNotification("Stock máximo alcanzado", 'info');
            }
            loadAndRenderCart();
        }
    });

    cartItemsList.addEventListener("change", (event) => {
        const target = event.target as HTMLInputElement;
        if (target.classList.contains("qty-input")) {
            const itemElement = target.closest<HTMLDivElement>(".cart-item");
            if (!itemElement || !itemElement.dataset.productId) return;

            const productId = Number(itemElement.dataset.productId);

            // 11. VALIDAMOS EL INPUT CONTRA EL STOCK
            const product = allProducts.find(p => p.id === productId);
            if (!product) return;
            const stock = product.stock;

            let newQuantity = Number(target.value);

            if (newQuantity > stock) {
                showNotification(`Stock máximo es ${stock}. Ajustando cantidad.`, 'info');
                newQuantity = stock;
            }
            if (newQuantity <= 0) {
                newQuantity = 1;
            }

            updateItemQuantity(productId, newQuantity);
            loadAndRenderCart();
        }
    });

    // BOTON "PROCEDER AL PAGO" (ABRE EL MODAL)
    checkoutBtn.addEventListener("click", () => {
        // Actualizamos el total en el modal antes de mostrarlo
        const total = summaryTotal.textContent;
        checkoutTotalDisplay.textContent = total;

        // Mostramos el modal
        checkoutModal.classList.remove("hidden");

        // 14. BOTÓN "X" DEL MODAL (CIERRA EL MODAL)
        cancelModalBtn.addEventListener("click", () => {
            checkoutModal.classList.add("hidden");
        });

        // 15. LISTENER PARA EL ENVÍO DEL FORMULARIO DE CHECKOUT
        checkoutForm.addEventListener("submit", async (event) => {
            event.preventDefault(); // Evita que la página se recargue

            // Obtenemos los valores (solo los requeridos)
            const phone = (document.getElementById("checkout-phone") as HTMLInputElement).value;
            const address = (document.getElementById("checkout-address") as HTMLInputElement).value;
            const payment = (document.getElementById("checkout-payment") as HTMLSelectElement).value;
            const notes = (document.getElementById("checkout-notes") as HTMLTextAreaElement).value;

            if (!phone || !address || !payment) {
                showNotification("Por favor, completa el teléfono, la dirección y el metodo de pago.", 'error');
                return; // Detenemos el envío
            }

            // --- INICIO DE LA LÓGICA DE CHECKOUT ---

            // 1. OBTENER ITEMS Y USUARIO
            const cart = getCart();
            const user = getUser();

            // Validamos que el usuario exista
            if (!user) {
                showNotification("Tu sesión ha expirado. Por favor, vuelve a iniciar sesión.", 'error');
                navigateTo(PATHS.LOGIN);
                return;
            }

            // --- NUEVA VALIDACIÓN DE STOCK ANTES DE ENVIAR ---
            let stockError = false;
            for (const item of cart) {
                const productInfo = allProducts.find(p => p.id === item.id);
                if (!productInfo || !productInfo.activo || item.quantity > productInfo.stock) {
                    const stockMsg = productInfo ? `(Máx: ${productInfo.stock})` : '(Producto no encontrado)';
                    showNotification(`El producto "${item.nombre}" no está disponible o no hay stock ${stockMsg}`, 'info');
                    stockError = true;
                    break; // Detiene el bucle
                }
            }

            if (stockError) {
                // Detenemos el envío y recargamos la vista del carrito para que el usuario vea el error
                loadAndRenderCart();
                return;
            }

            if (cart.length === 0) {
                showNotification("Tu carrito está vacío.", 'error');
                return;
            }

            const subtotal = cart.reduce((acc, item) => acc + (item.precio * item.quantity), 0);
            const total = subtotal + SHIPPING_COST;

            // 2. FORMATEAR LOS DATOS PARA LA API
            const detallesParaApi: IDetallePedidoCreate[] = cart.map(item => ({
                cantidad: item.quantity,
                subtotal: item.precio * item.quantity,
                producto_id: item.id
            }));

            // Creamos el objeto IOrderCreate
            const orderData: IOrderCreate = {
                total: total,
                detallePedidos: detallesParaApi,
                telefono: phone,
                direccion: address,
                metodoPago: payment,
                notas: notes,
                usuarioId: user.id
            };

            // 3. ENVIAR A LA API
            const submitButton = (event.submitter as HTMLButtonElement);
            try {
                // Deshabilitamos el botón para evitar doble click
                submitButton.disabled = true;
                submitButton.textContent = "Procesando...";

                await createOrder(orderData);

                // 4. ÉXITO
                sessionStorage.setItem('welcomeMessage', '¡Pedido realizado con éxito!');

                clearCart(); // Limpiamos el carrito

                // Redirigimos al usuario a "Mis Pedidos"
                navigateTo(PATHS.CLIENT_ORDERS);

            } catch (error) {
                console.error("Error al crear el pedido:", error);
                const msg = (error instanceof Error) ? error.message : "Ocurrió un error al enviar tu pedido";
                showNotification(msg, 'error');
                // Volvemos a habilitar el botón si hay error
                submitButton.disabled = false;
                submitButton.textContent = "Confirmar Pedido";
            }
        });
    })
}