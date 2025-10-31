import type { IProduct } from "@/types/IProduct";
import type { ICategoria } from "@/types/ICategoria";
import { getProducts, getCategories, createProduct, updateProduct, deleteProduct, updateProductStatus } from "@/utils/api";
import { setupAdminAuth } from "@/utils/auth";

// Referencias al DOM
const tableBody = document.getElementById("product-table-body") as HTMLTableSectionElement;
const modal = document.getElementById("product-modal") as HTMLDivElement;
const modalTitle = document.getElementById("modal-title") as HTMLHeadingElement;
const productForm = document.getElementById("product-form") as HTMLFormElement;
const newProductBtn = document.getElementById("new-product-btn") as HTMLButtonElement;
const cancelModalBtn = document.getElementById("cancel-modal") as HTMLButtonElement;

// Inputs del formulario
const nameInput = document.getElementById("prod-name") as HTMLInputElement;
const descriptionInput = document.getElementById("prod-description") as HTMLTextAreaElement;
const priceInput = document.getElementById("prod-price") as HTMLInputElement;
const stockInput = document.getElementById("prod-stock") as HTMLInputElement;
const categorySelect = document.getElementById("prod-category") as HTMLSelectElement;
const imageInput = document.getElementById("prod-image") as HTMLInputElement;
const activeCheckbox = document.getElementById("prod-active") as HTMLInputElement;

// Estado
let editingProductId: number | null = null;
let allProducts: IProduct[] = [];
let allCategories: ICategoria[] = [];

// Inicialización
document.addEventListener("DOMContentLoaded", async () => {
    setupAdminAuth();
    await loadInitialData();
    setupEventListeners();
});

// Carga inicial de datos
async function loadInitialData() {
    try {
        [allProducts, allCategories] = await Promise.all([getProducts(), getCategories()]);
        renderTable(allProducts);
        populateCategorySelect(allCategories);
    } catch (error) {
        console.error("Error al cargar datos iniciales:", error);
        tableBody.innerHTML = `<tr><td colspan="9">Error al cargar datos. Intente nuevamente.</td></tr>`;
    }
}

// Renderiza la tabla de productos
function renderTable(products: IProduct[]) {
    tableBody.innerHTML = "";
    if (products.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="9">No hay productos para mostrar.</td></tr>`;
        return;
    }
    products.forEach(prod => {
        const tr = document.createElement("tr");
        tr.dataset.productId = String(prod.id);
        tr.innerHTML = `
            <td>${prod.id}</td>
            <td><img src="${prod.urlImagen}" alt="${prod.nombre}" class="category-thumbnail"></td>
            <td>${prod.nombre}</td>
            <td>${prod.descripcion}</td>
            <td>$${prod.precio.toFixed(2)}</td>
            <td>${prod.categoria.nombre}</td>
            <td>${prod.stock}</td>
            <td>
                <span class="status-badge ${prod.activo ? 'status-active' : 'status-inactive'}">
                    ${prod.activo ? 'Activo' : 'Inactivo'}
                </span>
            </td>
            <td>
                <button class="action-btn action-edit">Editar</button>
                <button class="action-btn action-delete">Eliminar</button>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

// Llena el <select> del modal con las categorías
function populateCategorySelect(categories: ICategoria[]) {
    categorySelect.innerHTML = '<option value="">Seleccione una categoría</option>';
    categories.forEach(cat => {
        const option = document.createElement("option");
        option.value = String(cat.id);
        option.textContent = cat.nombre;
        categorySelect.appendChild(option);
    });
}

// Configura los listeners
function setupEventListeners() {
    newProductBtn.addEventListener("click", openNewProductModal);
    cancelModalBtn.addEventListener("click", closeModal);
    productForm.addEventListener("submit", handleFormSubmit);

    tableBody.addEventListener("click", (event) => {
        const target = event.target as HTMLButtonElement;
        const row = target.closest("tr");
        if (!row || !row.dataset.productId) return;

        const productId = parseInt(row.dataset.productId, 10);
        if (target.classList.contains("action-edit")) {
            openEditProductModal(productId);
        }
        if (target.classList.contains("action-delete")) {
            handleDelete(productId);
        }
    });
}

// Abre el modal para un nuevo producto
function openNewProductModal() {
    editingProductId = null;
    modalTitle.textContent = "Nuevo Producto";
    productForm.reset();
    activeCheckbox.checked = true;
    openModal();
}

// Abre el modal para editar un producto
function openEditProductModal(id: number) {
    editingProductId = id;
    const product = allProducts.find(p => p.id === id);
    if (!product) return;

    modalTitle.textContent = "Editar Producto";
    nameInput.value = product.nombre;
    descriptionInput.value = product.descripcion;
    priceInput.value = String(product.precio);
    stockInput.value = String(product.stock);
    categorySelect.value = String(product.categoria.id);
    imageInput.value = product.urlImagen;
    activeCheckbox.checked = product.activo;
    openModal();
}

// Maneja el envío del formulario para crear o actualizar productos.
// Si se está editando, actualiza los datos y también verifica si el estado "activo" ha cambiado para realizar una actualización específica.
// Si se está creando, simplemente envía los datos del nuevo producto. Al finalizar, cierra el modal y recarga la tabla.
async function handleFormSubmit(event: SubmitEvent) {
    event.preventDefault();
    const productData = {
        nombre: nameInput.value.trim(),
        descripcion: descriptionInput.value.trim(),
        precio: parseFloat(priceInput.value),
        stock: parseInt(stockInput.value, 10),
        categoriaId: parseInt(categorySelect.value, 10),
        urlImagen: imageInput.value.trim(),
    };

    if (isNaN(productData.precio) || isNaN(productData.stock) || isNaN(productData.categoriaId)) {
        alert("Por favor, complete todos los campos correctamente.");
        return;
    }

    try {
        if (editingProductId) {
            const originalProduct = allProducts.find(p => p.id === editingProductId);
            if (!originalProduct) throw new Error("Producto no encontrado.");

            const originalStatus = originalProduct.activo;
            const newStatus = activeCheckbox.checked;

            await updateProduct(editingProductId, productData);

            if (originalStatus !== newStatus) {
                await updateProductStatus(editingProductId);
            }
        } else {
            // La creación de un producto nuevo ya lo pone como 'activo' por defecto en el backend
            await createProduct(productData);
        }

        closeModal();
        loadInitialData();
    } catch (error) {
        alert(`Error al guardar el producto: ${error}`);
    }
}

// Maneja la eliminación
async function handleDelete(id: number) {
    if (confirm("¿Estás seguro de que quieres eliminar este producto?")) {
        try {
            await deleteProduct(id);
            loadInitialData();
        } catch (error) {
            alert(`Error al eliminar el producto: ${error}`);
        }
    }
}

// Funciones auxiliares del modal
function openModal() { modal.classList.remove("hidden"); }
function closeModal() { modal.classList.add("hidden"); }