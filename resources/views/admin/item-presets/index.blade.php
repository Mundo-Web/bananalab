@extends('admin')

@section('title', 'Gestión de Presets de Álbumes')

@section('content')
<div class="container-fluid">
    <div class="row">
        <div class="col-12">
            <!-- Encabezado -->
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h1 class="h3 mb-0">Presets de Álbumes</h1>
                <a href="{{ route('admin.item-presets.create') }}" class="btn btn-primary">
                    <i class="fas fa-plus me-2"></i>Nuevo Preset
                </a>
            </div>

            <!-- Filtros -->
            <div class="card mb-4">
                <div class="card-body">
                    <form method="GET" action="{{ route('admin.item-presets.index') }}">
                        <div class="row g-3">
                            <div class="col-md-3">
                                <label for="item_id" class="form-label">Producto</label>
                                <select name="item_id" id="item_id" class="form-select">
                                    <option value="">Todos los productos</option>
                                    @foreach($items as $item)
                                        <option value="{{ $item->id }}" 
                                                {{ request('item_id') == $item->id ? 'selected' : '' }}>
                                            {{ $item->name }}
                                        </option>
                                    @endforeach
                                </select>
                            </div>
                            <div class="col-md-2">
                                <label for="status" class="form-label">Estado</label>
                                <select name="status" id="status" class="form-select">
                                    <option value="">Todos</option>
                                    <option value="active" {{ request('status') == 'active' ? 'selected' : '' }}>Activos</option>
                                    <option value="inactive" {{ request('status') == 'inactive' ? 'selected' : '' }}>Inactivos</option>
                                </select>
                            </div>
                            <div class="col-md-3">
                                <label for="search" class="form-label">Buscar</label>
                                <input type="text" name="search" id="search" class="form-control" 
                                       placeholder="Nombre del preset..." value="{{ request('search') }}">
                            </div>
                            <div class="col-md-2">
                                <label class="form-label">&nbsp;</label>
                                <div class="d-grid">
                                    <button type="submit" class="btn btn-outline-primary">
                                        <i class="fas fa-search me-1"></i>Filtrar
                                    </button>
                                </div>
                            </div>
                            <div class="col-md-2">
                                <label class="form-label">&nbsp;</label>
                                <div class="d-grid">
                                    <a href="{{ route('admin.item-presets.index') }}" class="btn btn-outline-secondary">
                                        <i class="fas fa-times me-1"></i>Limpiar
                                    </a>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Tabla de presets -->
            <div class="card">
                <div class="card-body">
                    @if($presets->count() > 0)
                        <div class="table-responsive">
                            <table class="table table-hover">
                                <thead class="table-light">
                                    <tr>
                                        <th>Imagen</th>
                                        <th>Nombre</th>
                                        <th>Producto</th>
                                        <th>Precio</th>
                                        <th>Descuento</th>
                                        <th>Precio Final</th>
                                        <th>Estado</th>
                                        <th>Orden</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    @foreach($presets as $preset)
                                        <tr>
                                            <td>
                                                @if($preset->image)
                                                    <img src="{{ asset('storage/' . $preset->image) }}" 
                                                         alt="{{ $preset->name }}" 
                                                         class="img-thumbnail" style="width: 50px; height: 50px; object-fit: cover;">
                                                @else
                                                    <div class="bg-light d-flex align-items-center justify-content-center" 
                                                         style="width: 50px; height: 50px;">
                                                        <i class="fas fa-image text-muted"></i>
                                                    </div>
                                                @endif
                                            </td>
                                            <td>
                                                <strong>{{ $preset->name }}</strong>
                                                @if($preset->description)
                                                    <br><small class="text-muted">{{ Str::limit($preset->description, 50) }}</small>
                                                @endif
                                            </td>
                                            <td>{{ $preset->item->name }}</td>
                                            <td>${{ number_format($preset->price, 2) }}</td>
                                            <td>
                                                @if($preset->discount > 0)
                                                    <span class="badge bg-warning text-dark">{{ $preset->discount }}%</span>
                                                @else
                                                    -
                                                @endif
                                            </td>
                                            <td>
                                                <strong>${{ number_format($preset->final_price, 2) }}</strong>
                                            </td>
                                            <td>
                                                @if($preset->is_active)
                                                    <span class="badge bg-success">Activo</span>
                                                @else
                                                    <span class="badge bg-secondary">Inactivo</span>
                                                @endif
                                            </td>
                                            <td>{{ $preset->sort_order }}</td>
                                            <td>
                                                <div class="btn-group" role="group">
                                                    <a href="{{ route('admin.item-presets.show', $preset) }}" 
                                                       class="btn btn-sm btn-outline-info" title="Ver">
                                                        <i class="fas fa-eye"></i>
                                                    </a>
                                                    <a href="{{ route('admin.item-presets.edit', $preset) }}" 
                                                       class="btn btn-sm btn-outline-primary" title="Editar">
                                                        <i class="fas fa-edit"></i>
                                                    </a>
                                                    <form method="POST" action="{{ route('admin.item-presets.toggle-status', $preset) }}" 
                                                          class="d-inline">
                                                        @csrf
                                                        @method('PATCH')
                                                        <button type="submit" 
                                                                class="btn btn-sm {{ $preset->is_active ? 'btn-outline-warning' : 'btn-outline-success' }}" 
                                                                title="{{ $preset->is_active ? 'Desactivar' : 'Activar' }}">
                                                            <i class="fas {{ $preset->is_active ? 'fa-pause' : 'fa-play' }}"></i>
                                                        </button>
                                                    </form>
                                                    <form method="POST" action="{{ route('admin.item-presets.destroy', $preset) }}" 
                                                          class="d-inline"
                                                          onsubmit="return confirm('¿Estás seguro de que quieres eliminar este preset?')">
                                                        @csrf
                                                        @method('DELETE')
                                                        <button type="submit" class="btn btn-sm btn-outline-danger" title="Eliminar">
                                                            <i class="fas fa-trash"></i>
                                                        </button>
                                                    </form>
                                                </div>
                                            </td>
                                        </tr>
                                    @endforeach
                                </tbody>
                            </table>
                        </div>

                        <!-- Paginación -->
                        <div class="d-flex justify-content-center mt-3">
                            {{ $presets->withQueryString()->links() }}
                        </div>
                    @else
                        <div class="text-center py-5">
                            <i class="fas fa-layer-group fa-3x text-muted mb-3"></i>
                            <h5 class="text-muted">No hay presets disponibles</h5>
                            <p class="text-muted">Comienza creando tu primer preset de álbum.</p>
                            <a href="{{ route('admin.item-presets.create') }}" class="btn btn-primary">
                                <i class="fas fa-plus me-2"></i>Crear Preset
                            </a>
                        </div>
                    @endif
                </div>
            </div>
        </div>
    </div>
</div>
@endsection
