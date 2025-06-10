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
            $table->string('payment_method')->default('culqi')->after('payment_status');
            $table->string('payment_proof_path')->nullable()->after('payment_method');
            $table->text('admin_notes')->nullable()->after('payment_proof_path');
            $table->timestamp('verified_at')->nullable()->after('admin_notes');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropColumn(['payment_method', 'payment_proof_path', 'admin_notes', 'verified_at']);
        });
    }
};
