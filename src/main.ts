
// Comentado por que causa que el codigo de abajo no se ejecute
// import { setupCounter } from './counter.ts'

// document.querySelector<HTMLDivElement>('#app')!.innerHTML = 
// `
//   <div>

//   </div>
// `

// setupCounter(document.querySelector<HTMLButtonElement>('#counter')!)

import './style.css'
import { prueba } from "./utils/api";

const button = document.getElementById("button");
button?.addEventListener("click", () => {
  prueba();
});

// Si no estás en modo prueba, ejecuta la redirección
const TEST_MODE = true; // ponelo en false cuando termines

if (!TEST_MODE) {
  const userData = localStorage.getItem("user");

  if (userData) {
    try {
      const user = JSON.parse(userData);
      if (user.role === "admin") {
        window.location.href = "./src/pages/admin/adminHome/adminHome.html";
      } else {
        window.location.href = "./src/pages/store/home/home.html";
      }
    } catch (error) {
      console.error("Error al leer los datos del usuario:", error);
      localStorage.removeItem("user");
      window.location.href = "./src/pages/auth/login/login.html";
    }
  } else {
    window.location.href = "./src/pages/auth/login/login.html";
  }
}
