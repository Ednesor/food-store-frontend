import type { ICategoria } from "@/types/ICategoria";
import { getCategories, createCategory, updateCategory, deleteCategory } from "@/utils/api";
import { setupAdminAuth } from "@/utils/auth";

// Referencias al DOM
const tableBody = document.getElementById("category-table-body") as HTMLTableSectionElement;
const modal = document.getElementById("category-modal") as HTMLDivElement;
const modalTitle = document.getElementById("modal-title") as HTMLHeadingElement;
const categoryForm = document.getElementById("category-form") as HTMLFormElement;
const newCategoryBtn = document.getElementById("new-category-btn") as HTMLButtonElement;
const cancelModalBtn = document.getElementById("cancel-modal") as HTMLButtonElement;
const nameInput = document.getElementById("cat-name") as HTMLInputElement;
const descriptionInput = document.getElementById("cat-description") as HTMLTextAreaElement;
const imageInput = document.getElementById("cat-image") as HTMLInputElement;

// Estado para manejar si estamos creando o editando
let editingCategoryId: number | null = null;

// Inicialización de la página
document.addEventListener("DOMContentLoaded", () => {
    setupAdminAuth(); // Protege la página
    setupEventListeners();
    loadAndRenderCategories();
});

// Carga las categorías desde la API y las muestra en la tabla
async function loadAndRenderCategories() {
    try {
        const categories = await getCategories();
        renderTable(categories);
    } catch (error) {
        console.error("Error al cargar categorías:", error);
        tableBody.innerHTML = `<tr><td colspan="5">Error al cargar datos. Intente nuevamente.</td></tr>`;
    }
}

// Dibuja las filas de la tabla
function renderTable(categories: ICategoria[]) {
    tableBody.innerHTML = "";
    if (categories.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5">No hay categorías para mostrar.</td></tr>`;
        return;
    }
    categories.forEach(cat => {
        const tr = document.createElement("tr");
        tr.dataset.categoryId = String(cat.id); // Guardamos el ID para fácil acceso
        tr.innerHTML = `
            <td>${cat.id}</td>
            <td><img src="${cat.urlImagen}" alt="${cat.nombre}" width="50" height="50" class="category-thumbnail"></td>
            <td>${cat.nombre}</td>
            <td>${cat.descripcion}</td>
            <td>
                <button class="action-btn action-edit">Editar</button>
                <button class="action-btn action-delete">Eliminar</button>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

// Configura todos los listeners de la página
function setupEventListeners() {
    newCategoryBtn.addEventListener("click", openNewCategoryModal);
    cancelModalBtn.addEventListener("click", closeModal);
    categoryForm.addEventListener("submit", handleFormSubmit);

    // Usamos delegación de eventos para los botones de la tabla
    tableBody.addEventListener("click", (event) => {
        const target = event.target as HTMLButtonElement;
        const row = target.closest("tr");
        if (!row) return;

        const categoryId = parseInt(row.dataset.categoryId!, 10);

        if (target.classList.contains("action-edit")) {
            openEditCategoryModal(categoryId);
        }
        if (target.classList.contains("action-delete")) {
            handleDelete(categoryId);
        }
    });
}

// Abre el modal para crear una nueva categoría
function openNewCategoryModal() {
    editingCategoryId = null;
    modalTitle.textContent = "Nueva Categoría";
    categoryForm.reset();
    openModal();
}

// Abre el modal para editar una categoría existente
async function openEditCategoryModal(id: number) {
    editingCategoryId = id;
    const categories = await getCategories();
    const category = categories.find(c => c.id === id);
    if (!category) return;

    modalTitle.textContent = "Editar Categoría";
    nameInput.value = category.nombre;
    descriptionInput.value = category.descripcion;
    imageInput.value = category.urlImagen;
    openModal();
}

// Maneja el envío del formulario (crear o actualizar)
async function handleFormSubmit(event: SubmitEvent) {
    event.preventDefault();
    const categoryData = {
        nombre: nameInput.value.trim(),
        descripcion: descriptionInput.value.trim(),
        urlImagen: imageInput.value.trim(),
    };

    if (!categoryData.nombre || !categoryData.descripcion || !categoryData.urlImagen) {
        alert("Todos los campos son obligatorios.");
        return;
    }

    try {
        if (editingCategoryId) {
            await updateCategory(editingCategoryId, categoryData);
        } else {
            await createCategory(categoryData);
        }
        closeModal();
        loadAndRenderCategories();
    } catch (error) {
        alert(`Error al guardar la categoría: ${error}`);
    }
}

// Maneja la eliminación de una categoría
async function handleDelete(id: number) {
    if (confirm("¿Estás seguro de que quieres eliminar esta categoría?")) {
        try {
            await deleteCategory(id);
            loadAndRenderCategories();
        } catch (error) {
            alert(`Error al eliminar la categoría: ${error}`);
        }
    }
}

// Funciones auxiliares para el modal
function openModal() { modal.classList.remove("hidden"); }
function closeModal() { modal.classList.add("hidden"); }