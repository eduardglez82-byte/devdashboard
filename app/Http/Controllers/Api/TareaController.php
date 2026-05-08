<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Empresa;
use App\Models\Tarea;
use App\Models\User;
use Illuminate\Http\Request;

class TareaController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $query = Tarea::query()->orderBy('created_at', 'desc');

        if ($user->role !== 'admin') {
            $query->where('empresa_id', $user->empresa_id);
        }

        $tareas = $query->get();

        $this->hidratarRelaciones($tareas);

        return response()->json($tareas);
    }

    public function store(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'titulo'      => ['required', 'string', 'max:255'],
            'descripcion' => ['nullable', 'string'],
            'estado'      => ['nullable', 'in:pendiente,en_progreso,completado'],
            'prioridad'   => ['nullable', 'in:baja,media,alta'],
            'empresa_id'  => ['nullable', 'string'],
            'asignado_a'  => ['nullable', 'string'],
        ]);

        if (!empty($data['empresa_id']) && !Empresa::where('_id', $data['empresa_id'])->exists()) {
            return response()->json(['error' => 'empresa_id inválido'], 422);
        }
        if (!empty($data['asignado_a']) && !User::where('_id', $data['asignado_a'])->exists()) {
            return response()->json(['error' => 'asignado_a inválido'], 422);
        }

        if ($user->role === 'admin_empresa' && empty($data['empresa_id'])) {
            $data['empresa_id'] = $user->empresa_id;
        }

        $tarea = Tarea::create($data + [
            'estado'    => $data['estado']    ?? 'pendiente',
            'prioridad' => $data['prioridad'] ?? 'media',
        ]);

        $coll = collect([$tarea]);
        $this->hidratarRelaciones($coll);

        return response()->json($tarea, 201);
    }

    public function update(Request $request, $id)
    {
        $tarea = Tarea::findOrFail($id);

        $data = $request->validate([
            'titulo'      => ['sometimes', 'required', 'string', 'max:255'],
            'descripcion' => ['nullable', 'string'],
            'estado'      => ['sometimes', 'in:pendiente,en_progreso,completado'],
            'prioridad'   => ['sometimes', 'in:baja,media,alta'],
            'empresa_id'  => ['nullable', 'string'],
            'asignado_a'  => ['nullable', 'string'],
        ]);

        if (array_key_exists('empresa_id', $data) && !empty($data['empresa_id']) && !Empresa::where('_id', $data['empresa_id'])->exists()) {
            return response()->json(['error' => 'empresa_id inválido'], 422);
        }
        if (array_key_exists('asignado_a', $data) && !empty($data['asignado_a']) && !User::where('_id', $data['asignado_a'])->exists()) {
            return response()->json(['error' => 'asignado_a inválido'], 422);
        }

        $tarea->update($data);

        $coll = collect([$tarea]);
        $this->hidratarRelaciones($coll);

        return response()->json($tarea);
    }

    public function destroy($id)
    {
        $tarea = Tarea::findOrFail($id);
        $tarea->delete();
        return response()->json(['message' => 'deleted']);
    }

    /**
     * Carga `empresa` y `asignado` en una colección de tareas con un solo query por relación.
     */
    private function hidratarRelaciones($tareas): void
    {
        $empresaIds  = $tareas->pluck('empresa_id')->filter()->unique()->all();
        $asignadoIds = $tareas->pluck('asignado_a')->filter()->unique()->all();

        $empresas = Empresa::whereIn('_id', $empresaIds)->get(['_id', 'nombre'])->keyBy('id');
        $usuarios = User::whereIn('_id', $asignadoIds)->get(['_id', 'name', 'email'])->keyBy('id');

        $tareas->each(function ($t) use ($empresas, $usuarios) {
            $t->setRelation('empresa',  $t->empresa_id ? $empresas->get((string) $t->empresa_id) : null);
            $t->setRelation('asignado', $t->asignado_a ? $usuarios->get((string) $t->asignado_a) : null);
        });
    }
}
