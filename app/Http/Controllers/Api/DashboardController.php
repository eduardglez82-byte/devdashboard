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
            $tareas_total   = Tarea::count();

            $tareas_por_estado = Tarea::selectRaw('estado, COUNT(*) as total')
                ->groupBy('estado')
                ->pluck('total', 'estado');

            $empresa_nombre = null;
        } else {
            // admin_empresa or usuario_empresa — filter by empresa_id
            $empresa_id = $user->empresa_id;

            $empresas_total = $empresa_id ? Empresa::where('id', $empresa_id)->count() : 0;
            $usuarios_total = $empresa_id ? User::where('empresa_id', $empresa_id)->count() : 0;
            $tareas_total   = $empresa_id ? Tarea::where('empresa_id', $empresa_id)->count() : 0;

            $tareas_por_estado = $empresa_id
                ? Tarea::selectRaw('estado, COUNT(*) as total')
                    ->where('empresa_id', $empresa_id)
                    ->groupBy('estado')
                    ->pluck('total', 'estado')
                : collect([]);

            $empresa_nombre = $user->empresa ? $user->empresa->nombre : null;
        }

        return response()->json([
            'empresas'            => $empresas_total,
            'usuarios'            => $usuarios_total,
            'tareas_total'        => $tareas_total,
            'tareas_pendiente'    => $tareas_por_estado['pendiente']    ?? 0,
            'tareas_en_progreso'  => $tareas_por_estado['en_progreso']  ?? 0,
            'tareas_completado'   => $tareas_por_estado['completado']   ?? 0,
            'empresa_nombre'      => $empresa_nombre,
        ]);
    }
}
