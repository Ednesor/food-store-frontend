//Prueba de conexion con el backend
export async function prueba() {
    const url = "http://localhost:8080/api/alive";
    try {
        const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
        console.log('response a');
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }

        const result = await response.text();
        console.log('resultado', result);
    } catch (error: any) {
        console.error(error.message);
    }
}
