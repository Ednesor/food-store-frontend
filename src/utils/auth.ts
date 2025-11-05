import type { IUser } from "../types/IUser";
import { updateCartBadge } from "./cart";

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
    window.location.href = '/src/pages/auth/login/login.html';
}

export function setupAdminAuth() {
    const userSession = localStorage.getItem("user");
    if (userSession) {
        const user = JSON.parse(userSession) as IUser;
        
        // Actualiza el nombre de usuario en el header
        const userDisplay = document.getElementById("user-display");
        if (userDisplay) {
            userDisplay.textContent = user.name;
        }

        // Si el rol NO es ADMIN, lo redirige fuera del panel
        if (user.role !== "ADMIN") {
            window.location.href = "/src/pages/store/home/home.html";
            return; // Detiene la ejecución
        }
        
        // Configura el botón de logout
        const logoutBtn = document.getElementById("logout-btn");
        if (logoutBtn) {
            logoutBtn.addEventListener("click", (event) => {
                event.preventDefault();
                clearUser();
            });
        }
    } else {
        // Si no hay sesión, lo redirige al login
        window.location.href = "/src/pages/auth/login/login.html";
    }
}

export function setupClientAuth() {
    updateCartBadge();

    const userSession = localStorage.getItem('user');
    if (userSession) {
        const user = JSON.parse(userSession) as IUser;

        const userDisplay = document.getElementById("user-display");
        if (userDisplay) {
            userDisplay.textContent = user.name;
        }
        
        // Oculta el link de "Administración" si no es ADMIN
        const adminLink = document.getElementById("admin-link");
        if (adminLink && user.role !== 'ADMIN') {
            adminLink.style.display = 'none';
        }

        // Configura el botón de logout
        const logoutBtn = document.getElementById("logout-btn");
        if (logoutBtn) {
            logoutBtn.addEventListener("click", (event) => {
                event.preventDefault();
                clearUser();
            });
        }
    } else {
        // Si no hay sesión, lo redirige al login
        window.location.href = '/src/pages/auth/login/login.html'; 
    }
}