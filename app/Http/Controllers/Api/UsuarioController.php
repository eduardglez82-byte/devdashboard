<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UsuarioController extends Controller
{
    public function index(Request $request)
    {
        $authUser = $request->user();

        $query = User::with('empresa:id,nombre')->latest();

        if ($authUser->role !== 'admin') {
            $query->where('empresa_id', $authUser->empresa_id);
        }

        return $query->get(['id', 'name', 'email', 'role', 'empresa_id', 'created_at']);
    }

    public function store(Request $request)
    {
        $authUser = $request->user();
        $isAdminEmpresa = $authUser->role === 'admin_empresa';

        $rules = [
            'name'       => ['required', 'string', 'max:255'],
            'email'      => ['required', 'email', 'unique:users', 'max:255'],
            'password'   => ['required', 'string', 'min:8'],
            'empresa_id' => ['nullable', 'exists:empresas,id'],
        ];

        if (!$isAdminEmpresa) {
            $rules['role'] = ['required', 'in:admin,admin_empresa,usuario_empresa'];
        }

        $validated = $request->validate($rules);

        $empresaId = $isAdminEmpresa ? $authUser->empresa_id : ($validated['empresa_id'] ?? null);
        $role      = $isAdminEmpresa ? 'usuario_empresa' : $validated['role'];

        $user = User::create([
            'name'       => $validated['name'],
            'email'      => $validated['email'],
            'password'   => Hash::make($validated['password']),
            'role'       => $role,
            'empresa_id' => $empresaId,
        ]);

        $user->load('empresa:id,nombre');
        return response()->json($user->only(['id', 'name', 'email', 'role', 'empresa_id', 'created_at']) + ['empresa' => $user->empresa], 201);
    }

    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'name'       => ['required', 'string', 'max:255'],
            'email'      => ['required', 'email', 'max:255', 'unique:users,email,' . $user->id],
            'password'   => ['nullable', 'string', 'min:8'],
            'role'       => ['required', 'in:admin,admin_empresa,usuario_empresa'],
            'empresa_id' => ['nullable', 'exists:empresas,id'],
        ]);

        $data = [
            'name'       => $validated['name'],
            'email'      => $validated['email'],
            'role'       => $validated['role'],
            'empresa_id' => $validated['empresa_id'] ?? null,
        ];

        if (!empty($validated['password'])) {
            $data['password'] = Hash::make($validated['password']);
        }

        $user->update($data);
        $user->load('empresa:id,nombre');
        return response()->json($user->only(['id', 'name', 'email', 'role', 'empresa_id', 'created_at']) + ['empresa' => $user->empresa]);
    }

    public function destroy(User $user)
    {
        $user->delete();
        return response()->json(['message' => 'deleted']);
    }
}
