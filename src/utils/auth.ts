import type { IUser } from "../types/IUser";

// Guardar usuario en localStorage
export function saveUser(user: IUser): void {
    localStorage.setItem('user', JSON.stringify(user));
};

// Obtener usuario logiado desde localStorage
export function getUser(): IUser | null {
    const data = localStorage.getItem('user');
    return data ? JSON.parse(data) : null;
}

// Eliminar sesion y redirigir al login
export function clearUser(): void {
    localStorage.removeItem('user');
    window.location.href = './src/pages/auth/login/login.html';
}