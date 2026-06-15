<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('pos_transaction_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pos_transaction_id')->constrained('pos_transactions')->onDelete('cascade');
            $table->foreignId('product_variant_id')->constrained('product_variants');
            $table->string('product_name', 200);
            $table->string('sku', 100)->nullable();
            $table->string('color', 100)->nullable();
            $table->string('size', 50)->nullable();
            $table->decimal('price', 15, 2);
            $table->integer('qty');
            $table->decimal('subtotal', 15, 2);
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('pos_transaction_items'); }
};