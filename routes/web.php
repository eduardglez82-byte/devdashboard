<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes - DevDashboard
|--------------------------------------------------------------------------
| Una sola ruta catch-all que entrega el shell HTML del SPA de React.
| React Router maneja todas las sub-rutas del lado del cliente.
|
| Importante: esta ruta NO intercepta /api/* porque Laravel matchea primero
| las rutas de api.php. Tampoco intercepta /sanctum/csrf-cookie.
*/

Route::get('/{any?}', function () {
    return view('app');
})->where('any', '^(?!api|sanctum|storage|build|livewire).*$');
