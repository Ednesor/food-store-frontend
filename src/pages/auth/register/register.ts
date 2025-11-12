import { registerUser } from "@/utils/api";
import { saveUser } from "../../../utils/auth";
import type { IRegister } from "@/types/IRegister";
import { navigateTo, PATHS } from "@/utils/navigate";
import { showNotification } from "@/utils/notifications";

//Capturar el name, email y password del formulario de registro
const registerForm = document.getElementById('registerForm') as HTMLFormElement;

registerForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const name = (document.getElementById('name') as HTMLInputElement).value;
    const lastname = (document.getElementById('lastname') as HTMLInputElement).value;
    const username = (document.getElementById('username') as HTMLInputElement).value;
    const email = (document.getElementById('email') as HTMLInputElement).value;
    const password = (document.getElementById('password') as HTMLInputElement).value;
    const confirmPassword = (document.getElementById('confirmPassword') as HTMLInputElement).value;

    // Validar que las contraseñas coincidan
    if (password !== confirmPassword) {
        showNotification("Las contraseñas no coinciden.", 'error');
        return;
    }

    if (!name || !lastname || !username || !email || !password) {
        showNotification("Por favor completa todos los campos.", 'error');
        return;
    }

    if (password.length < 6) {
        showNotification("La contraseña debe tener al menos 6 caracteres.", 'error');
        return;
    }

    if (!email.includes("@")) {
        showNotification("Por favor ingrese un correo electronico valido.", 'error');
        return;
    }


    // validación de email sencilla
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showNotification("Por favor ingresa un correo electronico valido.", 'error');
        return;
    }

    try {
        const registerData: IRegister = { name, lastname, username, email, password };
        const userData = await registerUser(registerData);

        // Guardar el usuario en localStorage
        saveUser(userData);
        sessionStorage.setItem('welcomeMessage', `¡Bienvenido, ${userData.name}!`);
        // Redigimos al home del cliente
        navigateTo(PATHS.STORE_HOME)

    } catch (error) {
        console.error("Error en el registro:", error);
        showNotification("Ocurrio un error al registrar el usuario.", 'error')
    }
});