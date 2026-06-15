<?php

namespace App\Exports;

use App\Models\Review;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithTitle;

class ReviewsSheetExport implements FromCollection, WithHeadings, ShouldAutoSize, WithTitle, WithMapping
{
    public function collection()
    {
        return Review::query()
            ->with([
                'user:id,name',
                'product:id,name',
            ])
            ->latest()
            ->get();
    }

    public function headings(): array
    {
        return [
            'ID',
            'Nama User',
            'Nama Produk',
            'Rating',
            'Komentar',
            'Tanggal',
        ];
    }

    public function map($review): array
    {
        return [
            $review->id,
            $review->user?->name ?? '-',
            $review->product?->name ?? '-',
            $review->rating ?? 0,
            $review->comment ?? '-',
            optional($review->created_at)->format('d-m-Y H:i:s'),
        ];
    }

    public function title(): string
    {
        return 'Reviews';
    }
}