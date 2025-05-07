<?php

namespace App\Http\Controllers;

use App\Models\Ad;
use App\Http\Requests\StoreAdRequest;
use App\Http\Requests\UpdateAdRequest;

class AdController extends BasicController
{
    public $throwMediaError = true;
    public $model = Ad::class;
}
