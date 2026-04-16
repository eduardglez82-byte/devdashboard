import client, { ensureCsrf } from '../client';

export async function listarTareas() {
    const { data } = await client.get('/tareas');
    return data;
}

export async function crearTarea(payload) {
    await ensureCsrf();
    const { data } = await client.post('/tareas', payload);
    return data;
}

export async function actualizarTarea(id, payload) {
    await ensureCsrf();
    const { data } = await client.put(`/tareas/${id}`, payload);
    return data;
}

export async function eliminarTarea(id) {
    await ensureCsrf();
    await client.delete(`/tareas/${id}`);
}
