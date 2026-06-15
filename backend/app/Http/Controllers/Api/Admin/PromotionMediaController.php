<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\PromotionMedia;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class PromotionMediaController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(
            PromotionMedia::latest()->get()
        );
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title' => 'nullable|string|max:255',
            'placement' => 'required|in:hero_desktop,hero_mobile,promo',
            'image' => 'required|image|max:2048',
        ]);

        if (!$request->hasFile('image')) {
            return response()->json([
                'message' => 'File gambar tidak ditemukan.',
            ], 422);
        }

        $path = $request->file('image')->store('promotion-media', 'public');
        $url = asset('storage/' . ltrim($path, '/'));

        PromotionMedia::where('active_for', $data['placement'])->update([
            'active_for' => null,
        ]);

        $media = PromotionMedia::create([
            'title' => $data['title'] ?? null,
            'placement' => $data['placement'],
            'active_for' => $data['placement'],
            'image_path' => $path,
            'image_url' => $url,
        ]);

        return response()->json([
            'message' => 'Media berhasil di-upload dan langsung diaktifkan.',
            'data' => $media,
        ], 201);
    }

    public function activate(Request $request, $id): JsonResponse
    {
        $data = $request->validate([
            'type' => 'required|in:hero_desktop,hero_mobile,promo',
        ]);

        $media = PromotionMedia::find($id);

        if (!$media) {
            return response()->json([
                'message' => 'Media tidak ditemukan.',
            ], 404);
        }

        PromotionMedia::where('active_for', $data['type'])->update([
            'active_for' => null,
        ]);

        $media->update([
            'active_for' => $data['type'],
        ]);

        $media->refresh();

        return response()->json([
            'message' => 'Media berhasil diatur sebagai ' . $data['type'] . '.',
            'data' => $media,
        ]);
    }

    public function destroy($id): JsonResponse
    {
        $media = PromotionMedia::find($id);

        if (!$media) {
            return response()->json([
                'message' => 'Media tidak ditemukan.',
            ], 404);
        }

        if ($media->image_path) {
            Storage::disk('public')->delete($media->image_path);
        }

        $media->delete();

        return response()->json([
            'message' => 'Media berhasil dihapus.',
        ]);
    }
}