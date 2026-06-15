<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('pos_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pos_shift_id')->constrained('pos_shifts');
            $table->foreignId('cashier_staff_id')->constrained('cashier_staff');
            $table->string('transaction_code', 50)->unique();
            $table->decimal('subtotal', 15, 2)->default(0);
            $table->decimal('discount', 15, 2)->default(0);
            $table->decimal('grand_total', 15, 2)->default(0);
            $table->enum('payment_method', ['cash', 'qris', 'transfer_bca', 'card'])->default('cash');
            $table->decimal('cash_received', 15, 2)->nullable();
            $table->decimal('change_given', 15, 2)->nullable();
            $table->string('transfer_ref', 100)->nullable();
            $table->enum('status', ['completed', 'cancelled', 'refunded'])->default('completed');
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->index('pos_shift_id');
            $table->index('cashier_staff_id');
        });
    }
    public function down(): void { Schema::dropIfExists('pos_transactions'); }
};