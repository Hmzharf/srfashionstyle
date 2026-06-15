<?php

namespace App\Exports;

use App\Models\Category;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithTitle;

class CategoriesSheetExport implements FromCollection, WithHeadings, ShouldAutoSize, WithTitle
{
    public function collection()
    {
        return Category::query()
            ->latest()
            ->get([
                'id',
                'name',
                'slug',
                'created_at',
            ]);
    }

    public function headings(): array
    {
        return ['ID', 'Nama', 'Slug', 'Tanggal'];
    }

    public function title(): string
    {
        return 'Categories';
    }
}