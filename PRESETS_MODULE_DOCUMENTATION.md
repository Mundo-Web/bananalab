# Módulo de Presets de Álbumes

## Descripción
Este módulo permite a los administradores gestionar presets (configuraciones predefinidas) para productos de álbumes fotográficos. Cada producto puede tener múltiples presets con diferentes configuraciones de precios, descuentos y especificaciones técnicas.

## Estructura del Módulo

### Base de Datos
- **Tabla**: `item_presets`
- **Migración**: `database/migrations/2025_01_04_000001_create_item_presets_table.php`
- **Seeder**: `database/seeders/ItemPresetSeeder.php`

#### Campos de la tabla item_presets:
- `id`: Identificador único
- `item_id`: Relación con la tabla items (productos)
- `name`: Nombre del preset (ej: "Álbum Premium 30x30")
- `description`: Descripción detallada del preset
- `price`: Precio base del preset
- `discount`: Descuento aplicable (opcional)
- `image`: Imagen representativa del preset
- `sort_order`: Orden de visualización
- `configuration`: Configuración técnica en formato JSON
- `is_active`: Estado activo/inactivo
- `created_at` / `updated_at`: Timestamps

### Modelos Eloquent

#### ItemPreset (app/Models/ItemPreset.php)
- **Relaciones**:
  - `item()`: belongsTo Item
- **Scopes**:
  - `active()`: Solo presets activos
  - `ordered()`: Ordenados por sort_order
- **Accessors**:
  - `final_price`: Precio final con descuento aplicado

#### Item (app/Models/Item.php) - Actualizado
- **Nuevas relaciones**:
  - `presets()`: hasMany ItemPreset
  - `activePresets()`: hasMany ItemPreset (solo activos y ordenados)

### Controladores

#### ItemPresetController (app/Http/Controllers/Admin/ItemPresetController.php)
Controlador para vistas Blade tradicionales con métodos CRUD completos:
- `index()`: Lista de presets
- `create()`: Formulario de creación
- `store()`: Guardar nuevo preset
- `show()`: Ver preset individual
- `edit()`: Formulario de edición
- `update()`: Actualizar preset
- `destroy()`: Eliminar preset
- `toggleStatus()`: Cambiar estado activo/inactivo

#### ItemPresetReactController (app/Http/Controllers/Admin/ItemPresetReactController.php)
Controlador para la interfaz React con API endpoints:
- `index()`: Vista React principal
- `apiIndex()`: API para listar presets (con paginación)
- `store()`: API para crear/actualizar presets
- `destroy()`: API para eliminar presets
- `toggleStatus()`: API para cambiar estado

### Vistas

#### Vistas Blade (resources/views/admin/item-presets/)
- `index.blade.php`: Lista de presets
- `create.blade.php`: Formulario de creación
- `edit.blade.php`: Formulario de edición
- `show.blade.php`: Vista detalle

#### Componentes React
- `ItemPresets.jsx`: Componente principal con grid y formulario modal
- `ItemPresetsRest.js`: Clase para consumir API endpoints

### Rutas

#### Rutas Web (routes/web.php)
```php
// Rutas CRUD tradicionales
Route::resource('admin/item-presets', ItemPresetController::class)
    ->names('admin.item-presets');

// Ruta para cambiar estado
Route::patch('admin/item-presets/{itemPreset}/toggle-status', 
    [ItemPresetController::class, 'toggleStatus'])
    ->name('admin.item-presets.toggle-status');

// Vista React
Route::get('admin/item-presets-react', 
    [ItemPresetReactController::class, 'index'])
    ->name('admin.item-presets.react');
```

#### Rutas API (routes/api.php)
```php
// API endpoints para React
Route::prefix('admin/api')->group(function () {
    Route::get('item-presets', [ItemPresetReactController::class, 'apiIndex']);
    Route::post('item-presets', [ItemPresetReactController::class, 'store']);
    Route::delete('item-presets/{itemPreset}', [ItemPresetReactController::class, 'destroy']);
    Route::patch('item-presets/{itemPreset}/toggle-status', [ItemPresetReactController::class, 'toggleStatus']);
    Route::get('items/{item}/presets', [ItemPresetReactController::class, 'getByItem']);
});
```

## Uso del Módulo

### Para Administradores

#### Acceso Tradicional (Blade)
- URL: `/admin/item-presets`
- Funcionalidad completa CRUD
- Formularios tradicionales
- Validación del lado del servidor

#### Acceso React (Moderno)
- URL: `/admin/item-presets-react`
- Interfaz moderna con grid interactivo
- Formularios modales
- Validación en tiempo real
- Funcionalidad de filtrado por producto

#### Desde la gestión de Items
- En la lista de productos, cada item tiene un botón "Presets"
- Al hacer clic, redirige a la vista React filtrada por ese producto específico
- URL con parámetro: `/admin/item-presets-react?item_id=123`

### Características Principales

1. **Gestión Completa**: Crear, editar, ver y eliminar presets
2. **Activación/Desactivación**: Toggle rápido de estado
3. **Imágenes**: Subida y gestión de imágenes para cada preset
4. **Configuración JSON**: Campo flexible para configuraciones técnicas específicas
5. **Ordenamiento**: Control de orden de visualización
6. **Precios Dinámicos**: Cálculo automático de precio final con descuentos
7. **Filtrado**: Visualización de presets por producto específico
8. **Validación**: Validación completa de formularios tanto en backend como frontend

### Ejemplos de Configuración JSON

```json
{
  "pages": 50,
  "size": "30x30",
  "cover": "hardcover",
  "paper": "premium_matte",
  "binding": "lay_flat",
  "options": {
    "dust_jacket": true,
    "gift_box": false,
    "custom_text": true
  }
}
```

### Datos de Ejemplo
El seeder crea presets de ejemplo para los primeros 3 productos:
- 3 presets por producto
- Diferentes rangos de precios
- Configuraciones variadas
- Algunos con descuentos aplicados

## Integración con Items

Los presets están completamente integrados con el módulo de Items:
- Relación uno a muchos (Item -> ItemPresets)
- Los presets se incluyen automáticamente en las respuestas del ItemController
- Acceso directo desde la interfaz de gestión de productos
- Filtrado automático cuando se accede desde un producto específico

## Tecnologías Utilizadas

- **Backend**: Laravel (PHP)
- **Frontend**: React.js con DevExtreme
- **Base de Datos**: MySQL
- **Validación**: Laravel Validation + JavaScript
- **UI**: AdminTO theme + Bootstrap
- **Componentes**: DevExtreme DataGrid, SweetAlert2

## Estado del Módulo

✅ **Completo y Funcional**
- Migración ejecutada
- Modelos con relaciones
- Controladores implementados
- Vistas Blade y React funcionales
- Rutas registradas
- Datos de ejemplo creados
- Integración completa con Items
- Validación implementada
- Documentación completa

El módulo está listo para uso en producción.
