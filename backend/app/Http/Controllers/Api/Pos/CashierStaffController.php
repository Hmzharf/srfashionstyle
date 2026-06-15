<?php
namespace App\Http\Controllers\Api\Pos;

use App\Http\Controllers\Controller;
use App\Models\CashierStaff;
use Illuminate\Http\Request;

class CashierStaffController extends Controller
{
    public function index(Request $request)
    {
        $query = CashierStaff::query();

        // route POS -> cuma staff aktif
        if (str_contains($request->path(), 'pos/')) {
            $query->where('is_active', true);
        }

        return response()->json([
            'success' => true,
            'data' => $query->orderBy('name')->get(),
        ]);
    }


    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'code' => 'required|string|max:20|unique:cashier_staff,code',
            'is_active' => 'boolean',
            'notes' => 'nullable|string',
        ]);
        $staff = CashierStaff::create($validated);
        return response()->json(['success' => true, 'message' => 'Kasir berhasil ditambahkan.', 'data' => $staff], 201);
    }

    public function update(Request $request, $id)
    {
        $staff = CashierStaff::findOrFail($id);
        $validated = $request->validate([
            'name' => 'sometimes|string|max:100',
            'code' => 'sometimes|string|max:20|unique:cashier_staff,code,' . $id,
            'is_active' => 'sometimes|boolean',
            'notes' => 'nullable|string',
        ]);
        $staff->update($validated);
        return response()->json(['success' => true, 'message' => 'Kasir berhasil diperbarui.', 'data' => $staff]);
    }

    public function destroy($id)
    {
        $staff = CashierStaff::findOrFail($id);
        $openShift = $staff->shifts()->where('status', 'open')->first();
        if ($openShift) {
            return response()->json([
                'success' => false,
                'message' => 'Kasir masih memiliki shift yang sedang berjalan.',
            ], 422);
        }
        $staff->delete();
        return response()->json(['success' => true, 'message' => 'Kasir berhasil dihapus.']);
    }
}