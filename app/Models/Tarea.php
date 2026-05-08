<?php

namespace App\Models;

use App\Models\Concerns\HasMongoId;
use Jenssegers\Mongodb\Eloquent\Model;

class Tarea extends Model
{
    use HasMongoId;

    protected $connection = 'mongodb';
    protected $collection = 'tareas';

    protected $fillable = [
        'titulo',
        'descripcion',
        'estado',
        'prioridad',
        'empresa_id',
        'asignado_a',
    ];

    protected $attributes = [
        'estado'    => 'pendiente',
        'prioridad' => 'media',
    ];

    public function empresa()
    {
        return $this->belongsTo(Empresa::class, 'empresa_id', '_id');
    }

    public function asignado()
    {
        return $this->belongsTo(User::class, 'asignado_a', '_id');
    }
}
