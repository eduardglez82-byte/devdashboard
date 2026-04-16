<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Empresa;
use Illuminate\Http\Request;

class EmpresaController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        if ($user->role !== 'admin') {
            if (!$user->empresa_id) {
                return response()->json([]);
            }
            return response()->json(
                Empresa::withCount('usuarios')->where('id', $user->empresa_id)->get()
            );
        }

        return Empresa::withCount('usuarios')->latest()->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nombre'   => ['required', 'string', 'max:255'],
            'rfc'      => ['nullable', 'string', 'max:20', 'unique:empresas'],
            'email'    => ['nullable', 'email', 'max:255'],
            'telefono' => ['nullable', 'string', 'max:30'],
            'estatus'  => ['in:activo,inactivo'],
        ]);

        $empresa = Empresa::create($validated);
        $empresa->loadCount('usuarios');

        return response()->json($empresa, 201);
    }

    public function update(Request $request, Empresa $empresa)
    {
        $validated = $request->validate([
            'nombre'   => ['required', 'string', 'max:255'],
            'rfc'      => ['nullable', 'string', 'max:20', 'unique:empresas,rfc,' . $empresa->id],
            'email'    => ['nullable', 'email', 'max:255'],
            'telefono' => ['nullable', 'string', 'max:30'],
            'estatus'  => ['in:activo,inactivo'],
        ]);

        $empresa->update($validated);
        $empresa->loadCount('usuarios');

        return response()->json($empresa);
    }

    public function destroy(Empresa $empresa)
    {
        $empresa->delete();
        return response()->json(['message' => 'deleted']);
    }
}
