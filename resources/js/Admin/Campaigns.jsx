import BaseAdminto from "@Adminto/Base";
import SwitchFormGroup from "@Adminto/form/SwitchFormGroup";
import TextareaFormGroup from "@Adminto/form/TextareaFormGroup";
import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import Swal from "sweetalert2";
import CampaignsRest from "../Actions/Admin/CampaignsRest";
import ImageFormGroup from "../Components/Adminto/form/ImageFormGroup";
import InputFormGroup from "../Components/Adminto/form/InputFormGroup";
import Modal from "../Components/Adminto/Modal";
import Table from "../Components/Adminto/Table";
import DxButton from "../Components/dx/DxButton";
import CreateReactScript from "../Utils/CreateReactScript";
import ReactAppend from "../Utils/ReactAppend";
import SetSelectValue from "../Utils/SetSelectValue";
import SelectAPIFormGroup from "../Components/Adminto/form/SelectAPIFormGroup";
import { Trash2 } from "lucide-react";

const campaignsRest = new CampaignsRest();

const Campaigns = () => {
    const gridRef = useRef();
    const modalRef = useRef();
    const itemsRef = useRef();

    // Form elements ref
    const idRef = useRef();
    const nameRef = useRef();
    const descriptionRef = useRef();
    const bannerRef = useRef();
    const imageRef = useRef();

    const [isEditing, setIsEditing] = useState(false);
    const [selectedProducts, setSelectedProducts] = useState([]);
    const onModalOpen = (data) => {
        if (data?.id) setIsEditing(true);
        else setIsEditing(false);

        idRef.current.value = data?.id ?? "";
        const products = data.items || [];
        console.log(products);
        setSelectedProducts(products);

        // Seleccionar los productos en el campo SelectAPIFormGroup
        setTimeout(() => {
            const productIds = products.map((product) => product.id.toString());

            itemsRef.current.setValue(productIds); // Asegúrate de que `setValue` sea un método válido en `SelectAPIFormGroup`
        }, 0);
        nameRef.current.value = data?.name ?? "";
        descriptionRef.current.value = data?.description ?? "";
        bannerRef.image.src = `/storage/images/campaign/${data?.banner}`;
        bannerRef.current.value = null;
        imageRef.image.src = `/storage/images/campaign/${data?.image}`;
        imageRef.current.value = null;

        $(modalRef.current).modal("show");
    };

    const onModalSubmit = async (e) => {
        e.preventDefault();

        const request = {
            id: idRef.current.value || undefined,
            name: nameRef.current.value,
            description: descriptionRef.current.value,
        };

        const formData = new FormData();
        for (const key in request) {
            formData.append(key, request[key]);
        }
        const file = imageRef.current.files[0];
        if (file) {
            formData.append("image", file);
        }
        const file2 = bannerRef.current.files[0];
        if (file2) {
            formData.append("banner", file2);
        }

        const selectedProducts = $(itemsRef.current).val();
        if (selectedProducts) {
            selectedProducts.forEach((id) => formData.append("products[]", id));
        }

        const result = await campaignsRest.save(formData);
        if (!result) return;

        $(gridRef.current).dxDataGrid("instance").refresh();
        $(modalRef.current).modal("hide");
    };

    const onFeaturedChange = async ({ id, value }) => {
        const result = await campaignsRest.boolean({
            id,
            field: "featured",
            value,
        });
        if (!result) return;
        $(gridRef.current).dxDataGrid("instance").refresh();
    };

    const onVisibleChange = async ({ id, value }) => {
        const result = await campaignsRest.boolean({
            id,
            field: "visible",
            value,
        });
        if (!result) return;
        $(gridRef.current).dxDataGrid("instance").refresh();
    };

    const onDeleteClicked = async (id) => {
        const { isConfirmed } = await Swal.fire({
            title: "Eliminar registro",
            text: "¿Estas seguro de eliminar este registro?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Si, eliminar",
            cancelButtonText: "Cancelar",
        });
        if (!isConfirmed) return;
        const result = await campaignsRest.delete(id);
        if (!result) return;
        $(gridRef.current).dxDataGrid("instance").refresh();
    };

    // Manejador para cuando se selecciona un producto
    const handleProductChange = (event) => {
        const selectedData = $(event.target).select2("data"); // Obtiene los datos seleccionados
        const newProducts = selectedData.map((item) => item.data); // Extrae los datos completos del producto

        // Agregar los nuevos productos al estado existente sin duplicados
        setSelectedProducts((prevProducts) => {
            const existingIds = prevProducts.map((p) => p.id); // IDs de los productos ya seleccionados
            const uniqueNewProducts = newProducts.filter(
                (product) => !existingIds.includes(product.id)
            ); // Filtra duplicados
            return [...prevProducts, ...uniqueNewProducts]; // Combina los productos antiguos y nuevos
        });
    };

    const removeProduct = (productId) => {
        const updatedProducts = selectedProducts.filter(
            (p) => p.id !== productId
        );
        setSelectedProducts(updatedProducts);

        const selectedIds = updatedProducts.map((p) => p.id.toString());
        $(itemsRef.current).val(selectedIds).trigger("change");

        if (mainProduct?.id === productId) {
            setMainProduct(null);
        }
    };
    return (
        <>
            <Table
                gridRef={gridRef}
                title="Campañas"
                rest={campaignsRest}
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
                            text: "Nuevo registro",
                            hint: "Nuevo registro",
                            onClick: () => onModalOpen(),
                        },
                    });
                }}
                columns={[
                    {
                        dataField: "id",
                        caption: "ID",
                        visible: false,
                    },
                    {
                        dataField: "name",
                        caption: "Camapaña",
                        width: "30%",
                    },
                    {
                        dataField: "description",
                        caption: "Descripción",
                        width: "50%",
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
                                    src={`/storage/images/campaign/${data.image}`}
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
                        dataField: "featured",
                        caption: "Destacado",
                        dataType: "boolean",
                        cellTemplate: (container, { data }) => {
                            $(container).empty();
                            ReactAppend(
                                container,
                                <SwitchFormGroup
                                    checked={data.featured == 1}
                                    onChange={() =>
                                        onFeaturedChange({
                                            id: data.id,
                                            value: !data.featured,
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
                        cellTemplate: (container, { data }) => {
                            $(container).empty();
                            ReactAppend(
                                container,
                                <SwitchFormGroup
                                    checked={data.visible == 1}
                                    onChange={() =>
                                        onVisibleChange({
                                            id: data.id,
                                            value: !data.visible,
                                        })
                                    }
                                />
                            );
                        },
                    },
                    {
                        caption: "Acciones",
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
            <Modal
                modalRef={modalRef}
                title={isEditing ? "Editar Camapaña" : "Agregar Camapaña"}
                onSubmit={onModalSubmit}
            >
                <input ref={idRef} type="hidden" />
                <div className="row" id="campaign-container">
                    <div className="col-md-6">
                        <ImageFormGroup
                            eRef={bannerRef}
                            label="Banner"
                            col="col-12"
                            aspect={3 / 1}
                        />
                        <ImageFormGroup
                            eRef={imageRef}
                            label="Imagen"
                            col="col-12"
                            aspect={16 / 9}
                        />
                    </div>
                    <div className="col-md-6">
                        <TextareaFormGroup
                            eRef={nameRef}
                            label="Camapaña"
                            rows={2}
                            required
                        />
                        <TextareaFormGroup
                            eRef={descriptionRef}
                            label="Descripción"
                            rows={3}
                        />
                    </div>
                    <SelectAPIFormGroup
                        eRef={itemsRef}
                        label="Productos asociados"
                        multiple
                        searchAPI="/api/admin/items/paginate"
                        searchBy="name"
                        id="items"
                        dropdownParent="#campaign-container"
                        onChange={handleProductChange}
                    />
                </div>
                {/* Lista de productos seleccionados */}
                <div className="row">
                    <h4>Productos Seleccionados</h4>
                    <ul className="list-unstyled col-md-12 row">
                        {selectedProducts.map((product) => (
                            <li key={product.id} className="col-md-4">
                                <div>
                                    <div class="card mb-3">
                                        <div class="row g-0">
                                            <div className="position-relative d-inline-block ratio ratio-1x1 border rounded overflow-hidden">
                                                <img
                                                    src={`/storage/images/item/${
                                                        product?.image ??
                                                        "undefined"
                                                    }`}
                                                    className="object-fit-cover w-100 h-100"
                                                    alt={product.name}
                                                    onError={(e) =>
                                                        (e.target.src =
                                                            "/api/cover/thumbnail/null")
                                                    }
                                                />
                                                <button
                                                    className="btn btn-sm btn-danger position-absolute top-0 end-0 m-1 d-inline-flex align-items-center justify-content-center"
                                                    type="button"
                                                    onClick={() =>
                                                        removeProduct(
                                                            product.id
                                                        )
                                                    }
                                                    style={{
                                                        width: "auto",
                                                        height: "auto",
                                                        padding:
                                                            "0.25rem 0.5rem",
                                                    }}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>

                                            <div class="">
                                                <div class="card-body">
                                                    <h5 class="card-title">
                                                        {product?.name}{" "}
                                                    </h5>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </Modal>
        </>
    );
};

CreateReactScript((el, properties) => {
    createRoot(el).render(
        <BaseAdminto {...properties} title="Camapañas">
            <Campaigns {...properties} />
        </BaseAdminto>
    );
});
