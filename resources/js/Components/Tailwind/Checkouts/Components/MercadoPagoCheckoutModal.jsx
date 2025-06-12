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
    const [formData, setFormData] = useState({
        cardNumber: '',
        cardHolder: '',
        expirationMonth: '',
        expirationYear: '',
        securityCode: '',
        identificationType: 'DNI',
        identificationNumber: '',
        installments: 1
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [cardType, setCardType] = useState(null);
    const [installmentOptions, setInstallmentOptions] = useState([]);

    // Referencias para el SDK de MercadoPago
    const formRef = useRef(null);
    const cardNumberRef = useRef(null);
    const cardHolderRef = useRef(null);
    const expirationMonthRef = useRef(null);
    const expirationYearRef = useRef(null);
    const securityCodeRef = useRef(null);    useEffect(() => {
        if (isOpen && mercadoPagoConfig) {
            initializeMercadoPagoForm();
        }
    }, [isOpen, mercadoPagoConfig]);

    const initializeMercadoPagoForm = async () => {
        try {
            if (!window.MercadoPago) {
                console.error('MercadoPago SDK no está cargado');
                return;
            }

            // Configurar MercadoPago con la public key
            window.MercadoPago.setPublishableKey(mercadoPagoConfig.public_key);
            
            console.log('MercadoPago inicializado correctamente');
        } catch (error) {
            console.error('Error inicializando formulario MP:', error);
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
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            toast.error('Por favor, complete todos los campos correctamente');
            return;
        }

        setLoading(true);

        try {
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

            // Crear token usando MP SDK (esto debería ser implementado según la versión del SDK)
            const token = await createCardToken(cardData);

            // Procesar el pago con el backend
            const paymentData = {
                ...baseRequest,
                token: token.id,
                payment_method_id: token.payment_method_id,
                issuer_id: token.issuer_id,
                installments: formData.installments,
                identification_type: formData.identificationType,
                identification_number: formData.identificationNumber
            };

            const response = await fetch('/api/mercadopago/checkout-api', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
                },
                body: JSON.stringify(paymentData)
            });

            const result = await response.json();

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
    };    // Función auxiliar para crear token usando el SDK real de MercadoPago
    const createCardToken = async (cardData) => {
        return new Promise((resolve, reject) => {
            if (!window.MercadoPago) {
                reject(new Error('MercadoPago SDK no está disponible'));
                return;
            }

            window.MercadoPago.createToken({
                cardNumber: cardData.cardNumber,
                cardholderName: cardData.cardholderName,
                cardExpirationMonth: cardData.cardExpirationMonth,
                cardExpirationYear: cardData.cardExpirationYear,
                securityCode: cardData.securityCode,
                identificationType: cardData.identificationType,
                identificationNumber: cardData.identificationNumber,
            }, (status, response) => {
                if (status === 200 || status === 201) {
                    resolve(response);
                } else {
                    console.error('Error creando token MP:', response);
                    reject(new Error(response.cause?.[0]?.description || 'Error creando token de tarjeta'));
                }
            });
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full max-h-screen overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <div className="flex items-center gap-3">
                        <CreditCard className="w-6 h-6 text-blue-600" />
                        <h2 className="text-xl font-semibold">Pago con Tarjeta</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <form ref={formRef} onSubmit={handleSubmit} className="p-6 space-y-4">
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
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
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
    );
};

export default MercadoPagoCheckoutModal;
