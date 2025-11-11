import type { IProduct } from "./IProduct";
import type { IUser } from "./IUser";

/**
 * Define los estados posibles de un pedido.
 */
export type EstadoPedido = "PENDIENTE" | "CANCELADO" | "CONFIRMADO" | "TERMINADO";

/**
 * Interface para el Detalle de Pedido (Lectura).
 */
export interface IDetallePedido {
    id: number;
    cantidad: number;
    subtotal: number;
    producto: IProduct;
}

/**
 * Interface para el Pedido (Lectura).
 */
export interface IOrder {
    id: number;
    total: number;
    estado: EstadoPedido;
    fecha: string;
    detallePedidos: IDetallePedido[];
    usuario: IUser;
    telefono: string;
    direccion: string;
    metodoPago: string;
    notas: string;
}

// --- Interfaces para CREACIÓN de Pedidos ---

/**
 * Interface para crear un Detalle de Pedido.
 */
export interface IDetallePedidoCreate {
    cantidad: number;
    subtotal: number;
    producto_id: number;
}

/**
 * Interface para crear un Pedido.
 */
export interface IOrderCreate {
    total: number;
    detallePedidos: IDetallePedidoCreate[];
    telefono: string;
    direccion: string;
    metodoPago: string;
    notas: string;
    usuarioId: number;
}