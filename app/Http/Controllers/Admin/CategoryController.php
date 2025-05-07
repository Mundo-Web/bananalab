<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\BasicController;
use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;

class CategoryController extends BasicController
{
    public $model = Category::class;
    public $reactView = 'Admin/Categories';
    public $imageFields = ['banner', 'image'];
    public $prefix4filter = 'categories';

    public function setPaginationInstance(Request $request, string $model)
    {
        return $model::select('categories.*')
            ->with(['collection'])
            ->join('collections AS collection', 'collection.id', 'categories.collection_id');
    }
}
