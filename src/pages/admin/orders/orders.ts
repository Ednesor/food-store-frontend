import { setupAdminAuth } from "@/utils/auth";
import { getOrders, updateOrderStatus, cancelOrder } from "@/utils/api";
import type { IOrder, IDetallePedido, EstadoPedido } from "@/types/IOrders";
import { showNotification } from "@/utils/notifications";
import { showConfirmation } from "@/utils/confirmation";

/*
=========================================================
    REFERENCIAS AL DOM
=========================================================
*/
const ordersListContainer = document.getElementById("orders-list-container") as HTMLDivElement;
const filterStatus = document.getElementById("filter-status") as HTMLSelectElement;

// Referencias del Modal
const modal = document.getElementById("order-detail-modal") as HTMLDivElement;
const modalTitle = document.getElementById("modal-title") as HTMLHeadingElement;
const closeModalBtn = document.getElementById("close-modal-btn") as HTMLButtonElement;
const modalProductsList = document.getElementById("modal-products-list") as HTMLDivElement;
const modalCosts = document.getElementById("modal-costs") as HTMLDivElement;
const modalStatusSelect = document.getElementById("modal-status-select") as HTMLSelectElement;
const updateStatusBtn = document.getElementById("update-status-btn") as HTMLButtonElement;

// Spans de info del modal
const modalOrderDate = document.getElementById("modal-order-date") as HTMLSpanElement;
const modalClientName = document.getElementById("modal-client-name") as HTMLSpanElement;
const modalClientPhone = document.getElementById("modal-client-phone") as HTMLSpanElement;
const modalClientAddress = document.getElementById("modal-client-address") as HTMLSpanElement;
const modalClientPayment = document.getElementById("modal-client-payment") as HTMLSpanElement;

/*
=========================================================
    CONSTANTES
=========================================================
*/
// Esta constante solo se usaría si el cálculo falla.
const FALLBACK_SHIPPING_COST = 500;

/*
=========================================================
    ESTADO
=========================================================
*/
// Guardan los datos maestros de la API
let allOrders: IOrder[] = [];
// Guarda el ID del pedido que se está editando en el modal
let currentEditingOrderId: number | null = null;


/*
=========================================================
    INICIALIZACIÓN
=========================================================
*/
document.addEventListener("DOMContentLoaded", initializeApp);

/**
 * Flujo principal de la página
 */
async function initializeApp() {
    setupAdminAuth(); // Protege la ruta
    await loadAndRenderOrders();
    setupEventListeners();
}

/**
 * Carga los pedidos desde la API y los renderiza
 */
async function loadAndRenderOrders() {
    try {
        allOrders = await getOrders();
        // Por defecto, renderiza todos
        renderOrderCards(allOrders);
    } catch (error) {
        console.error("Error al cargar los pedidos:", error);
        ordersListContainer.innerHTML = `<p style="color: var(--danger)">Error al cargar pedidos. Intente nuevamente.</p>`;
    }
}

/**
 * Configura los listeners para filtros y botones
 */
function setupEventListeners() {
    filterStatus.addEventListener("change", handleFilterChange);
    closeModalBtn.addEventListener("click", closeModal);
    updateStatusBtn.addEventListener("click", handleStatusUpdate);

    // Delegación de eventos para abrir el modal
    ordersListContainer.addEventListener("click", (event) => {
        const card = (event.target as HTMLElement).closest<HTMLDivElement>(".order-card");
        if (card && card.dataset.orderId) {
            const id = Number(card.dataset.orderId);
            openOrderDetailModal(id);
        }
    });
}

/*
=========================================================
    RENDERIZADO DE LA LISTA
=========================================================
*/

/**
 * Renderiza las tarjetas de pedido en el contenedor principal
 */
function renderOrderCards(orders: IOrder[]) {
    ordersListContainer.innerHTML = ""; // Limpiar

    if (orders.length === 0) {
        ordersListContainer.innerHTML = `<p style="color: var(--text-secondary); text-align: center; padding: 40px;">No se encontraron pedidos.</p>`;
        return;
    }

    // Ordenamos por fecha (más recientes primero)
    orders.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

    orders.forEach(order => {
        const card = document.createElement("div");
        card.className = "order-card";
        card.dataset.orderId = String(order.id);

        // Badge de estado
        const badgeClass = `status-badge status-${order.estado.toLowerCase()}`;

        // Formatear fecha
        const orderDate = new Date(order.fecha);
        const dateStr = orderDate.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
        const timeStr = orderDate.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
        });

        card.innerHTML = `
            <div class="order-card-info">
                <div class="info-row">
                    <h3>Pedido #ORD-${order.id}</h3>
                </div>
                <div class="info-row">
                    <p class="client-name">Cliente: ${order.usuario.name}</p>
                </div>
                <p class="date">${dateStr}, ${timeStr}</p>
                <p class="items">${order.detallePedidos.length} producto(s)</p>
            </div>
            <div class="order-card-actions">
                <span class="total">$${order.total.toFixed(2)}</span>
                <span class="${badgeClass}">${order.estado}</span>
            </div>
        `;
        ordersListContainer.appendChild(card);
    });
}

/**
 * Maneja el cambio en el filtro de estado
 */
function handleFilterChange() {
    const status = filterStatus.value;

    if (status === "TODOS") {
        renderOrderCards(allOrders);
    } else {
        const filtered = allOrders.filter(order => order.estado === status);
        renderOrderCards(filtered);
    }
}


