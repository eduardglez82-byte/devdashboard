<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Empresa extends Model
{
    use HasFactory;

    protected $fillable = [
        'nombre',
        'rfc',
        'email',
        'telefono',
        'estatus',
    ];

    public function usuarios()
    {
        return $this->hasMany(User::class, 'empresa_id');
    }
}
