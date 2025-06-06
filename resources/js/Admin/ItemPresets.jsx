import BaseAdminto from "@Adminto/Base";
import SwitchFormGroup from "@Adminto/form/SwitchFormGroup";
import TextareaFormGroup from "@Adminto/form/TextareaFormGroup";
import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import Swal from "sweetalert2";
import ItemPresetsRest from "../Actions/Admin/ItemPresetsRest";
import Modal from "../Components/Adminto/Modal";
import Table from "../Components/Adminto/Table";
import ImageFormGroup from "../Components/Adminto/form/ImageFormGroup";
import InputFormGroup from "../Components/Adminto/form/InputFormGroup";
import QuillFormGroup from "../Components/Adminto/form/QuillFormGroup";
import SelectAPIFormGroup from "../Components/Adminto/form/SelectAPIFormGroup";
import SelectFormGroup from "../Components/Adminto/form/SelectFormGroup";
import DxButton from "../Components/dx/DxButton";
import CreateReactScript from "../Utils/CreateReactScript";
import Number2Currency from "../Utils/Number2Currency";
import ReactAppend from "../Utils/ReactAppend";
import SetSelectValue from "../Utils/SetSelectValue";

const itemPresetsRest = new ItemPresetsRest();

const ItemPresets = ({ items }) => {
    const [presetData, setPresetData] = useState([]);
    const gridRef = useRef();
    const modalRef = useRef();

    // Form elements ref
    const idRef = useRef();
    const itemRef = useRef();
    const nameRef = useRef();
    const descriptionRef = useRef();
    const priceRef = useRef();
    const discountRef = useRef();
    const imageRef = useRef();
    const sortOrderRef = useRef();
    const configurationRef = useRef();
    const isActiveRef = useRef();

    const [isEditing, setIsEditing] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    
    // Obtener item_id de la URL si existe
    const [urlItemId, setUrlItemId] = useState(() => {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('item_id');
    });

    useEffect(() => {
        if (gridRef.current) {
            gridRef.current.instance.refresh();
        }
    }, [presetData]);

    // Auto-seleccionar item si viene en la URL
    useEffect(() => {
        if (urlItemId && itemRef.current) {
            SetSelectValue(itemRef.current, urlItemId);
        }
    }, [urlItemId]);

    const onModalOpen = (data) => {
        setIsEditing(!!data?.id);
        
        // Reset form
        if (idRef.current) idRef.current.value = data?.id || "";
        if (nameRef.current) nameRef.current.value = data?.name || "";
        if (descriptionRef.current) descriptionRef.current.value = data?.description || "";
        if (priceRef.current) priceRef.current.value = data?.price || "";
        if (discountRef.current) discountRef.current.value = data?.discount || 0;
        if (sortOrderRef.current) sortOrderRef.current.value = data?.sort_order || 0;
        if (configurationRef.current) {
            configurationRef.current.value = data?.configuration 
                ? JSON.stringify(data.configuration, null, 2) 
                : "";
        }

        // Set select values - priorizar item del preset o item de la URL
        const itemIdToSelect = data?.item_id || urlItemId;
        if (itemRef.current && itemIdToSelect) {
            SetSelectValue(itemRef.current, itemIdToSelect);
        }

        // Set switch value
        if (isActiveRef.current) {
            isActiveRef.current.checked = data?.is_active !== false;
        }

        modalRef.current.show();
    };    const onModalSubmit = async (e) => {
        e.preventDefault();
        
        try {
            // Basic form validation
            if (!itemRef.current?.value) {
                throw new Error("Debe seleccionar un producto");
            }
            if (!nameRef.current?.value?.trim()) {
                throw new Error("El nombre es obligatorio");
            }
            if (!priceRef.current?.value || isNaN(parseFloat(priceRef.current.value))) {
                throw new Error("El precio debe ser un número válido");
            }
            if (parseFloat(priceRef.current.value) < 0) {
                throw new Error("El precio no puede ser negativo");
            }
            if (discountRef.current?.value && (isNaN(parseFloat(discountRef.current.value)) || parseFloat(discountRef.current.value) < 0)) {
                throw new Error("El descuento debe ser un número válido mayor o igual a 0");
            }
            
            const formData = new FormData();
            
            if (idRef.current?.value) {
                formData.append("id", idRef.current.value);
            }
            
            formData.append("item_id", itemRef.current.value);
            formData.append("name", nameRef.current.value.trim());
            formData.append("description", descriptionRef.current.value || "");
            formData.append("price", priceRef.current.value);
            formData.append("discount", discountRef.current.value || 0);
            formData.append("sort_order", sortOrderRef.current.value || 0);
            formData.append("is_active", isActiveRef.current.checked ? 1 : 0);
            
            // Configuration JSON
            if (configurationRef.current.value.trim()) {
                try {
                    JSON.parse(configurationRef.current.value); // Validate JSON
                    formData.append("configuration", configurationRef.current.value);
                } catch (error) {
                    throw new Error("La configuración debe ser un JSON válido");
                }
            }
            
            // Image file
            if (imageRef.current.files[0]) {
                formData.append("image", imageRef.current.files[0]);
            }

            await itemPresetsRest.save(formData);
            
            modalRef.current.hide();
            gridRef.current.instance.refresh();
            
            Swal.fire({
                title: "¡Éxito!",
                text: `Preset ${isEditing ? 'actualizado' : 'creado'} correctamente`,
                icon: "success",
                timer: 2000
            });
            
        } catch (error) {
            Swal.fire({
                title: "Error",
                text: error.message || "Error al guardar el preset",
                icon: "error"
            });
        }
    };

    const onToggleStatus = async ({ id, value }) => {
        try {
            await itemPresetsRest.toggleStatus(id);
            gridRef.current.instance.refresh();
            
            Swal.fire({
                title: "¡Éxito!",
                text: `Preset ${value ? 'activado' : 'desactivado'} correctamente`,
                icon: "success",
                timer: 2000
            });
        } catch (error) {
            Swal.fire({
                title: "Error",
                text: "Error al cambiar el estado del preset",
                icon: "error"
            });
        }
    };

    const onDeleteClicked = async (id) => {
        const result = await Swal.fire({
            title: "¿Estás seguro?",
            text: "Esta acción eliminará permanentemente el preset",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Sí, eliminar",
            cancelButtonText: "Cancelar"
        });

        if (result.isConfirmed) {
            try {
                await itemPresetsRest.delete(id);
                gridRef.current.instance.refresh();
                
                Swal.fire({
                    title: "¡Eliminado!",
                    text: "El preset ha sido eliminado correctamente",
                    icon: "success",
                    timer: 2000
                });
            } catch (error) {
                Swal.fire({
                    title: "Error",
                    text: "Error al eliminar el preset",
                    icon: "error"
                });
            }
        }
    };

    const columns = [
        {
            dataField: "image",
            caption: "Imagen",
            width: 80,
            allowFiltering: false,
            allowSorting: false,
            cellTemplate: (container, options) => {
                const imageUrl = options.value 
                    ? `/storage/${options.value}` 
                    : "/lte/assets/images/placeholder.png";
                
                ReactAppend(
                    container,
                    <img 
                        src={imageUrl} 
                        alt="Preset" 
                        style={{ 
                            width: "50px", 
                            height: "50px", 
                            objectFit: "cover",
                            borderRadius: "4px"
                        }} 
                    />
                );
            }
        },
        {
            dataField: "name",
            caption: "Nombre"
        },
        {
            dataField: "item.name",
            caption: "Producto"
        },
        {
            dataField: "price",
            caption: "Precio",
            cellTemplate: (container, options) => {
                ReactAppend(container, Number2Currency(options.value));
            }
        },
        {
            dataField: "discount",
            caption: "Descuento (%)",
            cellTemplate: (container, options) => {
                const discount = options.value || 0;
                ReactAppend(
                    container,
                    <span className={discount > 0 ? "text-warning fw-bold" : "text-muted"}>
                        {discount}%
                    </span>
                );
            }
        },
        {
            dataField: "final_price",
            caption: "Precio Final",
            cellTemplate: (container, options) => {
                const price = options.data.price || 0;
                const discount = options.data.discount || 0;
                const finalPrice = price - (price * (discount / 100));
                
                ReactAppend(
                    container,
                    <span className="fw-bold text-success">
                        {Number2Currency(finalPrice)}
                    </span>
                );
            }
        },
        {
            dataField: "sort_order",
            caption: "Orden",
            width: 80
        },
        {
            dataField: "is_active",
            caption: "Estado",
            width: 100,
            cellTemplate: (container, options) => {
                ReactAppend(
                    container,
                    <SwitchFormGroup
                        value={options.value}
                        onChange={(value) => onToggleStatus({ 
                            id: options.data.id, 
                            value 
                        })}
                    />
                );
            }
        },
        {
            caption: "Acciones",
            width: 120,
            allowFiltering: false,
            allowSorting: false,
            cellTemplate: (container, options) => {
                ReactAppend(
                    container,
                    <div className="d-flex gap-1">
                        <DxButton
                            text=""
                            icon="edit"
                            type="default"
                            stylingMode="text"
                            onClick={() => onModalOpen(options.data)}
                            hint="Editar"
                        />
                        <DxButton
                            text=""
                            icon="trash"
                            type="danger"
                            stylingMode="text"
                            onClick={() => onDeleteClicked(options.data.id)}
                            hint="Eliminar"
                        />
                    </div>
                );
            }
        }
    ];

    return (
        <BaseAdminto
            title="Gestión de Presets"
            breadcrumbs={[
                { text: "Panel", href: "/admin" },
                { text: "Presets de Álbumes", active: true }
            ]}
        >
            <div className="row">
                <div className="col-12">
                    <div className="card">
                        <div className="card-body">
                            {/* Indicador de filtro por item */}
                            {urlItemId && (
                                <div className="alert alert-info" role="alert">
                                    <i className="mdi mdi-information me-2"></i>
                                    Mostrando presets para el producto: <strong>
                                        {items.find(item => item.id === urlItemId)?.name || 'Producto seleccionado'}
                                    </strong>
                                    <button 
                                        type="button" 
                                        className="btn-close float-end" 
                                        onClick={() => {
                                            setUrlItemId(null);
                                            window.history.replaceState(null, '', '/admin/item-presets');
                                            gridRef.current?.instance.refresh();
                                        }}
                                    ></button>
                                </div>
                            )}
                            
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h4 className="header-title">Presets de Álbumes</h4>
                                <button 
                                    className="btn btn-primary"
                                    onClick={() => onModalOpen()}
                                >
                                    <i className="mdi mdi-plus me-2"></i>
                                    Nuevo Preset
                                </button>
                            </div>

                            <Table
                                ref={gridRef}
                                rest={itemPresetsRest}
                                columns={columns}
                                exports={["pdf", "xlsx"]}
                                allowColumnReordering={true}
                                allowColumnResizing={true}
                                showBorders={true}
                                rowAlternationEnabled={true}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <Modal
                ref={modalRef}
                title={isEditing ? "Editar Preset" : "Nuevo Preset"}
                size="lg"
                onSubmit={onModalSubmit}
            >
                <input ref={idRef} type="hidden" name="id" />
                
                <div className="row">
                    <div className="col-md-6">
                        <SelectFormGroup
                            ref={itemRef}
                            name="item_id"
                            label="Producto"
                            required
                            options={items.map(item => ({
                                value: item.id,
                                text: item.name
                            }))}
                        />
                    </div>
                    <div className="col-md-6">
                        <InputFormGroup
                            ref={nameRef}
                            name="name"
                            label="Nombre del Preset"
                            placeholder="Ej: Álbum Premium 30x30"
                            required
                        />
                    </div>
                </div>

                <TextareaFormGroup
                    ref={descriptionRef}
                    name="description"
                    label="Descripción"
                    placeholder="Descripción del preset..."
                    rows={3}
                />

                <div className="row">
                    <div className="col-md-4">
                        <InputFormGroup
                            ref={priceRef}
                            name="price"
                            label="Precio"
                            type="number"
                            step="0.01"
                            min="0"
                            required
                        />
                    </div>
                    <div className="col-md-4">
                        <InputFormGroup
                            ref={discountRef}
                            name="discount"
                            label="Descuento (%)"
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                        />
                    </div>
                    <div className="col-md-4">
                        <InputFormGroup
                            ref={sortOrderRef}
                            name="sort_order"
                            label="Orden"
                            type="number"
                            min="0"
                        />
                    </div>
                </div>

                <ImageFormGroup
                    ref={imageRef}
                    name="image"
                    label="Imagen del Preset"
                    accept="image/*"
                />

                <TextareaFormGroup
                    ref={configurationRef}
                    name="configuration"
                    label="Configuración (JSON)"
                    placeholder='{"pages": 20, "cover_type": "hard", "size": "30x30"}'
                    rows={4}
                    help="Configuración adicional en formato JSON (opcional)"
                />

                <SwitchFormGroup
                    ref={isActiveRef}
                    name="is_active"
                    label="Preset Activo"
                    defaultChecked={true}
                />
            </Modal>
        </BaseAdminto>
    );
};

CreateReactScript((el, properties) => {
    const root = createRoot(el);
    root.render(<ItemPresets {...properties} />);
});
