<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('payment_methods', function (Blueprint $table) {
            $table->id();            $table->string('name'); // Yape, MercadoPago, Culqi, etc.
            $table->string('slug'); // yape, mercadopago, culqi
            $table->string('display_name'); // Nombre para mostrar al usuario
            $table->text('description')->nullable(); // Descripción del método
            $table->string('icon')->nullable(); // Logo del método
            $table->string('type'); // 'gateway', 'manual', 'qr'
            $table->boolean('is_active')->default(true);
            $table->boolean('requires_proof')->default(false); // Si requiere comprobante
            $table->decimal('fee_percentage', 5, 2)->default(0); // Comisión en %
            $table->decimal('fee_fixed', 10, 2)->default(0); // Comisión fija
            $table->json('configuration'); // Configuración específica del método
            $table->json('instructions')->nullable(); // Instrucciones para el usuario
            $table->integer('sort_order')->default(0); // Orden de aparición
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payment_methods');
    }
};
