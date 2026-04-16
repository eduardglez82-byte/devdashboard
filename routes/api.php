<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ClaudeController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\EmpresaController;
use App\Http\Controllers\Api\NotaController;
use App\Http\Controllers\Api\TareaController;
use App\Http\Controllers\Api\UsuarioController;

/*
|--------------------------------------------------------------------------
| API Routes - DevDashboard
|--------------------------------------------------------------------------
| Estas rutas usan el middleware 'web' implícitamente vía Sanctum SPA mode,
| por lo que las cookies de sesión funcionan. Si en Laravel 11+ necesitas
| habilitar api.php, corre:  php artisan install:api
*/

// Rutas públicas
Route::post('/login', [AuthController::class, 'login']);

// Rutas autenticadas (sesión de cookie, Sanctum SPA mode)
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Empresas
    Route::get('/empresas',         [EmpresaController::class, 'index']);
    Route::post('/empresas',        [EmpresaController::class, 'store']);
    Route::put('/empresas/{empresa}', [EmpresaController::class, 'update']);
    Route::delete('/empresas/{empresa}', [EmpresaController::class, 'destroy']);

    // Usuarios
    Route::get('/usuarios',          [UsuarioController::class, 'index']);
    Route::post('/usuarios',         [UsuarioController::class, 'store']);
    Route::put('/usuarios/{user}',   [UsuarioController::class, 'update']);
    Route::delete('/usuarios/{user}', [UsuarioController::class, 'destroy']);

    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'stats']);

    // Claude AI
    Route::post('/claude/chat', [ClaudeController::class, 'chat']);

    // Notas
    Route::get('/notas',           [NotaController::class, 'index']);
    Route::post('/notas',          [NotaController::class, 'store']);
    Route::delete('/notas/{nota}', [NotaController::class, 'destroy']);

    // Tareas
    Route::get('/tareas',           [TareaController::class, 'index']);
    Route::post('/tareas',          [TareaController::class, 'store']);
    Route::put('/tareas/{tarea}',   [TareaController::class, 'update']);
    Route::delete('/tareas/{tarea}',[TareaController::class, 'destroy']);

    // Ejemplo de recurso protegido — reemplaza con tus controladores reales
    Route::get('/proyectos', function () {
        return [
            ['id' => 1, 'nombre' => 'api-core',      'lang' => 'Node.js', 'estado' => 'activo',  'commits' => 247],
            ['id' => 2, 'nombre' => 'dashboard-ui',  'lang' => 'React',   'estado' => 'activo',  'commits' => 189],
            ['id' => 3, 'nombre' => 'auth-service',  'lang' => 'Go',      'estado' => 'pausado', 'commits' => 92],
            ['id' => 4, 'nombre' => 'data-pipeline', 'lang' => 'Python',  'estado' => 'activo',  'commits' => 334],
        ];
    });
});
