<?php

namespace Database\Seeders;

use App\Models\SaleStatus;
use Illuminate\Database\Seeder;
use SoDe\Extend\Crypto;

class StatusSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $statuses = [
            [
                'id' => 'e13a417d-a2f0-4f5f-93d8-462d57f13d3c',
                'name' => 'Pendiente',
                'color' => '#6c757d',
                'editable' => false
            ],
            [
                'id' => '312f9a91-d3f2-4672-a6bf-678967616cac',
                'name' => 'Pagado',
                'color' => '#71b6f9',
                'editable' => false
            ],
            [
                'id' => 'd3a77651-15df-4fdc-a3db-91d6a8f4247c',
                'name' => 'Rechazado',
                'color' => '#ff5b5b',
                'editable' => false
            ],
            [
                'id' => 'c063efb2-1e9b-4a43-8991-b444c14d30dd',
                'name' => 'Anulado',
                'color' => '#323a46',
                'reversible' => false
            ],
            [
                'id' => 'a8903cd5-e91d-47d2-93ee-e0fca3845ecc',
                'name' => 'En producción',
                'color' => '#ffc107'
            ],
            [
                'id' => 'ad509181-6701-4fa1-a990-6bcb103254af',
                'name' => 'Enviado',
                'color' => '#17a2b8'
            ],
            [
                'id' => 'bc012ef5-96e8-4bbb-867b-061c4090d9d2',
                'name' => 'Entregado',
                'color' => '#10c469',
                'reversible' => false
            ],
        ];
        foreach ($statuses as $status) {
            SaleStatus::updateOrCreate(['name' => $status['name']], $status);
        }
    }
}
