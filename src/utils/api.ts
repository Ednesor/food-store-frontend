import { API_BASE_URL } from '@/config/contants';
import type { IRegister } from '@/types/IRegister';
import type { IUser } from '@/types/IUser';
import type { IProduct } from '@/types/IProduct';
import type { ICategoria } from '@/types/ICategoria';
import type { IOrder, IOrderCreate, EstadoPedido } from '@/types/IOrders';


//Prueba de conexion con el backend
export async function prueba() {
    const url = "http://localhost:8080/api/alive";
    try {
        const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
        console.log('response a');
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }

        const result = await response.text();
        console.log('resultado', result);
    } catch (error: any) {
        console.error(error.message);
    }
}
/*
==============================================
    FUNCION GENERICA PARA HACER REQUESTS
==============================================
*/
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log(`➡️ Request: ${options.method || 'GET'} ${url}`);

    try {
        const response = await fetch(url, {
            headers: { "Content-Type": "application/json" },
            ...options,
        });

        // Si el servidor no responde OK (200–299)
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ Error HTTP ${response.status}:`, errorText);
            throw new Error(`Error del servidor: ${errorText || response.statusText}`);
        }

        // Si la respuesta es 204 (No Content), simplemente retornamos null
        if (response.status === 204) {
            return null as T;
        }
        
        const responseText = await response.text();

        if (responseText) {
            try {
                // Intentamos parsear como JSON
                return JSON.parse(responseText) as T;
            } catch (e) {
                console.log("Respuesta no es JSON, pero la petición fue exitosa:", responseText);
                return null as T;
            }
        }
        return null as T;

    } catch (error) {
        console.error("🔥 Error en la función request:", error);
        throw error;
    }
}

/*
==============================
    METODOS DE AUTH
==============================
*/
export function loginUser(email: string, password: string): Promise<IUser> {
    return request<IUser>("/users/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
    });
}

export function registerUser(data: IRegister): Promise<IUser> {
    return request<IUser>("/users/signup", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

/*
=========================================================
    MÉTODOS DEL CATÁLOGO
=========================================================
*/
export function getCategories(): Promise<ICategoria[]> {
    return request<ICategoria[]>("/categorias");
}

export function getProducts(): Promise<IProduct[]> {
    return request<IProduct[]>("/productos");
}

/*
=========================================================
    MÉTODOS PARA CRUD DE CATEGORÍAS
=========================================================
*/
type CategoryData = Omit<ICategoria, 'id'>;

export function createCategory(data: CategoryData): Promise<ICategoria> {
    return request<ICategoria>("/categorias", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export function updateCategory(id: number, data: CategoryData): Promise<ICategoria> {
    return request<ICategoria>(`/categorias/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
    });
}

export function deleteCategory(id: number): Promise<void> {
    return request<void>(`/categorias/${id}`, {
        method: "DELETE",
    });
}

/*
=========================================================
    MÉTODOS PARA CRUD DE PRODUCTOS
=========================================================
*/
// Usamos un tipo para los datos de creación/actualización de productos
type ProductData = {
    nombre: string;
    descripcion: string;
    precio: number;
    stock: number;
    categoriaId: number;
    urlImagen: string;
};

export function getProductById(id: number): Promise<IProduct> {
    return request<IProduct>(`/productos/${id}`);
}

export function createProduct(data: ProductData): Promise<IProduct> {
    return request<IProduct>("/productos", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export function updateProduct(id: number, data: ProductData): Promise<IProduct> {
    return request<IProduct>(`/productos/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
    });
}

export function updateProductStatus(id: number): Promise<IProduct> {
    return request<IProduct>(`/productos/status/${id}`, {
        method: "PUT",
    });
}

export function deleteProduct(id: number): Promise<void> {
    return request<void>(`/productos/${id}`, {
        method: "DELETE",
    });
}

/*
=========================================================
    MÉTODOS PARA GESTIÓN DE PEDIDOS
=========================================================
*/

/**
 * Obtiene TODOS los pedidos (para el Admin).
 */
export function getOrders(): Promise<IOrder[]> {
    return request<IOrder[]>("/pedidos");
}

/**
 * Obtiene los pedidos DE UN USUARIO (para el Cliente).
 */
export function getOrdersByUserId(id: number): Promise<IOrder[]> {
    return request<IOrder[]>(`/pedidos/getAll/${id}`);
}

/**
 * Crea un nuevo pedido (para el Cliente).
 */
export function createOrder(data: IOrderCreate): Promise<IOrder> {
    return request<IOrder>("/pedidos", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

/**
 * Actualiza el estado de un pedido (para el Admin).
 */
export function updateOrderStatus(id: number, estado: EstadoPedido): Promise<IOrder> {
    let endpoint: string;

    switch (estado) {
        case "CONFIRMADO":
            endpoint = `/pedidos/confirmar/${id}`;
            break;
        case "TERMINADO":
            endpoint = `/pedidos/terminar/${id}`;
            break;
        default:
            throw new Error(`Estado '${estado}' no es actualizable por esta función.`);
    }

    return request<IOrder>(endpoint, {
        method: "POST",
    });
}

/**
 * Cancela un pedido (para el Admin o Cliente.
 */
export function cancelOrder(id: number): Promise<void> {
    return request<void>(`/pedidos/cancelar/${id}`, {
        method: "PUT",
    });
}