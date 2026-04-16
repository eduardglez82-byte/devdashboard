import axios from 'axios';

const client = axios.create({
    baseURL: '/api',
    withCredentials: true,
    withXSRFToken: true,
    headers: {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    },
});

// Antes de hacer un POST/PUT/DELETE contra rutas que requieren auth,
// Sanctum necesita la cookie CSRF. Esta función la pide una sola vez.
let csrfFetched = false;
export async function ensureCsrf() {
    if (csrfFetched) return;
    await axios.get('/sanctum/csrf-cookie', { withCredentials: true });
    csrfFetched = true;
}

// Interceptor de respuesta: si sale 401, limpiamos y redirigimos al login
client.interceptors.response.use(
    (res) => res,
    (error) => {
        if (error?.response?.status === 401) {
            // No forzamos redirect aquí para no pelearnos con React Router;
            // el AuthContext se encarga al detectar user = null.
        }
        return Promise.reject(error);
    }
);

export default client;
