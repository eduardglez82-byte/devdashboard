import client, { ensureCsrf } from '../client';

export async function listarPomodoros() {
    const { data } = await client.get('/pomodoro');
    return data;
}

export async function guardarPomodoro(payload) {
    await ensureCsrf();
    const { data } = await client.post('/pomodoro', payload);
    return data;
}

export async function pomodoroStats() {
    const { data } = await client.get('/pomodoro/stats');
    return data;
}
