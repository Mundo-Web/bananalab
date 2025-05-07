import React, {
    forwardRef,
    useImperativeHandle,
    useRef,
    useState,
} from "react";
import { createRoot } from "react-dom/client";
import $ from "jquery";
import Swal from "sweetalert2";

import Table from "../../Components/Adminto/Table";

const ProductsModal = forwardRef((props, ref) => {
    const modalRef = useRef();
    const gridRef = useRef();
    const [campaign, setCampaign] = useState(null);
    const [products, setProducts] = useState([]);

    const open = (campaignData) => {
        setCampaign(campaignData);
        loadProducts(campaignData.id);
        $(modalRef.current).modal("show");
    };

    const loadProducts = async (campaignId) => {
        try {
            const response = await fetch(
                `/api/admin/campaigns/${campaignId}/products`
            );
            const data = await response.json();
            setProducts(data);
        } catch (error) {
            console.error("Error loading products:", error);
        }
    };

    const onAddProducts = async () => {
        const { value: selectedIds } = await Swal.fire({
            title: "Agregar productos",
            html: `
                <div class="text-left">
                    <p>Ingresa los IDs de productos separados por comas:</p>
                    <input 
                        id="product-ids-input" 
                        class="swal2-input" 
                        placeholder="Ej: 123, 456, 789"
                    >
                </div>
            `,
            focusConfirm: false,
            preConfirm: () => {
                return document.getElementById("product-ids-input").value;
            },
            showCancelButton: true,
            confirmButtonText: "Agregar",
            cancelButtonText: "Cancelar",
        });

        if (selectedIds) {
            const productIds = selectedIds
                .split(",")
                .map((id) => id.trim())
                .filter((id) => id.length > 0);

            if (productIds.length === 0) {
                Swal.fire(
                    "Error",
                    "Debes ingresar al menos un ID válido",
                    "error"
                );
                return;
            }

            try {
                const response = await fetch(
                    `/api/admin/campaigns/${campaign.id}/products`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "X-CSRF-TOKEN": document.querySelector(
                                'meta[name="csrf-token"]'
                            ).content,
                        },
                        body: JSON.stringify({ product_ids: productIds }),
                    }
                );

                if (response.ok) {
                    Swal.fire(
                        "Éxito",
                        "Productos agregados correctamente",
                        "success"
                    );
                    loadProducts(campaign.id);
                } else {
                    const error = await response.json();
                    Swal.fire(
                        "Error",
                        error.message || "Error al agregar productos",
                        "error"
                    );
                }
            } catch (error) {
                Swal.fire("Error", "Error de conexión", "error");
            }
        }
    };

    const onRemoveProduct = async (productId) => {
        const { isConfirmed } = await Swal.fire({
            title: "Eliminar producto",
            text: "¿Estás seguro de eliminar este producto de la campaña?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Si, eliminar",
            cancelButtonText: "Cancelar",
        });

        if (!isConfirmed) return;

        try {
            const response = await fetch(
                `/api/admin/campaigns/${campaign.id}/products/${productId}`,
                {
                    method: "DELETE",
                    headers: {
                        "X-CSRF-TOKEN": document.querySelector(
                            'meta[name="csrf-token"]'
                        ).content,
                    },
                }
            );

            if (response.ok) {
                Swal.fire(
                    "Éxito",
                    "Producto eliminado de la campaña",
                    "success"
                );
                loadProducts(campaign.id);
            } else {
                const error = await response.json();
                Swal.fire(
                    "Error",
                    error.message || "Error al eliminar producto",
                    "error"
                );
            }
        } catch (error) {
            Swal.fire("Error", "Error de conexión", "error");
        }
    };

    useImperativeHandle(ref, () => ({
        open,
    }));

    return (
        <div className="modal fade" ref={modalRef} tabIndex="-1" role="dialog">
            <div className="modal-dialog modal-xl" role="document">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">
                            Productos de la campaña: {campaign?.name || ""}
                        </h5>
                        <button
                            type="button"
                            className="close"
                            data-dismiss="modal"
                            aria-label="Close"
                        >
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    <div className="modal-body">
                        <div className="mb-3">
                            <button
                                className="btn btn-primary"
                                onClick={onAddProducts}
                            >
                                <i className="fa fa-plus me-2"></i>
                                Agregar productos
                            </button>
                        </div>

                        <Table
                            gridRef={gridRef}
                            dataSource={products}
                            columns={[
                                {
                                    dataField: "id",
                                    caption: "ID",
                                    width: "80px",
                                },
                                {
                                    dataField: "name",
                                    caption: "Producto",
                                    width: "40%",
                                },
                                {
                                    dataField: "price",
                                    caption: "Precio",
                                    dataType: "number",
                                    format: "currency",
                                },
                                {
                                    dataField: "stock",
                                    caption: "Stock",
                                    dataType: "number",
                                },
                                {
                                    caption: "Acciones",
                                    cellTemplate: (container, { data }) => {
                                        container.append(
                                            DxButton({
                                                className:
                                                    "btn btn-xs btn-soft-danger",
                                                title: "Quitar",
                                                icon: "fa fa-trash",
                                                onClick: () =>
                                                    onRemoveProduct(data.id),
                                            })
                                        );
                                    },
                                    allowFiltering: false,
                                    allowExporting: false,
                                },
                            ]}
                        />
                    </div>
                    <div className="modal-footer">
                        <button
                            type="button"
                            className="btn btn-secondary"
                            data-dismiss="modal"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
});

export default ProductsModal;
