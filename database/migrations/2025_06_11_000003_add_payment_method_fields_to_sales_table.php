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
        Schema::table('sales', function (Blueprint $table) {
            // Agregar campos para métodos de pago
            if (!Schema::hasColumn('sales', 'payment_method_id')) {
                $table->unsignedBigInteger('payment_method_id')->nullable()->after('payment_method');
                $table->foreign('payment_method_id')->references('id')->on('payment_methods')->onDelete('set null');
            }
            
            if (!Schema::hasColumn('sales', 'payment_fee')) {
                $table->decimal('payment_fee', 10, 2)->default(0)->after('payment_method_id');
            }
            
            if (!Schema::hasColumn('sales', 'payment_proof_path')) {
                $table->string('payment_proof_path')->nullable()->after('payment_fee');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropForeign(['payment_method_id']);
            $table->dropColumn(['payment_method_id', 'payment_fee', 'payment_proof_path']);
        });
    }
};
