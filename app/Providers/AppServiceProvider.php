<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Laravel\Sanctum\Sanctum;

class AppServiceProvider extends ServiceProvider
{
    public function register()
    {
        // Sanctum SPA mode: no usamos personal_access_tokens (la tabla SQL no aplica en Mongo).
        Sanctum::ignoreMigrations();
    }

    public function boot()
    {
        //
    }
}
