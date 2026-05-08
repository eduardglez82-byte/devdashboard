<?php

namespace App\Models;

use App\Models\Concerns\HasMongoId;
use Jenssegers\Mongodb\Eloquent\Model;

class Nota extends Model
{
    use HasMongoId;

    protected $connection = 'mongodb';
    protected $collection = 'notas';

    protected $fillable = ['contenido', 'user_id'];

    public function usuario()
    {
        return $this->belongsTo(User::class, 'user_id', '_id');
    }
}
