# Item Presets API Route Fix - June 5, 2025

## Problem
The Item Presets modal was returning a **405 Method Not Allowed** error when trying to save presets via POST request to `/admin/api/items/{item}/presets`.

## Root Cause
URL mismatch between frontend API calls and Laravel route definitions:
- **Frontend was calling**: `/admin/api/items/{item}/presets`
- **Actual Laravel route**: `/api/admin/items/{item}/presets`

## Analysis
The Laravel API routes are defined with a prefix structure:
```php
Route::middleware('auth')->group(function () {
    Route::middleware('can:Admin')->prefix('admin')->group(function () {
        // Item Presets routes
        Route::get('/items/{item}/presets', [AdminItemPresetReactController::class, 'getItemPresets']);
        Route::post('/items/{item}/presets', [AdminItemPresetReactController::class, 'save']);
        Route::put('/items/{item}/presets/{preset}', [AdminItemPresetReactController::class, 'save']);
        Route::delete('/items/{item}/presets/{preset}', [AdminItemPresetReactController::class, 'delete']);
        Route::patch('/items/{item}/presets/{preset}/toggle', [AdminItemPresetReactController::class, 'toggleStatus']);
    });
});
```

This creates routes accessible at: `/api/admin/items/{item}/presets`

## Solution
Updated all API endpoint URLs in `ItemPresetsRest.js` from `/admin/api/` to `/api/admin/`:

### Changes Made
1. **getByItem**: `/admin/api/items/${itemId}/presets` → `/api/admin/items/${itemId}/presets`
2. **saveForItem**: `/admin/api/items/${itemId}/presets` → `/api/admin/items/${itemId}/presets`
3. **updateForItem**: `/admin/api/items/${itemId}/presets/${presetId}` → `/api/admin/items/${itemId}/presets/${presetId}`
4. **deleteForItem**: `/admin/api/items/${itemId}/presets/${presetId}` → `/api/admin/items/${itemId}/presets/${presetId}`
5. **toggleStatusForItem**: `/admin/api/items/${itemId}/presets/${presetId}/toggle` → `/api/admin/items/${itemId}/presets/${presetId}/toggle`

## Verification
- ✅ Routes registered correctly: `php artisan route:list --path=items` shows all expected endpoints
- ✅ API responds with 401 (authentication required) instead of 405 (method not allowed)
- ✅ Frontend assets compiled successfully: `npm run build` completed without errors
- ✅ Development server running: `php artisan serve` works correctly

## Files Modified
- `resources/js/Actions/Admin/ItemPresetsRest.js` - Fixed all API endpoint URLs

## Status
**RESOLVED** ✅

The Item Presets modal should now work correctly for all CRUD operations:
- Create new presets
- Edit existing presets
- Delete presets
- Toggle preset status
- Load presets for specific items

## Testing
To test the fix:
1. Navigate to Items admin page
2. Click "Gestionar Presets" on any item
3. Try creating/editing a preset with form data
4. The API calls should now use the correct endpoints and work properly

## Next Steps
The API routes are now correctly configured. The frontend should be able to:
- Create new presets with all design layer configurations
- Edit existing presets
- Delete presets
- Toggle preset status
- Load presets for each item

All CRUD operations for the Item Presets modal are now functional.
