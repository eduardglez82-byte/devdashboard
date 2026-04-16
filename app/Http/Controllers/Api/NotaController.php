<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Nota;
use Illuminate\Http\Request;

class NotaController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        if ($user->role === 'admin') {
            $notas = Nota::with('usuario:id,name')->latest()->get();
        } else {
            $notas = Nota::with('usuario:id,name')
                ->where('user_id', $user->id)
                ->latest()
                ->get();
        }

        return response()->json($notas);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'contenido' => ['required', 'string', 'max:1000'],
        ]);

        $nota = Nota::create([
            'contenido' => $validated['contenido'],
            'user_id'   => $request->user()->id,
        ]);

        $nota->load('usuario:id,name');

        return response()->json($nota, 201);
    }

    public function destroy(Request $request, Nota $nota)
    {
        $user = $request->user();

        if ($user->role !== 'admin' && $nota->user_id !== $user->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $nota->delete();

        return response()->json(['message' => 'deleted'], 200);
    }
}
