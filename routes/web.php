<?php

use Illuminate\Support\Facades\Route;

// Admin
use App\Http\Controllers\Admin\AboutusController as AdminAboutusController;
use App\Http\Controllers\Admin\HomeController as AdminHomeController;
use App\Http\Controllers\Admin\IndicatorController as AdminIndicatorController;
use App\Http\Controllers\Admin\SliderController as AdminSliderController;
use App\Http\Controllers\Admin\TestimonyController as AdminTestimonyController;
use App\Http\Controllers\Admin\SubscriptionController as AdminSubscriptionController;
use App\Http\Controllers\Admin\CategoryController as AdminCategoryController;
use App\Http\Controllers\Admin\CampaignController as AdminCampaignController;
use App\Http\Controllers\Admin\CollectionController as AdminCollectionController;
use App\Http\Controllers\Admin\PostController as AdminPostController;
use App\Http\Controllers\Admin\AdController as AdminAdController;
use App\Http\Controllers\Admin\SocialController as AdminSocialController;
use App\Http\Controllers\Admin\StrengthController as AdminStrengthController;
use App\Http\Controllers\Admin\GeneralController as AdminGeneralController;
use App\Http\Controllers\Admin\ProfileController as AdminProfileController;
use App\Http\Controllers\Admin\AccountController as AdminAccountController;
use App\Http\Controllers\Admin\BannerController as AdminBannerController;
use App\Http\Controllers\Admin\ItemController as AdminItemController;
use App\Http\Controllers\Admin\GalleryController as AdminGalleryController;
use App\Http\Controllers\Admin\SystemController as AdminSystemController;
use App\Http\Controllers\Admin\TagController as AdminTagController;
use App\Http\Controllers\Admin\BrandController as AdminBrandController;
use App\Http\Controllers\Admin\ComboController as AdminComboController;
use App\Http\Controllers\Admin\DeliveryPriceController as AdminDeliveryPriceController;
use App\Http\Controllers\Admin\SaleController as AdminSaleController;
use App\Http\Controllers\Admin\SubCategoryController as AdminSubCategoryController;
use App\Http\Controllers\Admin\ItemPresetController as AdminItemPresetController;
use App\Http\Controllers\Admin\ItemPresetReactController as AdminItemPresetReactController;
use App\Http\Controllers\Admin\PaymentMethodController as AdminPaymentMethodController;


use App\Http\Controllers\Admin\FaqController as AdminFaqController;
use App\Http\Controllers\Admin\RepositoryController as AdminRepositoryController;
use App\Http\Controllers\AuthClientController;
// Public 
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ComplaintController;
use App\Http\Controllers\RepositoryController;
use App\Http\Controllers\SystemController;
use SoDe\Extend\File;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "web" middleware group. Make something great!
|
*/

Route::get('/', fn() => view('coming-soon'));

// Testing routes
Route::get('/test-mercadopago', function () {
    return view('test-mercadopago');
});

// Verificar si el archivo existe, si no, crear uno vacío
$filePath = storage_path('app/pages.json');
if (!file_exists($filePath)) {
    file_put_contents($filePath, json_encode([]));
}

$pages = json_decode(File::get($filePath), true);

// Public routes
foreach ($pages as $page) {
    Route::get($page['path'], [SystemController::class, 'reactView'])->name('System.jsx');
}

Route::get('/base-template', [SystemController::class, 'reactView'])->name('System.jsx');
Route::get('/login', [AuthController::class, 'loginView'])->name('Login.jsx');

// Test routes for development
Route::get('/test-mercadopago', function () {
    return view('test-mercadopago');
})->name('test.mercadopago');

