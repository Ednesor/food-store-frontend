import { loginUser } from "@/utils/api";
import { saveUser } from "../../../utils/auth";

const loginForm = document.getElementById('loginForm') as HTMLFormElement;

loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const email = (document.getElementById('email') as HTMLInputElement).value;
    const password = (document.getElementById('password') as HTMLInputElement).value;

    if (!email || !password) {
        alert('Por favor, complete todos los campos.');
        return;
    }

    try {
        const userData = await loginUser(email, password);

        // Guardamos el usuario en localStorage
        saveUser(userData);

        // Redirigimos segun su rol
        if (userData.roles === 'ADMIN') {
            window.location.href = '../../admin/adminHome/adminHome.html';
        } else {
            window.location.href = '../../store/home/home.html';
        }
    } catch (error) {
        console.error("Error en login:", error);
        alert("Ocurrió un error al iniciar sesión.");
    }
})