import React, { useState, useEffect } from 'react';
import { X, CreditCard, ArrowLeft } from 'lucide-react';
import ButtonPrimary from './ButtonPrimary';
import ButtonSecondary from './ButtonSecondary';

const PaymentStepsModalNew = ({ 
    isOpen, 
    onClose, 
    paymentMethod, 
    amount, 
    onPaymentSuccess, 
    checkoutData 
}) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [mercadoPagoReady, setMercadoPagoReady] = useState(false);

    // Función para cargar el SDK de MercadoPago
    const loadMercadoPagoSDK = () => {
        return new Promise((resolve, reject) => {
            if (window.MercadoPago) {
                resolve(window.MercadoPago);
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://sdk.mercadopago.com/js/v2';
            script.onload = () => {
                console.log('✅ SDK MercadoPago cargado');
                resolve(window.MercadoPago);
            };
            script.onerror = () => {
                reject(new Error('Error al cargar SDK de MercadoPago'));
            };
            document.head.appendChild(script);
        });
    };

    // Función principal para manejar el pago con MercadoPago
    const handleMercadoPagoPayment = async () => {
        try {
            setIsProcessing(true);
            console.log('🚀 Iniciando proceso de pago con MercadoPago');
            
            // 1. Obtener configuración
            console.log('📋 Obteniendo configuración...');
            const configResponse = await fetch('/api/mercadopago/config', {
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
                }
            });
            
            if (!configResponse.ok) {
                throw new Error(`Error al obtener configuración: ${configResponse.status}`);
            }
            
            const config = await configResponse.json();
            console.log('✅ Configuración obtenida:', config);
            
            if (!config.status) {
                throw new Error('MercadoPago no está configurado');
            }

            // 2. Crear preferencia de pago
            console.log('🏗️ Creando preferencia...');
            const preferenceResponse = await fetch('/api/mercadopago/preference', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
                },
                body: JSON.stringify(checkoutData)
            });

            if (!preferenceResponse.ok) {
                throw new Error(`Error al crear preferencia: ${preferenceResponse.status}`);
            }

            const preference = await preferenceResponse.json();
            console.log('✅ Preferencia creada:', preference);
            
            if (!preference.status) {
                throw new Error(preference.message || 'Error al crear preferencia');
            }

            // 3. Redireccionar directamente (método más confiable)
            console.log('🚀 Redirigiendo a MercadoPago...');
            
            const checkoutUrl = config.is_sandbox 
                ? preference.sandbox_init_point 
                : preference.init_point;
                
            if (!checkoutUrl) {
                throw new Error('URL de checkout no disponible');
            }

            // Mostrar mensaje de redirección
            setCurrentStep(2);
            
            // Esperar un momento para mostrar el mensaje
            setTimeout(() => {
                window.location.href = checkoutUrl;
            }, 2000);

        } catch (error) {
            console.error('💥 Error en MercadoPago:', error);
            setIsProcessing(false);
            
            if (window.Notify) {
                window.Notify.add({
                    icon: "/assets/img/icon.svg",
                    title: "Error en el pago",
                    body: error.message,
                    type: "error",
                });
            }
        }
    };

    const handleNext = () => {
        if (paymentMethod?.slug === 'mercadopago') {
            handleMercadoPagoPayment();
        } else {
            // Manejar otros métodos de pago
            if (onPaymentSuccess) {
                onPaymentSuccess();
            }
        }
    };

    const renderMercadoPagoStep = () => {
        if (currentStep === 1) {
            return (
                <div className="text-center space-y-6">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                        <CreditCard className="w-8 h-8 text-blue-600" />
                    </div>
                    
                    <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            Pagar con MercadoPago
                        </h3>
                        <p className="text-gray-600">
                            Serás redirigido al sistema de pago seguro de MercadoPago
                        </p>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-medium text-blue-900 mb-2">
                            💡 Con MercadoPago puedes pagar con:
                        </h4>
                        <div className="grid grid-cols-2 gap-2 text-sm text-blue-800">
                            <div>• Visa, Mastercard</div>
                            <div>• American Express</div>
                            <div>• Transferencias</div>
                            <div>• Cuotas sin interés</div>
                        </div>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                            <span className="font-medium text-green-900">Total a pagar:</span>
                            <span className="text-2xl font-bold text-green-900">
                                S/ {amount?.toFixed(2)}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <ButtonPrimary 
                            onClick={handleNext}
                            disabled={isProcessing}
                            className="w-full"
                        >
                            {isProcessing ? (
                                <div className="flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Procesando...
                                </div>
                            ) : (
                                'Continuar con MercadoPago'
                            )}
                        </ButtonPrimary>
                        
                        <ButtonSecondary onClick={onClose} className="w-full">
                            Cancelar
                        </ButtonSecondary>
                    </div>
                </div>
            );
        }

        if (currentStep === 2) {
            return (
                <div className="text-center space-y-6">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                    
                    <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            Redirigiendo a MercadoPago
                        </h3>
                        <p className="text-gray-600">
                            Por favor espera mientras te redirigimos al sistema de pago seguro...
                        </p>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-blue-800">
                            🔒 Tu pago está protegido por el sistema de seguridad de MercadoPago
                        </p>
                    </div>
                </div>
            );
        }
    };

    const renderOtherPaymentMethods = () => {
        return (
            <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                    <CreditCard className="w-8 h-8 text-gray-600" />
                </div>
                
                <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {paymentMethod?.name}
                    </h3>
                    <p className="text-gray-600">
                        {paymentMethod?.description}
                    </p>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">Total a pagar:</span>
                        <span className="text-2xl font-bold text-gray-900">
                            S/ {amount?.toFixed(2)}
                        </span>
                    </div>
                </div>

                <div className="space-y-3">
                    <ButtonPrimary 
                        onClick={handleNext}
                        disabled={isProcessing}
                        className="w-full"
                    >
                        {isProcessing ? 'Procesando...' : 'Continuar'}
                    </ButtonPrimary>
                    
                    <ButtonSecondary onClick={onClose} className="w-full">
                        Cancelar
                    </ButtonSecondary>
                </div>
            </div>
        );
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">
                        Procesar Pago
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {paymentMethod?.slug === 'mercadopago' 
                        ? renderMercadoPagoStep()
                        : renderOtherPaymentMethods()
                    }
                </div>
            </div>
        </div>
    );
};

export default PaymentStepsModalNew;