// Admin routes
Route::middleware(['can:Admin', 'auth'])->prefix('admin')->group(function () {



    Route::get('/payment-methods', [AdminPaymentMethodController::class, 'reactView'])->name('Admin/PaymentMethodsAdmin.jsx');


    Route::get('/', fn() => redirect()->route('Admin/Home.jsx'));
    Route::get('/home', [AdminHomeController::class, 'reactView'])->name('Admin/Home.jsx');
    Route::get('/sales', [AdminSaleController::class, 'reactView'])->name('Admin/Sales.jsx');
    Route::get('/items', [AdminItemController::class, 'reactView'])->name('Admin/Items.jsx');
    Route::get('/item-presets', [AdminItemPresetReactController::class, 'reactView'])->name('Admin/ItemPresets.jsx');

    // Rutas para Item Presets
    Route::resource('/item-presets', AdminItemPresetController::class, [
        'as' => 'admin'
    ]);
    Route::patch('/item-presets/{itemPreset}/toggle-status', [AdminItemPresetController::class, 'toggleStatus'])
        ->name('admin.item-presets.toggle-status');
    Route::get('/api/items/{item}/presets', [AdminItemPresetController::class, 'getByItem'])
        ->name('admin.item-presets.by-item');

    Route::get('/combos', [AdminComboController::class, 'reactView'])->name('Admin/Combos.jsx');

    Route::get('/categories', [AdminCategoryController::class, 'reactView'])->name('Admin/Categories.jsx');
    Route::get('/campaigns', [AdminCampaignController::class, 'reactView'])->name('Admin/Campaigns.jsx');
    Route::get('/collections', [AdminCollectionController::class, 'reactView'])->name('Admin/Collections.jsx');
    Route::get('/subcategories', [AdminSubCategoryController::class, 'reactView'])->name('Admin/SubCategories.jsx');
    Route::get('/brands', [AdminBrandController::class, 'reactView'])->name('Admin/Brands.jsx');
    Route::get('/tags', [AdminTagController::class, 'reactView'])->name('Admin/Tags.jsx');
    Route::get('/prices', [AdminDeliveryPriceController::class, 'reactView'])->name('Admin/DeliveryPrices.jsx');
    Route::get('/messages', [AdminSubscriptionController::class, 'reactView'])->name('Admin/Messages.jsx');
    Route::get('/subscriptions', [AdminSubscriptionController::class, 'reactView'])->name('Admin/Subscriptions.jsx');

    Route::get('/posts', [AdminPostController::class, 'reactView'])->name('Admin/Posts.jsx');
    Route::get('/about', [AdminAboutusController::class, 'reactView'])->name('Admin/About.jsx');
    Route::get('/indicators', [AdminIndicatorController::class, 'reactView'])->name('Admin/Indicators.jsx');
    Route::get('/sliders', [AdminSliderController::class, 'reactView'])->name('Admin/Sliders.jsx');
    Route::get('/banners', [AdminBannerController::class, 'reactView'])->name('Admin/Banners.jsx');
    Route::get('/testimonies', [AdminTestimonyController::class, 'reactView'])->name('Admin/Testimonies.jsx');
    Route::get('/socials', [AdminSocialController::class, 'reactView'])->name('Admin/Socials.jsx');
    Route::get('/strengths', [AdminStrengthController::class, 'reactView'])->name('Admin/Strengths.jsx');
    Route::get('/generals', [AdminGeneralController::class, 'reactView'])->name('Admin/Generals.jsx');
    Route::get('/ads', [AdminAdController::class, 'reactView'])->name('Admin/Ads.jsx');
    Route::get('/faqs', [AdminFaqController::class, 'reactView'])->name('Admin/Faqs.jsx');


    Route::get('/gallery', [AdminGalleryController::class, 'reactView'])->name('Admin/Gallery.jsx');
    Route::get('/repository', [AdminRepositoryController::class, 'reactView'])->name('Admin/Repository.jsx');

    Route::middleware(['can:Root'])->get('/system', [AdminSystemController::class, 'reactView'])->name('Admin/System.jsx');

    Route::get('/profile', [AdminProfileController::class, 'reactView'])->name('Admin/Profile.jsx');
    Route::get('/account', [AdminAccountController::class, 'reactView'])->name('Admin/Account.jsx');
});

// Rutas de callback para MercadoPago
Route::get('/checkout/success', function (Illuminate\Http\Request $request) {
    $orderNumber = $request->query('external_reference');
    $paymentId = $request->query('payment_id');
    $collectionId = $request->query('collection_id');
    $paymentType = $request->query('payment_type');
    
    // Log para debug
    \Illuminate\Support\Facades\Log::info('MercadoPago Success Callback', [
        'external_reference' => $orderNumber,
        'payment_id' => $paymentId,
        'collection_id' => $collectionId,
        'all_params' => $request->all()
    ]);
    
    if ($paymentType === 'mercadopago' && $orderNumber) {
        // Usar collection_id si no hay payment_id
        $finalPaymentId = $paymentId ?: $collectionId;
        
        // Intentar marcar el pago como exitoso directamente en la base de datos
        try {
            $sale = \App\Models\Sale::where('code', $orderNumber)->first();
            if ($sale && $finalPaymentId) {
                $saleStatusPagado = \App\Models\SaleStatus::getByName('Pagado');
                
                $sale->update([
                    'culqi_charge_id' => $finalPaymentId,
                    'payment_status' => 'pagado',
                    'status_id' => $saleStatusPagado ? $saleStatusPagado->id : null,
                ]);
                
                // Actualizar stock
                $saleDetails = \App\Models\SaleDetail::where('sale_id', $sale->id)->get();
                foreach ($saleDetails as $detail) {
                    \App\Models\Item::where('id', $detail->item_id)->decrement('stock', $detail->quantity);
                }
                
                \Illuminate\Support\Facades\Log::info('Pago marcado como exitoso', [
                    'sale_id' => $sale->id,
                    'payment_id' => $finalPaymentId
                ]);
            }
        } catch (Exception $e) {
            \Illuminate\Support\Facades\Log::error('Error al marcar pago como exitoso: ' . $e->getMessage());
        }
        
        return redirect('/cart?step=3&order=' . $orderNumber . '&status=success&payment_type=mercadopago');
    }
    
    return redirect('/cart?step=3&status=success');
});

Route::get('/checkout/failure', function (Illuminate\Http\Request $request) {
    $orderNumber = $request->query('external_reference');
    return redirect('/cart?message=El pago ha sido rechazado&order=' . $orderNumber);
});

Route::get('/checkout/pending', function (Illuminate\Http\Request $request) {
    $orderNumber = $request->query('external_reference');
    return redirect('/cart?message=Pago pendiente de confirmación&order=' . $orderNumber);
});

if (env('APP_ENV') === 'local') {
    Route::get('/cloud/{uuid}', [RepositoryController::class, 'media']);
}
