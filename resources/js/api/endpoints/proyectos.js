import client from '../client';

export async function listProyectos(params = {}) {
    const { data } = await client.get('/proyectos', { params });
    return data;
}

export async function getProyecto(id) {
    const { data } = await client.get(`/proyectos/${id}`);
    return data;
}

export async function createProyecto(payload) {
    const { data } = await client.post('/proyectos', payload);
    return data;
}

export async function updateProyecto(id, payload) {
    const { data } = await client.put(`/proyectos/${id}`, payload);
    return data;
}

export async function deleteProyecto(id) {
    await client.delete(`/proyectos/${id}`);
}
