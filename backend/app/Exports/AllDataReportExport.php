<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\WithMultipleSheets;

class AllDataReportExport implements WithMultipleSheets
{
    public function sheets(): array
    {
        return [
            new OrdersSheetExport(),
            new ProductsSheetExport(),
            new CategoriesSheetExport(),
            new InventoriesSheetExport(),
            new ReviewsSheetExport(),
            new UsersSheetExport(),
        ];
    }
}