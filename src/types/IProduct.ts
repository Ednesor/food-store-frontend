import type { ICategoria } from "./ICategoria";

export interface IProduct {
    id: number;
    nombre: string;
    descripcion: string;
    precio: number;
    urlImagen: string;
    stock: number;
    activo: boolean;
    categoria: ICategoria;
}