<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Tarea extends Model
{
    protected $fillable = [
        'titulo',
        'descripcion',
        'estado',
        'prioridad',
        'empresa_id',
        'asignado_a',
    ];

    public function empresa()
    {
        return $this->belongsTo(Empresa::class);
    }

    public function asignado()
    {
        return $this->belongsTo(User::class, 'asignado_a');
    }
}
