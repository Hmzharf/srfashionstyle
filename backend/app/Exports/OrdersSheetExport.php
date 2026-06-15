<?php

namespace App\Exports;

use App\Models\Order;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithTitle;

class OrdersSheetExport implements FromCollection, WithHeadings, ShouldAutoSize, WithTitle
{
    public function collection()
    {
        return Order::query()
            ->latest()
            ->get([
                'id',
                'order_code',
                'customer_name',
                'email',
                'phone',
                'status',
                'payment_status',
                'payment_method',
                'grand_total',
                'created_at',
            ]);
    }

    public function headings(): array
    {
        return [
            'ID',
            'Kode Order',
            'Customer',
            'Email',
            'Telepon',
            'Status Order',
            'Status Pembayaran',
            'Metode Pembayaran',
            'Total',
            'Tanggal',
        ];
    }

    public function title(): string
    {
        return 'Orders';
    }
}