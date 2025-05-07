<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\BasicController;
use App\Http\Controllers\Controller;
use App\Models\Campaign;
use App\Models\Category;
use Illuminate\Http\Request;

class CampaignController extends BasicController
{
    public $model = Campaign::class;
    public $reactView = 'Admin/Campaigns';
    public $imageFields = ['banner', 'image'];
    public $prefix4filter = 'campaigns';

    public function setPaginationInstance(Request $request, string $model)
    {
        return $model::with(['items']);
    }

    public function afterSave(Request $request, object $jpa, ?bool $isNew)
    {
        if ($request->input('products')) {
            $jpa->items()->sync($request->input('products', []));
        }
    }
}
