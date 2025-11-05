export interface ICartItem {
    id: number;       // ID del producto
    nombre: string;
    precio: number;
    urlImagen: string;
    quantity: number; // Cantidad de este item en el carrito
}