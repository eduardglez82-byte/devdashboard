import client, { ensureCsrf } from '../client';

export async function listarUsuarios() {
    const { data } = await client.get('/usuarios');
    return data;
}

export async function crearUsuario(payload) {
    await ensureCsrf();
    const { data } = await client.post('/usuarios', payload);
    return data;
}

export async function actualizarUsuario(id, payload) {
    await ensureCsrf();
    const { data } = await client.put(`/usuarios/${id}`, payload);
    return data;
}

export async function eliminarUsuario(id) {
    await ensureCsrf();
    await client.delete(`/usuarios/${id}`);
}
