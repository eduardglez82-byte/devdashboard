<?php

namespace App\Models;

use App\Models\Concerns\HasMongoId;
use Jenssegers\Mongodb\Eloquent\Model;

class PomodoroSession extends Model
{
    use HasMongoId;

    protected $connection = 'mongodb';
    protected $collection = 'pomodoro_sessions';

    protected $fillable = [
        'user_id',
        'tarea_id',
        'tipo',
        'duracion_segundos',
        'completado',
        'iniciada_en',
        'finalizada_en',
    ];

    protected $casts = [
        'completado'        => 'boolean',
        'iniciada_en'       => 'datetime',
        'finalizada_en'     => 'datetime',
        'duracion_segundos' => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', '_id');
    }

    public function tarea()
    {
        return $this->belongsTo(Tarea::class, 'tarea_id', '_id');
    }
}
