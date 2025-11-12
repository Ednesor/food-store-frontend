export type NotificationType = 'success' | 'error' | 'info'; // Definimos los tipos de notificación que aceptaremos

// Esta variable guardará la referencia al contenedor de toasts
let notificationContainer: HTMLDivElement | null = null;

/**
 * Asegura que el <div class="notification-container"> exista en el DOM.
 * Si no existe, lo crea y lo añade al <body>.
 */
function getOrCreateContainer(): HTMLDivElement {
    // Si ya existe y está en el DOM, lo reutilizamos
    if (notificationContainer && document.body.contains(notificationContainer)) {
        return notificationContainer;
    }

    // Si no existe, lo creamos
    notificationContainer = document.createElement('div');
    notificationContainer.className = 'notification-container';
    document.body.appendChild(notificationContainer);
    return notificationContainer;
}

/**
 * Muestra una notificación "toast" en la esquina de la pantalla.
 * * @param message El texto a mostrar.
 * @param type El tipo de notificación ('success', 'error', 'info').
 * @param duration El tiempo en ms antes de que desaparezca (ej: 3000ms = 3 segundos).
 */
export function showNotification(
    message: string,
    type: NotificationType = 'info',
    duration: number = 3000
): void {

    // 1. Obtenemos (o creamos) el contenedor
    const container = getOrCreateContainer();

    // 2. Creamos el elemento del toast
    const toast = document.createElement('div');
    // Le asignamos las clases CSS: 'toast-notification' y el tipo (ej: 'error')
    toast.className = `toast-notification ${type}`;
    toast.textContent = message;

    // 3. Lo añadimos al contenedor (la animación 'slideIn' se ejecuta sola)
    container.appendChild(toast);

    // 4. Creamos el timer para ocultarlo
    // Usamos setTimeout para esperar la 'duration' que nos pasaron
    const hideTimer = setTimeout(() => {
        // Añadimos la clase 'hide' para activar la animación de salida
        toast.classList.add('hide');
    }, duration);

    // 5. Creamos otro timer para eliminarlo del DOM
    // Debe durar un poco más que la animación de salida (que dura 0.4s = 400ms)
    const removeTimer = setTimeout(() => {
        // Verificamos que el toast aún exista antes de intentar borrarlo
        if (container.contains(toast)) {
            container.removeChild(toast);
        }
        // Limpiamos los timers por si acaso
        clearTimeout(hideTimer);
    }, duration + 400); // 3000ms + 400ms
}

// =========================================================
//  MENSAJES DE BIENVENIDA (SESSION)
// =========================================================

const WELCOME_MESSAGE_KEY = 'welcomeMessage';

/**
 * Revisa si existe un mensaje de bienvenida en sessionStorage.
 * Si existe, lo muestra como una notificación 'success' y lo borra.
 */
export function checkAndShowWelcomeMessage(): void {
    const message = sessionStorage.getItem(WELCOME_MESSAGE_KEY);
    
    if (message) {
        // Usamos la función que ya existe en este mismo archivo
        showNotification(message, 'success'); 
        // Borramos la llave para que no se muestre de nuevo al recargar
        sessionStorage.removeItem(WELCOME_MESSAGE_KEY);
    }
}