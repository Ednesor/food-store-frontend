import { API_BASE_URL } from '@/config/contants';
import type { IRegister } from '@/types/IRegister';
import type { IUser } from '@/types/IUser';
import type { IProduct } from '@/types/IProduct';
import type { ICategoria } from '@/types/ICategoria';


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
export async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const BASE_URL = API_BASE_URL;
    const url = `${BASE_URL}${endpoint}`;
    console.log("➡️ Haciendo request a:", url);

    try {
        const res = await fetch(url, {
            headers: { "Content-Type": "application/json" },
            ...options,
        });

        console.log("🔁 Response status:", res.status);

        // Si el servidor no responde OK (200–299)
        if (!res.ok) {
            const text = await res.text();
            console.error("❌ Error HTTP:", res.status, text);
            throw new Error(`Error ${res.status}: ${text}`);
        }

        // Intentamos parsear JSON
        const text = await res.text();
        console.log("📦 Raw response:", text);

        try {
            const json = JSON.parse(text);
            console.log("✅ JSON parseado:", json);
            return json;
        } catch (err) {
            console.warn("⚠️ No se pudo parsear JSON:", err);
            throw new Error("Respuesta no JSON del servidor");
        }
    } catch (error) {
        if (error instanceof Error) {
            console.error("🔥 Error general en request():", error.message);
        } else {
            console.error("🔥 Error inesperado y de tipo desconocido:", String(error));
        }
        throw error;
    }
}


/*
==============================
    METODOS DE AUTH
==============================
*/
export async function loginUser(email: string, password: string): Promise<IUser> {
    return request<IUser>("/users/login", {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });
}

export async function registerUser(data: IRegister): Promise<IUser> {
    return request<IUser>("/users/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
}

/*
=========================================================
    MÉTODOS PARA OBTENER DATOS DEL CATÁLOGO
=========================================================
*/

/*
 * Obtiene todas las categorías desde el backend.
 * El método es GET por defecto en nuestra función 'request'.
*/
export async function getCategories(): Promise<ICategoria[]> {
    return request<ICategoria[]>("/categorias");
}

/*
 * Obtiene todos los productos desde el backend.
*/
export async function getProducts(): Promise<IProduct[]> {
    return request<IProduct[]>("/productos");
}