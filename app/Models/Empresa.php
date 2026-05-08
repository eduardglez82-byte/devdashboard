<?php

namespace App\Models;

use App\Models\Concerns\HasMongoId;
use Jenssegers\Mongodb\Eloquent\Model;

class Empresa extends Model
{
    use HasMongoId;

    protected $connection = 'mongodb';
    protected $collection = 'empresas';

    protected $fillable = [
        'nombre',
        'rfc',
        'email',
        'telefono',
        'estatus',
    ];

    public function usuarios()
    {
        return $this->hasMany(User::class, 'empresa_id', '_id');
    }
}
