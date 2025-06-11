import BaseAdminto from "@Adminto/Base";
import SwitchFormGroup from "@Adminto/form/SwitchFormGroup";
import TextareaFormGroup from "@Adminto/form/TextareaFormGroup";
import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import Swal from "sweetalert2";
import PaymentMethodsRest from "../Actions/Admin/PaymentMethodsRest";
import Modal from "../Components/Adminto/Modal";
import Table from "../Components/Adminto/Table";
import ImageFormGroup from "../Components/Adminto/form/ImageFormGroup";
import InputFormGroup from "../Components/Adminto/form/InputFormGroup";
import SelectFormGroup from "../Components/Adminto/form/SelectFormGroup";
import DxButton from "../Components/dx/DxButton";
import CreateReactScript from "../Utils/CreateReactScript";
import Number2Currency from "../Utils/Number2Currency";
import ReactAppend from "../Utils/ReactAppend";

const paymentMethodsRest = new PaymentMethodsRest();

const PaymentMethodsAdmin = () => {
    const gridRef = useRef();
    const modalRef = useRef();

    // Form refs
    const idRef = useRef();
    const nameRef = useRef();
    const displayNameRef = useRef();
    const descriptionRef = useRef();
    const typeRef = useRef();
    const isActiveRef = useRef();
    const requiresProofRef = useRef();
    const feePercentageRef = useRef();
    const feeFixedRef = useRef();
    const iconRef = useRef();
    const sortOrderRef = useRef();

    // Configuration refs
    const configurationRef = useRef({});    const [isEditing, setIsEditing] = useState(false);
    const [templates, setTemplates] = useState({});
    const [currentType, setCurrentType] = useState('gateway');
    const [currentTemplateKey, setCurrentTemplateKey] = useState('');
    const [paymentMethodData, setPaymentMethodData] = useState(null);

    useEffect(() => {
        loadTemplates();
    }, []);

    const loadTemplates = async () => {
        try {
            const result = await paymentMethodsRest.getTemplates();
            if (result.status) {
                setTemplates(result.templates);
            }
        } catch (error) {
            console.error('Error loading templates:', error);
        }
    };    const onModalOpen = async (data) => {
        console.log('🚀 Opening modal with data:', data);
        
        setPaymentMethodData(data || null);
        setIsEditing(!!data?.id);

        // Ensure templates are loaded before proceeding
        let availableTemplates = templates;
        let templatesUpdated = false;
        
        if (!availableTemplates || Object.keys(availableTemplates).length === 0) {
            console.log('⏳ Templates not loaded, fetching directly...');
            try {
                const result = await paymentMethodsRest.getTemplates();
                if (result.status) {
                    availableTemplates = result.templates;
                    setTemplates(availableTemplates); // Update state for future use
                    templatesUpdated = true;
                    console.log('✅ Templates loaded directly:', Object.keys(availableTemplates));
                } else {
                    console.error('❌ Failed to load templates:', result);
                    availableTemplates = {};
                }
            } catch (error) {
                console.error('❌ Error loading templates:', error);
                availableTemplates = {};
            }
        }

        // Set template key and type based on data
        const templateKey = data?.template_key || '';
        let configData = data?.configuration || {};
        
        // Parse configuration if string
        if (typeof configData === 'string') {
            try {
                configData = JSON.parse(configData);
                console.log('✅ Parsed configuration JSON:', configData);
            } catch (e) {
                console.warn('⚠️ Could not parse configuration JSON:', configData);
                configData = {};
            }
        }

        console.log('📋 Template key:', templateKey);
        console.log('🔧 Configuration data:', configData);
        console.log('📊 Available templates:', Object.keys(availableTemplates));

        // Store configuration data in ref for later use
        configurationRef.current = configData;
        
        // Reset all basic form values immediately
        populateBasicFields(data);
        
        // Set type and template key BEFORE showing modal to trigger field generation
        if (data?.type) {
            setCurrentType(data.type);
        }
        if (templateKey) {
            setCurrentTemplateKey(templateKey);
        }
        
        // Show modal
        $(modalRef.current).modal("show");
        
        // Wait for modal animation and React state updates to complete
        const waitTime = templatesUpdated ? 800 : 500; // More time if templates were just loaded
        setTimeout(async () => {
            console.log('🔄 Setting up dynamic fields...');
            
            // Update type dropdown
            if (typeRef.current) {
                $(typeRef.current).val(data?.type || "gateway").trigger("change");
            }
            
            // Wait for React state updates and field generation
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // Now populate configuration fields if we have data
            if (templateKey && availableTemplates[templateKey] && Object.keys(configData).length > 0) {
                console.log('🎯 Populating configuration fields...');
                await populateConfigurationFieldsRobust(templateKey, configData, availableTemplates);
            } else {
                console.log('ℹ️ No configuration data to populate or template not found');
                console.log('📋 Debug info:', {
                    templateKey,
                    hasTemplate: !!availableTemplates[templateKey],
                    configDataKeys: Object.keys(configData),
                    availableTemplateKeys: Object.keys(availableTemplates)
                });
            }
            
            // Set up instructions preview
            updateInstructionsPreview(templateKey, availableTemplates);
            
        }, waitTime);
    };

    // Separate function for basic field population
    const populateBasicFields = (data) => {
        console.log('📝 Populating basic fields...');
        
        if (idRef.current) idRef.current.value = data?.id || "";
        if (nameRef.current) nameRef.current.value = data?.name || "";
        if (displayNameRef.current) displayNameRef.current.value = data?.display_name || "";
        if (descriptionRef.current) descriptionRef.current.value = data?.description || "";

        if (isActiveRef.current) isActiveRef.current.checked = data?.is_active ?? true;
        if (requiresProofRef.current) requiresProofRef.current.checked = data?.requires_proof ?? false;
        if (feePercentageRef.current) feePercentageRef.current.value = data?.fee_percentage || 0;
        if (feeFixedRef.current) feeFixedRef.current.value = data?.fee_fixed || 0;
        if (sortOrderRef.current) sortOrderRef.current.value = data?.sort_order || 0;

        // Handle icon
        if (iconRef.current) {
            iconRef.current.value = null;
            if (iconRef.image) {
                iconRef.image.src = data?.icon ? `/storage/payment_icons/${data.icon}` : "/storage/images/item/undefined";
            }
        }
    };    // Separate function for instructions preview
    const updateInstructionsPreview = (templateKey, availableTemplates = templates) => {
        setTimeout(() => {
            const previewContainer = document.getElementById('instructions-preview-container');
            if (previewContainer) {
                const template = availableTemplates[templateKey];
                if (template && template.instructions) {
                    previewContainer.style.display = 'block';
                } else {
                    previewContainer.style.display = 'none';
                }
            }
        }, 200);
    };// More robust configuration field population
    const populateConfigurationFieldsRobust = async (templateKey, configData, availableTemplates = templates) => {
        const template = availableTemplates[templateKey];
        if (!template || !template.config) {
            console.warn('❌ Template or config not found for templateKey:', templateKey);
            console.warn('📋 Available templates:', Object.keys(availableTemplates));
            return;
        }

        console.log('🔧 Starting robust config field population for template:', templateKey);
        console.log('📊 Config data to populate:', configData);
        console.log('🏗️ Template structure:', template.config);

        return new Promise((resolve) => {
            const attemptPopulation = (attempt = 1) => {
                const maxAttempts = 25; // Increased attempts
                
                console.log(`🔍 Population attempt ${attempt}/${maxAttempts}`);
                
                // Check if all required DOM elements exist
                const configFieldKeys = Object.keys(template.config);
                const missingFields = [];
                const availableFields = [];
                
                configFieldKeys.forEach(fieldKey => {
                    const element = document.getElementById(`config_${fieldKey}`);
                    if (!element) {
                        missingFields.push(fieldKey);
                    } else {
                        availableFields.push(fieldKey);
                    }
                });
                
                console.log(`✅ Available fields (${availableFields.length}):`, availableFields);
                console.log(`❌ Missing fields (${missingFields.length}):`, missingFields);
                
                if (missingFields.length === 0) {
                    // All fields found, populate them
                    console.log('🎯 All fields found! Populating values...');
                    populateConfigFields(template, configData);
                    resolve(true);
                    return;
                }
                
                if (attempt < maxAttempts) {
                    console.log(`⏳ Waiting 300ms before retry...`);
                    setTimeout(() => attemptPopulation(attempt + 1), 300);
                } else {
                    console.warn('🚨 Max attempts reached. Populating available fields only.');
                    populateConfigFields(template, configData);
                    resolve(false);
                }
            };
            
            // Start the population process
            setTimeout(() => attemptPopulation(), 100);
        });
    };

    // Actual field population logic
    const populateConfigFields = (template, configData) => {
        console.log('� Populating configuration fields with data:', configData);
        
        Object.keys(template.config).forEach(fieldKey => {
            const element = document.getElementById(`config_${fieldKey}`);
            const fieldConfig = template.config[fieldKey];
            const value = configData[fieldKey] || fieldConfig.default || '';
            
            if (!element) {
                console.warn(`⚠️ Element config_${fieldKey} not found during population`);
                return;
            }
            
            console.log(`📝 Setting field ${fieldKey} =`, value);
            
            if (element.type === 'checkbox') {
                element.checked = !!value;
            } else if (element.type === 'file') {
                populateFileField(element, fieldKey, value, fieldConfig);
            } else {
                element.value = value;
            }
        });
        
        console.log('✅ Configuration field population completed');
    };

    // Handle file field population (including ImageFormGroup)
    const populateFileField = (element, fieldKey, value, fieldConfig) => {
        // Check if this is within an ImageFormGroup wrapper
        const imageFormGroupWrapper = element.closest('[data-image-form-group]');
        
        if (imageFormGroupWrapper && fieldConfig.accept && fieldConfig.accept.includes('image')) {
            console.log(`🖼️ Populating ImageFormGroup for ${fieldKey} with value:`, value);
            
            // Find the preview image in the ImageFormGroup
            const previewImage = imageFormGroupWrapper.querySelector('img');
            
            if (value && value !== '') {
                // Set the preview image
                if (previewImage) {
                    previewImage.src = `/storage/payment_config/${value}`;
                    previewImage.style.display = 'block';
                    console.log(`✅ Image preview set for ${fieldKey}:`, `/storage/payment_config/${value}`);
                }
                
                // Add file info
                let fileInfoElement = imageFormGroupWrapper.querySelector('.config-file-info');
                if (!fileInfoElement) {
                    fileInfoElement = document.createElement('div');
                    fileInfoElement.className = 'config-file-info mt-2';
                    imageFormGroupWrapper.appendChild(fileInfoElement);
                }
                fileInfoElement.innerHTML = `<small class="text-success"><i class="mdi mdi-check-circle"></i> Archivo actual: <strong>${value}</strong></small>`;
            } else {
                // No file - set placeholder image
                if (previewImage) {
                    previewImage.src = '/api/cover/thumbnail/null';
                    previewImage.style.display = 'block';
                }
                
                // Remove file info if exists
                const fileInfoElement = imageFormGroupWrapper.querySelector('.config-file-info');
                if (fileInfoElement) {
                    fileInfoElement.remove();
                }
            }
        } else {
            // Handle regular file inputs (non-ImageFormGroup)
            console.log(`📎 Populating regular file field ${fieldKey} with value:`, value);
            
            let fileInfoElement = document.getElementById(`config_${fieldKey}_info`);
            if (!fileInfoElement) {
                fileInfoElement = document.createElement('div');
                fileInfoElement.id = `config_${fieldKey}_info`;
                fileInfoElement.className = 'mt-2';
                element.parentNode.appendChild(fileInfoElement);
            }
            
            if (value && value !== '') {
                fileInfoElement.innerHTML = `<small class="text-success"><i class="mdi mdi-check-circle"></i> Archivo actual: <strong>${value}</strong></small>`;
            } else {
                fileInfoElement.innerHTML = '<small class="text-muted">No hay archivo subido</small>';
            }
        }
    };

    const onModalSubmit = async (e) => {
        e.preventDefault();

        const formData = new FormData();
        // Basic fields
        if (isEditing && idRef.current) formData.append("id", idRef.current.value);
        if (nameRef.current) formData.append("name", nameRef.current.value);
        if (displayNameRef.current) formData.append("display_name", displayNameRef.current.value);
        if (descriptionRef.current) formData.append("description", descriptionRef.current.value);
        if (typeRef.current) formData.append("type", typeRef.current.value);
        if (isActiveRef.current) formData.append("is_active", isActiveRef.current.checked ? 1 : 0);
        if (requiresProofRef.current) formData.append("requires_proof", requiresProofRef.current.checked ? 1 : 0);
        if (feePercentageRef.current) formData.append("fee_percentage", feePercentageRef.current.value);
        if (feeFixedRef.current) formData.append("fee_fixed", feeFixedRef.current.value);
        if (sortOrderRef.current) formData.append("sort_order", sortOrderRef.current.value);

        // Icon file
        if (iconRef.current && iconRef.current.files[0]) {
            formData.append("icon", iconRef.current.files[0]);
        }        // Configuration - usar currentTemplateKey en lugar de currentType
        const configuration = {};
        const configFiles = {};
        const template = templates[currentTemplateKey];
        if (template && template.config) {
            Object.keys(template.config).forEach(fieldKey => {
                const element = document.getElementById(`config_${fieldKey}`);
                if (element) {
                    if (element.type === 'checkbox') {
                        configuration[fieldKey] = element.checked;
                    } else if (element.type === 'file' && element.files[0]) {
                        // Store file for separate handling
                        configFiles[fieldKey] = element.files[0];
                        configuration[fieldKey] = element.files[0].name;
                    } else {
                        configuration[fieldKey] = element.value;
                    }
                }
            });
        }
        
        // También guardar el template key seleccionado
        formData.append("template_key", currentTemplateKey);

        formData.append("configuration", JSON.stringify(configuration));

        // Add config files to form data
        Object.keys(configFiles).forEach(fieldKey => {
            formData.append(`config_files[${fieldKey}]`, configFiles[fieldKey]);
        });

        // Instructions (use template default)
        const instructions = template?.instructions || {};
        formData.append("instructions", JSON.stringify(instructions));

        try {
            const response = isEditing
                ? await paymentMethodsRest.update(formData)
                : await paymentMethodsRest.store(formData);
            if (response) {
                if (modalRef.current) {
                    $(modalRef.current).modal("hide");
                }
                if (gridRef.current) {
                    $(gridRef.current).dxDataGrid("instance").refresh();
                }

                Swal.fire({
                    title: "¡Éxito!",
                    text: `Método de pago ${isEditing ? 'actualizado' : 'creado'} correctamente`,
                    icon: "success"
                });
            }
        } catch (error) {
            Swal.fire({
                title: "Error",
                text: error.message || "Error guardando método de pago",
                icon: "error"
            });
        }
    }; const onToggleStatus = async ({ id, value }) => {
        try {
            await paymentMethodsRest.toggleStatus(id);
            if (gridRef.current) {
                $(gridRef.current).dxDataGrid("instance").refresh();
            }
        } catch (error) {
            Swal.fire({
                title: "Error",
                text: error.message || "Error cambiando estado",
                icon: "error"
            });
        }
    };

    const onDelete = async (id) => {
        const result = await Swal.fire({
            title: "¿Estás seguro?",
            text: "Esta acción no se puede deshacer",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Sí, eliminar",
            cancelButtonText: "Cancelar"
        });

        if (result.isConfirmed) {
            try {
                await paymentMethodsRest.destroy(id);
                if (gridRef.current) {
                    $(gridRef.current).dxDataGrid("instance").refresh();
                }

                Swal.fire({
                    title: "¡Eliminado!",
                    text: "Método de pago eliminado correctamente",
                    icon: "success"
                });
            } catch (error) {
                Swal.fire({
                    title: "Error",
                    text: error.message || "Error eliminando método de pago",
                    icon: "error"
                });
            }
        }
    };    const handleTypeChange = (e) => {
        const newType = e.target.value;
        setCurrentType(newType);
        
        // Find the first template that matches this type and select it
        const matchingTemplate = Object.keys(templates).find(key => 
            templates[key].type === newType
        );
        
        if (matchingTemplate) {
            setCurrentTemplateKey(matchingTemplate);
            configurationRef.current = {};
            updateConfigurationFields(matchingTemplate, {});
            
            // Force re-render to show instructions preview
            setTimeout(() => {
                const previewContainer = document.getElementById('instructions-preview-container');
                if (previewContainer) {
                    const template = templates[matchingTemplate];
                    if (template && template.instructions) {
                        previewContainer.style.display = 'block';
                    } else {
                        previewContainer.style.display = 'none';
                    }
                }
            }, 100);
        }
    };const renderConfigurationFields = () => {
        const template = templates[currentTemplateKey];
        if (!template || !template.config) {
            if (!currentTemplateKey) {
                return (
                    <div className="alert alert-warning mt-4 mb-0">
                        <i className="mdi mdi-information"></i> Seleccione un método de pago específico para ver sus campos de configuración.
                    </div>
                );
            }
            return null;
        }

        return (
            <>
                <div className="row">
                    <div className="col-12">
                        <h5 className="mb-3">Configuración específica</h5>
                    </div>
                    {Object.entries(template.config).map(([fieldKey, fieldConfig]) => (
                        <div key={fieldKey} className="col-md-6 mb-3">
                            <label className="form-label">
                                {fieldConfig.label}
                                {fieldConfig.required && <span className="text-danger">*</span>}
                            </label>
                            {renderConfigField(fieldKey, fieldConfig)}
                        </div>
                    ))}
                </div>                {template.instructions && (
                    <div className="row mt-4" id="instructions-preview-container">
                        <div className="col-12">
                            <div className="card border-info">
                                <div className="card-header bg-light">
                                    <h6 className="mb-0 text-info">
                                        <i className="mdi mdi-information-outline me-2"></i>
                                        Vista previa de instrucciones para el usuario
                                    </h6>
                                    <small className="text-muted">
                                        Estas son las instrucciones que verán los usuarios al seleccionar este método de pago
                                    </small>
                                </div>
                                <div className="card-body bg-light">
                                    {renderInstructionsPreview(template.instructions)}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </>
        );
    };const renderInstructionsPreview = (instructions) => {
        return (
            <div className="instructions-preview">
                {instructions.title && (
                    <div className="mb-3">
                        <h6 className="text-primary mb-2">
                            <i className="mdi mdi-format-title me-1"></i>
                            {instructions.title}
                        </h6>
                    </div>
                )}

                {instructions.bank_info && (
                    <div className="mb-3">
                        <strong className="text-success">
                            <i className="mdi mdi-bank me-1"></i>
                            Datos bancarios:
                        </strong>
                        <div className="bg-white p-2 rounded border mt-2">
                            <ul className="list-unstyled mb-0">
                                {instructions.bank_info.map((info, index) => (
                                    <li key={index} className="mb-1" dangerouslySetInnerHTML={{ __html: info }} />
                                ))}
                            </ul>
                        </div>
                    </div>
                )}

                {instructions.contact_info && (
                    <div className="mb-3">
                        <strong className="text-info">
                            <i className="mdi mdi-phone me-1"></i>
                            Información de contacto:
                        </strong>
                        <div className="bg-white p-2 rounded border mt-2">
                            <ul className="list-unstyled mb-0">
                                {instructions.contact_info.map((info, index) => (
                                    <li key={index} className="mb-1" dangerouslySetInnerHTML={{ __html: info }} />
                                ))}
                            </ul>
                        </div>
                    </div>
                )}

                {instructions.account_info && (
                    <div className="mb-3">
                        <strong className="text-warning">
                            <i className="mdi mdi-account me-1"></i>
                            Datos de la cuenta:
                        </strong>
                        <div className="bg-white p-2 rounded border mt-2">
                            <ul className="list-unstyled mb-0">
                                {instructions.account_info.map((info, index) => (
                                    <li key={index} className="mb-1" dangerouslySetInnerHTML={{ __html: info }} />
                                ))}
                            </ul>
                        </div>
                    </div>
                )}

                {instructions.steps && (
                    <div className="mb-3">
                        <strong className="text-primary">
                            <i className="mdi mdi-format-list-numbered me-1"></i>
                            Pasos a seguir:
                        </strong>
                        <div className="bg-white p-2 rounded border mt-2">
                            <ol className="mb-0">
                                {instructions.steps.map((step, index) => (
                                    <li key={index} className="mb-2" dangerouslySetInnerHTML={{ __html: step }} />
                                ))}
                            </ol>
                        </div>
                    </div>
                )}

                {instructions.qr_display && (
                    <div className="mb-3">
                        <div className="alert alert-info border-0">
                            <i className="mdi mdi-qrcode me-2 fs-5"></i>
                            <strong>Código QR:</strong> Se mostrará el código QR que subas en el campo correspondiente.
                            <br />
                            <small className="text-muted">
                                Los usuarios podrán escanear el código para realizar el pago directamente.
                            </small>
                        </div>
                    </div>
                )}

                {instructions.show_phone && (
                    <div className="mb-3">
                        <div className="alert alert-info border-0">
                            <i className="mdi mdi-cellphone me-2 fs-5"></i>
                            <strong>Número de teléfono:</strong> Se mostrará el número configurado para búsqueda manual.
                            <br />
                            <small className="text-muted">
                                Útil como alternativa al QR para usuarios que prefieren buscar manualmente.
                            </small>
                        </div>
                    </div>
                )}

                {instructions.show_cci && (
                    <div className="mb-3">
                        <div className="alert alert-success border-0">
                            <i className="mdi mdi-bank-transfer me-2 fs-5"></i>
                            <strong>CCI:</strong> Se mostrará el código de cuenta interbancario configurado.
                            <br />
                            <small className="text-muted">
                                Para transferencias entre diferentes bancos.
                            </small>
                        </div>
                    </div>
                )}

                {instructions.note && (
                    <div className="alert alert-warning border-0">
                        <i className="mdi mdi-alert-circle-outline me-2 fs-5"></i>
                        <strong>Nota importante:</strong> {instructions.note}
                    </div>
                )}

                <div className="mt-3 pt-2 border-top">
                    <small className="text-muted">
                        <i className="mdi mdi-information me-1"></i>
                        Estas instrucciones se generan automáticamente según el tipo de método de pago seleccionado.
                        Los datos específicos (QR, CCI, teléfono) se mostrarán según la configuración que hagas arriba.
                    </small>
                </div>
            </div>
        );
    };

    const renderConfigField = (fieldKey, fieldConfig) => {
        const fieldId = `config_${fieldKey}`;

        switch (fieldConfig.type) {
            case 'text':
            case 'tel':
            case 'url':
                return (
                    <input
                        type={fieldConfig.type}
                        id={fieldId}
                        className="form-control"
                        placeholder={fieldConfig.placeholder}
                        required={fieldConfig.required}
                    />
                );

            case 'password':
                return (
                    <input
                        type="password"
                        id={fieldId}
                        className="form-control"
                        placeholder={fieldConfig.placeholder}
                        required={fieldConfig.required}
                    />
                );

            case 'select':
                return (
                    <select
                        id={fieldId}
                        className="form-control"
                        required={fieldConfig.required}
                    >
                        <option value="">Seleccionar...</option>
                        {Object.entries(fieldConfig.options || {}).map(([optValue, optLabel]) => (
                            <option key={optValue} value={optValue}>{optLabel}</option>
                        ))}
                    </select>
                );

            case 'boolean':
                return (
                    <div className="form-check">
                        <input
                            type="checkbox"
                            id={fieldId}
                            className="form-check-input"
                        />
                        <label className="form-check-label" htmlFor={fieldId}>
                            {fieldConfig.label}
                        </label>
                    </div>
                );
            case 'file':                // Usa SIEMPRE ImageFormGroup para imágenes/QR
                if (fieldConfig.accept && fieldConfig.accept.includes('image')) {
                    return (
                        <div data-image-form-group={fieldId}>
                            <ImageFormGroup
                                eRef={null}
                                id={fieldId}
                                label={fieldConfig.label || fieldKey}
                                accept={fieldConfig.accept}
                                required={fieldConfig.required}
                                help={fieldConfig.help}
                            />
                        </div>
                    );
                } else {
                    // Otros archivos
                    return (
                        <div>
                            <input
                                type="file"
                                id={fieldId}
                                className="form-control"
                                accept={fieldConfig.accept}
                                required={fieldConfig.required}
                            />
                            <div id={`${fieldId}_info`} className="mt-1"></div>
                            {fieldConfig.help && (
                                <small className="form-text text-muted">{fieldConfig.help}</small>
                            )}
                        </div>
                    );
                }
            case 'textarea':
                return (
                    <textarea
                        id={fieldId}
                        className="form-control"
                        rows="3"
                        placeholder={fieldConfig.placeholder}
                        required={fieldConfig.required}
                    />
                );

            default:
                return (
                    <input
                        type="text"
                        id={fieldId}
                        className="form-control"
                        placeholder={fieldConfig.placeholder}
                        required={fieldConfig.required}
                    />
                );
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'gateway': return 'mdi mdi-credit-card';
            case 'qr': return 'mdi mdi-qrcode';
            case 'manual': return 'mdi mdi-bank';
            default: return 'mdi mdi-credit-card';
        }
    };

    const getTypeBadge = (type) => {
        switch (type) {
            case 'gateway': return '<span class="badge bg-primary">Gateway</span>';
            case 'qr': return '<span class="badge bg-info">QR/Móvil</span>';
            case 'manual': return '<span class="badge bg-success">Manual</span>';
            default: return '<span class="badge bg-secondary">Otro</span>';
        }
    };

    return (
        <>            <Table
            gridRef={gridRef}
            title="Métodos de Pago"
            rest={paymentMethodsRest}
            toolBar={(container) => {
                container.unshift({
                    widget: "dxButton",
                    location: "after",
                    options: {
                        icon: "refresh",
                        hint: "Refrescar tabla",
                        onClick: () => {
                            if (gridRef.current) {
                                $(gridRef.current).dxDataGrid("instance").refresh();
                            }
                        },
                    },
                });
                container.unshift({
                    widget: "dxButton",
                    location: "after",
                    options: {
                        icon: "plus",
                        text: "Agregar Método",
                        hint: "Agregar Método de Pago",
                        onClick: () => onModalOpen(),
                    },
                });
            }}
            exportable={true}
            exportableName="MetodosPago"
            columns={[
                {
                    dataField: "id",
                    caption: "ID",
                    visible: false,
                },
                {
                    dataField: "icon",
                    caption: "Icono",
                    width: "60px",
                    cellTemplate: (container, { data }) => {
                        const iconSrc = data.icon
                            ? `/storage/payment_icons/${data.icon}`
                            : null;

                        container.html(
                            renderToString(
                                <div className="text-center">
                                    {iconSrc ? (
                                        <img
                                            src={iconSrc}
                                            alt={data.name}
                                            style={{ width: "32px", height: "32px", objectFit: "contain" }}
                                        />
                                    ) : (
                                        <i className={`${getTypeIcon(data.type)} fs-4`}></i>
                                    )}
                                </div>
                            )
                        );
                    },
                },
                {
                    dataField: "display_name",
                    caption: "Método",
                    cellTemplate: (container, { data }) => {
                        container.html(
                            renderToString(
                                <>
                                    <b>{data.display_name}</b>
                                    <br />
                                    <small className="text-muted">
                                        {data.description}
                                    </small>
                                </>
                            )
                        );
                    },
                },
                {
                    dataField: "type",
                    caption: "Tipo",
                    width: "100px",
                    cellTemplate: (container, { data }) => {
                        container.html(getTypeBadge(data.type));
                    },
                },
                {
                    dataField: "fee_percentage",
                    caption: "Comisión",
                    width: "120px",
                    cellTemplate: (container, { data }) => {
                        container.html(
                            renderToString(
                                <>
                                    {data.fee_percentage > 0 && (
                                        <div>{data.fee_percentage}%</div>
                                    )}
                                    {data.fee_fixed > 0 && (
                                        <div>S/ {Number2Currency(data.fee_fixed)}</div>
                                    )}
                                    {data.fee_percentage == 0 && data.fee_fixed == 0 && (
                                        <span className="text-success">Gratis</span>
                                    )}
                                </>
                            )
                        );
                    },
                },
                {
                    dataField: "requires_proof",
                    caption: "Comprobante",
                    width: "100px",
                    cellTemplate: (container, { data }) => {
                        container.html(
                            data.requires_proof
                                ? '<span class="badge bg-warning">Requerido</span>'
                                : '<span class="badge bg-light text-muted">No</span>'
                        );
                    },
                },
                {
                    dataField: "is_active",
                    caption: "Estado",
                    dataType: "boolean",
                    width: "80px", cellTemplate: (container, { data }) => {
                        ReactAppend(
                            container,
                            <SwitchFormGroup
                                checked={data.is_active}
                                onChange={(e) =>
                                    onToggleStatus({ id: data.id, value: e.target.checked })
                                }
                            />
                        );
                    },
                },
                {
                    dataField: "sort_order",
                    caption: "Orden",
                    width: "70px",
                }, {
                    caption: "Acciones",
                    width: "120px",
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
                                onClick: () => onDelete(data.id),
                            })
                        );
                    },
                },
            ]}
        />            
        
        <Modal
            modalRef={modalRef}
            title={isEditing ? "Editar Método de Pago" : "Nuevo Método de Pago"}
            onSubmit={onModalSubmit}
            size="lg"
            id="modalForm"
        >
                <input ref={idRef} type="hidden" />
                <div className="row">
                    <div className="col-md-6">
                        <InputFormGroup
                            eRef={nameRef}
                            label="Nombre interno"
                            placeholder="Ej: Yape"
                            required
                        />
                    </div>
                    <div className="col-md-6">
                        <InputFormGroup
                            eRef={displayNameRef}
                            label="Nombre para usuario"
                            placeholder="Ej: Pago con Yape"
                            required
                        />
                    </div>
                </div>                <TextareaFormGroup
                    eRef={descriptionRef}
                    label="Descripción"
                    placeholder="Descripción del método de pago"
                    rows={3}
                />                <div className="row">
                    <div className="col-md-4">                        <SelectFormGroup
                            eRef={typeRef}
                            label="Tipo de método"
                            required
                            onChange={handleTypeChange}
                            dropdownParent="#modalForm"
                        >
                            <option value="">Seleccionar tipo...</option>
                            {templates && [...new Set(Object.values(templates).map(t => t.type))].map(type => {
                                const typeNames = {
                                    'gateway': 'Gateway (Online)',
                                    'qr': 'QR/Móvil', 
                                    'manual': 'Manual'
                                };
                                return (
                                    <option key={type} value={type}>
                                        {typeNames[type] || type.charAt(0).toUpperCase() + type.slice(1)}
                                    </option>
                                );
                            })}
                        </SelectFormGroup>
                    </div>
                    <div className="col-md-4">
                        <div className="mb-3">
                            <label className="form-label">
                                Método de pago específico
                                <span className="text-danger">*</span>
                            </label>                            <select
                                className="form-select"
                                value={currentTemplateKey}                                onChange={(e) => {
                                    const newTemplateKey = e.target.value;
                                    setCurrentTemplateKey(newTemplateKey);
                                    
                                    console.log('Template changed to:', newTemplateKey);
                                    
                                    if (newTemplateKey && templates[newTemplateKey]) {
                                        // Auto-update type based on template
                                        const templateType = templates[newTemplateKey].type;
                                        setCurrentType(templateType);
                                        
                                        if (typeRef.current) {
                                            $(typeRef.current).val(templateType).trigger("change");
                                        }
                                        
                                        // When changing template, use stored config if we're editing and the template matches
                                        // the original template, otherwise clear config
                                        let configToUse = {};
                                        
                                        if (isEditing && paymentMethodData?.template_key === newTemplateKey) {
                                            // We're editing and selected the original template, use saved config
                                            configToUse = paymentMethodData?.configuration || {};
                                            console.log('Using original saved config for template:', newTemplateKey, configToUse);
                                        } else if (isEditing && paymentMethodData?.template_key !== newTemplateKey) {
                                            // We're editing but changed to a different template, clear config
                                            configToUse = {};
                                            console.log('Template changed during edit, clearing config');
                                        } else {
                                            // We're creating new, use empty config
                                            configToUse = {};
                                            console.log('New payment method, using empty config');
                                        }
                                        
                                        configurationRef.current = configToUse;                                        // Update configuration fields
                                        setTimeout(() => {
                                            populateConfigurationFieldsRobust(newTemplateKey, configToUse, templates);
                                        }, 100);
                                    } else {
                                        // Clear configuration when no template selected
                                        configurationRef.current = {};
                                    }
                                }}
                                required
                            ><option value="">Seleccionar método...</option>
                                {templates && Object.entries(templates).map(([key, template]) => {
                                    // Define friendly names for templates
                                    const templateNames = {
                                        'yape': 'Yape',
                                        'plin': 'Plin',
                                        'culqi': 'Culqi',
                                        'mercadopago': 'MercadoPago',
                                        'transferencia_bancaria': 'Transferencia Bancaria',
                                        'efectivo': 'Pago en Efectivo',
                                        'agente_bancario': 'Agente Bancario'
                                    };
                                    
                                    const displayName = templateNames[key] || template.name || key.charAt(0).toUpperCase() + key.slice(1);
                                    
                                    return (
                                        <option key={key} value={key}>
                                            {displayName}
                                        </option>
                                    );
                                })}
                            </select>
                            <small className="form-text text-muted">
                                Seleccione el método específico para mostrar sus campos de configuración
                            </small>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <InputFormGroup
                            eRef={feePercentageRef}
                            label="Comisión (%)"
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            defaultValue="0"
                        />
                    </div>
                    <div className="col-md-4">
                        <InputFormGroup
                            eRef={feeFixedRef}
                            label="Comisión fija (S/)"
                            type="number"
                            step="0.01"
                            min="0"
                            defaultValue="0"
                        />
                    </div>
                </div>

                <div className="row">                    <div className="col-md-4">
                    <ImageFormGroup
                        eRef={iconRef}
                        label="Icono"
                        accept="image/*"
                    />
                </div>
                    <div className="col-md-4">
                        <InputFormGroup
                            eRef={sortOrderRef}
                            label="Orden"
                            type="number"
                            min="0"
                            defaultValue="0"
                        />
                    </div>
                    <div className="col-md-4 d-flex flex-column justify-content-end">                        <div className="mb-3">
                        <SwitchFormGroup
                            eRef={isActiveRef}
                            label="Activo"
                            checked={true}
                        />
                    </div>
                        <div className="mb-3">
                            <SwitchFormGroup
                                eRef={requiresProofRef}
                                label="Requiere comprobante"
                                checked={false}
                            />
                        </div>
                    </div>
                </div>                <div id="dynamic-config-section">
                  {!templates || Object.keys(templates).length === 0 ? (
                        <div className="alert alert-info mt-4 mb-0">
                          <i className="mdi mdi-timer-sand"></i> Cargando configuración dinámica...
                        </div>
                      ) : (
                        renderConfigurationFields()
                      )}
                </div>
            </Modal>
        </>
    );
};

CreateReactScript((el, properties) => {
    createRoot(el).render(
        <BaseAdminto {...properties} title="Métodos de Pago">
            <PaymentMethodsAdmin {...properties} />
        </BaseAdminto>
    );
});

