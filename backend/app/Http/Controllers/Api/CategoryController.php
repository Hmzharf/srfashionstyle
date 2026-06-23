<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Traits\SlugGenerator;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    use SlugGenerator;

    public function index()
    {
        return Category::all();
    }

    public function show(Category $category)
    {
        return $category;
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $category = Category::create([
            'name'      => $data['name'],
            'slug'      => $this->generateUniqueSlug(Category::class, $data['name']),
            'is_active' => true,
        ]);

        return response()->json($category, 201);
    }

    public function update(Request $request, Category $category)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $category->update([
            'name' => $data['name'],
            'slug' => $this->generateUniqueSlug(Category::class, $data['name'], $category->id),
        ]);

        return response()->json($category);
    }

    public function destroy(Category $category)
    {
        $category->delete();
        return response()->json(null, 204);
    }
}