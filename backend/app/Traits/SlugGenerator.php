<?php

namespace App\Traits;

use Illuminate\Support\Str;

trait SlugGenerator
{
    /**
     * Generate a unique slug for a given model and name.
     *
     * @param  string       $modelClass  Fully-qualified model class name
     * @param  string       $name        Source name to slugify
     * @param  int|null     $ignoreId    Optional record ID to ignore (for updates)
     * @param  string       $column      Slug column name (default: 'slug')
     * @return string
     */
    private function generateUniqueSlug(
        string $modelClass,
        string $name,
        ?int $ignoreId = null,
        string $column = 'slug'
    ): string {
        $baseSlug = Str::slug($name);
        $slug = $baseSlug;
        $counter = 1;

        while (
            $modelClass::where($column, $slug)
                ->when($ignoreId, function ($query) use ($ignoreId) {
                    $query->where('id', '!=', $ignoreId);
                })
                ->exists()
        ) {
            $slug = $baseSlug . '-' . $counter;
            $counter++;
        }

        return $slug;
    }
}
