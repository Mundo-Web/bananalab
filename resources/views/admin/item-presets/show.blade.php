@extends('admin')

@section('title', 'Ver Preset de Álbum')

@section('content')
<div class="container-fluid">
    <div class="row">
        <div class="col-12">
            <!-- Encabezado -->
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h1 class="h3 mb-0">{{ $itemPreset->name }}</h1>
                <div class="btn-group">
                    <a href="{{ route('admin.item-presets.index') }}" class="btn btn-outline-secondary">
                        <i class="fas fa-arrow-left me-2"></i>Volver al listado
                    </a>
                    <a href="{{ route('admin.item-presets.edit', $itemPreset) }}" class="btn btn-primary">
                        <i class="fas fa-edit me-2"></i>Editar
                    </a>
                </div>
            </div>

            <div class="row">
                <div class="col-lg-8">
                    <!-- Información básica -->
                    <div class="card mb-4">
                        <div class="card-header">
                            <h5 class="card-title mb-0">Información del Preset</h5>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-6">
                                    <strong>Producto:</strong>
                                    <p class="mb-3">{{ $itemPreset->item->name }}</p>
                                </div>
                                <div class="col-md-6">
                                    <strong>Estado:</strong>
                                    <p class="mb-3">
                                        @if($itemPreset->is_active)
                                            <span class="badge bg-success fs-6">Activo</span>
                                        @else
                                            <span class="badge bg-secondary fs-6">Inactivo</span>
                                        @endif
                                    </p>
                                </div>
                            </div>

                            @if($itemPreset->description)
                                <div class="mb-3">
                                    <strong>Descripción:</strong>
                                    <p class="mb-0">{{ $itemPreset->description }}</p>
                                </div>
                            @endif

                            <div class="row">
                                <div class="col-md-3">
                                    <strong>Precio Base:</strong>
                                    <p class="mb-3 fs-5">${{ number_format($itemPreset->price, 2) }}</p>
                                </div>
                                <div class="col-md-3">
                                    <strong>Descuento:</strong>
                                    <p class="mb-3 fs-5">
                                        @if($itemPreset->discount > 0)
                                            <span class="text-warning">{{ $itemPreset->discount }}%</span>
                                        @else
                                            <span class="text-muted">Sin descuento</span>
                                        @endif
                                    </p>
                                </div>
                                <div class="col-md-3">
                                    <strong>Precio Final:</strong>
                                    <p class="mb-3 fs-4 fw-bold text-success">${{ number_format($itemPreset->final_price, 2) }}</p>
                                </div>
                                <div class="col-md-3">
                                    <strong>Orden:</strong>
                                    <p class="mb-3 fs-5">{{ $itemPreset->sort_order }}</p>
                                </div>
                            </div>

                            <div class="row">
                                <div class="col-md-6">
                                    <strong>Creado:</strong>
                                    <p class="mb-3">{{ $itemPreset->created_at->format('d/m/Y H:i') }}</p>
                                </div>
                                <div class="col-md-6">
                                    <strong>Última actualización:</strong>
                                    <p class="mb-3">{{ $itemPreset->updated_at->format('d/m/Y H:i') }}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Configuración -->
                    @if($itemPreset->configuration)
                        <div class="card mb-4">
                            <div class="card-header">
                                <h5 class="card-title mb-0">Configuración del Preset</h5>
                            </div>
                            <div class="card-body">
                                <div class="table-responsive">
                                    <table class="table table-sm">
                                        <tbody>
                                            @foreach($itemPreset->configuration as $key => $value)
                                                <tr>
                                                    <td class="fw-bold" style="width: 30%;">{{ ucfirst(str_replace('_', ' ', $key)) }}</td>
                                                    <td>
                                                        @if(is_array($value))
                                                            {{ json_encode($value) }}
                                                        @else
                                                            {{ $value }}
                                                        @endif
                                                    </td>
                                                </tr>
                                            @endforeach
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    @endif

                    <!-- Acciones adicionales -->
                    <div class="card">
                        <div class="card-header">
                            <h5 class="card-title mb-0">Acciones</h5>
                        </div>
                        <div class="card-body">
                            <div class="d-flex gap-2">
                                <form method="POST" action="{{ route('admin.item-presets.toggle-status', $itemPreset) }}" class="d-inline">
                                    @csrf
                                    @method('PATCH')
                                    <button type="submit" class="btn {{ $itemPreset->is_active ? 'btn-warning' : 'btn-success' }}">
                                        <i class="fas {{ $itemPreset->is_active ? 'fa-pause' : 'fa-play' }} me-2"></i>
                                        {{ $itemPreset->is_active ? 'Desactivar' : 'Activar' }} Preset
                                    </button>
                                </form>

                                <form method="POST" action="{{ route('admin.item-presets.destroy', $itemPreset) }}" 
                                      class="d-inline"
                                      onsubmit="return confirm('¿Estás seguro de que quieres eliminar este preset? Esta acción no se puede deshacer.')">
                                    @csrf
                                    @method('DELETE')
                                    <button type="submit" class="btn btn-danger">
                                        <i class="fas fa-trash me-2"></i>Eliminar Preset
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-lg-4">
                    <!-- Imagen -->
                    <div class="card mb-4">
                        <div class="card-header">
                            <h5 class="card-title mb-0">Imagen del Preset</h5>
                        </div>
                        <div class="card-body text-center">
                            @if($itemPreset->image)
                                <img src="{{ asset('storage/' . $itemPreset->image) }}" 
                                     alt="{{ $itemPreset->name }}" 
                                     class="img-fluid rounded shadow-sm" style="max-height: 300px;">
                            @else
                                <div class="bg-light d-flex align-items-center justify-content-center rounded" 
                                     style="height: 200px;">
                                    <div class="text-muted">
                                        <i class="fas fa-image fa-3x mb-2"></i>
                                        <p class="mb-0">Sin imagen</p>
                                    </div>
                                </div>
                            @endif
                        </div>
                    </div>

                    <!-- Información del producto relacionado -->
                    <div class="card">
                        <div class="card-header">
                            <h5 class="card-title mb-0">Producto Relacionado</h5>
                        </div>
                        <div class="card-body">
                            <div class="d-flex align-items-center">
                                @if($itemPreset->item->image)
                                    <img src="{{ asset('storage/' . $itemPreset->item->image) }}" 
                                         alt="{{ $itemPreset->item->name }}" 
                                         class="rounded me-3" style="width: 60px; height: 60px; object-fit: cover;">
                                @endif
                                <div>
                                    <h6 class="mb-1">{{ $itemPreset->item->name }}</h6>
                                    <p class="text-muted mb-1">SKU: {{ $itemPreset->item->sku ?? 'N/A' }}</p>
                                    <p class="text-muted mb-0">Precio base: ${{ number_format($itemPreset->item->price, 2) }}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection
