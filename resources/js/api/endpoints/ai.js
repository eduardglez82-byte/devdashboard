import client, { ensureCsrf } from '../client';

export async function aiChat(messages, context = null) {
    await ensureCsrf();
    const { data } = await client.post('/ai/chat', { messages, context });
    return data;
}
