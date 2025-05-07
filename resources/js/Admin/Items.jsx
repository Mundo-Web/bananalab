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

const itemsRest = new ItemsRest();

const Items = ({ categories, brands, collections }) => {
    const [itemData, setItemData] = useState([]);
    const gridRef = useRef();
    const modalRef = useRef();

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
        }`;*/
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

    const onDeleteClicked = async (id) => {
        const { isConfirmed } = await Swal.fire({
            title: "Eliminar Item",
            text: "¿Estás seguro de eliminar este Item?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Sí, eliminar",
            cancelButtonText: "Cancelar",
        });
        if (!isConfirmed) return;
        const result = await itemsRest.delete(id);
        if (!result) return;
        $(gridRef.current).dxDataGrid("instance").refresh();
    };

    const onModalImportOpen = () => {
        $(modalImportRef.current).modal("show");
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
                                    ref={specificationsRef}
                                    label="Especificaciones"
                                    structure={{
                                        type: "",
                                        title: "",
                                        description: "",
                                    }}
                                    onChange={setSpecifications}
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
