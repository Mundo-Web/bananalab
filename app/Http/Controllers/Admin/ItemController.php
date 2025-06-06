<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\BasicController;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Collection;
use App\Models\Item;
use App\Models\ItemTag;
use App\Models\Tag;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Ramsey\Uuid\Uuid;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Routing\ResponseFactory;
use Illuminate\Support\Facades\Storage;
use SoDe\Extend\Crypto;
use SoDe\Extend\Text;
use Exception;

class ItemController extends BasicController
{
    public $model = Item::class;
    public $reactView = 'Admin/Items';
    public $imageFields = ['image', 'banner', 'texture'];
    public $prefix4filter = 'items';

    public function mediaGallery(Request $request, string $uuid)
    {
        try {
            $snake_case = 'item/gallery';
            if (Text::has($uuid, '.')) {
                $route = "images/{$snake_case}/{$uuid}";
            } else {
                $route = "images/{$snake_case}/{$uuid}.img";
            }
            $content = Storage::get($route);
            if (!$content) throw new Exception('Imagen no encontrado');
            return response($content, 200, [
                'Content-Type' => 'application/octet-stream'
            ]);
        } catch (\Throwable $th) {
            $content = Storage::get('utils/cover-404.svg');
            $status = 200;
            if ($this->throwMediaError) return null;
            return response($content, $status, [
                'Content-Type' => 'image/svg+xml'
            ]);
        }
    }
    /*
    public function save(Request $request): HttpResponse|ResponseFactory
    {


//dump($request->all());

        DB::beginTransaction();
        try {
            // Validar los datos recibidos
            $validated = $request->validate([
                'category_id' => 'required|exists:categories,id',
                'subcategory_id' => 'nullable|exists:sub_categories,id',
                'brand_id' => 'nullable|exists:brands,id',
                'name' => 'required|string|max:255',
                'summary' => 'nullable|string',
                'price' => 'required|numeric',
                'discount' => 'nullable|numeric',
                'tags' => 'nullable|array',
                'description' => 'nullable|string',
                'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
                'banner' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
                'gallery' => 'nullable|array',
                'gallery.*' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
                'gallery_ids' => 'nullable|array',
                'gallery_ids.*' => 'nullable|integer',
                'deleted_images' => 'nullable|array',
                'deleted_images.*' => 'nullable|integer',
            ]);

            // Crear o actualizar el elemento
            $item = Item::updateOrCreate(
                ['id' => $request->input('id')],
                [
                    'category_id' => $request->input('category_id'),
                    'subcategory_id' => $request->input('subcategory_id'),
                    'brand_id' => $request->input('brand_id'),
                    'name' => $request->input('name'),
                    'summary' => $request->input('summary'),
                    'price' => $request->input('price'),
                    'discount' => $request->input('discount'),
                    'description' => $request->input('description'),
                ]
            );

            // Guardar la imagen principal
            if ($request->hasFile('image')) {
                $snake_case = Text::camelToSnakeCase(str_replace('App\\Models\\', '', $this->model));
                $full = $request->file("image");
                $uuid = Crypto::randomUUID();
                $ext = $full->getClientOriginalExtension();
                $path = "images/{$snake_case}/{$uuid}.{$ext}";
                Storage::put($path, file_get_contents($full));
                $item->image = "{$uuid}.{$ext}";
                $item->save();
            }

            // Guardar el banner
            if ($request->hasFile('banner')) {
                $snake_case = Text::camelToSnakeCase(str_replace('App\\Models\\', '', $this->model));
                $full = $request->file("banner");
                $uuid = Crypto::randomUUID();
                $ext = $full->getClientOriginalExtension();
                $path = "images/{$snake_case}/{$uuid}.{$ext}";
                Storage::put($path, file_get_contents($full));
                $item->banner = "{$uuid}.{$ext}";
                $item->save();
            }

            // Guardar las imágenes nuevas de la galería
            if ($request->hasFile('gallery')) {

                foreach ($request->file('gallery') as $file) {
                    $snake_case = Text::camelToSnakeCase(str_replace('App\\Models\\', '', $this->model));
                    $full = $file;
                    $uuid = Crypto::randomUUID();
                    $ext = $full->getClientOriginalExtension();
                    $path = "images/{$snake_case}/gallery/{$uuid}.{$ext}";
                    Storage::put($path, file_get_contents($full));
                    $item->images()->create(['url' => "{$uuid}.{$ext}"]);
                }
            }

            // Actualizar las imágenes existentes
            if ($request->has('gallery_ids')) {
                $existingImageIds = $request->input('gallery_ids');
                foreach ($existingImageIds as $id) {
                    $item->images()->where('id', $id)->update(['item_id' => $item->id]);
                }
            }

            // Eliminar las imágenes marcadas para eliminación
            if ($request->has('deleted_images')) {
                $deletedImageIds = $request->input('deleted_images');
                $item->images()->whereIn('id', $deletedImageIds)->delete();
            }

            DB::commit();
            return response(['message' => 'Elemento guardado correctamente'], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            return response(['message' => 'Error al guardar el elemento: ' . $e->getMessage()], 500);
        }
    }
*/
    public function setReactViewProperties(Request $request)
    {
        $categories = Category::all();
        $brands = Brand::all();
        $collections = Collection::all();

        return [
            'categories' => $categories,
            'brands' => $brands,
            'collections' => $collections
        ];
    }

    public function setPaginationInstance(Request $request, string $model)
    {
        return $model::select(['items.*'])
            ->with(['category', 'subcategory', 'brand', 'images', 'collection', 'presets'])
            ->leftJoin('categories AS category', 'category.id', 'items.category_id');
    }



    public function afterSave(Request $request, object $jpa, ?bool $isNew)
    {
        $tags = explode(',', $request->tags ?? '');

        DB::transaction(function () use ($jpa, $tags, $request) {
            // Manejo de Tags
            ItemTag::where('item_id', $jpa->id)->whereNotIn('tag_id', $tags)->delete();

            foreach ($tags as $tag) {
                if (Uuid::isValid($tag)) {
                    $tagId = $tag;
                } else {
                    $tagJpa = Tag::firstOrCreate(['name' => $tag]);
                    $tagId = $tagJpa->id;
                }

                ItemTag::updateOrCreate([
                    'item_id' => $jpa->id,
                    'tag_id' => $tagId
                ]);
            }
        });
        if ($request->hasFile('gallery')) {
            foreach ($request->file('gallery') as $file) {
                if (!$file) continue;

                $imageRequest = new Request();
                $imageRequest->replace(['item_id' => $jpa->id]);
                $imageRequest->files->set('url', $file);

                (new ItemImageController())->save($imageRequest);
            }
        }

        // Decodificar features y specifications
        $features = json_decode($request->input('features'), true);
        $specifications = json_decode($request->input('specifications'), true);

        // Procesar features
        if ($features && is_array($features)) {

            (new ItemFeatureController())->saveFeatures($jpa, $features);
        }

        // Procesar specifications
        if ($specifications && is_array($specifications)) {

            // Guardar cada specification asociada al item
            (new ItemSpecificationController())->saveSpecifications($jpa, $specifications);
        }
    }
}
