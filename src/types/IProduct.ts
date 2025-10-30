export interface IProduct {
    id: number;
    urlImagen: string;
    nombre: string;
    precio: number;
    categoria: string;
    stock: number;
    estado: boolean;
    categoriaId: number; // Relación con la categoría
}