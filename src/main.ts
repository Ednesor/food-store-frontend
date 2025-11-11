import { prueba } from "./utils/api";
import { navigateTo, PATHS } from './utils/navigate';

const button = document.getElementById("button");
button?.addEventListener("click", () => {
  prueba();
});

// Si no estás en modo prueba, ejecuta la redirección
const TEST_MODE = false; // ponelo en false cuando termines

if (!TEST_MODE) {
  const userData = localStorage.getItem("user");

  if (userData) {
    try {
      const user = JSON.parse(userData);
      if (user.role === "ADMIN") {
        navigateTo(PATHS.ADMIN_HOME);
      } else {
        navigateTo(PATHS.STORE_HOME)
      }
    } catch (error) {
      console.error("Error al leer los datos del usuario:", error);
      localStorage.removeItem("user");
      navigateTo(PATHS.LOGIN)
    }
  } else {
    navigateTo(PATHS.LOGIN)
  }
}