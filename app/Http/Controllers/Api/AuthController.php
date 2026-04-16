<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * POST /api/login
     * Autenticación por cookie (Sanctum SPA mode).
     */
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email'    => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        if (!Auth::attempt($credentials, true)) {
            throw ValidationException::withMessages([
                'email' => ['Credenciales incorrectas.'],
            ]);
        }

        $request->session()->regenerate();

        return response()->json([
            'user' => $request->user(),
        ]);
    }

    /**
     * POST /api/logout
     */
    public function logout(Request $request)
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['message' => 'logged_out']);
    }

    /**
     * GET /api/user
     */
    public function me(Request $request)
    {
        return $request->user();
    }
}
