/**
 * Muestra un modal de confirmación bonito en lugar del `confirm()` feo.
 * Devuelve una Promesa que se resuelve a `true` (si se confirma) o `false` (si se cancela).
 * * @param message El mensaje principal a mostrar (la pregunta).
 * @param title El título del modal (opcional).
 * @param confirmButtonText El texto del botón de confirmación (opcional, ej: "Eliminar").
 */
export function showConfirmation(
    message: string, 
    title: string = "Confirmación", 
    confirmButtonText: string = "Aceptar"
): Promise<boolean> {

    // Devuelve una Promesa que "esperará" la respuesta del usuario
    return new Promise((resolve) => {
        // --- 1. Crear los elementos del DOM ---
        
        // El fondo oscuro
        const overlay = document.createElement('div');
        overlay.className = 'confirmation-overlay';

        // El modal
        const modal = document.createElement('div');
        modal.className = 'confirmation-modal';

        // Título
        const modalTitle = document.createElement('h3');
        modalTitle.textContent = title;

        // Mensaje
        const modalMessage = document.createElement('p');
        modalMessage.textContent = message;

        // Contenedor de botones
        const actions = document.createElement('div');
        actions.className = 'confirmation-actions';

        // Botón de Cancelar (Secundario)
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'btn btn-secondary';
        cancelBtn.textContent = 'Cancelar';

        // Botón de Confirmar (Primario o de Peligro)
        const confirmBtn = document.createElement('button');
        confirmBtn.textContent = confirmButtonText;
        // Si el texto incluye "Eliminar", le damos el estilo de peligro
        if (confirmButtonText.toLowerCase().includes('eliminar')) {
            confirmBtn.className = 'btn btn-danger';
        } else {
            confirmBtn.className = 'btn btn-primary';
        }

        // --- 2. Función de limpieza ---
        // Esta función borra el modal del DOM
        const cleanup = () => {
            document.body.removeChild(overlay);
        };

        // --- 3. Asignar Eventos ---

        // Si hace clic en Confirmar, resuelve a 'true'
        confirmBtn.addEventListener('click', () => {
            cleanup();
            resolve(true); // Responde "sí"
        });

        // Si hace clic en Cancelar, resuelve a 'false'
        cancelBtn.addEventListener('click', () => {
            cleanup();
            resolve(false); // Responde "no"
        });

        // Si hace clic fuera del modal (en el overlay), también es 'false'
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                cleanup();
                resolve(false); // Responde "no"
            }
        });

        // --- 4. Construir y mostrar ---
        actions.appendChild(cancelBtn);
        actions.appendChild(confirmBtn);

        modal.appendChild(modalTitle);
        modal.appendChild(modalMessage);
        modal.appendChild(actions);

        overlay.appendChild(modal);

        document.body.appendChild(overlay);
    });
}