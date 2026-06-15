<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->enum('channel', ['online', 'pos'])->default('online')->after('notes');
            $table->string('pos_payment_method', 50)->nullable()->after('channel');
            $table->string('pos_transfer_ref', 100)->nullable()->after('pos_payment_method');
        });
    }
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['channel', 'pos_payment_method', 'pos_transfer_ref']);
        });
    }
};