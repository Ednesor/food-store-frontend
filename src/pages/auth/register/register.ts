import { saveUser } from "../../../utils/auth";
import { API_BASE_URL } from "@/config/contants";

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
        alert("Las contraseñas no coinciden. Por favor, inténtalo de nuevo.");
        return;
    }

    if (!name || !lastname || !username || !email || !password) {
        alert("Por favor completa todos los campos.");
        return;
    }

    if (password.length < 6) {
        alert("La contraseña debe tener al menos 6 caracteres.");
        return;
    }

    if (!email.includes("@")) {
        alert("Por favor ingrese un correo electrónico válido.");
        return;
    }


    // validación de email sencilla
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert("Por favor ingresa un correo electrónico válido.");
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/users/signup`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, lastname, username, email, password }),
        });

        if (!response.ok) {
            alert("Error al registrar. Verifica los datos.");
            return;
        }

        const userData = await response.json();

        // Guardar el usuario en localStorage
        saveUser(userData);
        // Redigimos al home del cliente
        window.location.href = '/src/pages/store/home/home.html';

    } catch (error) {
        console.error("Error en el registro:", error);
        alert("Ocurrió un error al registrar el usuario.");
    }
});