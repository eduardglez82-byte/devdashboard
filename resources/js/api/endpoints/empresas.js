import client, { ensureCsrf } from '../client';

export async function listarEmpresas() {
    const { data } = await client.get('/empresas');
    return data;
}

export async function crearEmpresa(payload) {
    await ensureCsrf();
    const { data } = await client.post('/empresas', payload);
    return data;
}

export async function actualizarEmpresa(id, payload) {
    await ensureCsrf();
    const { data } = await client.put(`/empresas/${id}`, payload);
    return data;
}

export async function eliminarEmpresa(id) {
    await ensureCsrf();
    await client.delete(`/empresas/${id}`);
}
