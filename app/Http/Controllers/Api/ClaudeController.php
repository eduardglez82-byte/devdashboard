<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class ClaudeController extends Controller
{
    public function chat(Request $request)
    {
        $validated = $request->validate([
            'messages'          => ['required', 'array', 'min:1'],
            'messages.*.role'   => ['required', 'in:user,assistant'],
            'messages.*.content'=> ['required', 'string', 'max:10000'],
        ]);

        $apiKey = config('services.anthropic.api_key');
        $model  = config('services.anthropic.model', 'claude-haiku-4-5-20251001');

        if (empty($apiKey)) {
            return response()->json([
                'error' => 'ANTHROPIC_API_KEY no configurada en .env',
            ], 503);
        }

        $response = Http::withHeaders([
            'x-api-key'         => $apiKey,
            'anthropic-version' => '2023-06-01',
            'content-type'      => 'application/json',
        ])->timeout(60)->post('https://api.anthropic.com/v1/messages', [
            'model'      => $model,
            'max_tokens' => 1024,
            'system'     => 'Eres un asistente útil integrado en DevDashboard. Responde de forma concisa y directa. Usa markdown cuando ayude a la legibilidad.',
            'messages'   => $validated['messages'],
        ]);

        if ($response->failed()) {
            return response()->json([
                'error' => 'Error al contactar la API de Anthropic: ' . $response->status(),
            ], 502);
        }

        return response()->json($response->json());
    }
}
