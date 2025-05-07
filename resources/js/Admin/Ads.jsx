import React, { useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import BaseAdminto from "@Adminto/Base";
import CreateReactScript from "../Utils/CreateReactScript";
import Modal from "../Components/Adminto/Modal";
import Table from "../Components/Adminto/Table";
import InputFormGroup from "../Components/Adminto/form/InputFormGroup";
import ReactAppend from "../Utils/ReactAppend";
import DxButton from "../Components/dx/DxButton";
import SwitchFormGroup from "@Adminto/form/SwitchFormGroup";
import ImageFormGroup from "../Components/Adminto/form/ImageFormGroup";
import Swal from "sweetalert2";
import AdsRest from "../Actions/Admin/AdsRest";
import { renderToString } from "react-dom/server";
import TextareaFormGroup from "../Components/Adminto/form/TextareaFormGroup";
import SelectFormGroup from "../Components/Adminto/form/SelectFormGroup";

const adsRest = new AdsRest();

const Ads = () => {
    const gridRef = useRef();
    const modalRef = useRef();

    // Form elements ref
    const idRef = useRef();
    const nameRef = useRef();
    const alt_textRef = useRef();

    const imageRef = useRef();
    const dateBeginRef = useRef();
    const dateEndRef = useRef();

    const linkRef = useRef();

    const [isEditing, setIsEditing] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [selectedAction, setSelectedAction] = useState(false);
    const onModalOpen = (data) => {
        if (data?.id) setIsEditing(true);
        else setIsEditing(false);

        idRef.current.value = data?.id ?? "";
        nameRef.current.value = data?.name ?? "";
        alt_textRef.current.value = data?.alt_text ?? "";
        imageRef.image.src = `/storage/images/ad/${data?.image}`;
        imageRef.current.value = null;
        dateBeginRef.current.value = data?.start_date
            ? data.start_date.split("T")[0]
            : "";
        dateEndRef.current.value = data?.end_date
            ? data.end_date.split("T")[0]
            : "";

        linkRef.current.value = data?.target_url ?? "";

        $(modalRef.current).modal("show");
    };

    const onModalSubmit = async (e) => {
        e.preventDefault();
        try {
            const request = {
                id: idRef.current.value || undefined,
                name: nameRef.current.value,
                alt_text: alt_textRef.current.value,

                start_date: dateBeginRef.current.value,
                end_date: dateEndRef.current.value,

                target_url: linkRef.current.value,
            };

            const formData = new FormData();
            for (const key in request) {
                formData.append(key, request[key]);
            }
            const file = imageRef.current.files[0];
            if (file) {
                formData.append("image", file);
            }

            const result = await adsRest.save(formData);
            console.log(result);
            if (!result) return;

            console.log("Refrescando tabla...");
            $(gridRef.current).dxDataGrid("instance").refresh();

            console.log("Cerrando modal...");
            $(modalRef.current).modal("hide");
        } catch (error) {
            console.error("Error al enviar el formulario:", error);
            Swal.fire({
                icon: "error",
                title: "Error",
                text: "Hubo un error al enviar el formulario. Por favor, inténtalo de nuevo.",
            });
        }
    };

    const onVisibleChange = async ({ id, value }) => {
        const result = await adsRest.boolean({ id, field: "visible", value });
        if (!result) return;
        $(gridRef.current).dxDataGrid("instance").refresh();
    };

    const onDeleteClicked = async (id) => {
        const { isConfirmed } = await Swal.fire({
            title: "Eliminar anuncio",
            text: "¿Estás seguro de eliminar este anuncio?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Sí, eliminar",
            cancelButtonText: "Cancelar",
        });
        if (!isConfirmed) return;
        const result = await adsRest.delete(id);
        if (!result) return;
        $(gridRef.current).dxDataGrid("instance").refresh();
    };

    return (
        <>
            <Table
                gridRef={gridRef}
                title="Anuncios"
                rest={adsRest}
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
                            text: "Nuevo anuncio",
                            hint: "Nuevo anuncio",
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
                        dataField: "image",
                        caption: "Imagen",
                        width: "60px",
                        allowFiltering: false,
                        cellTemplate: (container, { data }) => {
                            ReactAppend(
                                container,
                                <img
                                    src={`/storage/images/ad/${data.image}`}
                                    style={{
                                        width: "50px",
                                        aspectRatio: 1,
                                        objectFit: "contain",
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
                        dataField: "name",
                        caption: "Contenido",
                        width: "50%",
                        cellTemplate: (container, { data }) => {
                            ReactAppend(
                                container,
                                data.name || data.description ? (
                                    <p
                                        className="mb-0"
                                        style={{ width: "100%" }}
                                    >
                                        <b className="d-block">{data.name}</b>
                                        <small
                                            className="text-wrap text-muted"
                                            style={{
                                                overflow: "hidden",
                                                display: "-webkit-box",
                                                WebkitBoxOrient: "vertical",
                                                WebkitLineClamp: 2,
                                            }}
                                        >
                                            {data.description}
                                        </small>
                                    </p>
                                ) : (
                                    <i className="text-muted">
                                        - Sin contenido textual -
                                    </i>
                                )
                            );
                        },
                    },
                    {
                        dataField: "start_date",
                        caption: "Mostrar",
                        cellTemplate: (container, { data }) => {
                            container.html(
                                renderToString(
                                    <>
                                        {data.start_date && data.end_date ? (
                                            <>
                                                <p className="mb-0">
                                                    <b>Desde:</b>{" "}
                                                    {moment(
                                                        data.start_date
                                                    ).format("DD [de] MMMM")}
                                                </p>
                                                <p className="mb-0">
                                                    <b>Hasta:</b>{" "}
                                                    {moment(
                                                        data.end_date
                                                    ).format("DD [de] MMMM")}
                                                </p>
                                            </>
                                        ) : (
                                            <p className="mb-0">
                                                <b>Visible:</b> Siempre
                                            </p>
                                        )}
                                    </>
                                )
                            );
                        },
                    },
                    {
                        dataField: "target_url",
                        caption: "Link",
                        cellTemplate: (container, { data }) => {
                            if (data.target_url) {
                                container.html(
                                    renderToString(
                                        <a href={data.target_url}>
                                            {data.target_url}
                                        </a>
                                    )
                                );
                            } else {
                                container.html(
                                    renderToString(
                                        <i className="text-muted">
                                            - Sin link -
                                        </i>
                                    )
                                );
                            }
                        },
                    },
                    {
                        dataField: "visible",
                        caption: "Visible",
                        dataType: "boolean",
                        width: "120px",
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
                title={isEditing ? "Editar anuncio" : "Agregar anuncio"}
                onSubmit={onModalSubmit}
                size="lg"
            >
                <div className="row" id="principal-container">
                    <input ref={idRef} type="hidden" />
                    <ImageFormGroup
                        eRef={imageRef}
                        label="Imagen"
                        col="col-md-5"
                        aspect={1}
                        fit="contain"
                        required
                    />
                    <div className="col-md-7">
                        <InputFormGroup
                            eRef={nameRef}
                            label="Título"
                            rows={1}
                        />
                        <TextareaFormGroup
                            eRef={alt_textRef}
                            label="Texto Alternativo"
                            placeholder={"Descripción de la imagen"}
                            rows={2}
                        />
                        <InputFormGroup
                            eRef={dateBeginRef}
                            label="Desde"
                            type="date"
                            col="col-md-12"
                        />
                        <InputFormGroup
                            eRef={dateEndRef}
                            label="Hasta"
                            type="date"
                            col="col-md-12"
                        />
                        <InputFormGroup eRef={linkRef} label="Link" />
                    </div>
                </div>
            </Modal>
        </>
    );
};

CreateReactScript((el, properties) => {
    createRoot(el).render(
        <BaseAdminto {...properties} title="Anuncios">
            <Ads {...properties} />
        </BaseAdminto>
    );
});
