<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Empresa;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UsuarioController extends Controller
{
    public function index(Request $request)
    {
        $authUser = $request->user();

        $query = User::query()->orderBy('created_at', 'desc');

        if ($authUser->role !== 'admin') {
            $query->where('empresa_id', $authUser->empresa_id);
        }

        $users = $query->get(['_id', 'name', 'email', 'role', 'empresa_id', 'created_at']);

        // Hidratar empresa
        $ids = $users->pluck('empresa_id')->filter()->unique()->all();
        $empresas = Empresa::whereIn('_id', $ids)->get(['_id', 'nombre'])->keyBy('id');

        $users->each(function ($u) use ($empresas) {
            $u->setRelation('empresa', $u->empresa_id ? $empresas->get((string) $u->empresa_id) : null);
        });

        return response()->json($users);
    }

    public function store(Request $request)
    {
        $authUser = $request->user();
        $isAdminEmpresa = $authUser->role === 'admin_empresa';

        $rules = [
            'name'       => ['required', 'string', 'max:255'],
            'email'      => ['required', 'email', 'max:255', Rule::unique('mongodb.users', 'email')],
            'password'   => ['required', 'string', 'min:8'],
            'empresa_id' => ['nullable', 'string'],
        ];

        if (!$isAdminEmpresa) {
            $rules['role'] = ['required', 'in:admin,admin_empresa,usuario_empresa'];
        }

        $validated = $request->validate($rules);

        if (!empty($validated['empresa_id']) && !Empresa::where('_id', $validated['empresa_id'])->exists()) {
            return response()->json(['error' => 'empresa_id inválido'], 422);
        }

        $empresaId = $isAdminEmpresa ? $authUser->empresa_id : ($validated['empresa_id'] ?? null);
        $role      = $isAdminEmpresa ? 'usuario_empresa' : $validated['role'];

        $user = User::create([
            'name'       => $validated['name'],
            'email'      => $validated['email'],
            'password'   => Hash::make($validated['password']),
            'role'       => $role,
            'empresa_id' => $empresaId,
        ]);

        $user->setRelation('empresa', $empresaId ? Empresa::where('_id', $empresaId)->first(['_id', 'nombre']) : null);

        return response()->json($user, 201);
    }

    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'name'       => ['required', 'string', 'max:255'],
            'email'      => ['required', 'email', 'max:255', Rule::unique('mongodb.users', 'email')->ignore($user->id, '_id')],
            'password'   => ['nullable', 'string', 'min:8'],
            'role'       => ['required', 'in:admin,admin_empresa,usuario_empresa'],
            'empresa_id' => ['nullable', 'string'],
        ]);

        if (!empty($validated['empresa_id']) && !Empresa::where('_id', $validated['empresa_id'])->exists()) {
            return response()->json(['error' => 'empresa_id inválido'], 422);
        }

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
        $user->setRelation('empresa', $data['empresa_id'] ? Empresa::where('_id', $data['empresa_id'])->first(['_id', 'nombre']) : null);

        return response()->json($user);
    }

    public function destroy($id)
    {
        $user = User::findOrFail($id);
        $user->delete();
        return response()->json(['message' => 'deleted']);
    }
}
