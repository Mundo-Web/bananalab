import BaseAdminto from "@Adminto/Base";
import SwitchFormGroup from "@Adminto/form/SwitchFormGroup";
import TextareaFormGroup from "@Adminto/form/TextareaFormGroup";
import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import Swal from "sweetalert2";
import ItemsRest from "../Actions/Admin/ItemsRest";
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
import ItemsGalleryRest from "../Actions/Admin/ItemsGalleryRest";
import DynamicField from "../Components/Adminto/form/DynamicField";
import ModalImportItem from "./Components/ModalImportItem";
import ItemPresetsRest from "../Actions/Admin/ItemPresetsRest";

const itemsRest = new ItemsRest();
const itemPresetsRest = new ItemPresetsRest();

const Items = ({ categories, brands, collections }) => {
    const [itemData, setItemData] = useState([]);
    const gridRef = useRef();
    const modalRef = useRef();

    // Presets modal state
    const [showPresetsModal, setShowPresetsModal] = useState(false);
    const [selectedItemForPresets, setSelectedItemForPresets] = useState(null);
    const [presetsData, setPresetsData] = useState([]);
    const modalPresetsRef = useRef();
    const presetsGridRef = useRef();
    
    // Ref para mantener la referencia del item actualmente procesándose en presets
    // Esto evita problemas de sincronización con el estado asíncrono
    const currentItemForPresetsRef = useRef(null);
    
    // Preset form refs
    const presetIdRef = useRef();
    const presetItemIdRef = useRef(); // Ref para el item ID
    const presetNameRef = useRef();
    const presetDescriptionRef = useRef();
    const presetPriceRef = useRef();
    const presetDiscountRef = useRef();
    const presetImageRef = useRef();
    const presetSortOrderRef = useRef();
    const presetConfigurationRef = useRef();
    const presetIsActiveRef = useRef();
    
    // Design layer refs
    const presetCoverImageRef = useRef();
    const presetContentLayerImageRef = useRef();
    const presetFinalLayerImageRef = useRef();
    const presetPreviewImageRef = useRef();
    
    // Canvas configuration refs
    const canvasWidthRef = useRef();
    const canvasHeightRef = useRef();
    const canvasDpiRef = useRef();
    const canvasBackgroundColorRef = useRef();
    
    // Content area configuration refs
    const contentXRef = useRef();
    const contentYRef = useRef();
    const contentWidthRef = useRef();
    const contentHeightRef = useRef();
    const contentRotationRef = useRef();
    const contentOpacityRef = useRef();
    const contentFitModeRef = useRef();
    
    const [isEditingPreset, setIsEditingPreset] = useState(false);
    const [activePresetTab, setActivePresetTab] = useState('basic');
    const [isLoadingPresets, setIsLoadingPresets] = useState(false);
    const [presetSubmitting, setPresetSubmitting] = useState(false);

    // Form elements ref
    const idRef = useRef();
    const categoryRef = useRef();
    const collectionRef = useRef();
    const subcategoryRef = useRef();
    const brandRef = useRef();
    const nameRef = useRef();
    const colorRef = useRef();
    const summaryRef = useRef();
    const priceRef = useRef();
    const discountRef = useRef();
    // const tagsRef = useRef();
    //const bannerRef = useRef();
    const imageRef = useRef();
    const textureRef = useRef();
    const descriptionRef = useRef();
    const stockRef = useRef();
    // const featuresRef = useRef([]);
    const specificationsRef = useRef([]);

    const [isEditing, setIsEditing] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedCollection, setSelectedCollection] = useState(null);
    const [gallery, setGallery] = useState([]);
    const galleryRef = useRef();
    const [features, setFeatures] = useState([]);
    const [specifications, setSpecifications] = useState([]);
    const [showImportModal, setShowImportModal] = useState(false);
    const modalImportRef = useRef();

    // Definir openPresetsModal antes de su primer uso
    const openPresetsModal = async (item) => {
        console.log("openPresetsModal called with item:", item);
        
        if (!item || !item.id) {
            Swal.fire({
                title: "Error",
                text: "No se ha seleccionado un item válido para gestionar presets.",
                icon: "error"
            });
            return;
        }
        
        console.log("Setting selectedItemForPresets:", item);
        setSelectedItemForPresets(item);
        currentItemForPresetsRef.current = item; // Mantener referencia síncrona
        setShowPresetsModal(true);
        
        // Abrir el modal primero
        $(modalPresetsRef.current).modal("show");
        
        // Esperar a que el modal se abra completamente antes de cargar los presets
        $(modalPresetsRef.current).on('shown.bs.modal', async function() {
            console.log("Modal shown, loading presets for item:", item.id);
            await loadPresets(item.id);
            // Remover el event listener para evitar múltiples ejecuciones
            $(modalPresetsRef.current).off('shown.bs.modal');
        });
    };

    // Effect para manejar el cleanup del modal de presets
    useEffect(() => {
        if (modalPresetsRef.current) {
            const modalElement = modalPresetsRef.current;
            
            const handleModalHidden = () => {
                // Limpiar el DataGrid cuando se cierre el modal
                if (presetsGridRef.current) {
                    try {
                        const instance = $(presetsGridRef.current).dxDataGrid("instance");
                        if (instance) {
                            instance.dispose();
                        }
                    } catch (error) {
                        console.warn("Error disposing DataGrid:", error);
                    }
                }
                setShowPresetsModal(false);
                setSelectedItemForPresets(null);
                currentItemForPresetsRef.current = null; // Limpiar referencia síncrona
                setPresetsData([]);
            };
            
            $(modalElement).on('hidden.bs.modal', handleModalHidden);
            
            return () => {
                $(modalElement).off('hidden.bs.modal', handleModalHidden);
            };
        }
    }, []);

    // Effect para manejar el modal de preset individual (Bootstrap modal)
    useEffect(() => {
        const handlePresetModalShow = () => {
            console.log("presetModal is opening - currentItemForPresetsRef:", currentItemForPresetsRef.current);
            console.log("presetModal is opening - selectedItemForPresets:", selectedItemForPresets);
        };
        
        const handlePresetModalHidden = () => {
            console.log("presetModal is closing");
            // No limpiar las referencias aquí porque el modal de presets principal sigue abierto
        };
        
        $("#presetModal").on('shown.bs.modal', handlePresetModalShow);
        $("#presetModal").on('hidden.bs.modal', handlePresetModalHidden);
        
        return () => {
            $("#presetModal").off('shown.bs.modal', handlePresetModalShow);
            $("#presetModal").off('hidden.bs.modal', handlePresetModalHidden);
        };
    }, [selectedItemForPresets]);

    // Gallery handlers
    const handleGalleryChange = (e) => {
        const files = Array.from(e.target.files);
        const newImages = files.map((file) => ({
            file,
            url: URL.createObjectURL(file),
        }));
        setGallery((prev) => [...prev, ...newImages]);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files);
        const newImages = files.map((file) => ({
            file,
            url: URL.createObjectURL(file),
        }));
        setGallery((prev) => [...prev, ...newImages]);
    };

    const handleDragOver = (e) => e.preventDefault();

    const removeGalleryImage = (e, index) => {
        e.preventDefault();
        const image = gallery[index];
        if (image.id) {
            setGallery((prev) =>
                prev.map((img, i) =>
                    i === index ? { ...img, toDelete: true } : img
                )
            );
        } else {
            setGallery((prev) => prev.filter((_, i) => i !== index));
        }
    };

    useEffect(() => {
        if (itemData && itemData.images) {
            const existingImages = itemData.images.map((img) => ({
                id: img.id,
                url: `/storage/images/item_image/${img.url}`,
            }));
            setGallery(existingImages);
        }
    }, [itemData]);

    const onModalOpen = (data) => {
        setItemData(data || null);
        setIsEditing(!!data?.id);

        // Reset form values
        idRef.current.value = data?.id || "";
        $(categoryRef.current)
            .val(data?.category_id || null)
            .trigger("change");
        $(collectionRef.current)
            .val(data?.collection_id || null)
            .trigger("change");
        SetSelectValue(
            subcategoryRef.current,
            data?.subcategory?.id,
            data?.subcategory?.name
        );
        $(brandRef.current)
            .val(data?.brand_id || null)
            .trigger("change");
        nameRef.current.value = data?.name || "";
        colorRef.current.value = data?.color || "";
        summaryRef.current.value = data?.summary || "";
        priceRef.current.value = data?.price || 0;
        discountRef.current.value = data?.discount || 0;
        stockRef.current.value = data?.stock || 0;

        //SetSelectValue(tagsRef.current, data?.tags ?? [], "id", "name");

        // bannerRef.current.value = null;
        imageRef.current.value = null;
        /* bannerRef.image.src = `/storage/images/item/${
            data?.banner ?? "undefined"
        };*/
        imageRef.image.src = `/storage/images/item/${
            data?.image ?? "undefined"
        }`;
        textureRef.image.src = `/storage/images/item/${
            data?.texture ?? "undefined"
        }`;

        descriptionRef.editor.root.innerHTML = data?.description ?? "";

        // Set features and specifications
        setFeatures(data?.features || []);
        setSpecifications(data?.specifications || []);

        $(modalRef.current).modal("show");
    };

    const onModalSubmit = async (e) => {
        e.preventDefault();

        const request = {
            id: idRef.current.value || undefined,
            category_id: categoryRef.current.value,
            collection_id: collectionRef.current.value || null,
            subcategory_id: subcategoryRef.current.value,
            brand_id: brandRef.current.value,
            name: nameRef.current.value,
            color: colorRef.current.value,
            summary: summaryRef.current.value,
            price: priceRef.current.value,
            discount: discountRef.current.value,
            //  tags: $(tagsRef.current).val(),
            description: descriptionRef.current.value,
            stock: stockRef.current.value,
        };

        const formData = new FormData();
        for (const key in request) {
            formData.append(key, request[key]);
        }
        formData.append("features", JSON.stringify(features));
        formData.append("specifications", JSON.stringify(specifications));

        const image = imageRef.current.files[0];
        if (image) formData.append("image", image);

        const texture = textureRef.current.files[0];
        if (texture) formData.append("texture", texture);

        //  const banner = bannerRef.current.files[0];
        // if (banner) formData.append("banner", banner);

        // Handle gallery
        gallery.forEach((img, index) => {
            if (!img.toDelete) {
                if (img.file) {
                    formData.append(`gallery[${index}]`, img.file);
                } else {
                    formData.append(`gallery_ids[${index}]`, img.id);
                }
            }
        });

        const deletedImages = gallery
            .filter((img) => img.toDelete)
            .map((img) => parseInt(img.id, 10));
        if (deletedImages.length > 0) {
            formData.append("deleted_images", JSON.stringify(deletedImages));
        }

        const result = await itemsRest.save(formData);
        if (!result) return;

        $(gridRef.current).dxDataGrid("instance").refresh();
        $(modalRef.current).modal("hide");
        setGallery([]);
    };

    const onVisibleChange = async ({ id, value }) => {
        const result = await itemsRest.boolean({ id, field: "visible", value });
        if (!result) return;
        $(gridRef.current).dxDataGrid("instance").refresh();
    };

    const onBooleanChange = async ({ id, field, value }) => {
        const result = await itemsRest.boolean({ id, field, value });
        if (!result) return;
        $(gridRef.current).dxDataGrid("instance").refresh();
    };

    // Presets Modal Functions
    function loadPresets(itemId) {
        if (!itemId) {
            console.warn("loadPresets called without itemId");
            return;
        }
        console.log("loadPresets called with itemId:", itemId);
        setIsLoadingPresets(true);
        setPresetsData([]); // Limpiar datos anteriores
        
        itemPresetsRest.getByItem(itemId)
            .then(result => {
                console.log("loadPresets result:", result);
                const presets = result.data || [];
                setPresetsData(presets);
                
                // Esperar un poco más antes de inicializar el grid para asegurar que el DOM esté listo
                setTimeout(() => {
                    console.log("Attempting to initialize presets grid with data:", presets);
                    initializePresetsGrid(presets);
                }, 300);
            })
            .catch(error => {
                console.error("Error loading presets:", error);
                setPresetsData([]);
                // Mostrar error al usuario
                Swal.fire({
                    title: "Error",
                    text: "No se pudieron cargar los presets. Por favor, intenta nuevamente.",
                    icon: "error"
                });
            })
            .finally(() => {
                setIsLoadingPresets(false);
            });
    }

    const onPresetModalOpen = (preset = null, item = null) => {
        // Si se pasa un item, usarlo. Si no, usar el ya seleccionado.
        // Solo fallar si no hay ningún item disponible.
        const targetItem = item || selectedItemForPresets || currentItemForPresetsRef.current;
        
        if (!targetItem || !targetItem.id) {
            Swal.fire({
                title: "Error",
                text: "No hay item seleccionado para gestionar presets. Por favor, selecciona un item válido.",
                icon: "error"
            });
            return;
        }
        
        // Asegurar que el item esté seleccionado
        setSelectedItemForPresets(targetItem);
        currentItemForPresetsRef.current = targetItem; // Mantener referencia síncrona
        setIsEditingPreset(!!preset?.id);
        setActivePresetTab('basic');
        
        // Resetear refs y cargar datos del preset si existe
        presetIdRef.current.value = preset?.id || "";
        presetItemIdRef.current.value = targetItem?.id || ""; // Establecer el item ID con verificación
        presetNameRef.current.value = preset?.name || "";
        presetDescriptionRef.current.value = preset?.description || "";
        presetPriceRef.current.value = preset?.price || "";
        presetDiscountRef.current.value = preset?.discount || 0;
        presetSortOrderRef.current.value = preset?.sort_order || 0;
        presetConfigurationRef.current.value = preset?.configuration ? JSON.stringify(preset.configuration, null, 2) : "";
        presetIsActiveRef.current.checked = preset?.is_active !== false;
        presetImageRef.current.value = "";
        // Reset design layer images
        if (presetCoverImageRef.current) presetCoverImageRef.current.value = "";
        if (presetContentLayerImageRef.current) presetContentLayerImageRef.current.value = "";
        if (presetFinalLayerImageRef.current) presetFinalLayerImageRef.current.value = "";
        if (presetPreviewImageRef.current) presetPreviewImageRef.current.value = "";
        // Canvas config
        canvasWidthRef.current.value = preset?.canvas_config?.width || 1000;
        canvasHeightRef.current.value = preset?.canvas_config?.height || 1000;
        canvasDpiRef.current.value = preset?.canvas_config?.dpi || 300;
        canvasBackgroundColorRef.current.value = preset?.canvas_config?.background_color || '#ffffff';
        // Content area config
        contentXRef.current.value = preset?.content_layer_config?.x || 0;
        contentYRef.current.value = preset?.content_layer_config?.y || 0;
        contentWidthRef.current.value = preset?.content_layer_config?.width || 1000;
        contentHeightRef.current.value = preset?.content_layer_config?.height || 1000;
        contentRotationRef.current.value = preset?.content_layer_config?.rotation || 0;
        contentOpacityRef.current.value = preset?.content_layer_config?.opacity || 1;
        contentFitModeRef.current.value = preset?.content_layer_config?.fit_mode || 'cover';
        
        // Verificación final antes de mostrar el modal
        console.log("onPresetModalOpen - antes de mostrar modal, selectedItemForPresets:", selectedItemForPresets, "targetItem:", targetItem);
        
        $("#presetModal").modal("show");
    };

    const updatePresetsGrid = (data) => {
        console.log("updatePresetsGrid called with data:", data);
        if (!presetsGridRef.current) {
            console.warn("presetsGridRef.current is null in updatePresetsGrid");
            return;
        }
        
        try {
            const instance = $(presetsGridRef.current).dxDataGrid("instance");
            if (instance) {
                console.log("Updating existing DataGrid instance");
                instance.option("dataSource", data);
            } else {
                console.log("No DataGrid instance found, initializing new one");
                // Si no hay instancia, inicializar el grid
                initializePresetsGrid(data);
            }
        } catch (error) {
            console.warn("DataGrid instance not available, will initialize on next load", error);
        }
    };

    const initializePresetsGrid = (data) => {
        console.log("initializePresetsGrid called with data:", data);
        if (!presetsGridRef.current) {
            console.warn("presetsGridRef.current is null in initializePresetsGrid");
            return;
        }
        
        // Verificar si el elemento del grid está visible y disponible
        if (!$(presetsGridRef.current).is(':visible')) {
            console.warn("Grid element is not visible, retrying in 500ms");
            setTimeout(() => initializePresetsGrid(data), 500);
            return;
        }
        
        // Verificar si el DataGrid ya está inicializado
        try {
            const instance = $(presetsGridRef.current).dxDataGrid("instance");
            if (instance) {
                console.log("DataGrid already initialized, updating data");
                // Si ya está inicializado, solo actualizar los datos
                instance.option("dataSource", data);
                return;
            }
        } catch (error) {
            console.log("No existing DataGrid instance found, creating new one");
        }
        
        console.log("Creating new DataGrid instance");
        // Si no está inicializado, crear el DataGrid
        $(presetsGridRef.current).dxDataGrid({
            dataSource: data,
            keyExpr: "id",
            showBorders: true,
            columnAutoWidth: true,
            searchPanel: {
                visible: true,
                placeholder: "Buscar presets..."
            },
            filterRow: {
                visible: true
            },
            headerFilter: {
                visible: true
            },
            paging: {
                enabled: false
            },
            onContentReady: function() {
                console.log("DataGrid content ready with", data.length, "items");
            },
            columns: [
                {
                    dataField: "name",
                    caption: "Nombre",
                    width: "200px"
                },
                {
                    dataField: "description",
                    caption: "Descripción",
                    width: "250px"
                },
                {
                    dataField: "price",
                    caption: "Precio",
                    width: "80px",
                    cellTemplate: (container, options) => {
                        container.text(`S/. ${Number2Currency(options.value)}`);
                    }
                },
                {
                    dataField: "discount",
                    caption: "Descuento",
                    width: "80px",
                    cellTemplate: (container, options) => {
                        if (options.value > 0) {
                            container.text(`S/. ${Number2Currency(options.value)}`);
                        } else {
                            container.text("-");
                        }
                    }
                },
                {
                    caption: "Precio Final",
                    width: "100px",
                    cellTemplate: (container, options) => {
                        const finalPrice = options.data.discount > 0 
                            ? options.data.price - options.data.discount 
                            : options.data.price;
                        container.html(
                            `<span class="fw-bold text-success">S/. ${Number2Currency(finalPrice)}</span>`
                        );
                    }
                },
                {
                    dataField: "sort_order",
                    caption: "Orden",
                    width: "70px"
                },
                {
                    dataField: "is_active",
                    caption: "Estado",
                    width: "100px",
                    cellTemplate: (container, options) => {
                        ReactAppend(
                            container,
                            <div className="form-check form-switch">
                                <input 
                                    className="form-check-input" 
                                    type="checkbox" 
                                    checked={options.value}
                                    onChange={(e) => onPresetToggleStatus({ 
                                        id: options.data.id, 
                                        value: e.target.checked
                                    })}
                                />
                            </div>
                        );
                    }
                },
                {
                    caption: "Acciones",
                    width: "120px",
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
                                    onClick={() => {
                                        const itemForEdit = selectedItemForPresets || currentItemForPresetsRef.current;
                                        console.log("Edit preset clicked - item:", itemForEdit, "preset:", options.data);
                                        onPresetModalOpen(options.data, itemForEdit);
                                    }}
                                    hint="Editar"
                                />
                                <DxButton
                                    text=""
                                    icon="trash"
                                    type="danger"
                                    stylingMode="text"
                                    onClick={() => onPresetDelete(options.data.id)}
                                    hint="Eliminar"
                                />
                            </div>
                        );
                    }
                }
            ]
        });
    };

    // Asegurarse de que selectedItemForPresets existe antes de guardar o cargar
    const onPresetSubmit = async (e) => {
        e.preventDefault();
        
        // Usar múltiples fuentes para obtener el item ID
        const targetItem = selectedItemForPresets || currentItemForPresetsRef.current;
        const itemIdFromForm = presetItemIdRef.current?.value;
        
        console.log("onPresetSubmit - selectedItemForPresets:", selectedItemForPresets);
        console.log("onPresetSubmit - currentItemForPresetsRef.current:", currentItemForPresetsRef.current);
        console.log("onPresetSubmit - targetItem:", targetItem);
        console.log("onPresetSubmit - itemIdFromForm:", itemIdFromForm);
        
        // Usar el ID del formulario como último recurso
        const finalItemId = targetItem?.id || itemIdFromForm;
        
        if (!finalItemId) {
            Swal.fire({
                title: "Error",
                text: "No hay item seleccionado para asociar el preset. Por favor, cierra este modal y vuelve a abrir desde el botón 'Gestionar Presets' del item deseado.",
                icon: "error"
            });
            return;
        }

        setPresetSubmitting(true);
        
        try {
            // Basic form validation
            if (!presetNameRef.current?.value?.trim()) {
                throw new Error("El nombre es obligatorio");
            }
            if (!presetPriceRef.current?.value || isNaN(parseFloat(presetPriceRef.current.value))) {
                throw new Error("El precio debe ser un número válido");
            }
            if (parseFloat(presetPriceRef.current.value) < 0) {
                throw new Error("El precio no puede ser negativo");
            }
            
            const formData = new FormData();
            
            if (presetIdRef.current?.value) {
                formData.append("id", presetIdRef.current.value);
            }
            
            // Basic fields
            formData.append("item_id", finalItemId);
            formData.append("name", presetNameRef.current.value.trim());
            formData.append("description", presetDescriptionRef.current.value || "");
            formData.append("price", presetPriceRef.current.value);
            formData.append("discount", presetDiscountRef.current.value || 0);
            formData.append("sort_order", presetSortOrderRef.current.value || 0);
            formData.append("is_active", presetIsActiveRef.current.checked ? 1 : 0);
            
            // Configuration JSON
            if (presetConfigurationRef.current.value.trim()) {
                try {
                    JSON.parse(presetConfigurationRef.current.value); // Validate JSON
                    formData.append("configuration", presetConfigurationRef.current.value);
                } catch (error) {
                    throw new Error("La configuración debe ser un JSON válido");
                }
            }
            
            // Images
            if (presetImageRef.current.files[0]) {
                formData.append("image", presetImageRef.current.files[0]);
            }
            if (presetCoverImageRef.current?.files[0]) {
                formData.append("cover_image", presetCoverImageRef.current.files[0]);
            }
            if (presetContentLayerImageRef.current?.files[0]) {
                formData.append("content_layer_image", presetContentLayerImageRef.current.files[0]);
            }
            if (presetFinalLayerImageRef.current?.files[0]) {
                formData.append("final_layer_image", presetFinalLayerImageRef.current.files[0]);
            }
            if (presetPreviewImageRef.current?.files[0]) {
                formData.append("preview_image", presetPreviewImageRef.current.files[0]);
            }
            
            // Canvas configuration
            const canvasConfig = {
                width: parseInt(canvasWidthRef.current?.value) || 1000,
                height: parseInt(canvasHeightRef.current?.value) || 1000,
                dpi: parseInt(canvasDpiRef.current?.value) || 300,
                background_color: canvasBackgroundColorRef.current?.value || '#ffffff',
                format: 'JPEG',
                quality: 90
            };
            formData.append("canvas_config", JSON.stringify(canvasConfig));
            
            // Content layer configuration
            const contentLayerConfig = {
                x: parseInt(contentXRef.current?.value) || 0,
                y: parseInt(contentYRef.current?.value) || 0,
                width: parseInt(contentWidthRef.current?.value) || 1000,
                height: parseInt(contentHeightRef.current?.value) || 1000,
                rotation: parseFloat(contentRotationRef.current?.value) || 0,
                opacity: parseFloat(contentOpacityRef.current?.value) || 1,
                blend_mode: 'normal',
                fit_mode: contentFitModeRef.current?.value || 'cover',
                allow_upload: true,
                max_file_size: 10,
                allowed_formats: ['jpg', 'jpeg', 'png', 'gif']
            };
            formData.append("content_layer_config", JSON.stringify(contentLayerConfig));

            if (isEditingPreset && presetIdRef.current?.value) {
                await itemPresetsRest.updateForItem(finalItemId, presetIdRef.current.value, formData);
            } else {
                await itemPresetsRest.saveForItem(finalItemId, formData);
            }
            
            // Recargar y actualizar la tabla
            setIsLoadingPresets(true); // Mostrar loading en el grid
            const result = await itemPresetsRest.getByItem(finalItemId);
            setPresetsData(result.data || []);
            updatePresetsGrid(result.data || []);
            setIsLoadingPresets(false); // Ocultar loading
            // Cerrar el modal de edición/creación de preset, pero NO el de gestión de presets
            $("#presetModal").modal("hide");
            
            Swal.fire({
                title: "¡Éxito!",
                text: `Preset ${isEditingPreset ? 'actualizado' : 'creado'} correctamente`,
                icon: "success",
                timer: 2000
            });
            
        } catch (error) {
            Swal.fire({
                title: "Error",
                text: error.message || "Error al guardar el preset",
                icon: "error"
            });
        } finally {
            setPresetSubmitting(false);
        }
    };

    const onPresetToggleStatus = async ({ id, value }) => {
        try {
            await itemPresetsRest.toggleStatusForItem(selectedItemForPresets.id, id);
            
            // Actualizar los datos y refrescar el grid
            const result = await itemPresetsRest.getByItem(selectedItemForPresets.id);
            setPresetsData(result.data || []);
            updatePresetsGrid(result.data || []);
            
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

    const onPresetDelete = async (id) => {
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
                await itemPresetsRest.deleteForItem(selectedItemForPresets.id, id);
                
                // Recargar y actualizar la tabla
                const result = await itemPresetsRest.getByItem(selectedItemForPresets.id);
                setPresetsData(result.data || []);
                updatePresetsGrid(result.data || []);
                
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

    return (
        <>
            <Table
                gridRef={gridRef}
                title="Items"
                rest={itemsRest}
                toolBar={(container) => {
                    container.unshift({
                        widget: "dxButton",
                        location: "after",
                        options: {
                            icon: "refresh",
                            hint: "Refrescar tabla",
                            onClick: () =>
                                $(gridRef.current)
                                    .dxDataGrid("instance")
                                    .refresh(),
                        },
                    });
                    container.unshift({
                        widget: "dxButton",
                        location: "after",
                        options: {
                            icon: "plus",
                            text: "Agregar",
                            hint: "Agregar",
                            onClick: () => onModalOpen(),
                        },
                    });
                    container.unshift({
                        widget: "dxButton",
                        location: "after",
                        options: {
                            icon: "upload",
                            text: "Importar Datos",
                            hint: "Importar Datos",
                            onClick: () => onModalImportOpen(),
                        },
                    });
                }}
                exportable={true}
                exportableName="Items"
                columns={[
                    {
                        dataField: "id",
                        caption: "ID",
                        visible: false,
                    },
                    {
                        dataField: "category.name",
                        caption: "Categoría",
                        width: "120px",
                        cellTemplate: (container, { data }) => {
                            container.html(
                                renderToString(
                                    <>
                                        <b className="d-block fst-italic text-muted">
                                            {data.collection?.name}
                                        </b>
                                        <b className="d-block">
                                            {data.category?.name}
                                        </b>
                                        <small className="text-muted">
                                            {data.subcategory?.name}
                                        </small>
                                    </>
                                )
                            );
                        },
                    },
                    {
                        dataField: "subcategory.name",
                        caption: "Subcategoría",
                        visible: false,
                    },
                    {
                        dataField: "brand.name",
                        caption: "Marca",
                        width: "120px",
                    },
                    {
                        dataField: "name",
                        caption: "Nombre",
                        width: "300px",
                        cellTemplate: (container, { data }) => {
                            container.html(
                                renderToString(
                                    <>
                                        <b>{data.name}</b>
                                        <br />
                                        <span className="truncate">
                                            {data.summary}
                                        </span>
                                    </>
                                )
                            );
                        },
                    },
                    {
                        dataField: "final_price",
                        caption: "Precio",
                        dataType: "number",
                        width: "75px",
                        cellTemplate: (container, { data }) => {
                            container.html(
                                renderToString(
                                    <>
                                        {data.discount > 0 && (
                                            <small
                                                className="d-block text-muted"
                                                style={{
                                                    textDecoration:
                                                        "line-through",
                                                }}
                                            >
                                                S/.{Number2Currency(data.price)}
                                            </small>
                                        )}
                                        <span>
                                            S/.
                                            {Number2Currency(
                                                data.discount > 0
                                                    ? data.discount
                                                    : data.price
                                            )}
                                        </span>
                                    </>
                                )
                            );
                        },
                    },
                    {
                        dataField: "image",
                        caption: "Imagen",
                        width: "90px",
                        allowFiltering: false,
                        cellTemplate: (container, { data }) => {
                            ReactAppend(
                                container,
                                <img
                                    src={`/storage/images/item/${data.image}`}
                                    style={{
                                        width: "80px",
                                        height: "48px",
                                        objectFit: "cover",
                                        objectPosition: "center",
                                        borderRadius: "4px",
                                    }}
                                    onError={(e) =>
                                        (e.target.src =
                                            "/api/cover/thumbnail/null")
                                    }
                                />
                            );
                        },
                    },
                    {
                        dataField: "is_new",
                        caption: "Nuevo",
                        dataType: "boolean",
                        width: "80px",
                        cellTemplate: (container, { data }) => {
                            ReactAppend(
                                container,
                                <SwitchFormGroup
                                    checked={data.is_new}
                                    onChange={(e) =>
                                        onBooleanChange({
                                            id: data.id,
                                            field: "is_new",
                                            value: e.target.checked,
                                        })
                                    }
                                />
                            );
                        },
                    },
                    {
                        dataField: "offering",
                        caption: "En oferta",
                        dataType: "boolean",
                        width: "80px",
                        cellTemplate: (container, { data }) => {
                            ReactAppend(
                                container,
                                <SwitchFormGroup
                                    checked={data.offering}
                                    onChange={(e) =>
                                        onBooleanChange({
                                            id: data.id,
                                            field: "offering",
                                            value: e.target.checked,
                                        })
                                    }
                                />
                            );
                        },
                    },
                    {
                        dataField: "recommended",
                        caption: "Recomendado",
                        dataType: "boolean",
                        width: "80px",
                        cellTemplate: (container, { data }) => {
                            ReactAppend(
                                container,
                                <SwitchFormGroup
                                    checked={data.recommended}
                                    onChange={(e) =>
                                        onBooleanChange({
                                            id: data.id,
                                            field: "recommended",
                                            value: e.target.checked,
                                        })
                                    }
                                />
                            );
                        },
                    },
                    {
                        dataField: "featured",
                        caption: "Destacado",
                        dataType: "boolean",
                        width: "80px",
                        cellTemplate: (container, { data }) => {
                            ReactAppend(
                                container,
                                <SwitchFormGroup
                                    checked={data.featured}
                                    onChange={(e) =>
                                        onBooleanChange({
                                            id: data.id,
                                            field: "featured",
                                            value: e.target.checked,
                                        })
                                    }
                                />
                            );
                        },
                    },
                    {
                        dataField: "visible",
                        caption: "Visible",
                        dataType: "boolean",
                        width: "80px",
                        cellTemplate: (container, { data }) => {
                            ReactAppend(
                                container,
                                <SwitchFormGroup
                                    checked={data.visible}
                                    onChange={(e) =>
                                        onVisibleChange({
                                            id: data.id,
                                            value: e.target.checked,
                                        })
                                    }
                                />
                            );
                        },
                    },
                    {
                        caption: "Acciones",
                        width: "100px",
                        cellTemplate: (container, { data }) => {
                            container.css("text-overflow", "unset");
                            container.append(
                                DxButton({
                                    className: "btn btn-xs btn-soft-primary",
                                    title: "Editar",
                                    icon: "fa fa-pen",
                                    onClick: () => onModalOpen(data),
                                })
                            );
                            container.append(
                                DxButton({
                                    className: "btn btn-xs btn-soft-info",
                                    title: "Gestionar Presets",
                                    icon: "fa fa-layer-group",
                                    onClick: () => openPresetsModal(data),
                                })
                            );
                            container.append(
                                DxButton({
                                    className: "btn btn-xs btn-soft-danger",
                                    title: "Eliminar",
                                    icon: "fa fa-trash",
                                    onClick: () => onDeleteClicked(data.id),
                                })
                            );
                        },
                        allowFiltering: false,
                        allowExporting: false,
                    },
                ]}
            />

            {/* Modal principal para crear/editar items */}
            <Modal
                modalRef={modalRef}
                title={isEditing ? "Editar Item" : "Agregar Item"}
                onSubmit={onModalSubmit}
                size="xl"
            >
                <div className="row g-3">
                    {/* Columna 1: Información básica */}
                    <div className="col-md-4" id="principal-container">
                        <div className="card">
                            <div className="card-header bg-light">
                                <h5 className="card-title mb-0">
                                    Información Básica
                                </h5>
                            </div>
                            <div className="card-body">
                                <input ref={idRef} type="hidden" />

                                <SelectFormGroup
                                    eRef={collectionRef}
                                    label="Colección"
                                    dropdownParent="#principal-container"
                                    onChange={(e) =>
                                        setSelectedCollection(e.target.value)
                                    }
                                >
                                    {collections.map((item, index) => (
                                        <option key={index} value={item.id}>
                                            {item.name}
                                        </option>
                                    ))}
                                </SelectFormGroup>

                                <SelectAPIFormGroup
                                    onChange={(e) =>
                                        setSelectedCategory(e.target.value)
                                    }
                                    eRef={categoryRef}
                                    label="Categoría"
                                    searchAPI="/api/admin/categories/paginate"
                                    searchBy="name"
                                    filter={[
                                        "collection_id",
                                        "=",
                                        selectedCollection,
                                    ]}
                                    dropdownParent="#principal-container"
                                />

                                <SelectAPIFormGroup
                                    eRef={subcategoryRef}
                                    label="Subcategoría"
                                    searchAPI="/api/admin/subcategories/paginate"
                                    searchBy="name"
                                    filter={[
                                        "category_id",
                                        "=",
                                        selectedCategory,
                                    ]}
                                    dropdownParent="#principal-container"
                                />

                                <SelectFormGroup
                                    eRef={brandRef}
                                    label="Marca"
                                    required
                                    dropdownParent="#principal-container"
                                >
                                    {brands.map((item, index) => (
                                        <option key={index} value={item.id}>
                                            {item.name}
                                        </option>
                                    ))}
                                </SelectFormGroup>

                                <InputFormGroup
                                    eRef={nameRef}
                                    label="Nombre"
                                    required
                                />

                                <InputFormGroup
                                    eRef={colorRef}
                                    label="Color"
                                    required
                                />

                                <TextareaFormGroup
                                    eRef={summaryRef}
                                    label="Resumen"
                                    rows={3}
                                    required
                                />

                                {/*  <SelectAPIFormGroup
                                    id="tags"
                                    eRef={tagsRef}
                                    searchAPI={"/api/admin/tags/paginate"}
                                    searchBy="name"
                                    label="Tags"
                                    dropdownParent="#principal-container"
                                    tags
                                    multiple
                                />*/}
                            </div>
                            <div className="card">
                                <div className="card-header bg-light">
                                    <h5 className="card-title mb-0">
                                        Precios y Stock
                                    </h5>
                                </div>
                                <div className="card-body">
                                    <InputFormGroup
                                        eRef={priceRef}
                                        label="Precio"
                                        type="number"
                                        step="0.01"
                                        required
                                    />

                                    <InputFormGroup
                                        eRef={discountRef}
                                        label="Descuento"
                                        type="number"
                                        step="0.01"
                                    />

                                    <InputFormGroup
                                        label="Stock"
                                        eRef={stockRef}
                                        type="number"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Columna 2: Especificaciones */}
                    <div className="col-md-8">
                        {/*  <div className="card mt-3">
                            <div className="card-header bg-light">
                                <h5 className="card-title mb-0">
                                    Características
                                </h5>
                            </div>
                            <div className="card-body">
                                <DynamicField
                                    ref={featuresRef}
                                    label="Características"
                                    structure=""
                                    onChange={setFeatures}
                                />
                            </div>
                        </div>*/}
                        <div className="card mt-3">
                            <div className="card-header bg-light">
                                <h5 className="card-title mb-0">
                                    Especificaciones
                                </h5>
                            </div>
                            <div className="card-body">
                                <DynamicField
                                    onChange={setSpecifications}
                                    label="Especificaciones"
                                    structure={{
                                        type: "",
                                        title: "",
                                        description: "",
                                    }}
                                    typeOptions={["General", "Principal"]}
                                />
                            </div>
                        </div>
                        <div className="card">
                            <div className="card-header bg-light">
                                <h5 className="card-title mb-0">Imágenes</h5>
                            </div>
                            <div className="card-body">
                                {/*  <ImageFormGroup
                                    eRef={bannerRef}
                                    label="Banner"
                                    aspect={2 / 1}
                                    col="col-12"
                                />*/}

                                <div className="row">
                                    <div className="col-md-6">
                                        <ImageFormGroup
                                            eRef={imageRef}
                                            label="Imagen Principal"
                                            aspect={1}
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <ImageFormGroup
                                            eRef={textureRef}
                                            label="Textura"
                                            aspect={1}
                                        />
                                    </div>
                                </div>

                                <div className="mt-3">
                                    <label className="form-label">
                                        Galería de Imágenes
                                    </label>
                                    <input
                                        id="input-item-gallery"
                                        ref={galleryRef}
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        hidden
                                        onChange={handleGalleryChange}
                                    />
                                    <div
                                        className="gallery-upload-area"
                                        onClick={() =>
                                            galleryRef.current.click()
                                        }
                                        onDrop={handleDrop}
                                        onDragOver={handleDragOver}
                                    >
                                        <span className="form-label d-block mb-1">
                                            Arrastra y suelta imágenes aquí o
                                            haz clic para agregar
                                        </span>
                                    </div>

                                    <div className="gallery-preview mt-2">
                                        {gallery.map((image, index) => (
                                            <div
                                                key={index}
                                                className="gallery-thumbnail"
                                            >
                                                <img
                                                    src={`${image.url}`}
                                                    alt="preview"
                                                />
                                                <button
                                                    className="btn btn-xs btn-danger gallery-remove-btn"
                                                    onClick={(e) =>
                                                        removeGalleryImage(
                                                            e,
                                                            index
                                                        )
                                                    }
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card mt-3">
                    <div className="card-header bg-light">
                        <h5 className="card-title mb-0">
                            Descripción Completa
                        </h5>
                    </div>
                    <div className="card-body">
                        <QuillFormGroup eRef={descriptionRef} label="" />
                    </div>
                </div>
            </Modal>

            {/* Modal para importar datos */}
            <Modal modalRef={modalImportRef} title={"Importar Datos"} size="sm">
                <ModalImportItem gridRef={gridRef} modalRef={modalImportRef} />
            </Modal>

            {/* Modal para gestionar presets */}
            <Modal 
                modalRef={modalPresetsRef} 
                title={`Gestión de Presets - ${selectedItemForPresets?.name || ''}`} 
                size="xl"
            >
                <div className="row">
                    <div className="col-12 mb-3">
                        <div className="d-flex justify-content-between align-items-center">
                            <h6 className="mb-0">Presets de {selectedItemForPresets?.name}</h6>
                            <button 
                                className="btn btn-primary btn-sm"
                                onClick={() => {
                                    const currentItem = selectedItemForPresets || currentItemForPresetsRef.current;
                                    console.log("Nuevo Preset button clicked - currentItem:", currentItem);
                                    onPresetModalOpen(null, currentItem);
                                }}
                            >
                                <i className="fa fa-plus me-2"></i>
                                Nuevo Preset
                            </button>
                        </div>
                    </div>
                </div>
                
                <div className="table-responsive">
                    {isLoadingPresets ? (
                        <div className="text-center py-4">
                            <i className="fa fa-spinner fa-spin fa-2x"></i>
                            <p className="mt-2">Cargando presets...</p>
                        </div>
                    ) : (
                        <div 
                            ref={presetsGridRef}
                            style={{ height: '400px' }}
                        ></div>
                    )}
                </div>
            </Modal>

            {/* Modal para crear/editar preset */}
            <div 
                className="modal fade" 
                id="presetModal" 
                tabIndex="-1" 
                aria-labelledby="presetModalLabel" 
                aria-hidden="true"
            >
                <div className="modal-dialog modal-xl">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title" id="presetModalLabel">
                                {isEditingPreset ? 'Editar Preset' : 'Nuevo Preset'}
                            </h5>
                            <button 
                                type="button" 
                                className="btn-close" 
                                data-bs-dismiss="modal" 
                                aria-label="Close"
                            ></button>
                        </div>
                        <form onSubmit={onPresetSubmit}>
                            <div className="modal-body">
                                <input ref={presetIdRef} type="hidden" name="id" />
                                <input ref={presetItemIdRef} type="hidden" name="item_id" />
                                
                                {/* Navigation Tabs */}
                                <ul className="nav nav-tabs mb-3" role="tablist">
                                    <li className="nav-item" role="presentation">
                                        <a 
                                            className={`nav-link ${activePresetTab === 'basic' ? 'active' : ''}`}
                                            onClick={() => setActivePresetTab('basic')}
                                            href="#"
                                        >
                                            Información Básica
                                        </a>
                                    </li>
                                    <li className="nav-item" role="presentation">
                                        <a 
                                            className={`nav-link ${activePresetTab === 'design' ? 'active' : ''}`}
                                            onClick={() => setActivePresetTab('design')}
                                            href="#"
                                        >
                                            Capas de Diseño
                                        </a>
                                    </li>
                                    <li className="nav-item" role="presentation">
                                        <a 
                                            className={`nav-link ${activePresetTab === 'canvas' ? 'active' : ''}`}
                                            onClick={() => setActivePresetTab('canvas')}
                                            href="#"
                                        >
                                            Configuración Canvas
                                        </a>
                                    </li>
                                    <li className="nav-item" role="presentation">
                                        <a 
                                            className={`nav-link ${activePresetTab === 'content' ? 'active' : ''}`}
                                            onClick={() => setActivePresetTab('content')}
                                            href="#"
                                        >
                                            Área de Contenido
                                        </a>
                                    </li>
                                </ul>

                                {/* Tab Content */}
                                <div className="tab-content">
                                    {/* Basic Information Tab */}
                                    <div 
                                        className={`tab-pane fade ${activePresetTab === 'basic' ? 'show active' : ''}`}
                                        style={{ display: activePresetTab === 'basic' ? 'block' : 'none' }}
                                    >
                                            <div className="row">
                                                <div className="col-md-6">
                                                    <InputFormGroup
                                                        eRef={presetNameRef}
                                                        name="name"
                                                        label="Nombre del Preset"
                                                        placeholder="Ej: Álbum Premium 30x30"
                                                    />
                                                </div>
                                                <div className="col-md-3">
                                                    <InputFormGroup
                                                        eRef={presetPriceRef}
                                                        name="price"
                                                        label="Precio"
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                    />
                                                </div>
                                                <div className="col-md-3">
                                                    <InputFormGroup
                                                        eRef={presetDiscountRef}
                                                        name="discount"
                                                        label="Descuento (%)"
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        max="100"
                                                    />
                                                </div>
                                            </div>

                                            <TextareaFormGroup
                                                eRef={presetDescriptionRef}
                                                name="description"
                                                label="Descripción"
                                                placeholder="Descripción del preset..."
                                                rows={3}
                                            />

                                            <div className="row">
                                                <div className="col-md-6">
                                                    <ImageFormGroup
                                                        eRef={presetImageRef}
                                                        name="image"
                                                        label="Imagen Principal del Preset"
                                                    />
                                                </div>
                                                <div className="col-md-6">
                                                    <ImageFormGroup
                                                        eRef={presetPreviewImageRef}
                                                        name="preview_image"
                                                        label="Imagen de Vista Previa"
                                                    />
                                                </div>
                                            </div>

                                            <div className="row">
                                                <div className="col-md-3">
                                                    <InputFormGroup
                                                        eRef={presetSortOrderRef}
                                                        name="sort_order"
                                                        label="Orden"
                                                        type="number"
                                                        min="0"
                                                        defaultValue="0"
                                                    />
                                                </div>
                                                <div className="col-md-3">
                                                    <div className="form-group">
                                                        <label className="form-label">Estado</label>
                                                        <div className="form-check form-switch">
                                                            <input 
                                                                ref={presetIsActiveRef}
                                                                className="form-check-input" 
                                                                type="checkbox" 
                                                                defaultChecked={true}
                                                            />
                                                            <label className="form-check-label">
                                                                Activo
                                                            </label>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="form-group">
                                                <label className="form-label">Configuración Adicional (JSON)</label>
                                                <textarea 
                                                    ref={presetConfigurationRef}
                                                    className="form-control" 
                                                    rows="4"
                                                    placeholder='{"pages": 50, "size": "30x30", "cover": "hardcover"}'
                                                ></textarea>
                                                <small className="form-text text-muted">
                                                    Configuración técnica en formato JSON (opcional)
                                                </small>
                                            </div>
                                    </div>
                                    {/* Design Layers Tab */}
                                    <div 
                                        className={`tab-pane fade ${activePresetTab === 'design' ? 'show active' : ''}`}
                                        style={{ display: activePresetTab === 'design' ? 'block' : 'none' }}
                                    >
                                            <div className="row">
                                                <div className="col-md-4">
                                                    <div className="card">
                                                        <div className="card-header">
                                                            <h6 className="mb-0">Capa de Portada (Cover)</h6>
                                                        </div>
                                                        <div className="card-body">
                                                            <ImageFormGroup
                                                                eRef={presetCoverImageRef}
                                                                name="cover_image"
                                                                label="Imagen de Portada"
                                                            />
                                                            <small className="text-muted">
                                                                Esta es la imagen de fondo que aparecerá en el editor
                                                            </small>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col-md-4">
                                                    <div className="card">
                                                        <div className="card-header">
                                                            <h6 className="mb-0">Capa de Contenido</h6>
                                                        </div>
                                                        <div className="card-body">
                                                            <ImageFormGroup
                                                                eRef={presetContentLayerImageRef}
                                                                name="content_layer_image"
                                                                label="Imagen de Contenido"
                                                            />
                                                            <small className="text-muted">
                                                                Capa intermedia donde el usuario subirá su imagen
                                                            </small>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col-md-4">
                                                    <div className="card">
                                                        <div className="card-header">
                                                            <h6 className="mb-0">Capa Final (Tapa)</h6>
                                                        </div>
                                                        <div className="card-body">
                                                            <ImageFormGroup
                                                                eRef={presetFinalLayerImageRef}
                                                                name="final_layer_image"
                                                                label="Imagen de Tapa Final"
                                                            />
                                                            <small className="text-muted">
                                                                Esta es la capa superior que se superpone al contenido
                                                            </small>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                    </div>
                                    {/* Canvas Configuration Tab */}
                                    <div 
                                        className={`tab-pane fade ${activePresetTab === 'canvas' ? 'show active' : ''}`}
                                        style={{ display: activePresetTab === 'canvas' ? 'block' : 'none' }}
                                    >
                                            <h6 className="mb-3">Configuración del Canvas</h6>
                                            <div className="row">
                                                <div className="col-md-3">
                                                    <InputFormGroup
                                                        eRef={canvasWidthRef}
                                                        name="canvas_width"
                                                        label="Ancho (cm)"
                                                        type="number"
                                                        min="1"
                                                        step="0.1"
                                                        defaultValue="30"
                                                    />
                                                </div>
                                                <div className="col-md-3">
                                                    <InputFormGroup
                                                        eRef={canvasHeightRef}
                                                        name="canvas_height"
                                                        label="Alto (cm)"
                                                        type="number"
                                                        min="1"
                                                        step="0.1"
                                                        defaultValue="30"
                                                    />
                                                </div>
                                                <div className="col-md-3">
                                                    <InputFormGroup
                                                        eRef={canvasDpiRef}
                                                        name="canvas_dpi"
                                                        label="DPI (puntos por pulgada)"
                                                        type="number"
                                                        min="72"
                                                        defaultValue="300"
                                                    />
                                                </div>
                                                <div className="col-md-3">
                                                    <div className="form-group">
                                                        <label className="form-label">Color de Fondo</label>
                                                        <input 
                                                            ref={canvasBackgroundColorRef}
                                                            type="color"
                                                            className="form-control form-control-color"
                                                            defaultValue="#ffffff"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="mb-2">
                                                <small className="form-text text-muted">
                                                    El tamaño del canvas se ingresa en centímetros. El valor DPI recomendado para impresión es 300.
                                                </small>
                                            </div>
                                    </div>
                                    {/* Content Area Configuration Tab */}
                                    <div 
                                        className={`tab-pane fade ${activePresetTab === 'content' ? 'show active' : ''}`}
                                        style={{ display: activePresetTab === 'content' ? 'block' : 'none' }}
                                    >
                                            <h6 className="mb-3">Configuración del Área de Contenido del Usuario</h6>
                                            <div className="row">
                                                <div className="col-md-3">
                                                    <InputFormGroup
                                                        eRef={contentXRef}
                                                        name="content_x"
                                                        label="Posición X"
                                                        type="number"
                                                        defaultValue="0"
                                                    />
                                                </div>
                                                <div className="col-md-3">
                                                    <InputFormGroup
                                                        eRef={contentYRef}
                                                        name="content_y"
                                                        label="Posición Y"
                                                        type="number"
                                                        defaultValue="0"
                                                    />
                                                </div>
                                                <div className="col-md-3">
                                                    <InputFormGroup
                                                        eRef={contentWidthRef}
                                                        name="content_width"
                                                        label="Ancho"
                                                        type="number"
                                                        min="1"
                                                        defaultValue="1000"
                                                    />
                                                </div>
                                                <div className="col-md-3">
                                                    <InputFormGroup
                                                        eRef={contentHeightRef}
                                                        name="content_height"
                                                        label="Alto"
                                                        type="number"
                                                        min="1"
                                                        defaultValue="1000"
                                                    />
                                                </div>
                                            </div>
                                            <div className="row">
                                                <div className="col-md-3">
                                                    <InputFormGroup
                                                        eRef={contentRotationRef}
                                                        name="content_rotation"
                                                        label="Rotación (grados)"
                                                        type="number"
                                                        min="-360"
                                                        max="360"
                                                        step="0.1"
                                                        defaultValue="0"
                                                    />
                                                </div>
                                                <div className="col-md-3">
                                                    <InputFormGroup
                                                        eRef={contentOpacityRef}
                                                        name="content_opacity"
                                                        label="Opacidad"
                                                        type="number"
                                                        min="0"
                                                        max="1"
                                                        step="0.1"
                                                        defaultValue="1"
                                                    />
                                                </div>
                                                <div className="col-md-6">
                                                    <div className="form-group">
                                                        <label className="form-label">Modo de Ajuste</label>
                                                        <select ref={contentFitModeRef} className="form-control">
                                                            <option value="cover">Cover (cubrir área)</option>
                                                            <option value="contain">Contain (ajustar manteniendo aspecto)</option>
                                                            <option value="fill">Fill (estirar para llenar)</option>
                                                            <option value="none">None (tamaño original)</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button 
                                    type="button" 
                                    className="btn btn-secondary" 
                                    data-bs-dismiss="modal"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit" 
                                    className="btn btn-primary"
                                    disabled={presetSubmitting}
                                >
                                    {presetSubmitting ? (
                                        <>
                                            <i className="fa fa-spinner fa-spin me-2"></i>
                                            Guardando...
                                        </>
                                    ) : (
                                        `${isEditingPreset ? 'Actualizar' : 'Crear'} Preset`
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {/* Estilos para la galería */}
            <style jsx>{`
                .gallery-upload-area {
                    border: 2px dashed #ccc;
                    padding: 0px;
                    text-align: center;
                    cursor: pointer;
                    border-radius: 4px;
                    box-shadow: 2.5px 2.5px 5px rgba(0, 0, 0, 0.125);

                    height: 100px;
                    width: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background-color: #f8f9fa;
                    transition: all 0.3s ease;
                }

                .gallery-upload-area:hover {
                    border-color: #0d6efd;
                    background-color: #e9f0ff;
                }

                .gallery-preview {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                }

                .gallery-thumbnail {
                    position: relative;
                    width: 80px;
                    height: 80px;
                    border-radius: 4px;
                    overflow: hidden;
                }

                .gallery-thumbnail img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .gallery-remove-btn {
                    position: absolute;
                    top: 0;
                    right: 0;
                    padding: 0;
                    width: 20px;
                    height: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 10px;
                }
            `}</style>
        </>
    );
};

CreateReactScript((el, properties) => {
    createRoot(el).render(
        <BaseAdminto {...properties} title="Items">
            <Items {...properties} />
        </BaseAdminto>
    );
});
