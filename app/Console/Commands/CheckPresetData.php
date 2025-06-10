<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\ItemPreset;

class CheckPresetData extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'check:preset-data';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check current preset data in database';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Verificando datos de presets en la base de datos...');
        
        $presets = ItemPreset::with('item')->get();
        
        if ($presets->isEmpty()) {
            $this->warn('No hay presets en la base de datos.');
            return;
        }
        
        foreach ($presets as $preset) {
            $this->info("=== PRESET: {$preset->name} ===");
            $this->line("ID: {$preset->id}");
            $this->line("Item: {$preset->item->name}");
            
            $this->line("\n📄 Pages Options:");
            if ($preset->pages_options) {
                $this->line("  " . json_encode($preset->pages_options, JSON_PRETTY_PRINT));
            } else {
                $this->line("  ❌ NULL/Empty");
            }
            $this->line("  Default: " . ($preset->default_pages ?: 'NULL'));
            
            $this->line("\n🎨 Cover Options:");
            if ($preset->cover_options) {
                $this->line("  " . json_encode($preset->cover_options, JSON_PRETTY_PRINT));
            } else {
                $this->line("  ❌ NULL/Empty");
            }
            $this->line("  Default: " . ($preset->default_cover ?: 'NULL'));
            
            $this->line("\n✨ Finish Options:");
            if ($preset->finish_options) {
                $this->line("  " . json_encode($preset->finish_options, JSON_PRETTY_PRINT));
            } else {
                $this->line("  ❌ NULL/Empty");
            }
            $this->line("  Default: " . ($preset->default_finish ?: 'NULL'));
            
            $this->line("\n🖼️ Content Layer Config:");
            if ($preset->content_layer_config) {
                $this->line("  " . json_encode($preset->content_layer_config, JSON_PRETTY_PRINT));
            } else {
                $this->line("  ❌ NULL/Empty");
            }
            
            $this->line("\n" . str_repeat('-', 50) . "\n");
        }
        
        return 0;
    }
}
