<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class AiController extends Controller
{
    public function chat(Request $request)
    {
        $validated = $request->validate([
            'messages'           => ['required', 'array', 'min:1'],
            'messages.*.role'    => ['required', 'in:user,assistant,system'],
            'messages.*.content' => ['required', 'string', 'max:10000'],
            'context'            => ['nullable', 'string', 'max:4000'],
        ]);

        $apiKey  = config('services.openrouter.api_key');
        $model   = config('services.openrouter.model', 'openai/gpt-oss-20b:free');
        $referer = config('services.openrouter.referer');
        $title   = config('services.openrouter.title');

        if (empty($apiKey)) {
            return response()->json([
                'error' => 'OPENROUTER_API_KEY no configurada en .env',
            ], 503);
        }

        $systemPrompt = "Eres un asistente integrado en DevDashboard, un panel de productividad con Kanban, "
            . "tareas, empresas y un timer Pomodoro. Responde de forma concisa y directa, en español. "
            . "Usa markdown solo cuando ayude a la legibilidad.";

        if (!empty($validated['context'])) {
            $systemPrompt .= "\n\nContexto del usuario:\n" . $validated['context'];
        }

        $messages = array_merge(
            [['role' => 'system', 'content' => $systemPrompt]],
            $validated['messages']
        );

        $response = Http::withHeaders([
            'Authorization' => "Bearer {$apiKey}",
            'Content-Type'  => 'application/json',
            'HTTP-Referer'  => $referer,
            'X-Title'       => $title,
        ])->timeout(60)->post('https://openrouter.ai/api/v1/chat/completions', [
            'model'       => $model,
            'messages'    => $messages,
            'max_tokens'  => 1024,
            'temperature' => 0.7,
        ]);

        if ($response->failed()) {
            return response()->json([
                'error'  => 'Error al contactar OpenRouter (HTTP ' . $response->status() . ').',
                'detail' => $response->json('error.message') ?? $response->body(),
            ], 502);
        }

        $payload = $response->json();
        $text = $payload['choices'][0]['message']['content'] ?? '';

        return response()->json([
            'content' => $text,
            'model'   => $payload['model'] ?? $model,
            'usage'   => $payload['usage'] ?? null,
        ]);
    }
}
