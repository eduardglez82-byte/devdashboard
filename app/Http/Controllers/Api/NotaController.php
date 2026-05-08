<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Nota;
use App\Models\User;
use Illuminate\Http\Request;

class NotaController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $query = Nota::query()->orderBy('created_at', 'desc');

        if ($user->role !== 'admin') {
            $query->where('user_id', $user->id);
        }

        $notas = $query->get();

        $userIds = $notas->pluck('user_id')->filter()->unique()->all();
        $users   = User::whereIn('_id', $userIds)->get(['_id', 'name'])->keyBy('id');

        $notas->each(function ($n) use ($users) {
            $n->setRelation('usuario', $users->get((string) $n->user_id));
        });

        return response()->json($notas);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'contenido' => ['required', 'string', 'max:1000'],
        ]);

        $user = $request->user();

        $nota = Nota::create([
            'contenido' => $validated['contenido'],
            'user_id'   => $user->id,
        ]);

        $nota->setRelation('usuario', User::where('_id', $user->id)->first(['_id', 'name']));

        return response()->json($nota, 201);
    }

    public function destroy(Request $request, $id)
    {
        $nota = Nota::findOrFail($id);
        $user = $request->user();

        if ($user->role !== 'admin' && (string) $nota->user_id !== (string) $user->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $nota->delete();

        return response()->json(['message' => 'deleted']);
    }
}
