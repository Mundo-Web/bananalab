<?php

namespace App\Http\Controllers;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Collection;
use App\Models\Combo;
use App\Models\Item;
use App\Models\ItemTag;
use App\Models\SubCategory;
use App\Models\Tag;
use App\Models\WebDetail;
use Exception;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use SoDe\Extend\Response;
use Illuminate\Contracts\Routing\ResponseFactory;
use Illuminate\Http\RedirectResponse;

use Illuminate\Http\Response as HttpResponse;

class ItemController extends BasicController
{
    public $model = Item::class;
    public $reactView = 'Courses';
    public $reactRootView = 'public';
    public $prefix4filter = 'items';

    public function variationsItems(Request $request)
    {
        $response = new Response();


        try {
            // Obtener el producto principal por slug
            $product = Item::with(['category', 'brand', 'images', 'specifications'])
                ->where('slug', $request->slug)
                ->firstOrFail();

            // Obtener las variantes (productos con el mismo nombre pero diferente ID)
            $variants = Item::where('name', $product->name)
                ->where('id', '!=', $product->id)
                ->get(['id', 'slug', 'color', 'texture', 'image', 'final_price']);

            // Agregar las variantes al producto principal
            $product->variants = $variants;

            $response->status = 200;
            $response->message = 'Producto obtenido correctamente';
            $response->data = $product;
        } catch (\Throwable $th) {
            $response->status = 404;
            $response->message = 'Producto no encontrado';
        }

        return response($response->toArray(), $response->status);
    }


    public function setReactViewProperties(Request $request)
    {
        $categories = Category::select([
            DB::raw('DISTINCT(categories.id)'),
            'categories.name'
        ])
            ->join('items', 'items.category_id', 'categories.id')
            ->where('categories.status', true)
            ->where('categories.visible', true)
            ->where('items.status', true)
            ->where('items.visible', true)
            ->get();
        $details = WebDetail::where('page', 'courses')->get();
        return [
            'categories' => $categories,
            'details' => $details
        ];
    }
    /*aqui agregar el codigo*/
    public function setPaginationInstance(Request $request, string $model)
    {
        //  dump($request->all());
        // dump('Estamos aqui');
        $query = $model::select(['items.*'])
            ->with(['collection', 'category', 'subcategory', 'brand', 'tags'])
            ->leftJoin('collections AS collection', 'collection.id', 'items.collection_id')
            ->leftJoin('categories AS category', 'category.id', 'items.category_id')
            ->leftJoin('sub_categories AS subcategory', 'subcategory.id', 'items.subcategory_id')
            ->leftJoin('brands AS brand', 'brand.id', 'items.brand_id')
            ->leftJoin('item_tags AS item_tag', 'item_tag.item_id', 'items.id')
            ->where('items.status', true)
            ->where('items.visible', true)
            ->where(function ($query) {
                $query->where('collection.status', true)
                    ->orWhereNull('collection.id');
            })
            ->where(function ($query) {
                $query->where('collection.visible', true)
                    ->orWhereNull('collection.id');
            })
            ->where(function ($query) {
                $query->where('category.status', true)
                    ->orWhereNull('category.id');
            })
            ->where(function ($query) {
                $query->where('category.visible', true)
                    ->orWhereNull('category.id');
            })
            ->where(function ($query) {
                $query->where('subcategory.status', true)
                    ->orWhereNull('subcategory.id');
            })
            ->where(function ($query) {
                $query->where('subcategory.visible', true)
                    ->orWhereNull('subcategory.id');
            })
            ->where(function ($query) {
                $query->where('brand.status', true)
                    ->orWhereNull('brand.id');
            })
            ->where(function ($query) {
                $query->where('brand.visible', true)
                    ->orWhereNull('brand.id');
            });

        // Solo aplica agrupación para la página específica

        $query->join(
            DB::raw('(SELECT MIN(id) as min_id FROM items GROUP BY name) as grouped'),
            function ($join) {
                $join->on('items.id', '=', 'grouped.min_id');
            }
        );


        return $query;
    }

    public function setPaginationSummary(Request $request, Builder $builder)
    {
        /* $minPrice = Item::min('price');
        $maxPrice = Item::max('price');
        $rangeSize = 50;  // Define el tamaño del rango

        // Calcular rangos de precio
        $ranges = [];
        for ($i = $minPrice; $i <= $maxPrice; $i += $rangeSize) {
            $ranges[] = [
                'min' => $i,
                'max' => $i + $rangeSize - 1
            ];
        }*/

        $i4price = clone $builder;
        $minPrice = 0;
        $maxPrice = $i4price->max('final_price');
        $rangeSize = 50;  // Define el tamaño del rango

        // Calcular rangos de precio
        $ranges = [];
        for ($i = $minPrice; $i <= $maxPrice; $i += $rangeSize) {
            $ranges[] = [
                'min' => $i,
                'max' => $i + $rangeSize - 1
            ];
        }
        $i4collection = clone $builder;
        $i4category = clone $builder;
        $i4subcategory = clone $builder;
        $i4brand = clone $builder;
        $i4tag = clone $builder;
        $collections = Item::getForeign($i4collection, Collection::class, 'collection_id');
        $categories = Item::getForeign($i4category, Category::class, 'category_id');
        $subcategories = Item::getForeign($i4subcategory, SubCategory::class, 'subcategory_id');
        $brands = Item::getForeign($i4brand, Brand::class, 'brand_id');
        $tags = Item::getForeignMany($i4tag, ItemTag::class, Tag::class);



        return [
            'priceRanges' => $ranges,
            'collections' => $collections,
            'categories' => $categories,
            'subcategories' => $subcategories,
            'brands' => $brands,
            'tags' => $tags
        ];
    }

