import { setupClientAuth, getUser } from "@/utils/auth";
import { getOrdersByUserId } from "@/utils/api";
import type { IOrder, IDetallePedido, EstadoPedido } from "@/types/IOrders";
import { PATHS, navigateTo } from "@/utils/navigate";

/*
=========================================================
    REFERENCIAS AL DOM
=========================================================
*/
const ordersListContainer = document.getElementById("orders-list-container") as HTMLDivElement;
const filterStatus = document.getElementById("filter-status") as HTMLSelectElement;
const emptyOrdersMessage = document.getElementById("empty-orders-message") as HTMLDivElement;

// Referencias del Modal
const modal = document.getElementById("order-detail-modal") as HTMLDivElement;
const modalTitle = document.getElementById("modal-title") as HTMLHeadingElement;
const closeModalBtn = document.getElementById("close-modal-btn") as HTMLButtonElement;
const modalProductsList = document.getElementById("modal-products-list") as HTMLDivElement;
const modalCosts = document.getElementById("modal-costs") as HTMLDivElement;
const modalStatusMessage = document.getElementById("modal-status-message") as HTMLDivElement;

// Spans de info del modal
const modalOrderDate = document.getElementById("modal-order-date") as HTMLSpanElement;
const modalClientPhone = document.getElementById("modal-client-phone") as HTMLSpanElement;
const modalClientAddress = document.getElementById("modal-client-address") as HTMLSpanElement;
const modalClientPayment = document.getElementById("modal-client-payment") as HTMLSpanElement;
const modalClientNotes = document.getElementById("modal-client-notes") as HTMLSpanElement;


/*
=========================================================
    CONSTANTES
=========================================================
*/
const FALLBACK_SHIPPING_COST = 500;

/*
=========================================================
    ESTADO
=========================================================
*/
let allOrders: IOrder[] = []; // Guardan los datos maestros de la API

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
    setupClientAuth(); // Protege la ruta (CLIENTE)
    await loadAndRenderOrders();
    setupEventListeners();
}

/**
 * Carga los pedidos desde la API y los renderiza
 */
async function loadAndRenderOrders() {
    const user = getUser();
    if (!user) {
        navigateTo(PATHS.LOGIN);
        return;
    }

    try {
        allOrders = await getOrdersByUserId(user.id);
        renderOrderCards(allOrders); // Por defecto, renderiza todos
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
    if (orders.length === 0) {
        ordersListContainer.classList.add("hidden");
        emptyOrdersMessage.classList.remove("hidden");
        return;
    }

    ordersListContainer.classList.remove("hidden");
    emptyOrdersMessage.classList.add("hidden");
    ordersListContainer.innerHTML = ""; // Limpiar

    // Ordenamos por fecha (más recientes primero)
    orders.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

    orders.forEach(order => {
        const card = document.createElement("div");
        card.className = "order-card";
        card.dataset.orderId = String(order.id);

        const badgeClass = `status-badge status-${order.estado.toLowerCase()}`;
        const orderDate = new Date(order.fecha);
        const dateStr = orderDate.toLocaleDateString('es-ES', { day: '2-digit', month: 'long' });
        const timeStr = orderDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

        card.innerHTML = `
            <div class="order-card-info">
                <div class="info-row">
                    <h3>Pedido #ORD-${order.id}</h3>
                </div>
                <p class="date">${dateStr}, ${timeStr}hs</p>
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
    LÓGICA DEL MODAL (SOLO LECTURA)
=========================================================
*/

/**
 * Abre el modal y lo rellena con la info del pedido
 */
function openOrderDetailModal(id: number) {
    const order = allOrders.find(o => o.id === id);
    if (!order) return;

    modalTitle.textContent = `Detalle del Pedido #ORD-${order.id}`;

    // 1. Info de Entrega 
    // Rellenamos con la info que sí tenemos.
    const orderDate = new Date(order.fecha);
    modalOrderDate.textContent = `${orderDate.toLocaleDateString()} ${orderDate.toLocaleTimeString()}`;

    modalClientPhone.textContent = order.telefono || "(No especificado)";
    modalClientAddress.textContent = order.direccion || "(No especificado)";
    modalClientPayment.textContent = order.metodoPago || "(No especificado)";
    modalClientNotes.textContent = order.notas || "(Ninguna)";

    // 2. Rellenar Productos
    renderModalProductList(order.detallePedidos);

    // 3. Rellenar Costos
    const subtotal = order.detallePedidos.reduce((acc, item) => acc + item.subtotal, 0);
    let shipping = order.total - subtotal;
    if (shipping < 0) shipping = FALLBACK_SHIPPING_COST;

    modalCosts.innerHTML = `
        <div><span>Subtotal:</span> <span>$${subtotal.toFixed(2)}</span></div>
        <div><span>Envío:</span> <span>$${shipping.toFixed(2)}</span></div>
        <div class="total"><span>Total:</span> <span>$${order.total.toFixed(2)}</span></div>
    `;

    // 4. Setear mensaje de estado
    updateStatusMessage(order.estado);

    openModal();
}

/**
 * Renderiza la lista de productos dentro del modal
 */
function renderModalProductList(detalles: IDetallePedido[]) {
    modalProductsList.innerHTML = "";
    detalles.forEach(item => {
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
 * Actualiza el mensaje en el modal según el estado del pedido
 */
function updateStatusMessage(estado: EstadoPedido) {
    modalStatusMessage.className = `modal-status-message status-${estado.toLowerCase()}`;
    switch (estado) {
        case "PENDIENTE":
            modalStatusMessage.innerHTML = "Tu pedido está pendiente de confirmación. El restaurant lo revisará pronto.";
            break;
        case "CONFIRMADO":
            modalStatusMessage.innerHTML = "¡Tu pedido está en preparación! Pronto estará en camino.";
            break;
        case "TERMINADO":
            modalStatusMessage.innerHTML = "Tu pedido fue entregado. ¡Que lo disfrutes!";
            break;
        case "CANCELADO":
            modalStatusMessage.innerHTML = "Este pedido fue cancelado.";
            break;
    }
}

/*
=========================================================
    FUNCIONES AUXILIARES DEL MODAL
=========================================================
*/
function openModal() { modal.classList.remove("hidden"); }
function closeModal() { modal.classList.add("hidden"); }