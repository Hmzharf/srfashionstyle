<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Laporan Orders</title>
    <style>
        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 12px;
            color: #222;
        }

        h1 {
            margin: 0 0 8px;
            font-size: 20px;
        }

        .meta {
            margin-bottom: 16px;
            font-size: 11px;
            color: #555;
            line-height: 1.5;
        }

        table {
            width: 100%;
            border-collapse: collapse;
        }

        th, td {
            border: 1px solid #cfcfcf;
            padding: 6px 8px;
            vertical-align: top;
            text-align: left;
        }

        th {
            background: #f2f2f2;
            font-weight: bold;
        }

        .text-right {
            text-align: right;
        }
    </style>
</head>
<body>
    <h1>Laporan Orders</h1>

    <div class="meta">
        <div>Periode: {{ $from ?: '-' }} s/d {{ $to ?: '-' }}</div>
        <div>Status Order: {{ $status ?: 'Semua' }}</div>
        <div>Status Pembayaran: {{ $paymentStatus ?: 'Semua' }}</div>
        <div>Dicetak pada: {{ $printedAt }}</div>
    </div>

    <table>
        <thead>
            <tr>
                <th>No</th>
                <th>Tanggal</th>
                <th>Kode Order</th>
                <th>Customer</th>
                <th>Email</th>
                <th>Telepon</th>
                <th>Status Order</th>
                <th>Status Pembayaran</th>
                <th>Metode</th>
                <th>Total</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($orders as $index => $order)
                <tr>
                    <td>{{ $index + 1 }}</td>
                    <td>{{ optional($order->created_at)->format('d-m-Y H:i') }}</td>
                    <td>{{ $order->order_code }}</td>
                    <td>{{ $order->customer_name }}</td>
                    <td>{{ $order->email }}</td>
                    <td>{{ $order->phone }}</td>
                    <td>{{ $order->status }}</td>
                    <td>{{ $order->payment_status }}</td>
                    <td>{{ $order->payment_method }}</td>
                    <td class="text-right">Rp {{ number_format($order->grand_total ?? 0, 0, ',', '.') }}</td>
                </tr>
            @empty
                <tr>
                    <td colspan="10">Tidak ada data order.</td>
                </tr>
            @endforelse
        </tbody>
    </table>
</body>
</html>