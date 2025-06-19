import React, { useState, useEffect, useRef } from 'react';
import { X, CreditCard, Lock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const MercadoPagoCheckoutModal = ({ 
    isOpen, 
    onClose, 
    amount, 
    baseRequest, 
    onPaymentSuccess,
    mercadoPagoConfig 
}) => {
    console.log('🚀 MercadoPagoCheckoutModal función ejecutada con props:', {
        isOpen,
        amount,
        hasBaseRequest: !!baseRequest,
        hasConfig: !!mercadoPagoConfig
    });

    // Agregar protección contra cierres accidentales
    const [preventClose, setPreventClose] = useState(false);
    
    const handleClose = () => {
        if (preventClose) {
            console.log('🛡️ Cierre del modal bloqueado por protección');
            return;
        }
        console.log('🔴 Modal cerrándose - handleClose ejecutado');
        onClose();
    };

    const [formData, setFormData] = useState({
        cardNumber: '',
        cardHolder: '',
        expirationMonth: '',
        expirationYear: '',
        securityCode: '',
        identificationType: 'DNI',
        identificationNumber: '',
        installments: 1
    });    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [cardType, setCardType] = useState(null);
    const [installmentOptions, setInstallmentOptions] = useState([]);
    const [mpReady, setMpReady] = useState(false);
    
    // Referencias para el SDK de MercadoPago
    const formRef = useRef(null);
    const cardNumberRef = useRef(null);
    const cardHolderRef = useRef(null);
    const expirationMonthRef = useRef(null);
    const expirationYearRef = useRef(null);
    const securityCodeRef = useRef(null);
    const mercadoPagoRef = useRef(null);    // Cargar SDK de MercadoPago dinámicamente
    useEffect(() => {
        if (isOpen && mercadoPagoConfig) {
            console.log('🔄 useEffect activado - Modal abierto y config disponible');
            // Activar protección contra cierre accidental al empezar carga
            setPreventClose(true);
            
            // Verificar si el SDK ya está disponible (cualquier versión)
            if (window.MercadoPago || window.Mercadopago) {
                console.log('✅ SDK de MercadoPago ya disponible');
                initializeMercadoPagoForm();
            } else {
                console.log('🔄 SDK no encontrado, cargando...');
                loadMercadoPagoSDK();
            }
            
            // Desactivar protección después de la inicialización
            setTimeout(() => {
                setPreventClose(false);
                console.log('🛡️ Protección contra cierre desactivada');
            }, 2000);
        } else if (!isOpen) {
            console.log('❌ useEffect - Modal cerrado o sin config');
        }
    }, [isOpen, mercadoPagoConfig]);const loadMercadoPagoSDK = () => {
        console.log('🔄 Cargando SDK de MercadoPago...');
        
        if (document.getElementById('mercadopago-sdk')) {
            console.log('✅ Script del SDK ya está en el DOM');
            // Esperar un poco para que el SDK se inicialice
            setTimeout(() => {
                if (mercadoPagoConfig) {
                    initializeMercadoPagoForm();
                }
            }, 100);
            return;
        }

        const script = document.createElement('script');
        script.id = 'mercadopago-sdk';
        // Intentar primero con v2, luego fallback a v1
        script.src = 'https://sdk.mercadopago.com/js/v2';
        script.async = true;
        
        script.onload = () => {
            console.log('✅ SDK de MercadoPago v2 cargado');
            setTimeout(() => {
                if (mercadoPagoConfig) {
                    initializeMercadoPagoForm();
                }
            }, 100);
        };
        
        script.onerror = () => {
            console.warn('⚠️ Error cargando SDK v2, intentando v1...');
            // Remover el script fallido
            script.remove();
            
            // Intentar con v1
            const scriptV1 = document.createElement('script');
            scriptV1.id = 'mercadopago-sdk';
            scriptV1.src = 'https://secure.mlstatic.com/sdk/javascript/v1/mercadopago.js';
            scriptV1.async = true;
            
            scriptV1.onload = () => {
                console.log('✅ SDK de MercadoPago v1 cargado como fallback');
                setTimeout(() => {
                    if (mercadoPagoConfig) {
                        initializeMercadoPagoForm();
                    }
                }, 100);
            };
            
            scriptV1.onerror = () => {
                console.error('❌ Error cargando ambas versiones del SDK');
                toast.error('Error cargando el sistema de pagos');
            };
            
            document.head.appendChild(scriptV1);
        };

        document.head.appendChild(script);
    };    const initializeMercadoPagoForm = async () => {
        try {
            // Detección robusta del SDK - verificar ambas versiones
            let mp = null;
            let sdkVersion = null;
            
            if (window.MercadoPago) {
                // SDK v2 - window.MercadoPago (M mayúscula)
                mp = window.MercadoPago;
                sdkVersion = 'v2';
                console.log('🔧 Detectado SDK MercadoPago v2');
            } else if (window.Mercadopago) {
                // SDK v1 - window.Mercadopago (m minúscula) 
                mp = window.Mercadopago;
                sdkVersion = 'v1';
                console.log('🔧 Detectado SDK MercadoPago v1');
            }
            
            if (!mp) {
                console.error('❌ No se encontró ninguna versión del SDK de MercadoPago');
                toast.error('Error: SDK de MercadoPago no disponible');
                return;
            }

            console.log('🔧 Inicializando MercadoPago', sdkVersion, 'con public key:', mercadoPagoConfig.public_key?.substring(0, 20) + '...');
            
            if (sdkVersion === 'v2') {
                // SDK v2: crear una instancia
                mercadoPagoRef.current = new mp(mercadoPagoConfig.public_key);
                console.log('✅ MercadoPago v2 inicializado correctamente');
            } else if (sdkVersion === 'v1') {
                // SDK v1: usar setPublishableKey
                mp.setPublishableKey(mercadoPagoConfig.public_key);
                mercadoPagoRef.current = mp; // Guardar referencia para v1 también
                console.log('✅ MercadoPago v1 inicializado correctamente');
            }
            
            setMpReady(true);
            
        } catch (error) {
            console.error('❌ Error inicializando formulario MP:', error);
            toast.error('Error inicializando el sistema de pagos');
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        
        // Limpiar error específico
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }

        // Detectar tipo de tarjeta basado en el número
        if (name === 'cardNumber') {
            detectCardType(value);
        }
    };

    const detectCardType = (cardNumber) => {
        const cleanNumber = cardNumber.replace(/\s/g, '');
        
        if (cleanNumber.startsWith('4')) {
            setCardType('visa');
        } else if (cleanNumber.startsWith('5') || cleanNumber.startsWith('2')) {
            setCardType('master');
        } else if (cleanNumber.startsWith('3')) {
            setCardType('amex');
        } else {
            setCardType(null);
        }
    };

    const formatCardNumber = (value) => {
        return value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.cardNumber.replace(/\s/g, '') || formData.cardNumber.replace(/\s/g, '').length < 13) {
            newErrors.cardNumber = 'Número de tarjeta inválido';
        }

        if (!formData.cardHolder.trim()) {
            newErrors.cardHolder = 'Nombre del titular requerido';
        }

        if (!formData.expirationMonth || !formData.expirationYear) {
            newErrors.expiration = 'Fecha de vencimiento requerida';
        }

        if (!formData.securityCode || formData.securityCode.length < 3) {
            newErrors.securityCode = 'Código de seguridad inválido';
        }

        if (!formData.identificationNumber.trim()) {
            newErrors.identificationNumber = 'Número de documento requerido';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            toast.error('Por favor, complete todos los campos correctamente');
            return;
        }

        // Datos de prueba para MercadoPago
        const testingCards = {
            visa: {
                cardNumber: '4509 9535 6623 3704',
                cardHolder: 'APRO',
                securityCode: '123',
                expirationMonth: '11',
                expirationYear: '25',
            },
            master: {
                cardNumber: '5031 7557 3453 0604',
                cardHolder: 'APRO',
                securityCode: '123',
                expirationMonth: '11',
                expirationYear: '25',
            },
            rejected: {
                cardNumber: '4000 0000 0000 0002',
                cardHolder: 'RJCT',
                securityCode: '123',
                expirationMonth: '11',
                expirationYear: '25',
            },
        };

        setLoading(true);

        try {
            console.log('🧪 Integrando pago con MercadoPago...');
            
            // Si deseas usar tarjetas de prueba, descomenta la siguiente línea:
            // const useTestCard = 'visa';
            
            // Crear token de la tarjeta usando el SDK de MercadoPago
            const cardData = {
                cardNumber: formData.cardNumber.replace(/\s/g, ''),
                cardholderName: formData.cardHolder,
                cardExpirationMonth: formData.expirationMonth,
                cardExpirationYear: formData.expirationYear,
                securityCode: formData.securityCode,
                identificationType: formData.identificationType,
                identificationNumber: formData.identificationNumber,
            };

            // Crear token usando MP SDK v2
            const token = await createCardToken(cardData);
            console.log('🎯 Token creado y listo para enviar:', token);

            // Procesar el pago con el backend            // Preparar datos del pago - asegurarse que la estructura sea correcta
            const paymentData = {
                ...baseRequest,
                token: token.id,
                payment_method_id: token.payment_method_id || cardType, // Usar cardType como fallback
                issuer_id: token.issuer?.id || null,
                installments: formData.installments,
                identification_type: formData.identificationType,
                identification_number: formData.identificationNumber,
                card_type: cardType,
                // Asegurarse de incluir todos los campos que pueda necesitar el backend
                card_last_four: formData.cardNumber.replace(/\s/g, '').slice(-4),
                card_holder_name: formData.cardHolder
            };
            
            // Registrar lo que estamos enviando para diagnóstico
            console.log('📤 Enviando datos al backend:', {
                token_id: paymentData.token,
                payment_method_id: paymentData.payment_method_id,
                baseRequest_sample: baseRequest ? Object.keys(baseRequest) : 'N/A',
                amount: amount,
                installments: paymentData.installments
            });
            
            const response = await fetch('/api/payments/mercadopago/checkout-api', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
                },
                body: JSON.stringify(paymentData)
            });            // Analizar la respuesta
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Error en respuesta del servidor:', {
                    status: response.status,
                    statusText: response.statusText,
                    body: errorText
                });
                
                try {
                    // Intentar parsear como JSON si es posible
                    const errorJson = JSON.parse(errorText);
                    throw new Error(errorJson.message || `Error ${response.status}: ${response.statusText}`);
                } catch (e) {
                    // Si no es JSON o hay otro error, usar texto original
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }
            }
            
            const result = await response.json();
            console.log('✅ Respuesta del servidor:', result);

            if (result.status) {
                toast.success('¡Pago procesado exitosamente!');
                onPaymentSuccess(result);
                onClose();
            } else {
                throw new Error(result.message || 'Error procesando el pago');
            }

        } catch (error) {
            console.error('Error procesando pago MP:', error);
            toast.error(error.message || 'Error procesando el pago');
        } finally {
            setLoading(false);
        }
    };    // Función auxiliar para crear token usando el SDK real de MercadoPago (compatible con v1 y v2)
    const createCardToken = async (cardData) => {
        return new Promise((resolve, reject) => {
            // Verificación robusta de disponibilidad del SDK
            const mp = window.MercadoPago || window.Mercadopago;
            if (!mp) {
                reject(new Error('MercadoPago SDK no está disponible'));
                return;
            }

            if (!mpReady || !mercadoPagoRef.current) {
                reject(new Error('MercadoPago no está inicializado'));
                return;
            }

            console.log('🔄 Creando token con datos:', {
                cardNumber: cardData.cardNumber ? cardData.cardNumber.substring(0, 6) + '****' : 'No proporcionado',
                cardholderName: cardData.cardholderName,
                hasSecurityCode: !!cardData.securityCode
            });

            const tokenData = {
                cardNumber: cardData.cardNumber.replace(/\s/g, ''),
                cardholderName: cardData.cardholderName,
                cardExpirationMonth: cardData.cardExpirationMonth,
                cardExpirationYear: cardData.cardExpirationYear,
                securityCode: cardData.securityCode,
                identificationType: cardData.identificationType,
                identificationNumber: cardData.identificationNumber,
            };

            try {
                if (window.MercadoPago && mercadoPagoRef.current.createCardToken) {
                    // SDK v2 - usar la instancia
                    console.log('🔄 Usando createCardToken v2...');
                    mercadoPagoRef.current.createCardToken(tokenData)
                        .then(response => {
                            console.log('✅ Token v2 creado exitosamente:', response.id);
                            resolve(response);
                        })
                        .catch(error => {
                            console.error('❌ Error creando token v2:', error);
                            reject(new Error(error.message || 'Error creando token de tarjeta v2'));
                        });
                } else if (window.Mercadopago && window.Mercadopago.createToken) {
                    // SDK v1 - usar método global con callback
                    console.log('🔄 Usando createToken v1...');
                    window.Mercadopago.createToken(tokenData, function(status, response) {
                        if (status === 200 || status === 201) {
                            console.log('✅ Token v1 creado exitosamente:', response.id);
                            resolve(response);
                        } else {
                            console.error('❌ Error creando token v1:', response);
                            reject(new Error(response.cause?.[0]?.description || 'Error creando token de tarjeta v1'));
                        }
                    });
                } else {
                    reject(new Error('Método createToken no disponible en el SDK'));
                }
            } catch (error) {
                console.error('❌ Error creando token (excepción):', error);
                reject(new Error(error.message || 'Error inesperado creando token de tarjeta'));
            }
        });
    };if (!isOpen) {
        console.log('🔴 Modal NO se renderiza porque isOpen =', isOpen);
        return null;
    }

    console.log('🟢 Modal SÍ se está renderizando!');

    console.log('🔴 MercadoPago Modal Props:', { 
        isOpen, 
        amount, 
        mercadoPagoConfig: mercadoPagoConfig?.public_key?.substring(0, 20) + '...',
        baseRequest: baseRequest ? 'Sí' : 'No'
    });

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4"
            style={{ zIndex: 99999 }}
        >
            <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                {/* Header simplificado */}
                <div className="flex items-center justify-between p-4 border-b bg-blue-600">
                    <div className="flex items-center gap-3">
                        <CreditCard className="w-6 h-6 text-white" />
                        <h2 className="text-lg font-semibold text-white">💳 Pago con MercadoPago</h2>
                    </div>                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-blue-700 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-white" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">                    {/* Debug info */}
                    <div className="text-center mb-4 p-3 bg-green-100 rounded border">
                        <p className="text-sm font-bold text-green-800">✅ MODAL CARGADO CORRECTAMENTE</p>
                        <p className="text-xs text-green-600 mt-1">
                            Monto: S/ {amount} | Config: {mercadoPagoConfig ? '✓' : '✗'} | MP Ready: {mpReady ? '✓' : '✗'}
                        </p>
                        {!mpReady && (
                            <p className="text-xs text-orange-600 mt-1">
                                🔄 Inicializando sistema de pagos...
                            </p>
                        )}
                    </div>
                    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
                        {/* Monto */}
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                            <div className="text-center">
                                <p className="text-sm text-blue-600">Total a pagar</p>
                                <p className="text-2xl font-bold text-blue-800">S/ {amount?.toFixed(2)}</p>
                            </div>
                        </div>

                        {/* Número de tarjeta */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Número de tarjeta
                            </label>
                            <div className="relative">
                                <input
                                    ref={cardNumberRef}
                                    type="text"
                                    name="cardNumber"
                                    value={formatCardNumber(formData.cardNumber)}
                                    onChange={handleInputChange}
                                    placeholder="1234 5678 9012 3456"
                                    maxLength="19"
                                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.cardNumber ? 'border-red-500' : 'border-gray-300'}`}
                                />
                                {cardType && (
                                    <div className="absolute right-3 top-3">
                                        <span className="text-xs text-gray-500 uppercase">{cardType}</span>
                                    </div>
                                )}
                            </div>
                            {errors.cardNumber && <p className="text-red-500 text-sm mt-1">{errors.cardNumber}</p>}
                        </div>

                        {/* Titular */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Nombre del titular
                            </label>
                            <input
                                ref={cardHolderRef}
                                type="text"
                                name="cardHolder"
                                value={formData.cardHolder}
                                onChange={handleInputChange}
                                placeholder="Como aparece en la tarjeta"
                                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.cardHolder ? 'border-red-500' : 'border-gray-300'}`}
                            />
                            {errors.cardHolder && <p className="text-red-500 text-sm mt-1">{errors.cardHolder}</p>}
                        </div>

                        {/* Vencimiento y CVV */}
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Mes
                                </label>
                                <select
                                    ref={expirationMonthRef}
                                    name="expirationMonth"
                                    value={formData.expirationMonth}
                                    onChange={handleInputChange}
                                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.expiration ? 'border-red-500' : 'border-gray-300'}`}
                                >
                                    <option value="">MM</option>
                                    {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                                        <option key={month} value={month.toString().padStart(2, '0')}>
                                            {month.toString().padStart(2, '0')}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Año
                                </label>
                                <select
                                    ref={expirationYearRef}
                                    name="expirationYear"
                                    value={formData.expirationYear}
                                    onChange={handleInputChange}
                                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.expiration ? 'border-red-500' : 'border-gray-300'}`}
                                >
                                    <option value="">AA</option>
                                    {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i).map(year => (
                                        <option key={year} value={year.toString().slice(-2)}>
                                            {year}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    CVV
                                </label>
                                <input
                                    ref={securityCodeRef}
                                    type="text"
                                    name="securityCode"
                                    value={formData.securityCode}
                                    onChange={handleInputChange}
                                    placeholder="123"
                                    maxLength="4"
                                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.securityCode ? 'border-red-500' : 'border-gray-300'}`}
                                />
                            </div>
                        </div>
                        {errors.expiration && <p className="text-red-500 text-sm">{errors.expiration}</p>}
                        {errors.securityCode && <p className="text-red-500 text-sm">{errors.securityCode}</p>}

                        {/* Documento */}
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tipo
                                </label>
                                <select
                                    name="identificationType"
                                    value={formData.identificationType}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="DNI">DNI</option>
                                    <option value="CE">CE</option>
                                    <option value="PASSPORT">Pasaporte</option>
                                </select>
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Número de documento
                                </label>
                                <input
                                    type="text"
                                    name="identificationNumber"
                                    value={formData.identificationNumber}
                                    onChange={handleInputChange}
                                    placeholder="12345678"
                                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.identificationNumber ? 'border-red-500' : 'border-gray-300'}`}
                                />
                                {errors.identificationNumber && <p className="text-red-500 text-sm mt-1">{errors.identificationNumber}</p>}
                            </div>
                        </div>

                        {/* Seguridad */}
                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                            <div className="flex items-center gap-2">
                                <Lock className="w-5 h-5 text-green-600" />
                                <p className="text-sm text-green-700">
                                    Tus datos están protegidos con encriptación SSL
                                </p>
                            </div>
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-3 pt-4">                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Cancelar
                        </button><button
                                type="submit"
                                disabled={loading || !mpReady}
                                className={`flex-1 px-4 py-3 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                                    !mpReady 
                                        ? 'bg-gray-400 text-white cursor-not-allowed'
                                        : loading 
                                            ? 'bg-blue-400 text-white cursor-not-allowed'
                                            : 'bg-blue-600 text-white hover:bg-blue-700'
                                }`}
                            >
                                {loading ? (
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                                ) : !mpReady ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                                        Inicializando...
                                    </>
                                ) : (
                                    <>
                                        <CreditCard className="w-5 h-5" />
                                        Pagar S/ {amount?.toFixed(2)}
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default MercadoPagoCheckoutModal;
