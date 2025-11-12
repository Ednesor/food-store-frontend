import { navigateTo, PATHS } from './utils/navigate';

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
