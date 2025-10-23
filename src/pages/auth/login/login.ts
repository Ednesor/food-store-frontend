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
        // llamada al backend
        const response = await fetch('http://localhost:8080/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
            alert('Crenciales inválidas. Intente de nuevo.');
            return;
        }

        // Convertimos la respuesta del backend a objeto JSON
        const userData = await response.json();

        // Guardamos el usuario en localStorage
        saveUser(userData);

        // Redirigimos segun su rol
        if (userData.roles === 'Admin') {
            window.location.href = '/src/pages/admin/adminHome/adminHome.html';
        } else {
            window.location.href = '/src/pages/store/home/home.html';
        }
    } catch (error) {
        console.error("Error en login:", error);
        alert("Ocurrió un error al iniciar sesión.");
    }
})