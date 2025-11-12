import type { ICartItem } from "@/types/ICart";
import type { IProduct } from "@/types/IProduct";
import { showNotification } from "./notifications";

// Esta es la "llave" con la que guardaremos el carrito en localStorage
const CART_KEY = 'shopping_cart';

/**
 * Actualiza el contador (badge) del carrito en el header.
 * Lee el localStorage, suma las cantidades y actualiza el DOM.
 */
export function updateCartBadge(): void {
    const cart = getCart();
    const badge = document.getElementById("cart-badge") as HTMLSpanElement;

    if (!badge) return; // Si el badge no existe en la página actual

    // Sumamos la cantidad total de *items*, no solo de *productos*
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);

    if (totalItems > 0) {
        badge.textContent = String(totalItems);
        badge.classList.remove("hidden");
    } else {
        badge.textContent = "0";
        badge.classList.add("hidden");
    }
}

/**
 * Obtiene el carrito actual desde localStorage.
 * Si no hay carrito, devuelve un array vacío.
 */
export function getCart(): ICartItem[] {
    const cartData = localStorage.getItem(CART_KEY);
    return cartData ? JSON.parse(cartData) : [];
}

/**
 * Guarda el carrito completo en localStorage.
 * Esta función es "privada" del módulo (no se exporta).
 */
function saveCart(cart: ICartItem[]): void {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartBadge();
}

/**
 * Añade un producto (y su cantidad) al carrito.
 * Si el producto ya existe, actualiza su cantidad.
 * Valida el stock. 
 */
export function addToCart(product: IProduct, quantity: number): void {
    const cart = getCart();
    const existingItem = cart.find(item => item.id === product.id);

    // Obtenemos el stock máximo desde el producto
    const stock = product.stock;

    if (existingItem) {
        // --- YA EXISTÍA EN EL CARRITO ---

        // Calculamos cuál sería el nuevo total
        const newTotalQuantity = existingItem.quantity + quantity;

        if (newTotalQuantity > stock) {
            // Si el nuevo total supera el stock, ajustamos al máximo
            existingItem.quantity = stock;
            // Y avisamos al usuario
            showNotification(`Stock máximo (${stock}) alcanzado. Se ajustó tu carrito.`, 'info');
        } else {
            // Si no supera, simplemente actualizamos
            existingItem.quantity = newTotalQuantity;
            showNotification(`Añadiste ${quantity} más. Total: ${newTotalQuantity} en el carrito.`, 'info');
        }
    } else {
        // --- ES UN ITEM NUEVO ---

        if (quantity > stock) {
            // Si la cantidad que quiere agregar de golpe es mayor al stock
            showNotification(`El stock máximo es ${stock}. Se añadirán solo ${stock} items.`, 'info'); quantity = stock; // Lo limitamos al stock
        } else {
            // Es un item nuevo y la cantidad es válida
            showNotification(`¡Añadiste ${quantity} ${product.nombre} al carrito!`, 'success');
        }
        
        const newItem: ICartItem = {
            id: product.id,
            nombre: product.nombre,
            precio: product.precio,
            urlImagen: product.urlImagen,
            quantity: quantity
        };
        cart.push(newItem);
    }

    // 4. Guardar el carrito actualizado
    saveCart(cart);
}


/**
 * Elimina un producto del carrito, sin importar la cantidad.
 */
export function removeFromCart(productId: number): void {
    let cart = getCart();
    cart = cart.filter(item => item.id !== productId);
    saveCart(cart);
}

/**
 * Actualiza la cantidad específica de un producto en el carrito.
 * Si la cantidad es 0 o menos, lo elimina.
 */
export function updateItemQuantity(productId: number, newQuantity: number): void {
    let cart = getCart();
    const item = cart.find(item => item.id === productId);

    if (item) {
        if (newQuantity <= 0) {
            // Eliminar si la cantidad es 0 o negativa
            cart = cart.filter(item => item.id !== productId);
        } else {
            // Actualizar la cantidad
            item.quantity = newQuantity;
        }
        saveCart(cart);
    }
}

/**
 * Vacía completamente el carrito.
 */
export function clearCart(): void {
    localStorage.removeItem(CART_KEY);
    updateCartBadge();
}