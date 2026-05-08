<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Empresa;
use App\Models\Tarea;
use App\Models\User;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function stats(Request $request)
    {
        $user = $request->user();
        $role = $user->role;

        if ($role === 'admin') {
            $empresas_total = Empresa::count();
            $usuarios_total = User::count();
            $tareasQuery    = Tarea::query();
            $empresa_nombre = null;
        } else {
            $empresa_id = $user->empresa_id;

            $empresas_total = $empresa_id ? Empresa::where('_id', $empresa_id)->count() : 0;
            $usuarios_total = $empresa_id ? User::where('empresa_id', $empresa_id)->count() : 0;
            $tareasQuery    = $empresa_id ? Tarea::where('empresa_id', $empresa_id) : Tarea::whereRaw(['_id' => null]);

            $empresa_nombre = $user->empresa ? $user->empresa->nombre : null;
        }

        $tareas_total = (clone $tareasQuery)->count();
        $estados      = (clone $tareasQuery)->get(['estado'])->groupBy('estado')->map->count();

        return response()->json([
            'empresas'           => $empresas_total,
            'usuarios'           => $usuarios_total,
            'tareas_total'       => $tareas_total,
            'tareas_pendiente'   => $estados['pendiente']    ?? 0,
            'tareas_en_progreso' => $estados['en_progreso']  ?? 0,
            'tareas_completado'  => $estados['completado']   ?? 0,
            'empresa_nombre'     => $empresa_nombre,
        ]);
    }
}
