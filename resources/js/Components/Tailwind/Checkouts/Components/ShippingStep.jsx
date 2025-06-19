import { useEffect, useState } from "react";
import Number2Currency from "../../../../Utils/Number2Currency";
import ubigeoData from "../../../../../../storage/app/utils/ubigeo.json";
import DeliveryPricesRest from "../../../../Actions/DeliveryPricesRest";
import { processCulqiPayment } from "../../../../Actions/culqiPayment";
import { processMercadoPagoPayment, processManualPayment } from "../../../../Actions/paymentMethods";
import paymentAPI from "../../../../Actions/paymentMethods";
import ButtonPrimary from "./ButtonPrimary";
import ButtonSecondary from "./ButtonSecondary";
import InputForm from "./InputForm";
import SelectForm from "./SelectForm";
import OptionCard from "./OptionCard";
import PaymentStepsModalFixed from "./PaymentStepsModalFixed";
import MercadoPagoCheckoutModal from "./MercadoPagoCheckoutModal";
import { InfoIcon, CreditCard, Smartphone, Building2, Upload, Check, User, Copy, QrCode, Clock, ChevronRight } from "lucide-react";
import { Notify } from "sode-extend-react";

export default function ShippingStep({
    cart,
    setSale,
    setCode,
    setDelivery,
    setCart,
    onContinue,
    noContinue,
    subTotal,
    igv,
    totalFinal,
    user,
    setEnvio,
    envio,
}) {
    const [formData, setFormData] = useState({
        name: user?.name || "",
        lastname: user?.lastname || "",
        email: user?.email || "",
        department: user?.department || "",
        province: user?.province || "",
        district: user?.district || "",
        address: user?.address || "",
        number: user?.number || "",
        comment: user?.comment || "",
        reference: user?.reference || "",
        shippingOption: "delivery", // Valor predeterminado
        paymentMethod: "culqi", // Nuevo campo para método de pago
    });

    // Estados para archivos de comprobante
    const [paymentProof, setPaymentProof] = useState(null);
    const [paymentProofPreview, setPaymentProofPreview] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    
    // Estado para métodos de pago dinámicos
    const [availablePaymentMethods, setAvailablePaymentMethods] = useState([]);
    const [loadingMethods, setLoadingMethods] = useState(true);

    // Estados para el modal de pasos de pago
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);

    // Estados para MercadoPago Checkout API
    const [mercadoPagoConfig, setMercadoPagoConfig] = useState(null);
    const [cardPayment, setCardPayment] = useState(null);
    const [mpInitialized, setMpInitialized] = useState(false);
    const [showMpModal, setShowMpModal] = useState(false);

    // DEBUG: Rastrear cambios en el estado del modal
    useEffect(() => {
        console.log('🔔 showMpModal cambió a:', showMpModal);
        if (showMpModal) {
            console.log('✅ Modal de MP debería estar ABIERTO');
        } else {
            console.log('❌ Modal de MP debería estar CERRADO');
        }
    }, [showMpModal]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    // Manejar selección de método de pago
    const handlePaymentMethodChange = (methodSlug) => {
        setFormData((prev) => ({ ...prev, paymentMethod: methodSlug }));
        
        // Encontrar el método seleccionado para determinar si requiere comprobante
        const selectedMethod = availablePaymentMethods.find(method => method.slug === methodSlug);
        
        // Limpiar archivo si cambia a método que no requiere comprobante
        if (selectedMethod && !selectedMethod.requires_proof) {
            setPaymentProof(null);
            setPaymentProofPreview(null);
        }
    };

    // Función para obtener datos del checkout
    const getCheckoutData = () => {
        return {
            user_id: user?.id || "",
            name: formData?.name || "",
            lastname: formData?.lastname || "",
            fullname: `${formData?.name} ${formData?.lastname}`,
            email: formData?.email || "",
            phone: formData?.phone || "",
            country: "Perú",
            department: departamento || "",
            province: provincia || "",
            district: distrito || "",
            ubigeo: null,
            address: formData?.address || "",
            number: formData?.number || "",
            comment: formData?.comment || "",
            reference: formData?.reference || "",
            amount: totalFinal || 0,
            delivery: envio,
            cart: cart,
            payment_method: formData.paymentMethod,
            invoiceType: formData.invoiceType,
            documentType: formData.documentType,
            document: formData.document,
            businessName: formData.businessName,
        };
    };

    // Abrir modal de pasos de pago
    const handleOpenPaymentModal = () => {
        const selectedMethod = availablePaymentMethods.find(method => method.slug === formData.paymentMethod);
        if (selectedMethod) {
            setSelectedPaymentMethod(selectedMethod);
            setShowPaymentModal(true);
        }
    };

    // Procesar pago con MercadoPago Checkout API
    const processMercadoPagoCheckoutApi = async (baseRequest) => {
        try {
            if (!mpInitialized || !mercadoPagoConfig) {
                throw new Error('MercadoPago no está disponible. Verifica tu conexión.');
            }

            console.log('💳 Iniciando proceso de pago con MercadoPago...');

            // Primero creamos el pedido en nuestro backend
            const response = await paymentAPI.processPayment(baseRequest);
            
            if (!response || !response.status) {
                throw new Error(response?.message || 'Error al crear el pedido');
            }

            console.log('✅ Pedido creado:', response.code);

            // Crear datos de preferencia para MercadoPago
            const preferenceData = {
                items: [
                    {
                        title: `Pedido BananaLab #${response.code}`,
                        description: `Compra en BananaLab - ${cart.length} item(s)`,
                        unit_price: parseFloat(baseRequest.amount),
                        quantity: 1,
                        currency_id: 'PEN'
                    }
                ],
                external_reference: response.code,
                back_urls: {
                    success: `${window.location.origin}/checkout/success?order=${response.code}`,
                    failure: `${window.location.origin}/checkout/failure?order=${response.code}`,
                    pending: `${window.location.origin}/checkout/pending?order=${response.code}`
                },
                auto_return: 'approved',
                notification_url: `${window.location.origin}/api/payments/mercadopago/webhook`,
                statement_descriptor: 'BANANALAB',
                payment_methods: {
                    installments: 12,
                    default_installments: 1
                },
                payer: {
                    name: baseRequest.name,
                    surname: baseRequest.lastname,
                    email: baseRequest.email,
                    phone: {
                        area_code: '51',
                        number: baseRequest.phone || ''
                    }
                }
            };

            console.log('📋 Creando preferencia de pago...');

            // Usar nuestro backend para crear la preferencia
            const preferenceResponse = await fetch('/api/payments/mercadopago/create-preference', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
                },
                body: JSON.stringify({
                    preference_data: preferenceData,
                    order_code: response.code
                })
            });

            const preferenceResult = await preferenceResponse.json();

            if (preferenceResult.status && preferenceResult.init_point) {
                console.log('✅ Preferencia creada, redirigiendo...');
                
                // Redirigir al checkout de MercadoPago
                window.location.href = preferenceResult.init_point;
                
                // Retornar la respuesta para que el componente maneje el éxito
                return response;
            } else {
                throw new Error(preferenceResult.message || 'No se pudo crear la preferencia de pago');
            }

        } catch (error) {
            console.error('❌ Error en MercadoPago:', error);
            
            // Si hay un error, mostrar un mensaje más amigable
            let errorMessage = 'Error procesando el pago con MercadoPago';
            
            if (error.message.includes('public_key') || error.message.includes('configurado')) {
                errorMessage = 'MercadoPago no está configurado correctamente';
            } else if (error.message.includes('network') || error.message.includes('fetch')) {
                errorMessage = 'Error de conexión. Verifica tu internet e intenta nuevamente';
            } else if (error.message.includes('preferencia')) {
                errorMessage = 'Error creando la preferencia de pago';
            }
            
            throw new Error(errorMessage);
        }
    };

    // Manejar éxito de pago desde el modal de MercadoPago
    const handleMercadoPagoSuccess = (result) => {
        setShowMpModal(false);
        
        if (result && result.status) {
            setSale(result.sale);
            setCode(result.code);
            setCart([]);
            
            Notify.add({
                icon: "/assets/img/icon.svg",
                title: "¡Pago exitoso!",
                body: "Tu pago con tarjeta ha sido procesado correctamente",
                type: "success",
            });
            
            onContinue();
        }
        
        if (window.mercadoPagoPaymentResolver) {
            window.mercadoPagoPaymentResolver.resolve(result);
            window.mercadoPagoPaymentResolver = null;
        }
    };

    // Manejar cierre del modal de MercadoPago
    const handleMercadoPagoClose = () => {
        console.log('🔴 handleMercadoPagoClose ejecutado');
        setShowMpModal(false);
        
        if (window.mercadoPagoPaymentResolver) {
            window.mercadoPagoPaymentResolver.reject(new Error('Pago cancelado por el usuario'));
            window.mercadoPagoPaymentResolver = null;
        }
    };

    // Manejar pago exitoso desde el modal
    const handlePaymentSuccess = async () => {
        const baseRequest = {
            user_id: user?.id || "",
            name: formData?.name || "",
            lastname: formData?.lastname || "",
            fullname: `${formData?.name} ${formData?.lastname}`,
            email: formData?.email || "",
            phone: formData?.phone || "",
            country: "Perú",
            department: departamento || "",
            province: provincia || "",
            district: distrito || "",
            ubigeo: null,
            address: formData?.address || "",
            number: formData?.number || "",
            comment: formData?.comment || "",
            reference: formData?.reference || "",
            amount: totalFinal || 0,
            delivery: envio,
            cart: cart,
            payment_method: formData.paymentMethod,
            invoiceType: formData.invoiceType,
            documentType: formData.documentType,
            document: formData.document,
            businessName: formData.businessName,
        };

        try {
            const selectedMethod = availablePaymentMethods.find(method => method.slug === formData.paymentMethod);
            
            if (!selectedMethod) {
                throw new Error('Método de pago no válido');
            }

            let response;

            // Usar la nueva API unificada para procesar pagos
            if (selectedMethod.type === 'gateway') {
                // Para gateways (Culqi, otros)
                if (selectedMethod.slug === 'culqi') {
                    if (!window.Culqi) {
                        throw new Error("Culqi aún no se ha cargado.");
                    }
                    response = await processCulqiPayment(baseRequest);
                } else if (selectedMethod.slug === 'mercadopago') {
                    // MercadoPago se maneja directamente en handlePayment
                    throw new Error('MercadoPago debe manejarse directamente');
                } else {
                    // Otros gateways usando la API unificada
                    response = await paymentAPI.processPayment(baseRequest);
                }
            } else {
                // Para métodos manuales o QR, usar la nueva API
                response = await paymentAPI.processPayment(baseRequest, paymentProof);
            }

            if (response && response.status) {
                setSale(response.sale);
                setCode(response.code);
                setCart([]);
                
                // Limpiar archivos de pago
                setPaymentProof(null);
                setPaymentProofPreview(null);
                
                // Mostrar notificación de éxito
                const message = selectedMethod.type === 'gateway' 
                    ? 'Pago procesado exitosamente'
                    : 'Pedido creado. Te notificaremos cuando el pago sea verificado.';
                
                paymentAPI.showSuccessNotification(message);
                
                // Continuar al siguiente paso
                onContinue();
            } else {
                throw new Error(response?.message || 'Error procesando el pago');
            }

        } catch (error) {
            console.error('Error en el pago:', error);
            paymentAPI.showErrorNotification(error.message || 'Error procesando el pago');
            throw error;
        }
    };

    // Manejar subida de comprobante
    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validar tipo de archivo
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
            if (!allowedTypes.includes(file.type)) {
                Notify.add({
                    icon: "/assets/img/icon.svg",
                    title: "Archivo no válido",
                    body: "Solo se permiten imágenes (JPG, PNG) o archivos PDF",
                    type: "danger",
                });
                return;
            }

            // Validar tamaño (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                Notify.add({
                    icon: "/assets/img/icon.svg",
                    title: "Archivo muy grande",
                    body: "El archivo no debe superar los 5MB",
                    type: "danger",
                });
                return;
            }

            setPaymentProof(file);
            
            // Crear preview si es imagen
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => setPaymentProofPreview(e.target.result);
                reader.readAsDataURL(file);
            } else {
                setPaymentProofPreview(null);
            }
        }
    };

    // Estados para manejar los valores seleccionados
    const [departamento, setDepartamento] = useState("");
    const [provincia, setProvincia] = useState("");
    const [distrito, setDistrito] = useState("");

    // Estados para las opciones dinámicas
    const [departamentos, setDepartamentos] = useState([]);
    const [provincias, setProvincias] = useState([]);
    const [distritos, setDistritos] = useState([]);

    // Estado para el precio de envío
    const [shippingCost, setShippingCost] = useState(0);

    // Cargar métodos de pago disponibles
    useEffect(() => {
        fetchPaymentMethods();
    }, []);

    // Inicializar MercadoPago SDK
    useEffect(() => {
        loadMercadoPagoScript();
    }, []);

    const loadMercadoPagoScript = () => {
        // Verificar si el script ya está cargado
        if (window.MercadoPago) {
            initializeMercadoPago();
            return;
        }

        // Cargar script de MercadoPago
        const script = document.createElement('script');
        script.src = 'https://sdk.mercadopago.com/js/v2';
        script.async = true;
        script.onload = () => {
            console.log('✅ SDK de MercadoPago cargado');
            initializeMercadoPago();
        };
        script.onerror = () => {
            console.error('❌ Error cargando SDK de MercadoPago');
        };
        document.head.appendChild(script);
    };

    const initializeMercadoPago = async () => {
        try {
            if (!window.MercadoPago) {
                console.warn('⚠️ SDK de MercadoPago no está disponible');
                return;
            }

            // Obtener configuración de MercadoPago usando nuestra nueva API
            const response = await fetch('/api/payments/mercadopago/config');
            const data = await response.json();
            
            if (data.status && data.config && data.config.public_key) {
                setMercadoPagoConfig(data.config);
                setMpInitialized(true);
                console.log('✅ MercadoPago configurado correctamente');
                console.log('🔑 Public Key:', data.config.public_key.substring(0, 20) + '...');
                console.log('🏗️ Sandbox:', data.config.sandbox ? 'Sí' : 'No');
            } else {
                console.warn('⚠️ MercadoPago no configurado correctamente:', data);
            }
        } catch (error) {
            console.error('❌ Error inicializando MercadoPago:', error);
        }
    };

    const fetchPaymentMethods = async () => {
        try {
            const data = await paymentAPI.getPaymentMethods();
            if (data.status && data.methods) {
                setAvailablePaymentMethods(data.methods);
                // Establecer el primer método activo como predeterminado
                if (data.methods.length > 0) {
                    setFormData(prev => ({ ...prev, paymentMethod: data.methods[0].slug }));
                }
            } else {
                console.error('Error en respuesta de métodos de pago:', data);
                paymentAPI.showErrorNotification('Error al cargar métodos de pago');
            }
        } catch (error) {
            console.error('Error fetching payment methods:', error);
            paymentAPI.showErrorNotification('No se pudieron cargar los métodos de pago');
        } finally {
            setLoadingMethods(false);
        }
    };

    // Cargar los departamentos al iniciar el componente
    useEffect(() => {
        const uniqueDepartamentos = [
            ...new Set(ubigeoData.map((item) => item.departamento)),
        ];
        setDepartamentos(uniqueDepartamentos);
    }, []);

    // Filtrar provincias cuando se selecciona un departamento
    useEffect(() => {
        if (departamento) {
            const filteredProvincias = [
                ...new Set(
                    ubigeoData
                        .filter((item) => item.departamento === departamento)
                        .map((item) => item.provincia)
                ),
            ];
            setProvincias(filteredProvincias);
            setProvincia(""); // Reiniciar provincia
            setDistrito(""); // Reiniciar distrito
            setDistritos([]); // Limpiar distritos
            setFormData((prev) => ({
                ...prev,
                department: departamento,
                province: "",
                district: "",
            }));
        }
    }, [departamento]);

    // Filtrar distritos cuando se selecciona una provincia
    useEffect(() => {
        if (provincia) {
            const filteredDistritos = ubigeoData
                .filter(
                    (item) =>
                        item.departamento === departamento &&
                        item.provincia === provincia
                )
                .map((item) => item.distrito);
            setDistritos(filteredDistritos);
            setDistrito(""); // Reiniciar distrito
            setFormData((prev) => ({
                ...prev,
                province: provincia,
                district: "",
            }));
        }
    }, [provincia]);

    // Consultar el precio de envío cuando se selecciona un distrito
    useEffect(() => {
        if (distrito) {
            setFormData((prev) => ({ ...prev, district: distrito }));

            // Llamar a la API para obtener el precio de envío
            const fetchShippingCost = async () => {
                try {
                    const response = await DeliveryPricesRest.getShippingCost({
                        department: departamento,
                        district: distrito,
                    });
                    setEnvio(response.data.price);
                    if (Number2Currency(response.data.price) > 0) {
                        setSelectedOption("express");
                    } else {
                        setSelectedOption("free");
                    }
                } catch (error) {
                    console.error("Error fetching shipping cost:", error);
                    alert("No se pudo obtener el costo de envío.");
                }
            };

            fetchShippingCost();
        }
    }, [distrito]);

    const handlePayment = async (e) => {
        e.preventDefault();
        
        if (!user) {
            Notify.add({
                icon: "/assets/img/icon.svg",
                title: "Iniciar Sesión",
                body: "Se requiere que inicie sesión para realizar la compra",
                type: "danger",
            });
            return;
        }

        // Validar campos obligatorios
        if (
            !formData.department ||
            !formData.province ||
            !formData.district ||
            !formData.name ||
            !formData.lastname ||
            !formData.email ||
            !formData.address ||
            !formData.reference
        ) {
            Notify.add({
                icon: "/assets/img/icon.svg",
                title: "Error en el Formulario",
                body: "Completar los datos de envío",
                type: "danger",
            });
            return;
        }

        const selectedMethod = availablePaymentMethods.find(method => method.slug === formData.paymentMethod);
        
        // Si es MercadoPago, abrir directamente el modal de tarjetas
        if (selectedMethod?.slug === 'mercadopago') {
            if (!mpInitialized || !mercadoPagoConfig) {
                Notify.add({
                    icon: "/assets/img/icon.svg",
                    title: "MercadoPago no disponible",
                    body: "MercadoPago no está configurado correctamente",
                    type: "danger",
                });
                return;
            }
            
            // Preparar datos para el modal de MercadoPago
            const baseRequest = {
                user_id: user?.id || "",
                name: formData?.name || "",
                lastname: formData?.lastname || "",
                fullname: `${formData?.name} ${formData?.lastname}`,
                email: formData?.email || "",
                phone: formData?.phone || "",
                country: "Perú",
                department: departamento || "",
                province: provincia || "",
                district: distrito || "",
                ubigeo: null,
                address: formData?.address || "",
                number: formData?.number || "",
                comment: formData?.comment || "",
                reference: formData?.reference || "",
                amount: totalFinal || 0,
                delivery: envio,
                cart: cart,
                payment_method: formData.paymentMethod,
                invoiceType: formData.invoiceType,
                documentType: formData.documentType,
                document: formData.document,
                businessName: formData.businessName,
            };
            
            // Guardar datos para el modal
            window.mercadoPagoPaymentResolver = { 
                resolve: (result) => {
                    // Manejar éxito del pago
                    if (result && result.status) {
                        setSale(result.sale);
                        setCode(result.code);
                        setCart([]);
                        
                        Notify.add({
                            icon: "/assets/img/icon.svg",
                            title: "¡Pago exitoso!",
                            body: "Tu pago ha sido procesado correctamente",
                            type: "success",
                        });
                        
                        onContinue();
                    }
                }, 
                reject: (error) => {
                    console.error('Error en pago MercadoPago:', error);
                    Notify.add({
                        icon: "/assets/img/icon.svg",
                        title: "Error en el pago",
                        body: error.message || "No se pudo procesar el pago",
                        type: "danger",
                    });
                }, 
                baseRequest 
            };
            
            // Abrir modal de MercadoPago de forma robusta
            console.log('🔴 Abriendo modal MercadoPago con datos:', {
                amount: totalFinal,
                baseRequest: baseRequest ? 'Preparado' : 'Sin datos',
                mpConfig: mercadoPagoConfig ? 'Configurado' : 'No configurado',
                mpInitialized
            });
            
            // Abrir modal inmediatamente, luego verificar estado
            setShowMpModal(true);
            console.log('🔵 setShowMpModal(true) ejecutado');
            
            // Verificación adicional para asegurar que el modal permanezca abierto
            setTimeout(() => {
                if (!showMpModal) {
                    console.warn('⚠️ Modal se cerró inesperadamente, reabriéndolo');
                    setShowMpModal(true);
                }
            }, 100);
        } else {
            // Para otros métodos de pago, usar el modal de pasos
            handleOpenPaymentModal();
        }
    };

    const [selectedOption, setSelectedOption] = useState("free");

    // Función para obtener icono según el tipo de método de pago
    const getPaymentMethodIcon = (type, slug) => {
        switch (type) {
            case 'gateway':
                return <CreditCard size={20} />;
            case 'qr':
                return <Smartphone size={20} />;
            case 'manual':
                return <Building2 size={20} />;
            default:
                return <CreditCard size={20} />;
        }
    };

    // Función para reemplazar variables dinámicas en el texto
    const replaceVariables = (text, config, amount) => {
        if (!text) return '';
        
        const variables = {
            phone_number: config.phone_number || config.phone || '',
            amount: `S/ ${Number2Currency(amount)}`,
            bank_name: config.bank_name || '',
            account_number: config.account_number || '',
            account_type: config.account_type || '',
            cci: config.cci || '',
            account_holder: config.account_holder || '',
            document_number: config.document_number || '',
            currency: config.currency || 'PEN',
            qr_code: config.qr_code || '',
            account_name: config.account_name || '',
            order_id: Math.random().toString(36).substr(2, 9).toUpperCase(),
            current_date: new Date().toLocaleDateString('es-PE'),
            current_time: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
        };

        let result = text;
        Object.keys(variables).forEach(key => {
            const regex = new RegExp(`\\{${key}\\}`, 'g');
            result = result.replace(regex, variables[key]);
        });

        return result;
    };

    // Función para renderizar instrucciones dinámicas mejorada
    const renderPaymentInstructions = (method) => {
        if (!method || !method.instructions) return null;

        let instructions = method.instructions;
        const config = method.configuration || {};

        // Si las instrucciones vienen como string, parsearlas
        if (typeof instructions === 'string') {
            try {
                instructions = JSON.parse(instructions);
            } catch (e) {
                console.error('Error parsing instructions:', e);
                return (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                        <h4 className="font-semibold text-gray-800 mb-2">Instrucciones para {method.name}</h4>
                        <p className="text-gray-700">{method.instructions}</p>
                    </div>
                );
            }
        }

        const colorClass = getInstructionColor(method.type);
        
        return (
            <div className={`bg-${colorClass}-50 border border-${colorClass}-200 rounded-xl p-6 transition-all duration-200 animate-fadeIn`}>
                {/* Título con icono */}
                <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-lg bg-${colorClass}-100 flex items-center justify-center`}>
                        {getPaymentMethodIcon(method.type, method.slug)}
                    </div>
                    <h4 className={`font-semibold text-${colorClass}-800 text-lg`}>
                        {replaceVariables(instructions.title || `Instrucciones para ${method.name}`, config, totalFinal)}
                    </h4>
                </div>

                {/* Información principal específica por tipo */}
                {method.type === 'qr' && renderQRPaymentInfo(method, config, instructions, colorClass)}
                {method.type === 'manual' && renderBankTransferInfo(method, config, instructions, colorClass)}
                {method.type === 'gateway' && renderGatewayInfo(method, config, instructions, colorClass)}

                {/* Pasos de instrucciones */}
                {instructions.steps && instructions.steps.length > 0 && (
                    <div className="mt-6">
                        <h5 className={`font-medium text-${colorClass}-800 mb-3 flex items-center gap-2`}>
                            <span className="text-lg">📋</span>
                            Pasos a seguir:
                        </h5>
                        <ol className="space-y-3">
                            {instructions.steps.map((step, index) => (
                                <li key={index} className="flex items-start gap-3">
                                    <span className={`bg-${colorClass}-200 text-${colorClass}-800 rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5`}>
                                        {index + 1}
                                    </span>
                                    <div 
                                        className={`text-sm text-${colorClass}-700 flex-1 leading-relaxed`}
                                        dangerouslySetInnerHTML={{ 
                                            __html: replaceVariables(step, config, totalFinal) 
                                        }}
                                    />
                                </li>
                            ))}
                        </ol>
                    </div>
                )}

                {/* Nota importante */}
                {instructions.note && (
                    <div className={`mt-5 p-4 bg-${colorClass}-100 rounded-lg border border-${colorClass}-200`}>
                        <div className="flex items-start gap-2">
                            <span className="text-lg flex-shrink-0">⚠️</span>
                            <div>
                                <p className={`text-sm font-medium text-${colorClass}-800 mb-1`}>Importante:</p>
                                <p className={`text-sm text-${colorClass}-700`}>
                                    {replaceVariables(instructions.note, config, totalFinal)}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tiempo estimado de procesamiento */}
                {instructions.processing_time && (
                    <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
                        <Clock size={16} />
                        <span>Tiempo de procesamiento: {instructions.processing_time}</span>
                    </div>
                )}
            </div>
        );
    };

    // Función para renderizar información de pagos QR (Yape, Plin)
    const renderQRPaymentInfo = (method, config, instructions, colorClass) => (
        <div className="space-y-4">
            {/* Información de contacto destacada */}
            {config.phone_number && (
                <div className={`bg-gradient-to-r from-${colorClass}-100 to-${colorClass}-50 rounded-lg p-5 border-2 border-${colorClass}-200`}>
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <Smartphone size={20} className={`text-${colorClass}-600`} />
                                <p className={`text-sm font-medium text-${colorClass}-700`}>
                                    Número para {method.name}:
                                </p>
                            </div>
                            <p className={`text-3xl font-bold text-${colorClass}-900 tracking-wider mb-1`}>
                                {config.phone_number}
                            </p>
                            {config.account_name && (
                                <p className={`text-sm text-${colorClass}-600 flex items-center gap-1`}>
                                    <User size={14} />
                                    A nombre de: <span className="font-medium">{config.account_name}</span>
                                </p>
                            )}
                        </div>
                        <button 
                            className={`bg-${colorClass}-600 text-white px-4 py-3 rounded-lg text-sm font-medium hover:bg-${colorClass}-700 transition-colors shadow-md flex items-center gap-2`}
                            onClick={() => {
                                navigator.clipboard.writeText(config.phone_number);
                                // Mostrar feedback temporal
                                const btn = event.target;
                                const original = btn.innerHTML;
                                btn.innerHTML = '✓ Copiado';
                                setTimeout(() => btn.innerHTML = original, 2000);
                            }}
                        >
                            <Copy size={16} />
                            Copiar
                        </button>
                    </div>
                </div>
            )}

            {/* Monto a pagar destacado con animación */}
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-lg p-5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                            💰
                        </div>
                        <span className="text-yellow-800 font-medium text-lg">Monto exacto a enviar:</span>
                    </div>
                    <div className="text-right">
                        <div className="text-3xl font-bold text-yellow-900">S/ {Number2Currency(totalFinal)}</div>
                        <div className="text-sm text-yellow-700">Incluye todos los cargos</div>
                    </div>
                </div>
            </div>

            {/* Código QR si existe */}
            {config.qr_code && instructions.qr_display !== false && (
                <div className="text-center bg-white rounded-lg p-6 border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors">
                    <div className="mb-4">
                        <div className="inline-flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full text-sm text-gray-600 mb-3">
                            <QrCode size={16} />
                            Código QR
                        </div>
                    </div>
                    <div className="relative inline-block">
                        <img 
                            src={`/storage/images/payment_method/${config.qr_code}`}
                            alt="Código QR"
                            className="mx-auto max-w-48 h-auto rounded-lg border shadow-lg"
                            onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'block';
                            }}
                        />
                        <div className="hidden bg-gray-100 p-8 rounded-lg">
                            <QrCode size={48} className="mx-auto text-gray-400 mb-2" />
                            <p className="text-gray-500">QR no disponible</p>
                        </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-3 flex items-center justify-center gap-2">
                        <span className="text-lg">📱</span>
                        Escanea el código QR con tu app de {method.name}
                    </p>
                </div>
            )}

            {/* Tips específicos para el método */}
            <div className={`bg-${colorClass}-50 border border-${colorClass}-200 rounded-lg p-4`}>
                <h5 className={`font-medium text-${colorClass}-800 mb-2 flex items-center gap-2`}>
                    <span className="text-lg">💡</span>
                    Tips para {method.name}:
                </h5>
                <ul className={`text-sm text-${colorClass}-700 space-y-1`}>
                    <li>• Envía exactamente <strong>S/ {Number2Currency(totalFinal)}</strong></li>
                    <li>• Toma captura del comprobante de la app</li>
                    <li>• Asegúrate de que aparezca el número de operación</li>
                    <li>• Verifica que el destinatario sea correcto</li>
                </ul>
            </div>
        </div>
    );

    // Función para renderizar información de transferencias bancarias
    const renderBankTransferInfo = (method, config, instructions, colorClass) => (
        <div className="space-y-4">
            {/* Datos bancarios destacados */}
            <div className={`bg-gradient-to-r from-${colorClass}-100 to-${colorClass}-50 rounded-lg p-5 border-2 border-${colorClass}-200`}>
                <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 bg-${colorClass}-600 rounded-lg flex items-center justify-center`}>
                        <Building2 size={20} className="text-white" />
                    </div>
                    <h5 className={`font-semibold text-${colorClass}-800 text-lg`}>Datos para transferencia</h5>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {config.bank_name && (
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600 font-medium">Banco:</span>
                                <span className="font-bold text-gray-900">{config.bank_name}</span>
                            </div>
                        </div>
                    )}
                    
                    {config.account_number && (
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600 font-medium">N° Cuenta:</span>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-gray-900 font-mono">{config.account_number}</span>
                                    <button 
                                        className="text-blue-600 hover:text-blue-800 transition-colors"
                                        onClick={() => navigator.clipboard.writeText(config.account_number)}
                                    >
                                        <Copy size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {config.cci && (
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600 font-medium">CCI:</span>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-gray-900 font-mono">{config.cci}</span>
                                    <button 
                                        className="text-blue-600 hover:text-blue-800 transition-colors"
                                        onClick={() => navigator.clipboard.writeText(config.cci)}
                                    >
                                        <Copy size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {config.account_holder && (
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600 font-medium">Titular:</span>
                                <span className="font-bold text-gray-900">{config.account_holder}</span>
                            </div>
                        </div>
                    )}
                    
                    {config.document_number && (
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600 font-medium">DNI/RUC:</span>
                                <span className="font-bold text-gray-900 font-mono">{config.document_number}</span>
                            </div>
                        </div>
                    )}
                    
                    {config.account_type && (
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600 font-medium">Tipo:</span>
                                <span className="font-bold text-gray-900">{config.account_type}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Monto a transferir destacado */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            💸
                        </div>
                        <span className="text-blue-800 font-medium text-lg">Monto exacto a transferir:</span>
                    </div>
                    <div className="text-right">
                        <div className="text-3xl font-bold text-blue-900">S/ {Number2Currency(totalFinal)}</div>
                        <div className="text-sm text-blue-700">Incluye todos los cargos</div>
                    </div>
                </div>
            </div>

            {/* Tips para transferencia */}
            <div className={`bg-${colorClass}-50 border border-${colorClass}-200 rounded-lg p-4`}>
                <h5 className={`font-medium text-${colorClass}-800 mb-2 flex items-center gap-2`}>
                    <span className="text-lg">💡</span>
                    Tips importantes para transferencia:
                </h5>
                <ul className={`text-sm text-${colorClass}-700 space-y-1`}>
                    <li>• Transfiere exactamente <strong>S/ {Number2Currency(totalFinal)}</strong></li>
                    <li>• Guarda el comprobante de transferencia</li>
                    <li>• Anota el número de operación</li>
                    <li>• Verifica que los datos del destinatario sean correctos</li>
                    <li>• El procesamiento puede tomar de 1 a 24 horas</li>
                </ul>
            </div>
        </div>
    );

    // Función para renderizar información de gateways
    const renderGatewayInfo = (method, config, instructions, colorClass) => (
        <div className="space-y-4">
            <div className={`bg-gradient-to-r from-${colorClass}-100 to-${colorClass}-50 rounded-lg p-5 border-2 border-${colorClass}-200`}>
                <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 bg-${colorClass}-600 rounded-lg flex items-center justify-center`}>
                        <CreditCard size={20} className="text-white" />
                    </div>
                    <div>
                        <h5 className={`font-semibold text-${colorClass}-800 text-lg`}>
                            Procesamiento seguro con {method.name}
                        </h5>
                        <p className={`text-sm text-${colorClass}-600`}>
                            Acepta tarjetas Visa, Mastercard y más
                        </p>
                    </div>
                </div>
                
                <div className="flex items-center justify-between bg-white rounded-lg p-4 border border-gray-200">
                    <span className="text-sm font-medium text-gray-700">Monto a pagar:</span>
                    <span className="text-2xl font-bold text-gray-900">S/ {Number2Currency(totalFinal)}</span>
                </div>
                
                {/* Información de seguridad */}
                <div className="mt-3 flex items-center gap-2 text-sm text-green-700">
                    <div className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center">
                        ✓
                    </div>
                    <span>Transacción protegida con cifrado SSL</span>
                </div>
            </div>

            {/* Beneficios del gateway */}
            <div className={`bg-${colorClass}-50 border border-${colorClass}-200 rounded-lg p-4`}>
                <h5 className={`font-medium text-${colorClass}-800 mb-2 flex items-center gap-2`}>
                    <span className="text-lg">🛡️</span>
                    Beneficios del pago online:
                </h5>
                <ul className={`text-sm text-${colorClass}-700 space-y-1`}>
                    <li>• ✅ Procesamiento inmediato</li>
                    <li>• 🔒 Transacción 100% segura</li>
                    <li>• 📱 Compatible con billeteras digitales</li>
                    <li>• ♻️ Sin necesidad de subir comprobante</li>
                    <li>• ⚡ Confirmación automática del pedido</li>
                </ul>
            </div>
        </div>
    );

    // Función auxiliar para obtener colores de instrucciones
    const getInstructionColor = (type) => {
        switch (type) {
            case 'gateway': return 'blue';
            case 'qr': return 'purple';
            case 'manual': return 'green';
            default: return 'gray';
        }
    };

    return (
        <div className="grid lg:grid-cols-5 gap-8">
            <div className="lg:col-span-3">
                {/* Formulario */}
                <form
                    className="space-y-6"
                    onSubmit={(e) => e.preventDefault()}
                >
                    <div className="grid grid-cols-2 gap-4">
                        {/* Nombres */}
                        <InputForm
                            type="text"
                            label="Nombres"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Nombres"
                        />
                        {/* Apellidos */}
                        <InputForm
                            label="Apellidos"
                            type="text"
                            name="lastname"
                            value={formData.lastname}
                            onChange={handleChange}
                            placeholder="Apellidos"
                        />
                    </div>

                    {/* Correo electrónico */}

                    <InputForm
                        label="Correo electrónico"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Ej. hola@gmail.com"
                    />

                    {/* Departamento */}

                    <SelectForm
                        label="Departamento"
                        options={departamentos}
                        placeholder="Selecciona un Departamento"
                        onChange={(value) => {
                            setDepartamento(value);
                            setFormData((prev) => ({
                                ...prev,
                                department: departamento,
                            }));
                        }}
                    />

                    {/* Provincia */}

                    <SelectForm
                        disabled={!departamento}
                        label="Provincia"
                        options={provincias}
                        placeholder="Selecciona una Provincia"
                        onChange={(value) => {
                            setProvincia(value);
                            setFormData((prev) => ({
                                ...prev,
                                province: provincia,
                            }));
                        }}
                    />

                    {/* Distrito */}

                    <SelectForm
                        disabled={!provincia}
                        label="Distrito"
                        options={distritos}
                        placeholder="Selecciona un Distrito"
                        onChange={(value) => {
                            setDistrito(value);
                            setFormData((prev) => ({
                                ...prev,
                                district: distrito,
                            }));
                        }}
                    />

                    {/* Dirección */}
                    <InputForm
                        label="Avenida / Calle / Jirón"
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        placeholder="Ingresa el nombre de la calle"
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <InputForm
                            label="Número"
                            type="text"
                            name="number"
                            value={formData.number}
                            onChange={handleChange}
                            placeholder="Ingresa el número de la calle"
                        />

                        <InputForm
                            label="Dpto./ Interior/ Piso/ Lote/ Bloque (opcional)"
                            type="text"
                            name="comment"
                            value={formData.comment}
                            onChange={handleChange}
                            placeholder="Ej. Casa 3, Dpto 101"
                        />
                    </div>

                    {/* Referencia */}
                    <InputForm
                        label="Referencia"
                        type="text"
                        name="reference"
                        value={formData.reference}
                        onChange={handleChange}
                        placeholder="Ejem. Altura de la avenida..."
                    />                    {/* Métodos de Pago - Simplificado */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                                <CreditCard size={20} className="text-primary" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900">Método de Pago</h3>
                        </div>
                        
                        {loadingMethods ? (
                            <div className="text-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                                <p className="text-gray-500 mt-2">Cargando métodos de pago...</p>
                            </div>
                        ) : availablePaymentMethods.length === 0 ? (
                            <div className="text-center py-8 bg-gray-50 rounded-xl">
                                <CreditCard size={48} className="mx-auto text-gray-400 mb-3" />
                                <p className="text-gray-500">No hay métodos de pago disponibles</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {availablePaymentMethods.map((method) => (
                                    <div 
                                        key={method.slug}
                                        className={`group relative border-2 rounded-xl p-4 cursor-pointer transition-all duration-300 hover:shadow-lg ${
                                            formData.paymentMethod === method.slug 
                                            ? 'border-primary bg-primary/5 shadow-md' 
                                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                        }`}
                                        onClick={() => handlePaymentMethodChange(method.slug)}
                                    >
                                        {/* Badge de selección */}
                                        {formData.paymentMethod === method.slug && (
                                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                                                <Check size={14} className="text-white" />
                                            </div>
                                        )}

                                        <div className="flex items-center gap-4">
                                            {/* Icono del método */}
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 ${
                                                formData.paymentMethod === method.slug 
                                                    ? 'bg-primary text-white shadow-lg' 
                                                    : 'bg-gray-100 group-hover:bg-gray-200'
                                            }`}>
                                                {method.icon ? (
                                                    <img 
                                                        src={method.icon} 
                                                        alt={method.name}
                                                        className="w-8 h-8 object-contain"
                                                    />
                                                ) : (
                                                    getPaymentMethodIcon(method.type, method.slug)
                                                )}
                                            </div>

                                            {/* Información del método */}
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="font-semibold text-gray-900">{method.name}</h4>
                                                    {/* Badge del tipo */}
                                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                                        method.type === 'gateway' ? 'bg-blue-100 text-blue-800' :
                                                        method.type === 'qr' ? 'bg-purple-100 text-purple-800' :
                                                        'bg-green-100 text-green-800'
                                                    }`}>
                                                        {method.type === 'gateway' ? 'Online' : 
                                                         method.type === 'qr' ? 'QR' : 'Manual'}
                                                    </span>
                                                </div>
                                                
                                                <p className="text-sm text-gray-600">{method.description}</p>
                                                
                                                {/* Información de tarifas compacta */}
                                                <div className="flex items-center gap-2 text-xs mt-1">
                                                    {method.fee_percentage > 0 || method.fee_fixed > 0 ? (
                                                        <span className="text-orange-600 font-medium">
                                                            {method.fee_percentage > 0 && `+${method.fee_percentage}%`}
                                                            {method.fee_percentage > 0 && method.fee_fixed > 0 && ' '}
                                                            {method.fee_fixed > 0 && `+S/ ${Number2Currency(method.fee_fixed)}`}
                                                        </span>
                                                    ) : (
                                                        <span className="text-green-600 font-medium">
                                                            Sin comisión
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Indicador de selección */}
                                            <div className={`w-5 h-5 rounded-full border-2 transition-all duration-200 ${
                                                formData.paymentMethod === method.slug 
                                                    ? 'border-primary bg-primary' 
                                                    : 'border-gray-300 group-hover:border-gray-400'
                                            }`}>
                                                {formData.paymentMethod === method.slug && (
                                                    <div className="w-full h-full rounded-full bg-white scale-50"></div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Información resumida del método seleccionado */}
                        {(() => {
                            const selectedMethod = availablePaymentMethods.find(method => method.slug === formData.paymentMethod);
                            if (!selectedMethod) return null;
                            
                            const colorClass = getInstructionColor(selectedMethod.type);
                            const getBgClass = () => {
                                if (colorClass === 'blue') return 'bg-blue-50 border-blue-200';
                                if (colorClass === 'purple') return 'bg-purple-50 border-purple-200';
                                if (colorClass === 'green') return 'bg-green-50 border-green-200';
                                return 'bg-gray-50 border-gray-200';
                            };
                            
                            const getIconBgClass = () => {
                                if (colorClass === 'blue') return 'bg-blue-100';
                                if (colorClass === 'purple') return 'bg-purple-100';
                                if (colorClass === 'green') return 'bg-green-100';
                                return 'bg-gray-100';
                            };
                            
                            const getTextClass = () => {
                                if (colorClass === 'blue') return 'text-blue-800';
                                if (colorClass === 'purple') return 'text-purple-800';
                                if (colorClass === 'green') return 'text-green-800';
                                return 'text-gray-800';
                            };
                            
                            const getSecondaryTextClass = () => {
                                if (colorClass === 'blue') return 'text-blue-700';
                                if (colorClass === 'purple') return 'text-purple-700';
                                if (colorClass === 'green') return 'text-green-700';
                                return 'text-gray-700';
                            };
                            
                            const getAccentTextClass = () => {
                                if (colorClass === 'blue') return 'text-blue-600';
                                if (colorClass === 'purple') return 'text-purple-600';
                                if (colorClass === 'green') return 'text-green-600';
                                return 'text-gray-600';
                            };
                            
                            return (
                                <div className={`border rounded-xl p-4 ${getBgClass()}`}>
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getIconBgClass()}`}>
                                            {getPaymentMethodIcon(selectedMethod.type, selectedMethod.slug)}
                                        </div>
                                        <h4 className={`font-semibold ${getTextClass()}`}>
                                            {selectedMethod.name} - {selectedMethod.type === 'gateway' ? 'Pago Online' : 'Proceso Paso a Paso'}
                                        </h4>
                                    </div>
                                    <p className={`text-sm mb-3 ${getSecondaryTextClass()}`}>
                                        {selectedMethod.slug === 'mercadopago' 
                                            ? 'Se abrirá un formulario seguro para ingresar los datos de tu tarjeta de crédito o débito.'
                                            : selectedMethod.type === 'gateway' 
                                            ? 'Te redirigiremos al gateway de pago seguro para procesar tu transacción.'
                                            : 'Te guiaremos paso a paso para completar tu pago de forma fácil y segura.'
                                        }
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <ChevronRight size={16} className={getAccentTextClass()} />
                                        <span className={`text-sm font-medium ${getTextClass()}`}>
                                            Monto total: S/ {Number2Currency(totalFinal)}
                                        </span>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                </form>
                <div className="flex gap-4 mt-4">
                    <OptionCard
                        title="Envío gratis"
                        description="Entrega entre 3 a 10 días hábiles"
                        selected={selectedOption === "free"}
                    />
                    <OptionCard
                        title="Delivery"
                        description="Delivery 24 horas"
                        selected={selectedOption === "express"}
                    />
                </div>
                <div className="flex gap-4 mt-6 bg-[#F7F9FB] p-3 rounded-xl">
                    <div className="w-5">
                        <InfoIcon className="customtext-primary" width="20px" />
                    </div>
                    <div className="text-xs font-medium customtext-neutral-dark flex flex-col gap-2">
                        <p>
                            Solo Lima Metropolitana: Dentro de las 24 horas
                            después de efectuado el pago, solo algunos distritos
                            de Lima Metropolitana.
                        </p>
                        <p>
                            {" "}
                            Distritos No incluidos: Santa María del Mar,
                            Pucusana, San Bartolo, Punta Hermosa, Lurín,
                            Pachacamac, Chorrillos, Villa el Salvador, Villa
                            María del Triunfo, San Juan de Miraflores,
                            Cieneguilla, Ate, Chosica, Huaycan, San Juan de
                            Lurigancho (hasta el Metro), Ancón, Santa Rosa,
                            Carabayllo, Puente Piedra.
                        </p>
                        <p>
                            {" "}
                            Same Day: Solo para compras efectuadas hasta las 1pm
                            del día.
                        </p>
                    </div>
                </div>
                <div className="flex gap-4 mt-4 bg-[#F7F9FB] p-3 rounded-xl">
                    <div className="w-5">
                        <InfoIcon className="customtext-primary" width="20px" />
                    </div>
                    <div className="text-xs font-medium customtext-neutral-dark flex flex-col gap-2">
                        <p>
                            Lima: 3 a 4 dias hábiles | Provincia: de 4 a 10 dias
                            hábiles
                        </p>
                    </div>
                </div>
            </div>
            {/* Resumen de compra */}
            <div className="bg-[#F7F9FB] rounded-xl shadow-lg p-6 col-span-2 h-max">
                <h3 className="text-2xl font-bold pb-6">Resumen de compra</h3>

                <div className="space-y-6 border-b-2 pb-6">
                    {cart.map((item, index) => (
                        <div key={item.id} className="rounded-lg">
                            <div className="flex items-center gap-4">
                                <div className="bg-white p-2 rounded-xl">
                                    <img
                                        src={item.type === 'custom_album' 
                                            ? `/storage/images/item_preset/${item.image}` 
                                            : `/storage/images/item/${item.image}`
                                        }
                                        alt={item.name}
                                        className="w-20 h-20 object-cover rounded"
                                    />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-medium text-lg mb-2">
                                        {item.name}
                                    </h3>

                                    {item.type === 'custom_album' ? (
                                        // Información para álbumes personalizados
                                        <>
                                            <p className="text-sm customtext-neutral-light">
                                                Tipo:{" "}
                                                <span className="customtext-neutral-dark">
                                                    Álbum Personalizado
                                                </span>
                                            </p>
                                            <p className="text-sm customtext-neutral-light">
                                                Páginas:{" "}
                                                <span className="customtext-neutral-dark">
                                                    {item.album_data?.pages_count || 'N/A'}
                                                </span>
                                            </p>
                                        </>
                                    ) : (
                                        // Información para productos regulares
                                        <p className="text-sm customtext-neutral-light">
                                            Marca:{" "}
                                            <span className="customtext-neutral-dark">
                                                {item.brand?.name || 'Sin marca'}
                                            </span>
                                        </p>
                                    )}
                                    
                                    <p className="text-sm customtext-neutral-light">
                                        Cantidad:{" "}
                                        <span className="customtext-neutral-dark">
                                            {item.quantity || 1}
                                        </span>
                                    </p>
                                  {/*  <p className="text-sm customtext-neutral-light">
                                        SKU:{" "}
                                        <span className="customtext-neutral-dark">
                                            {item.sku || ''}
                                        </span>
                                    </p> */}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="space-y-4 mt-6">
                    {/* Calcular y mostrar ahorros totales */}
                    {(() => {
                        const totalSavings = cart.reduce((acc, item) => {
                            const basePrice = item.price || 0;
                            const finalPrice = item.final_price || item.price || 0;
                            const quantity = item.quantity || 1;
                            if (basePrice > finalPrice) {
                                return acc + ((basePrice - finalPrice) * quantity);
                            }
                            return acc;
                        }, 0);
                        
                        return totalSavings > 0 ? (
                            <div className="flex justify-between">
                                <span className="text-green-600 font-medium">
                                    Ahorros totales
                                </span>
                                <span className="font-semibold text-green-600">
                                    -S/ {Number2Currency(totalSavings)}
                                </span>
                            </div>
                        ) : null;
                    })()}
                    
                    <div className="flex justify-between">
                        <span className="customtext-neutral-dark">
                            Subtotal
                        </span>
                        <span className="font-semibold">
                            S/ {Number2Currency(subTotal)}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="customtext-neutral-dark">IGV</span>
                        <span className="font-semibold">
                            S/ {Number2Currency(igv)}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="customtext-neutral-dark">Envío</span>
                        <span className="font-semibold">
                            S/ {Number2Currency(envio)}
                        </span>
                    </div>
                    <div className="py-3 border-y-2 mt-6">
                        <div className="flex justify-between font-bold text-[20px] items-center">
                            <span>Total</span>
                            <span>S/ {Number2Currency(totalFinal)}</span>
                        </div>
                    </div>
                    <div className="space-y-2 pt-4">
                        <ButtonPrimary onClick={handlePayment}>
                            {(() => {
                                const selectedMethod = availablePaymentMethods.find(method => method.slug === formData.paymentMethod);
                                if (!selectedMethod) return 'Continuar';
                                
                                if (selectedMethod.slug === 'mercadopago') {
                                    return '💳 Pagar con Tarjeta - MercadoPago';
                                }
                                
                                switch (selectedMethod.type) {
                                    case 'gateway':
                                        return `Pagar con ${selectedMethod.name}`;
                                    case 'qr':
                                    case 'manual':
                                        return `Confirmar ${selectedMethod.name}`;
                                    default:
                                        return 'Continuar';
                                }
                            })()}
                        </ButtonPrimary>

                        <ButtonSecondary onClick={noContinue}>
                            Cancelar
                        </ButtonSecondary>
                    </div>
                    <div>
                        <p className="text-sm customtext-neutral-dark">
                            Al realizar tu pedido, aceptas los 
                            <a className="customtext-primary font-bold">
                                Términos y Condiciones
                            </a>
                            , y que nosotros usaremos sus datos personales de
                            acuerdo con nuestra 
                            <a className="customtext-primary font-bold">
                                Política de Privacidad
                            </a>
                            .
                        </p>
                    </div>
                </div>
            </div>

            {/* Modal de pasos de pago */}
            <PaymentStepsModalFixed
                isOpen={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                paymentMethod={selectedPaymentMethod}
                amount={totalFinal}
                onPaymentSuccess={handlePaymentSuccess}
                checkoutData={getCheckoutData()}
            />

            {/* Modal de MercadoPago Checkout API */}
            <MercadoPagoCheckoutModal
                isOpen={showMpModal}
                onClose={handleMercadoPagoClose}
                amount={totalFinal}
                baseRequest={window.mercadoPagoPaymentResolver?.baseRequest || {}}
                onPaymentSuccess={handleMercadoPagoSuccess}
                mercadoPagoConfig={mercadoPagoConfig}
            />
            
        </div>
    );
}
