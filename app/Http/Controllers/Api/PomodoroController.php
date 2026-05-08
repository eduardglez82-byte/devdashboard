<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PomodoroSession;
use App\Models\Tarea;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class PomodoroController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $sessions = PomodoroSession::where('user_id', $user->id)
            ->latest()
            ->limit(50)
            ->get();

        // Embed tarea title manualmente (Mongo no tiene JOIN)
        $tareaIds = $sessions->pluck('tarea_id')->filter()->unique()->values();
        $tareas   = Tarea::whereIn('_id', $tareaIds)->get(['_id', 'titulo'])->keyBy('id');

        $sessions->each(function ($s) use ($tareas) {
            $s->setRelation('tarea', $s->tarea_id ? $tareas->get((string) $s->tarea_id) : null);
        });

        return response()->json($sessions);
    }

    public function store(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'tarea_id'          => ['nullable', 'string'],
            'tipo'              => ['required', 'in:focus,short_break,long_break'],
            'duracion_segundos' => ['required', 'integer', 'min:1', 'max:14400'],
            'completado'        => ['nullable', 'boolean'],
            'iniciada_en'       => ['nullable', 'date'],
        ]);

        // Validar tarea existe (si se mandó)
        if (!empty($data['tarea_id']) && !Tarea::where('_id', $data['tarea_id'])->exists()) {
            return response()->json(['error' => 'tarea_id inválido'], 422);
        }

        $session = PomodoroSession::create([
            'user_id'           => $user->id,
            'tarea_id'          => $data['tarea_id']    ?? null,
            'tipo'              => $data['tipo'],
            'duracion_segundos' => $data['duracion_segundos'],
            'completado'        => $data['completado']  ?? true,
            'iniciada_en'       => isset($data['iniciada_en'])
                                    ? Carbon::parse($data['iniciada_en'])
                                    : Carbon::now()->subSeconds($data['duracion_segundos']),
            'finalizada_en'     => Carbon::now(),
        ]);

        if ($session->tarea_id) {
            $session->setRelation('tarea', Tarea::where('_id', $session->tarea_id)->first(['_id', 'titulo']));
        }

        return response()->json($session, 201);
    }

    public function stats(Request $request)
    {
        $user = $request->user();

        $today = Carbon::today();
        $week  = Carbon::now()->startOfWeek();

        $base = PomodoroSession::where('user_id', $user->id)
            ->where('tipo', 'focus')
            ->where('completado', true);

        $todaySeconds = (clone $base)->where('created_at', '>=', $today)->sum('duracion_segundos');
        $weekSeconds  = (clone $base)->where('created_at', '>=', $week)->sum('duracion_segundos');
        $totalCount   = (clone $base)->count();
        $todayCount   = (clone $base)->where('created_at', '>=', $today)->count();

        // Agrupado por tarea_id usando aggregation pipeline
        $perTareaRaw = PomodoroSession::raw(function ($collection) use ($user) {
            return $collection->aggregate([
                ['$match' => [
                    'user_id'    => $user->id,
                    'tipo'       => 'focus',
                    'completado' => true,
                    'tarea_id'   => ['$ne' => null],
                ]],
                ['$group' => [
                    '_id'      => '$tarea_id',
                    'segundos' => ['$sum' => '$duracion_segundos'],
                    'sesiones' => ['$sum' => 1],
                ]],
                ['$sort'  => ['segundos' => -1]],
                ['$limit' => 10],
            ]);
        });

        // Hidratar título de tarea
        $tareaIds = collect($perTareaRaw)->pluck('_id')->filter()->all();
        $tareas   = Tarea::whereIn('_id', $tareaIds)->get(['_id', 'titulo'])->keyBy('id');

        $perTarea = collect($perTareaRaw)->map(function ($row) use ($tareas) {
            $tareaId = (string) $row->_id;
            return [
                'tarea_id' => $tareaId,
                'segundos' => (int) $row->segundos,
                'sesiones' => (int) $row->sesiones,
                'tarea'    => $tareas->get($tareaId)
                    ? ['id' => $tareaId, 'titulo' => $tareas->get($tareaId)->titulo]
                    : null,
            ];
        })->values();

        return response()->json([
            'today_seconds' => (int) $todaySeconds,
            'week_seconds'  => (int) $weekSeconds,
            'total_count'   => $totalCount,
            'today_count'   => $todayCount,
            'per_tarea'     => $perTarea,
        ]);
    }
}
