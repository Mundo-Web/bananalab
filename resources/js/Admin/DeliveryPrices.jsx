import React, { useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";

import DeliveryPricesRest from "@Rest/Admin/DeliveryPricesRest";
import CreateReactScript from "@Utils/CreateReactScript";
import Swal from "sweetalert2";
import BaseAdminto from "../Components/Adminto/Base";
import DxButton from "../Components/Adminto/Dx/DxButton";
import Modal from "../Components/Adminto/Modal";
import Table from "../Components/Adminto/Table";
import InputFormGroup from "../Components/Adminto/form/InputFormGroup";
import SelectFormGroup from "../Components/Adminto/form/SelectFormGroup";
import SwitchFormGroup from "../Components/Adminto/form/SwitchFormGroup";
import TextareaFormGroup from "../Components/Adminto/form/TextareaFormGroup";
import Number2Currency from "../Utils/Number2Currency";

const deliverypricesRest = new DeliveryPricesRest();

const DeliveryPrices = ({ ubigeo = [] }) => {
    const gridRef = useRef();
    const modalRef = useRef();

    // Form elements ref
    const idRef = useRef();
    const ubigeoRef = useRef();
    const priceRef = useRef();
    const descriptionRef = useRef();

    const [isEditing, setIsEditing] = useState(false);
    const [inHome, setInHome] = useState(false);

    const onModalOpen = (data) => {
        if (data?.id) setIsEditing(true);
        else setIsEditing(false);

        idRef.current.value = data?.id ?? "";
        $(ubigeoRef.current)
            .val(data?.ubigeo ?? null)
            .trigger("change");
        setInHome(data?.price === null);
        priceRef.current.value = data?.price ?? 0;
        descriptionRef.current.value = data?.description ?? "";

        $(modalRef.current).modal("show");
    };

    const onModalSubmit = async (e) => {
        e.preventDefault();

        const selected = ubigeo.find(
            (x) => x.reniec == ubigeoRef.current.value
        );
        const request = {
            id: idRef.current.value || undefined,
            name: `${selected.distrito}, ${selected.departamento}`.toTitleCase(),
            price: inHome ? null : priceRef.current.value,
            description: descriptionRef.current.value,
            ubigeo: ubigeoRef.current.value,
        };

        const result = await deliverypricesRest.save(request);
        if (!result) return;

        $(gridRef.current).dxDataGrid("instance").refresh();
        $(modalRef.current).modal("hide");
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
        const result = await deliverypricesRest.delete(id);
        if (!result) return;
        $(gridRef.current).dxDataGrid("instance").refresh();
    };

    const ubigeoTemplate = (e) => {
        return $(
            renderToString(
                <span>
                    <span className="d-block w-100 text-truncate">
                        {e.text.replace(e.id, "")}
                    </span>
                    <small className="d-block">Ubigeo: {e.id}</small>
                </span>
            )
        );
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        e.target.value = null;

        const formData = new FormData();
        formData.append("excel", file);

        const result = await deliverypricesRest.upload(formData);

        if (!result) return;
        $(gridRef.current).dxDataGrid("instance").refresh();
    };

    return (
        <>
            <input
                id="file-input"
                type="file"
                accept=".xlsx, .xls"
                style={{ display: "none" }}
                onChange={handleFileUpload}
            />
            <Table
                gridRef={gridRef}
                title="Costos de envío"
                rest={deliverypricesRest}
                exportable={true}
                exportableName="delivery.prices"
                toolBar={(container) => {
                    container.unshift({
                        widget: "dxButton",
                        location: "after",
                        options: {
                            icon: "upload",
                            hint: "Cargar archivo Excel",
                            onClick: () =>
                                document.getElementById("file-input").click(),
                        },
                    });
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
                        dataField: "ubigeo",
                        caption: "Ubigeo (RENIEC)",
                        width: "150px",
                    },
                    {
                        dataField: "name",
                        caption: "Envío a",
                        width: "200px",
                        allowExporting: false,
                    },
                    {
                        dataField: "description",
                        caption: "Descripción",
                        cellTemplate: (container, { data }) => {
                            container.html(
                                data.description ||
                                    '<i class="text-muted">- Sin descripción -</i>'
                            );
                        },
                    },
                    {
                        dataField: "price",
                        caption: "Precio",
                        dataType: "number",
                        width: "150px",
                        cellTemplate: (container, { data }) => {
                            if (data.price === null) {
                                container.html(
                                    renderToString(
                                        <span className="text-muted">
                                            Pago en destino
                                        </span>
                                    )
                                );
                            } else if (data.price > 0) {
                                container.html(
                                    renderToString(
                                        <span>
                                            S/. {Number2Currency(data.price)}
                                        </span>
                                    )
                                );
                            } else {
                                container.text("Gratis");
                            }
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
            <Modal
                modalRef={modalRef}
                title={
                    isEditing
                        ? "Editar Costo de envío"
                        : "Agregar Costo de envío"
                }
                onSubmit={onModalSubmit}
                size="sm"
            >
                <input ref={idRef} type="hidden" />
                <div id="form-container" className="row">
                    <SelectFormGroup
                        eRef={ubigeoRef}
                        label="Distrito/Ubigeo"
                        templateResult={ubigeoTemplate}
                        templateSelection={ubigeoTemplate}
                        dropdownParent="#form-container"
                        required
                    >
                        {ubigeo.map((x, index) => {
                            return (
                                <option key={index} value={x.reniec}>
                                    {x.reniec} {x.distrito} {x.provincia}{" "}
                                    {x.departamento}
                                </option>
                            );
                        })}
                    </SelectFormGroup>
                    <SwitchFormGroup
                        label="Pago en destino"
                        col="col-6"
                        onChange={(e) => setInHome(e.target.checked)}
                        checked={inHome}
                        refreshable={[inHome]}
                    />
                    <div className="col-6" hidden={inHome}>
                        <InputFormGroup
                            eRef={priceRef}
                            label="Costo de envío"
                            col="col-12"
                            type="number"
                            step={0.01}
                            required
                        />
                    </div>
                    <TextareaFormGroup
                        eRef={descriptionRef}
                        label="Descripción"
                        rows={2}
                    />
                </div>
            </Modal>
        </>
    );
};

CreateReactScript((el, properties) => {
    createRoot(el).render(
        <BaseAdminto {...properties} title="Costos de envio">
            <DeliveryPrices {...properties} />
        </BaseAdminto>
    );
});
