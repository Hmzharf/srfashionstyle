<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('promotion_media', function (Blueprint $table) {
            $table->id();
            $table->string('title')->nullable();
            $table->string('placement')->nullable();
            $table->string('active_for')->nullable();
            $table->string('image_path');
            $table->text('image_url');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('promotion_media');
    }
};