import { loginUser } from "@/utils/api";
import { saveUser } from "../../../utils/auth";
import { navigateTo, PATHS } from "@/utils/navigate";
import { showNotification } from "@/utils/notifications";

const loginForm = document.getElementById('loginForm') as HTMLFormElement;

loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const email = (document.getElementById('email') as HTMLInputElement).value;
    const password = (document.getElementById('password') as HTMLInputElement).value;

    if (!email || !password) {
        showNotification("Por favor, complete todos los campos.", 'error')
        return;
    }

    try {
        const userData = await loginUser(email, password);

        // Guardamos el usuario en localStorage
        saveUser(userData);

        sessionStorage.setItem('welcomeMessage', `¡Hola de nuevo, ${userData.name}!`);

        // Redirigimos segun su rol
        if (userData.role === 'ADMIN') {
            navigateTo(PATHS.ADMIN_HOME)
        } else {
            navigateTo(PATHS.STORE_HOME)
        }
    } catch (error) {
        console.error("Error en login:", error);
        showNotification("Ocurrió un error al iniciar sesión.", 'error')
    }
})