    public function verifyStock(Request $request)
    {
        $response = Response::simpleTryCatch(function () use ($request) {
            return Item::select(['id', 'price', 'discount', 'name'])
                ->whereIn('id', $request->all())
                ->get();
        });
        return response($response->toArray(), $response->status);
    }
    public function verifyCombo2(Request $request)
    {
        //dump($request->all());
        try {
            // Validar la solicitud
            $validated = $request->validate([
                'id' => 'required', // Asegúrate de que el producto exista
            ]);

            // Buscar combos donde el producto sea el principal
            $combos = Combo::whereHas('items', function ($query) use ($validated) {
                $query->where('item_id', $validated['id'])
                    ->where('is_main_item', true);
            })->with(['items' => function ($query) {
                $query->orderBy('is_main_item', 'desc'); // Ordenar para que el principal aparezca primero
            }])->get();

            //dump($combos);

            // Verificar si hay combos
            if ($combos->isEmpty()) {
                return response()->json([
                    'status' => false,
                    'message' => 'El producto no es un producto principal en ningún combo.',
                ], 404);
            }

            // Formatear los datos de respuesta
            $result = $combos->map(function ($combo) {
                return [
                    'combo_id' => $combo->id,
                    'combo_name' => $combo->name,
                    'main_product' => $combo->items->firstWhere('pivot.is_main_item', true),
                    'associated_items' => $combo->items->filter(function ($item) {
                        return !$item->pivot->is_main_item;
                    }),
                ];
            });
            //dump($result);
            return response()->json([
                'status' => true,
                'data' => $result,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    public function verifyCombo(Request $request): HttpResponse | ResponseFactory
    {
        $response = new Response();
        try {
            // Validar el correo electrónico
            $request->validate([
                'id' => 'required',
            ]);

            // Buscar al usuario por correo electrónico
            // Buscar combos donde el producto sea el principal
            $combos = Combo::whereHas('items', function ($query) use ($request) {
                $query->where('item_id', $request->id)
                    ->where('is_main_item', true);
            })->with([
                'items' => function ($query) {
                    $query->orderBy('is_main_item', 'desc'); // Ordenar para que el principal aparezca primero
                },
                'items.category', // Incluir la categoría del item
                'items.brand'     // Incluir la marca del item
            ])->get();

            //dump($combos);

            // Verificar si hay combos
            if ($combos->isEmpty()) {
                $response->status = 400;
                $response->message = 'No productos relacionados';
            }

            // Formatear los datos de respuesta
            $result = $combos->map(function ($combo) {
                return [
                    'combo_id' => $combo->id,
                    'combo_name' => $combo->name,
                    'main_product' => $combo->items->firstWhere('pivot.is_main_item', true),
                    'associated_items' => $combo->items->filter(function ($item) {
                        return !$item->pivot->is_main_item;
                    }),
                ];
            });

            //dump($result);

            // Respuesta exitosa
            $response->status = 200;
            $response->message = 'Se ha enviado un enlace para restablecer tu contraseña.';
            $response->data = $result;
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response(
                $response->toArray(),
                $response->status
            );
        }
    }
    public function updateViews(Request $request)
    {
        //dump($request->all());
        $product = Item::findOrFail($request->id); // Asegúrate de que el modelo sea el correcto
        if (!$product) {
            return response()->json(['error' => 'Producto no encontrado'], 404);
        }
        $product->increment('views'); // Incrementa en 1
        return response()->json(['success' => true, 'views' => $product->views]);
    }

    public function relationsItems(Request $request): HttpResponse | ResponseFactory
    {
        //dump($request->all());
        $response = new Response();
        try {
            // Validar el ID del producto
            $request->validate([
                'id' => 'required',
            ]);

            // Obtener el producto principal
            $product = Item::findOrFail($request->id);
            //dump($product);
            // Obtener productos de la misma categoría (excluyendo el producto principal)
            $relatedItems = Item::where('category_id', $product->category_id)
                ->where('id', '!=', $product->id) // Excluir el producto actual
                ->with(['category', 'brand']) // Cargar relaciones necesarias
                ->take(10) // Limitar a 10 productos
                ->get();
            //dump($relatedItems);

            // Verificar si hay productos relacionados
            if ($relatedItems->isEmpty()) {
                $response->status = 400;
                $response->message = 'No hay productos relacionados.';
                return response($response->toArray(), $response->status);
            }

            // Formatear la respuesta
            $response->status = 200;
            $response->message = 'Productos relacionados encontrados.';
            $response->data = $relatedItems;
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }
}