/*
=========================================================
    LÓGICA DEL MODAL
=========================================================
*/

/**
 * Abre el modal y lo rellena con la info del pedido
 */
function openOrderDetailModal(id: number) {
    currentEditingOrderId = id;
    const order = allOrders.find(o => o.id === id);

    if (!order) {
        console.error("No se encontró el pedido con id:", id);
        return;
    }

    // 1. Rellenar Título e Info Básica
    modalTitle.textContent = `Detalle del Pedido #ORD-${order.id}`;

    const orderDate = new Date(order.fecha);
    const dateStr = orderDate.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });
    const timeStr = orderDate.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
    });
    modalOrderDate.textContent = `${dateStr}, ${timeStr}`;

    // Rellena la info del cliente cuando la api lo soporte.
    modalClientName.textContent = order.usuario.name || "(No especificado)";
    modalClientPhone.textContent = order.telefono || "(No especificado)";
    modalClientAddress.textContent = order.direccion || "(No especificado)";
    modalClientPayment.textContent = order.metodoPago || "(No especificado)";

    // 2. Rellenar Productos
    renderModalProductList(order.detallePedidos);

    // 3. Rellenar Costos
    // Calculamos el subtotal sumando los detalles
    const subtotal = order.detallePedidos.reduce((acc, item) => acc + item.subtotal, 0);

    // Calculamos el envío dinámicamente.
    // El 'order.total' viene de la API (ya incluye el envío).
    let shipping = order.total - subtotal;
    if (shipping < 0) {
        // Si algo es inconsistente, usamos el fallback
        shipping = FALLBACK_SHIPPING_COST;
    }

    modalCosts.innerHTML = `
        <div>
            <span>Subtotal:</span>
            <span>$${subtotal.toFixed(2)}</span>
        </div>
        <div>
            <span>Envío:</span>
            <span>$${shipping.toFixed(2)}</span>
        </div>
        <div class="total">
            <span>Total:</span>
            <span>$${order.total.toFixed(2)}</span>
        </div>
    `;

    // 4. Setear el select
    modalStatusSelect.value = order.estado;

    // 5. Deshabilitar opciones si el pedido está en un estado final
    const isFinalState = order.estado === 'TERMINADO' || order.estado === 'CANCELADO';
    modalStatusSelect.disabled = isFinalState;
    updateStatusBtn.disabled = isFinalState;

    // Permitir reactivar un pedido cancelado (si se desea)
    if (order.estado === 'CANCELADO') {
        modalStatusSelect.disabled = false;
        updateStatusBtn.disabled = false;
    }

    openModal();
}

/**
 * Renderiza la lista de productos dentro del modal
 */
function renderModalProductList(detalles: IDetallePedido[]) {
    modalProductsList.innerHTML = "";
    if (detalles.length === 0) {
        modalProductsList.innerHTML = "<p style='color: var(--text-secondary);'>No hay productos en este pedido.</p>";
        return;
    }

    detalles.forEach(item => {
        // Calculamos el precio unitario (el subtotal del detalle / cantidad)
        const precioUnitario = item.subtotal / item.cantidad;
        modalProductsList.innerHTML += `
            <div class="modal-product-item">
                <span class="name">
                    ${item.producto.nombre}
                    <br>
                    <span style="font-size: 0.85rem; color: var(--text-secondary);">
                        Cantidad: ${item.cantidad} · $${precioUnitario.toFixed(2)}
                    </span>
                </span>
                <span class="price">$${item.subtotal.toFixed(2)}</span>
            </div>
        `;
    });
}

/**
 * Maneja el click en el botón "Actualizar" del modal
 */
async function handleStatusUpdate() {
    if (!currentEditingOrderId) return;

    const newState = modalStatusSelect.value as EstadoPedido;

    // 1. Buscamos el pedido original en nuestro array de estado
    const order = allOrders.find(o => o.id === currentEditingOrderId);
    
    if (!order) {
        // Esto es solo un seguro, no debería pasar
        console.error("Error: No se encontró el pedido para comparar estados.");
        return;
    }

    // 2. Comparamos el estado original con el nuevo
    if (newState === order.estado) {
        // Si son iguales, mostramos una notificación y salimos
        showNotification("El pedido ya se encuentra en este estado.", 'info');
        return;
    }

    // 3. Si son diferentes, continuamos con la confirmación
    const didConfirm = await showConfirmation(`¿Estás seguro de cambiar el estado a "${newState}"?`, `Cambiar estado`, `Cambiar`)
    
    if (didConfirm) {
        try {
            updateStatusBtn.disabled = true;
            updateStatusBtn.textContent = "Actualizando...";

            if (newState === 'CANCELADO') {
                await cancelOrder(currentEditingOrderId);
            } else {
                await updateOrderStatus(currentEditingOrderId, newState);
            }

            showNotification("Estado actualizado con éxito.", 'success')
            closeModal();
            await loadAndRenderOrders(); 

        } catch (error) {
            console.error("Error al actualizar estado:", error);
            showNotification(`Error al actualizar: ${error}`, 'error')
        } finally {
            updateStatusBtn.disabled = false;
            updateStatusBtn.textContent = "Actualizar Estado";
        }
    }
}


/*
=========================================================
    FUNCIONES AUXILIARES DEL MODAL
=========================================================
*/
function openModal() { modal.classList.remove("hidden"); }
function closeModal() {
    modal.classList.add("hidden");
    currentEditingOrderId = null;
}