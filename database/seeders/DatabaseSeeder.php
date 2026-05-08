<?php

namespace Database\Seeders;

use App\Models\Empresa;
use App\Models\Tarea;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Empresa demo
        $empresa = Empresa::firstOrCreate(
            ['rfc' => 'XAXX010101000'],
            [
                'nombre'   => 'Empresa Demo',
                'email'    => 'contacto@empresa-demo.com',
                'telefono' => '5550000000',
                'estatus'  => 'activo',
            ]
        );

        // Admin global
        $admin = User::firstOrCreate(
            ['email' => 'admin@dicomfresnillo.com'],
            [
                'name'       => 'Admin',
                'password'   => Hash::make('password123'),
                'role'       => 'admin',
                'empresa_id' => null,
            ]
        );

        // Admin de empresa
        $adminEmpresa = User::firstOrCreate(
            ['email' => 'admin@empresa-demo.com'],
            [
                'name'       => 'Admin Empresa',
                'password'   => Hash::make('password123'),
                'role'       => 'admin_empresa',
                'empresa_id' => (string) $empresa->_id,
            ]
        );

        // Usuario común
        $usuario = User::firstOrCreate(
            ['email' => 'user@empresa-demo.com'],
            [
                'name'       => 'Usuario Demo',
                'password'   => Hash::make('password123'),
                'role'       => 'usuario_empresa',
                'empresa_id' => (string) $empresa->_id,
            ]
        );

        // Tareas demo
        if (Tarea::count() === 0) {
            $tareas = [
                ['titulo' => 'Configurar entorno', 'estado' => 'completado',  'prioridad' => 'alta'],
                ['titulo' => 'Diseñar tablero',    'estado' => 'en_progreso', 'prioridad' => 'media'],
                ['titulo' => 'Probar Pomodoro',    'estado' => 'pendiente',   'prioridad' => 'baja'],
                ['titulo' => 'Revisar IA chat',    'estado' => 'pendiente',   'prioridad' => 'media'],
            ];
            foreach ($tareas as $t) {
                Tarea::create($t + [
                    'empresa_id' => (string) $empresa->_id,
                    'asignado_a' => (string) $usuario->_id,
                ]);
            }
        }
    }
}
