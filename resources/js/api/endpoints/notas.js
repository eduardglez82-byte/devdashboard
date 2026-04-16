import client, { ensureCsrf } from '../client';

export async function listarNotas() {
    const { data } = await client.get('/notas');
    return data;
}

export async function crearNota(payload) {
    await ensureCsrf();
    const { data } = await client.post('/notas', payload);
    return data;
}

export async function eliminarNota(id) {
    await ensureCsrf();
    await client.delete(`/notas/${id}`);
}
