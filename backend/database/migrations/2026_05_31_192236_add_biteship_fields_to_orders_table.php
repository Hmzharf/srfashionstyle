<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('shipping_service_code')->nullable()->after('shipping_method');
            $table->string('shipping_label')->nullable()->after('shipping_service_code');
            $table->string('biteship_order_id')->nullable()->after('payment_reference');
            $table->string('tracking_id')->nullable()->after('biteship_order_id');
            $table->string('waybill_id')->nullable()->after('tracking_id');
            $table->string('shipping_status')->nullable()->after('waybill_id');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn([
                'shipping_service_code',
                'shipping_label',
                'biteship_order_id',
                'tracking_id',
                'waybill_id',
                'shipping_status',
            ]);
        });
    }
};