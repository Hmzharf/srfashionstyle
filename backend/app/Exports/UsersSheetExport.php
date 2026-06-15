<?php

namespace App\Exports;

use App\Models\User;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithTitle;

class UsersSheetExport implements FromCollection, WithHeadings, ShouldAutoSize, WithTitle
{
    public function collection()
    {
        return User::query()
            ->latest()
            ->get([
                'id',
                'name',
                'email',
                'role',
                'created_at',
            ]);
    }

    public function headings(): array
    {
        return ['ID', 'Nama', 'Email', 'Role', 'Tanggal'];
    }

    public function title(): string
    {
        return 'Users';
    }
}