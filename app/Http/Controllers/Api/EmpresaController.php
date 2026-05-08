<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Empresa;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class EmpresaController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $query = Empresa::query()->orderBy('created_at', 'desc');

        if ($user->role !== 'admin') {
            if (!$user->empresa_id) {
                return response()->json([]);
            }
            $query->where('_id', $user->empresa_id);
        }

        $empresas = $query->get();

        // contar usuarios por empresa
        $ids = $empresas->pluck('id')->all();
        $counts = User::whereIn('empresa_id', $ids)
            ->get(['empresa_id'])
            ->groupBy('empresa_id')
            ->map->count();

        $empresas->each(function ($e) use ($counts) {
            $e->usuarios_count = (int) ($counts[(string) $e->id] ?? 0);
        });

        return response()->json($empresas);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nombre'   => ['required', 'string', 'max:255'],
            'rfc'      => ['nullable', 'string', 'max:20', Rule::unique('mongodb.empresas', 'rfc')],
            'email'    => ['nullable', 'email', 'max:255'],
            'telefono' => ['nullable', 'string', 'max:30'],
            'estatus'  => ['nullable', 'in:activo,inactivo'],
        ]);

        $empresa = Empresa::create($validated + ['estatus' => $validated['estatus'] ?? 'activo']);
        $empresa->usuarios_count = 0;

        return response()->json($empresa, 201);
    }

    public function update(Request $request, $id)
    {
        $empresa = Empresa::findOrFail($id);

        $validated = $request->validate([
            'nombre'   => ['required', 'string', 'max:255'],
            'rfc'      => ['nullable', 'string', 'max:20', Rule::unique('mongodb.empresas', 'rfc')->ignore($empresa->id, '_id')],
            'email'    => ['nullable', 'email', 'max:255'],
            'telefono' => ['nullable', 'string', 'max:30'],
            'estatus'  => ['nullable', 'in:activo,inactivo'],
        ]);

        $empresa->update($validated);
        $empresa->usuarios_count = User::where('empresa_id', $empresa->id)->count();

        return response()->json($empresa);
    }

    public function destroy($id)
    {
        $empresa = Empresa::findOrFail($id);
        $empresa->delete();
        return response()->json(['message' => 'deleted']);
    }
}
