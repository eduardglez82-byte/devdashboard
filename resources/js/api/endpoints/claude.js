import client, { ensureCsrf } from '../client';

export async function claudeChat(messages) {
    await ensureCsrf();
    const { data } = await client.post('/claude/chat', { messages });
    return data;
}
