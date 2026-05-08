<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;
use Jenssegers\Mongodb\Schema\Blueprint;

return new class extends Migration {
    protected $connection = 'mongodb';

    public function up(): void
    {
        $schema = Schema::connection('mongodb');

        $schema->create('users', function (Blueprint $collection) {
            $collection->unique('email');
            $collection->index('empresa_id');
            $collection->index('role');
        });

        $schema->create('empresas', function (Blueprint $collection) {
            $collection->index('nombre');
            $collection->index('rfc');
        });

        $schema->create('tareas', function (Blueprint $collection) {
            $collection->index('estado');
            $collection->index('prioridad');
            $collection->index('empresa_id');
            $collection->index('asignado_a');
            $collection->index('created_at');
        });

        $schema->create('notas', function (Blueprint $collection) {
            $collection->index('user_id');
            $collection->index('created_at');
        });

        $schema->create('pomodoro_sessions', function (Blueprint $collection) {
            $collection->index('user_id');
            $collection->index('tarea_id');
            $collection->index('tipo');
            $collection->index('created_at');
        });
    }

    public function down(): void
    {
        $schema = Schema::connection('mongodb');
        foreach (['users', 'empresas', 'tareas', 'notas', 'pomodoro_sessions'] as $coll) {
            $schema->dropIfExists($coll);
        }
    }
};
