@extends('admin')

@section('title', 'Editar Preset de Álbum')

@section('content')
<div class="container-fluid">
    <div class="row">
        <div class="col-12">
            <!-- Encabezado -->
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h1 class="h3 mb-0">Editar Preset: {{ $itemPreset->name }}</h1>
                <a href="{{ route('admin.item-presets.index') }}" class="btn btn-outline-secondary">
                    <i class="fas fa-arrow-left me-2"></i>Volver al listado
                </a>
            </div>

            <form method="POST" action="{{ route('admin.item-presets.update', $itemPreset) }}" enctype="multipart/form-data">
                @csrf
                @method('PUT')
                
                <div class="row">
                    <div class="col-lg-8">
                        <!-- Información básica -->
                        <div class="card mb-4">
                            <div class="card-header">
                                <h5 class="card-title mb-0">Información Básica</h5>
                            </div>
                            <div class="card-body">
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="item_id" class="form-label">Producto <span class="text-danger">*</span></label>
                                            <select name="item_id" id="item_id" class="form-select @error('item_id') is-invalid @enderror" required>
                                                <option value="">Selecciona un producto</option>
                                                @foreach($items as $item)
                                                    <option value="{{ $item->id }}" 
                                                            {{ (old('item_id', $itemPreset->item_id) == $item->id) ? 'selected' : '' }}>
                                                        {{ $item->name }}
                                                    </option>
                                                @endforeach
                                            </select>
                                            @error('item_id')
                                                <div class="invalid-feedback">{{ $message }}</div>
                                            @enderror
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="name" class="form-label">Nombre del Preset <span class="text-danger">*</span></label>
                                            <input type="text" name="name" id="name" 
                                                   class="form-control @error('name') is-invalid @enderror" 
                                                   value="{{ old('name', $itemPreset->name) }}" required>
                                            @error('name')
                                                <div class="invalid-feedback">{{ $message }}</div>
                                            @enderror
                                        </div>
                                    </div>
                                </div>

                                <div class="mb-3">
                                    <label for="description" class="form-label">Descripción</label>
                                    <textarea name="description" id="description" rows="3" 
                                              class="form-control @error('description') is-invalid @enderror">{{ old('description', $itemPreset->description) }}</textarea>
                                    @error('description')
                                        <div class="invalid-feedback">{{ $message }}</div>
                                    @enderror
                                </div>

                                <div class="row">
                                    <div class="col-md-4">
                                        <div class="mb-3">
                                            <label for="price" class="form-label">Precio <span class="text-danger">*</span></label>
                                            <div class="input-group">
                                                <span class="input-group-text">$</span>
                                                <input type="number" name="price" id="price" step="0.01" min="0"
                                                       class="form-control @error('price') is-invalid @enderror" 
                                                       value="{{ old('price', $itemPreset->price) }}" required>
                                            </div>
                                            @error('price')
                                                <div class="invalid-feedback">{{ $message }}</div>
                                            @enderror
                                        </div>
                                    </div>
                                    <div class="col-md-4">
                                        <div class="mb-3">
                                            <label for="discount" class="form-label">Descuento (%)</label>
                                            <input type="number" name="discount" id="discount" min="0" max="100" step="0.01"
                                                   class="form-control @error('discount') is-invalid @enderror" 
                                                   value="{{ old('discount', $itemPreset->discount) }}">
                                            @error('discount')
                                                <div class="invalid-feedback">{{ $message }}</div>
                                            @enderror
                                        </div>
                                    </div>
                                    <div class="col-md-4">
                                        <div class="mb-3">
                                            <label for="sort_order" class="form-label">Orden de Clasificación</label>
                                            <input type="number" name="sort_order" id="sort_order" min="0"
                                                   class="form-control @error('sort_order') is-invalid @enderror" 
                                                   value="{{ old('sort_order', $itemPreset->sort_order) }}">
                                            @error('sort_order')
                                                <div class="invalid-feedback">{{ $message }}</div>
                                            @enderror
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Configuración avanzada -->
                        <div class="card mb-4">
                            <div class="card-header">
                                <h5 class="card-title mb-0">Configuración Avanzada</h5>
                            </div>
                            <div class="card-body">
                                <div class="mb-3">
                                    <label for="configuration" class="form-label">Configuración JSON</label>
                                    <textarea name="configuration" id="configuration" rows="5" 
                                              class="form-control @error('configuration') is-invalid @enderror"
                                              placeholder='{"pages": 20, "cover_type": "hard", "size": "30x30"}'
                                              >{{ old('configuration', $itemPreset->configuration ? json_encode($itemPreset->configuration, JSON_PRETTY_PRINT) : '') }}</textarea>
                                    <div class="form-text">
                                        Configuración adicional en formato JSON (opcional). Ejemplo: número de páginas, tipo de tapa, tamaño, etc.
                                    </div>
                                    @error('configuration')
                                        <div class="invalid-feedback">{{ $message }}</div>
                                    @enderror
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-lg-4">
                        <!-- Imagen y estado -->
                        <div class="card mb-4">
                            <div class="card-header">
                                <h5 class="card-title mb-0">Imagen del Preset</h5>
                            </div>
                            <div class="card-body">
                                @if($itemPreset->image)
                                    <div class="mb-3 text-center">
                                        <img src="{{ asset('storage/' . $itemPreset->image) }}" 
                                             alt="{{ $itemPreset->name }}" 
                                             class="img-fluid rounded" style="max-height: 200px;">
                                        <p class="text-muted mt-2 mb-0">Imagen actual</p>
                                    </div>
                                @endif

                                <div class="mb-3">
                                    <label for="image" class="form-label">{{ $itemPreset->image ? 'Nueva imagen' : 'Imagen' }}</label>
                                    <input type="file" name="image" id="image" 
                                           class="form-control @error('image') is-invalid @enderror"
                                           accept="image/*">
                                    <div class="form-text">Formatos: JPG, PNG, GIF. Máximo 2MB.</div>
                                    @error('image')
                                        <div class="invalid-feedback">{{ $message }}</div>
                                    @enderror
                                </div>

                                <div class="mb-3">
                                    <div class="form-check">
                                        <input type="checkbox" name="is_active" id="is_active" value="1" 
                                               class="form-check-input" {{ old('is_active', $itemPreset->is_active) ? 'checked' : '' }}>
                                        <label for="is_active" class="form-check-label">Preset activo</label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Vista previa del precio -->
                        <div class="card">
                            <div class="card-header">
                                <h5 class="card-title mb-0">Vista Previa</h5>
                            </div>
                            <div class="card-body">
                                <div id="price-preview" class="text-center">
                                    <div class="mb-2">
                                        <span class="text-muted">Precio:</span>
                                        <span id="preview-price" class="fs-5">$0.00</span>
                                    </div>
                                    <div class="mb-2">
                                        <span class="text-muted">Descuento:</span>
                                        <span id="preview-discount" class="text-warning">0%</span>
                                    </div>
                                    <div>
                                        <span class="text-muted">Precio Final:</span>
                                        <span id="preview-final" class="fs-4 fw-bold text-success">$0.00</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="col-12">
                        <div class="d-flex justify-content-between">
                            <div>
                                <a href="{{ route('admin.item-presets.show', $itemPreset) }}" class="btn btn-info">
                                    <i class="fas fa-eye me-2"></i>Ver Preset
                                </a>
                            </div>
                            <div class="d-flex gap-2">
                                <a href="{{ route('admin.item-presets.index') }}" class="btn btn-secondary">Cancelar</a>
                                <button type="submit" class="btn btn-primary">
                                    <i class="fas fa-save me-2"></i>Actualizar Preset
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    </div>
</div>

@push('scripts')
<script>
document.addEventListener('DOMContentLoaded', function() {
    const priceInput = document.getElementById('price');
    const discountInput = document.getElementById('discount');
    const previewPrice = document.getElementById('preview-price');
    const previewDiscount = document.getElementById('preview-discount');
    const previewFinal = document.getElementById('preview-final');

    function updatePreview() {
        const price = parseFloat(priceInput.value) || 0;
        const discount = parseFloat(discountInput.value) || 0;
        const finalPrice = price - (price * (discount / 100));

        previewPrice.textContent = '$' + price.toFixed(2);
        previewDiscount.textContent = discount.toFixed(1) + '%';
        previewFinal.textContent = '$' + finalPrice.toFixed(2);
    }

    priceInput.addEventListener('input', updatePreview);
    discountInput.addEventListener('input', updatePreview);
    
    // Actualizar al cargar
    updatePreview();
});
</script>
@endpush
@endsection
