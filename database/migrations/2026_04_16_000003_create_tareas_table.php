<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tareas', function (Blueprint $table) {
            $table->id();
            $table->string('titulo');
            $table->text('descripcion')->nullable();
            $table->enum('estado', ['pendiente', 'en_progreso', 'completado'])->default('pendiente');
            $table->enum('prioridad', ['baja', 'media', 'alta'])->default('media');
            $table->foreignId('empresa_id')
                  ->nullable()
                  ->constrained('empresas')
                  ->nullOnDelete();
            $table->foreignId('asignado_a')
                  ->nullable()
                  ->constrained('users')
                  ->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tareas');
    }
};
