<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('pos_shifts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cashier_staff_id')->constrained('cashier_staff');
            $table->foreignId('opened_by_user_id')->constrained('users');
            $table->string('shift_code', 50)->unique();
            $table->decimal('opening_cash', 15, 2)->default(0);
            $table->decimal('closing_cash', 15, 2)->nullable();
            $table->decimal('total_cash_in', 15, 2)->default(0);
            $table->decimal('total_non_cash', 15, 2)->default(0);
            $table->decimal('cash_difference', 15, 2)->nullable();
            $table->enum('status', ['open', 'closed'])->default('open');
            $table->timestamp('opened_at')->useCurrent();
            $table->timestamp('closed_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->index('status');
            $table->index('cashier_staff_id');
        });
    }
    public function down(): void { Schema::dropIfExists('pos_shifts'); }
};