<?php

namespace App\Exports;

use App\Models\Order;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class OrdersReportExport implements FromCollection, WithHeadings, WithMapping, ShouldAutoSize
{
    protected $from;
    protected $to;
    protected $status;
    protected $paymentStatus;
    protected $rowNumber = 0;

    public function __construct($from = null, $to = null, $status = null, $paymentStatus = null)
    {
        $this->from = $from;
        $this->to = $to;
        $this->status = $status;
        $this->paymentStatus = $paymentStatus;
    }

    public function collection()
    {
        return Order::query()
            ->when($this->from, fn ($q) => $q->whereDate('created_at', '>=', $this->from))
            ->when($this->to, fn ($q) => $q->whereDate('created_at', '<=', $this->to))
            ->when($this->status, fn ($q) => $q->where('status', $this->status))
            ->when($this->paymentStatus, fn ($q) => $q->where('payment_status', $this->paymentStatus))
            ->latest()
            ->get();
    }

    public function headings(): array
    {
        return [
            'No',
            'Tanggal',
            'Kode Order',
            'Customer',
            'Email',
            'Telepon',
            'Status Order',
            'Status Pembayaran',
            'Metode Pembayaran',
            'Total',
        ];
    }

    public function map($order): array
    {
        $this->rowNumber++;

        return [
            $this->rowNumber,
            optional($order->created_at)->format('d-m-Y H:i'),
            $order->order_code,
            $order->customer_name,
            $order->email,
            $order->phone,
            $order->status,
            $order->payment_status,
            $order->payment_method,
            $order->grand_total,
        ];
    }
}