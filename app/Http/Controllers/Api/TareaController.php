<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tarea;
use Illuminate\Http\Request;

class TareaController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $query = Tarea::with([
            'empresa:id,nombre',
            'asignado:id,name,email',
        ])->latest();

        if ($user->role !== 'admin') {
            $query->where('empresa_id', $user->empresa_id);
        }

        return $query->get();
    }

    public function store(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'titulo'      => ['required', 'string', 'max:255'],
            'descripcion' => ['nullable', 'string'],
            'estado'      => ['in:pendiente,en_progreso,completado'],
            'prioridad'   => ['in:baja,media,alta'],
            'empresa_id'  => ['nullable', 'exists:empresas,id'],
            'asignado_a'  => ['nullable', 'exists:users,id'],
        ]);

        // admin_empresa: auto-set empresa_id if not provided
        if ($user->role === 'admin_empresa' && empty($data['empresa_id'])) {
            $data['empresa_id'] = $user->empresa_id;
        }

        $tarea = Tarea::create($data);
        $tarea->load('empresa:id,nombre', 'asignado:id,name,email');

        return response()->json($tarea, 201);
    }

    public function update(Request $request, Tarea $tarea)
    {
        $data = $request->validate([
            'titulo'      => ['sometimes', 'required', 'string', 'max:255'],
            'descripcion' => ['nullable', 'string'],
            'estado'      => ['sometimes', 'in:pendiente,en_progreso,completado'],
            'prioridad'   => ['sometimes', 'in:baja,media,alta'],
            'empresa_id'  => ['nullable', 'exists:empresas,id'],
            'asignado_a'  => ['nullable', 'exists:users,id'],
        ]);

        $tarea->update($data);
        $tarea->load('empresa:id,nombre', 'asignado:id,name,email');

        return response()->json($tarea);
    }

    public function destroy(Tarea $tarea)
    {
        $tarea->delete();
        return response()->json(['message' => 'deleted']);
    }
}
