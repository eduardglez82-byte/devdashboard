import client, { ensureCsrf } from '../client';

export async function login(email, password) {
    await ensureCsrf();
    const { data } = await client.post('/login', { email, password });
    return data;
}

export async function logout() {
    await ensureCsrf();
    await client.post('/logout');
}

export async function me() {
    const { data } = await client.get('/user');
    return data;
}
