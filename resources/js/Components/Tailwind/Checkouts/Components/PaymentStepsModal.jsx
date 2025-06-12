import { useState, useEffect } from "react";
import { X, ChevronRight, ChevronLeft, CheckCircle, Clock, Copy, Upload, AlertCircle, QrCode, CreditCard, Smartphone, Building2 } from "lucide-react";
import Number2Currency from "../../../../Utils/Number2Currency";

export default function PaymentStepsModal({ 
    isOpen, 
    onClose, 
    paymentMethod, 
    amount, 
    onPaymentSuccess,
    onFileUpload,
    paymentProof,
    checkoutData 
}) {
    const [currentStep, setCurrentStep] = useState(1);
    const [completedSteps, setCompletedSteps] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);

    if (!isOpen || !paymentMethod) return null;

    const getMethodIcon = (type) => {
        switch (type) {
            case 'gateway': return <CreditCard size={24} className="text-blue-600" />;
            case 'qr': return <Smartphone size={24} className="text-purple-600" />;
            case 'manual': return <Building2 size={24} className="text-green-600" />;
            default: return <CreditCard size={24} className="text-gray-600" />;
        }
    };

    const getColorClass = (type) => {
        switch (type) {
            case 'gateway': return 'blue';
            case 'qr': return 'purple';
            case 'manual': return 'green';
            default: return 'gray';
        }
    };

    const colorClass = getColorClass(paymentMethod.type);
    const config = paymentMethod.configuration || {};
    const instructions = paymentMethod.instructions || {};

    // Función para reemplazar variables dinámicas
    const replaceVariables = (text) => {
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
    };    const getStepsForMethod = () => {
        if (paymentMethod.type === 'gateway') {
            return [
                {
                    id: 1,
                    title: "Procesar Pago",
                    description: "Serás redirigido al gateway de pago seguro",
                    component: <GatewayStep paymentMethod={paymentMethod} amount={amount} />,
                    action: paymentMethod.slug === 'mercadopago' ? "Pagar con MercadoPago" : "Procesar Pago",
                    canProceed: true
                }
            ];
        } else if (paymentMethod.type === 'qr') {
            return [
                {
                    id: 1,
                    title: "Datos de Transferencia",
                    description: `Información para enviar dinero por ${paymentMethod.name}`,
                    component: <QRPaymentStep paymentMethod={paymentMethod} amount={amount} config={config} instructions={instructions} replaceVariables={replaceVariables} colorClass={colorClass} />,
                    action: "Ya Envié el Dinero",
                    canProceed: true
                },
                {
                    id: 2,
                    title: "Subir Comprobante",
                    description: "Sube tu comprobante de pago para validación",
                    component: <UploadProofStep onFileUpload={onFileUpload} paymentProof={paymentProof} />,
                    action: "Enviar Comprobante",
                    canProceed: !!paymentProof
                },
                {
                    id: 3,
                    title: "Validación",
                    description: "Tu comprobante está siendo validado",
                    component: <ValidationStep paymentMethod={paymentMethod} />,
                    action: "Finalizar",
                    canProceed: true
                }
            ];
        } else {
            return [
                {
                    id: 1,
                    title: "Datos Bancarios",
                    description: "Información para realizar la transferencia",
                    component: <BankTransferStep paymentMethod={paymentMethod} amount={amount} config={config} instructions={instructions} replaceVariables={replaceVariables} colorClass={colorClass} />,
                    action: "Ya Transferí",
                    canProceed: true
                },
                {
                    id: 2,
                    title: "Subir Comprobante",
                    description: "Sube tu comprobante de transferencia",
                    component: <UploadProofStep onFileUpload={onFileUpload} paymentProof={paymentProof} />,
                    action: "Enviar Comprobante",
                    canProceed: !!paymentProof
                },
                {
                    id: 3,
                    title: "Validación",
                    description: "Tu transferencia está siendo validada",
                    component: <ValidationStep paymentMethod={paymentMethod} />,
                    action: "Finalizar",
                    canProceed: true
                }
            ];
        }
    };

    const steps = getStepsForMethod();
    const currentStepData = steps.find(s => s.id === currentStep);    const handleNext = async () => {
        if (currentStep === steps.length) {
            // Último paso - procesar pago y cerrar modal
            setIsProcessing(true);
            try {
                if (paymentMethod.slug === 'mercadopago') {
                    await handleMercadoPagoPayment();
                } else {
                    await onPaymentSuccess();
                }
                onClose();
            } catch (error) {
                console.error('Error processing payment:', error);
            } finally {
                setIsProcessing(false);
            }        } else {
            // Para MercadoPago, en el primer paso mostramos el SDK
            if (paymentMethod.slug === 'mercadopago' && currentStep === 1) {
                setIsProcessing(true);
                try {
                    await handleMercadoPagoPayment();
                    // No cerramos el modal aquí, dejamos que el usuario complete el pago
                } catch (error) {
                    console.error('Error processing MercadoPago payment:', error);
                } finally {
                    setIsProcessing(false);
                }
            } else {
                setCompletedSteps([...completedSteps, currentStep]);
                setCurrentStep(currentStep + 1);
            }
        }
    };    const handleMercadoPagoPayment = async () => {
        try {
            setIsProcessing(true);
            console.log('🚀 Iniciando proceso de pago con MercadoPago');
            
            // Obtener configuración de MercadoPago
            console.log('📋 Obteniendo configuración de MercadoPago...');
            const configResponse = await fetch('/api/mercadopago/config');
            
            if (!configResponse.ok) {
                throw new Error(`Error HTTP: ${configResponse.status}`);
            }
            
            const configData = await configResponse.json();
            console.log('✅ Respuesta de configuración:', configData);
            
            if (!configData.status) {
                throw new Error(configData.message || 'Error al obtener configuración de MercadoPago');
            }

            console.log(`🔑 Public Key obtenida: ${configData.public_key.substring(0, 20)}...`);

            // Cargar el SDK de MercadoPago si no está cargado
            console.log('📦 Cargando SDK de MercadoPago...');
            await loadMercadoPagoSDK();
            console.log('✅ SDK de MercadoPago cargado');

            // Obtener datos del checkout
            const currentCheckoutData = getCheckoutData();
            console.log('📊 Datos del checkout:', currentCheckoutData);
            
            // Crear preferencia de pago
            console.log('🏗️ Creando preferencia de pago...');
            const response = await fetch('/api/mercadopago/preference', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
                },
                body: JSON.stringify(currentCheckoutData)
            });

            console.log(`📡 Respuesta HTTP: ${response.status}`);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Error en respuesta:', errorText);
                throw new Error(`Error HTTP ${response.status}: ${errorText}`);
            }

            const result = await response.json();
            console.log('✅ Preferencia creada:', result);
            
            if (!result.status) {
                throw new Error(result.message || 'Error al crear preferencia de pago');
            }

            // Mostrar el contenedor del botón
            const buttonContainer = document.querySelector('.mercadopago-button');
            if (buttonContainer) {
                buttonContainer.style.display = 'flex';
                buttonContainer.innerHTML = '<p class="text-blue-600">🔄 Inicializando MercadoPago...</p>';
                console.log('👁️ Contenedor de MercadoPago mostrado');
            }

            // Inicializar MercadoPago con la public key
            console.log('🚀 Inicializando MercadoPago con public key...');
            const mp = new window.MercadoPago(configData.public_key, {
                locale: 'es-PE'
            });
            console.log('✅ MercadoPago inicializado');

            // Crear el checkout usando Wallet Brick (recomendado para SDK v2)
            console.log('🎯 Creando Wallet Brick...');
            const bricksBuilder = mp.bricks();
            
            // Limpiar el contenedor
            if (buttonContainer) {
                buttonContainer.innerHTML = '';
            }

            // Crear el wallet brick
            const wallet = await bricksBuilder.create('wallet', '.mercadopago-button', {
                initialization: {
                    preferenceId: result.preference_id,
                },
                customization: {
                    texts: {
                        valueProp: 'smart_option',
                    },
                },
                callbacks: {
                    onReady: () => {
                        console.log('🎉 Checkout de MercadoPago listo');
                        if (buttonContainer) {
                            buttonContainer.style.display = 'flex';
                        }
                    },
                    onSubmit: ({ selectedPaymentMethod, formData }) => {
                        console.log('💳 Enviando pago...', { selectedPaymentMethod, formData });
                        return new Promise((resolve, reject) => {
                            // El pago será procesado por MercadoPago
                            // El webhook manejará la confirmación
                            resolve();
                        });
                    },
                    onError: (error) => {
                        console.error('❌ Error en checkout:', error);
                        if (buttonContainer) {
                            buttonContainer.innerHTML = `
                                <div class="text-red-600 p-4 text-center">
                                    <p class="font-medium">❌ Error en el pago</p>
                                    <p class="text-sm mt-1">${error.message || 'Error desconocido'}</p>
                                    <button class="mt-2 bg-blue-600 text-white px-4 py-2 rounded text-sm" onclick="location.reload()">
                                        Reintentar
                                    </button>
                                </div>
                            `;
                        }
                    }
                }
            });

            console.log('🎉 Checkout de MercadoPago creado exitosamente');
            
        } catch (error) {
            console.error('💥 Error en MercadoPago:', error);
            
            // Mostrar error en el contenedor
            const buttonContainer = document.querySelector('.mercadopago-button');
            if (buttonContainer) {
                buttonContainer.innerHTML = `
                    <div class="text-red-600 p-4 text-center">
                        <p class="font-medium">❌ Error al cargar MercadoPago</p>
                        <p class="text-sm mt-1">${error.message}</p>
                        <button class="mt-2 bg-red-600 text-white px-4 py-2 rounded text-sm" onclick="location.reload()">
                            Reintentar
                        </button>
                    </div>
                `;
                buttonContainer.style.display = 'flex';
            }
            
            if (window.Notify) {
                window.Notify.add({
                    icon: "/assets/img/icon.svg",
                    title: "Error en el pago",
                    body: error.message,
                    type: "error",
                });
            } else {
                alert('Error al procesar el pago: ' + error.message);
            }
            throw error;        } finally {
            setIsProcessing(false);
        }
    };

    const loadMercadoPagoSDK = () => {
        return new Promise((resolve, reject) => {
            if (window.MercadoPago) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://sdk.mercadopago.com/js/v2';
            script.onload = () => {
                resolve();
            };
            script.onerror = () => {
                reject(new Error('Error al cargar el SDK de MercadoPago'));
            };
            document.head.appendChild(script);
        });
    };const getCheckoutData = () => {
        // Si se pasa checkoutData como prop, usarlo; si no, usar localStorage como fallback
        if (checkoutData) {
            return {
                ...checkoutData,
                amount: amount
            };
        }
        
        // Fallback a localStorage
        const cart = JSON.parse(localStorage.getItem('bananalab_cart') || '[]');
        const storedCheckoutData = JSON.parse(localStorage.getItem('bananalab_checkout_data') || '{}');
        
        return {
            ...storedCheckoutData,
            cart: cart,
            amount: amount
        };
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
            setCompletedSteps(completedSteps.filter(s => s !== currentStep - 1));
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">                {/* Header */}
                <div className={`bg-gradient-to-r text-white p-6 ${
                    colorClass === 'blue' ? 'from-blue-600 to-blue-700' :
                    colorClass === 'purple' ? 'from-purple-600 to-purple-700' :
                    colorClass === 'green' ? 'from-green-600 to-green-700' :
                    'from-gray-600 to-gray-700'
                }`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {getMethodIcon(paymentMethod.type)}
                            <div>
                                <h2 className="text-xl font-bold">{paymentMethod.name}</h2>
                                <p className="text-sm opacity-90">Monto: S/ {Number2Currency(amount)}</p>
                            </div>
                        </div>
                        <button 
                            onClick={onClose}
                            className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-6">
                        <div className="flex items-center justify-between mb-2">
                            {steps.map((step, index) => (
                                <div key={step.id} className="flex items-center">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                                        completedSteps.includes(step.id) 
                                            ? 'bg-green-500 text-white' 
                                            : currentStep === step.id 
                                                ? 'bg-white text-gray-800' 
                                                : 'bg-white bg-opacity-30 text-white'
                                    }`}>
                                        {completedSteps.includes(step.id) ? <CheckCircle size={16} /> : step.id}
                                    </div>
                                    {index < steps.length - 1 && (
                                        <div className={`w-12 h-1 mx-2 rounded ${
                                            completedSteps.includes(step.id) ? 'bg-green-500' : 'bg-white bg-opacity-30'
                                        }`} />
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-medium">{currentStepData?.title}</p>
                            <p className="text-xs opacity-75">{currentStepData?.description}</p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-96">
                    {currentStepData?.component}
                </div>

                {/* Footer */}
                <div className="border-t p-4 bg-gray-50 flex items-center justify-between">
                    <button
                        onClick={handleBack}
                        disabled={currentStep === 1}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                            currentStep === 1 
                                ? 'text-gray-400 cursor-not-allowed' 
                                : 'text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        <ChevronLeft size={16} />
                        Anterior
                    </button>

                    <button
                        onClick={handleNext}                        disabled={!currentStepData?.canProceed || isProcessing}
                        className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-colors ${
                            !currentStepData?.canProceed || isProcessing
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : colorClass === 'blue' ? 'bg-blue-600 text-white hover:bg-blue-700' :
                                  colorClass === 'purple' ? 'bg-purple-600 text-white hover:bg-purple-700' :
                                  colorClass === 'green' ? 'bg-green-600 text-white hover:bg-green-700' :
                                  'bg-gray-600 text-white hover:bg-gray-700'
                        }`}
                    >
                        {isProcessing ? (
                            <>
                                <Clock size={16} className="animate-spin" />
                                Procesando...
                            </>
                        ) : (
                            <>
                                {currentStepData?.action}
                                {currentStep < steps.length && <ChevronRight size={16} />}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

// Componente para pagos por gateway
function GatewayStep({ paymentMethod, amount }) {
    const getGatewayInfo = () => {
        if (paymentMethod.slug === 'mercadopago') {
            return {
                icon: '💙',
                title: 'MercadoPago',
                description: 'Te redirigiremos al checkout seguro de MercadoPago',
                features: [
                    '• 💳 Acepta tarjetas de crédito y débito',
                    '• 🏦 Transferencias bancarias',
                    '• 💰 Cuotas sin interés disponibles',
                    '• 🔒 Transacciones 100% seguras',
                    '• ⚡ Aprobación instantánea'
                ]
            };
        } else if (paymentMethod.slug === 'culqi') {
            return {
                icon: '🟢',
                title: 'Culqi',
                description: 'Te redirigiremos al checkout seguro de Culqi',
                features: [
                    '• ✅ Transacción protegida con cifrado SSL',
                    '• 💳 Acepta tarjetas Visa, Mastercard y más',
                    '• ⚡ Confirmación inmediata del pago',
                    '• 🔒 Datos protegidos según estándares PCI DSS'
                ]
            };
        }
        
        return {
            icon: '💳',
            title: paymentMethod.name,
            description: `Te redirigiremos al checkout seguro de ${paymentMethod.name}`,
            features: [
                '• 🔒 Transacción 100% segura',
                '• ⚡ Procesamiento inmediato',
                '• 💳 Múltiples métodos de pago'
            ]
        };
    };

    const gatewayInfo = getGatewayInfo();

    return (
        <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <span className="text-3xl">{gatewayInfo.icon}</span>
            </div>
            <div>
                <h3 className="text-lg font-semibold text-gray-900">Pago Seguro con {gatewayInfo.title}</h3>
                <p className="text-gray-600 mt-2">
                    {gatewayInfo.description} para completar tu pago de S/ {Number2Currency(amount)}
                </p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">🛡️ Procesamiento Seguro</h4>
                <ul className="text-sm text-blue-800 space-y-1 text-left">
                    {gatewayInfo.features.map((feature, index) => (
                        <li key={index}>{feature}</li>
                    ))}
                </ul>
            </div>            {paymentMethod.slug === 'mercadopago' && (
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">💡 Con MercadoPago puedes pagar con:</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm text-blue-800 mb-4">
                        <div>• Visa, Mastercard</div>
                        <div>• American Express</div>
                        <div>• Transferencias</div>
                        <div>• Cuotas sin interés</div>
                    </div>
                    
                    {/* Contenedor para el botón de MercadoPago SDK */}
                    <div className="mercadopago-button bg-white rounded-lg p-4 border-2 border-dashed border-blue-300 text-center min-h-[100px] flex items-center justify-center" style={{ display: 'none' }}>
                        <p className="text-blue-600">🔄 Cargando formulario de pago seguro...</p>
                    </div>
                </div>
            )}
            
            {/* Instrucciones para el usuario */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-900 mb-2">📝 ¿Qué sucede después?</h4>
                {paymentMethod.slug === 'mercadopago' ? (
                    <ol className="text-sm text-yellow-800 space-y-1">
                        <li>1. Al hacer clic en "Pagar con MercadoPago" se cargará el formulario de pago</li>
                        <li>2. Completa tus datos de pago de forma segura</li>
                        <li>3. El pago se procesará instantáneamente</li>
                        <li>4. Recibirás la confirmación en pantalla y por email</li>
                    </ol>
                ) : (
                    <ol className="text-sm text-yellow-800 space-y-1">
                        <li>1. Al hacer clic en "Procesar Pago" serás redirigido al gateway de pago seguro</li>
                        <li>2. Completa tu pago de forma segura</li>
                        <li>3. Serás redirigido de vuelta a nuestra tienda</li>
                        <li>4. Recibirás la confirmación por email</li>
                    </ol>
                )}
            </div>
        </div>
    );
}

// Componente para pagos QR (Yape, Plin)
function QRPaymentStep({ paymentMethod, amount, config, instructions, replaceVariables, colorClass }) {
    const copyToClipboard = (text, buttonId) => {
        navigator.clipboard.writeText(text);
        const button = document.getElementById(buttonId);
        const original = button.innerHTML;
        button.innerHTML = '✅ Copiado';
        setTimeout(() => button.innerHTML = original, 2000);
    };

    const getBgClass = () => {
        if (colorClass === 'purple') return 'from-purple-100 to-purple-50 border-purple-200';
        if (colorClass === 'blue') return 'from-blue-100 to-blue-50 border-blue-200';
        if (colorClass === 'green') return 'from-green-100 to-green-50 border-green-200';
        return 'from-gray-100 to-gray-50 border-gray-200';
    };

    const getTextClass = () => {
        if (colorClass === 'purple') return 'text-purple-700';
        if (colorClass === 'blue') return 'text-blue-700';
        if (colorClass === 'green') return 'text-green-700';
        return 'text-gray-700';
    };

    const getBtnClass = () => {
        if (colorClass === 'purple') return 'bg-purple-600 hover:bg-purple-700';
        if (colorClass === 'blue') return 'bg-blue-600 hover:bg-blue-700';
        if (colorClass === 'green') return 'bg-green-600 hover:bg-green-700';
        return 'bg-gray-600 hover:bg-gray-700';
    };

    const getBadgeClass = () => {
        if (colorClass === 'purple') return 'bg-purple-200 text-purple-800';
        if (colorClass === 'blue') return 'bg-blue-200 text-blue-800';
        if (colorClass === 'green') return 'bg-green-200 text-green-800';
        return 'bg-gray-200 text-gray-800';
    };

    return (
        <div className="space-y-4">
            {/* Número de teléfono destacado */}
            {config.phone_number && (
                <div className={`bg-gradient-to-r rounded-lg p-4 border-2 ${getBgClass()}`}>
                    <div className="text-center">
                        <p className={`text-sm font-medium mb-1 ${getTextClass()}`}>
                            📱 Número para {paymentMethod.name}
                        </p>
                        <p className={`text-3xl font-bold mb-2 ${getTextClass().replace('700', '900')}`}>
                            {config.phone_number}
                        </p>
                        {config.account_name && (
                            <p className={`text-sm mb-3 ${getTextClass().replace('700', '600')}`}>
                                A nombre de: <span className="font-medium">{config.account_name}</span>
                            </p>
                        )}
                        <button 
                            id="copy-phone"
                            onClick={() => copyToClipboard(config.phone_number, 'copy-phone')}
                            className={`${getBtnClass()} text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 mx-auto`}
                        >
                            <Copy size={16} />
                            Copiar Número
                        </button>
                    </div>
                </div>
            )}

            {/* Monto destacado */}
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-lg p-4">
                <div className="text-center">
                    <p className="text-yellow-800 font-medium text-lg mb-2">💰 Monto exacto a enviar</p>
                    <p className="text-4xl font-bold text-yellow-900">S/ {Number2Currency(amount)}</p>
                    <p className="text-sm text-yellow-700 mt-1">⚠️ Debe ser exacto para procesar automáticamente</p>
                </div>
            </div>

            {/* Código QR si existe */}
            {config.qr_code && (
                <div className="text-center bg-white rounded-lg p-4 border-2 border-dashed border-gray-300">
                    <div className="mb-3">
                        <div className="inline-flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full text-sm text-gray-600 mb-3">
                            <QrCode size={16} />
                            Código QR
                        </div>
                    </div>
                    <img 
                        src={`/storage/images/payment_method/${config.qr_code}`}
                        alt="Código QR"
                        className="mx-auto max-w-48 h-auto rounded-lg border shadow-lg"
                    />
                    <p className="text-sm text-gray-600 mt-3">
                        📱 Escanea con tu app de {paymentMethod.name}
                    </p>
                </div>
            )}

            {/* Pasos a seguir */}
            {instructions.steps && (
                <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                        📋 Pasos a seguir:
                    </h4>
                    <ol className="space-y-2">
                        {instructions.steps.slice(0, 4).map((step, index) => (
                            <li key={index} className="flex items-start gap-3">
                                <span className={`rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 ${getBadgeClass()}`}>
                                    {index + 1}
                                </span>
                                <span className="text-sm text-gray-700" dangerouslySetInnerHTML={{ 
                                    __html: replaceVariables(step) 
                                }} />
                            </li>
                        ))}
                    </ol>
                </div>
            )}
        </div>
    );
}

// Componente para transferencias bancarias
function BankTransferStep({ paymentMethod, amount, config, instructions, replaceVariables, colorClass }) {
    const copyToClipboard = (text, buttonId) => {
        navigator.clipboard.writeText(text);
        const button = document.getElementById(buttonId);
        const original = button.innerHTML;
        button.innerHTML = '✅ Copiado';
        setTimeout(() => button.innerHTML = original, 2000);
    };

    const getBgClass = () => {
        if (colorClass === 'green') return 'from-green-100 to-green-50 border-green-200';
        if (colorClass === 'blue') return 'from-blue-100 to-blue-50 border-blue-200';
        if (colorClass === 'purple') return 'from-purple-100 to-purple-50 border-purple-200';
        return 'from-gray-100 to-gray-50 border-gray-200';
    };

    const getTextClass = () => {
        if (colorClass === 'green') return 'text-green-800';
        if (colorClass === 'blue') return 'text-blue-800';
        if (colorClass === 'purple') return 'text-purple-800';
        return 'text-gray-800';
    };

    return (
        <div className="space-y-4">
            {/* Datos bancarios */}
            <div className={`bg-gradient-to-r rounded-lg p-4 border-2 ${getBgClass()}`}>
                <h4 className={`font-semibold mb-3 flex items-center gap-2 ${getTextClass()}`}>
                    <Building2 size={20} />
                    Datos para Transferencia
                </h4>

                <div className="grid grid-cols-1 gap-3">
                    {config.bank_name && (
                        <div className="bg-white rounded-lg p-3 border border-gray-200">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Banco:</span>
                                <span className="font-bold text-gray-900">{config.bank_name}</span>
                            </div>
                        </div>
                    )}
                    
                    {config.account_number && (
                        <div className="bg-white rounded-lg p-3 border border-gray-200">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">N° Cuenta:</span>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-gray-900 font-mono">{config.account_number}</span>
                                    <button 
                                        id="copy-account"
                                        onClick={() => copyToClipboard(config.account_number, 'copy-account')}
                                        className="text-blue-600 hover:text-blue-800 transition-colors"
                                    >
                                        <Copy size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {config.cci && (
                        <div className="bg-white rounded-lg p-3 border border-gray-200">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">CCI:</span>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-gray-900 font-mono">{config.cci}</span>
                                    <button 
                                        id="copy-cci"
                                        onClick={() => copyToClipboard(config.cci, 'copy-cci')}
                                        className="text-blue-600 hover:text-blue-800 transition-colors"
                                    >
                                        <Copy size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {config.account_holder && (
                        <div className="bg-white rounded-lg p-3 border border-gray-200">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Titular:</span>
                                <span className="font-bold text-gray-900">{config.account_holder}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Monto a transferir */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-4">
                <div className="text-center">
                    <p className="text-blue-800 font-medium text-lg mb-2">💸 Monto a transferir</p>
                    <p className="text-4xl font-bold text-blue-900">S/ {Number2Currency(amount)}</p>
                    <p className="text-sm text-blue-700 mt-1">Incluye todos los cargos</p>
                </div>
            </div>
        </div>
    );
}

// Componente para subir comprobante
function UploadProofStep({ onFileUpload, paymentProof }) {
    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            onFileUpload(e);
        }
    };

    return (
        <div className="space-y-4">
            <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Upload size={32} className="text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Sube tu Comprobante</h3>
                <p className="text-gray-600">
                    Sube una imagen clara de tu comprobante de pago para validar la transacción
                </p>
            </div>

            {/* Zona de subida */}
            <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
                paymentProof 
                    ? 'border-green-300 bg-green-50' 
                    : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
            }`}>
                {!paymentProof ? (
                    <div>
                        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <div className="space-y-2">
                            <label htmlFor="payment-proof-modal" className="cursor-pointer">
                                <span className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium inline-block">
                                    Seleccionar Archivo
                                </span>
                                <input
                                    id="payment-proof-modal"
                                    type="file"
                                    className="hidden"
                                    accept="image/*,.pdf"
                                    onChange={handleFileUpload}
                                />
                            </label>
                            <p className="text-sm text-gray-500">
                                PNG, JPG o PDF hasta 5MB
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="flex items-center justify-center gap-3">
                            <CheckCircle className="text-green-600" size={24} />
                            <span className="text-green-800 font-medium">Archivo cargado: {paymentProof.name}</span>
                        </div>
                        <p className="text-xs text-green-600">
                            {(paymentProof.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                    </div>
                )}
            </div>

            {/* Tips */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h5 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                    <AlertCircle size={16} />
                    Asegúrate que tu comprobante incluya:
                </h5>
                <ul className="text-sm text-blue-800 space-y-1">
                    <li>• ✅ Monto transferido claramente visible</li>
                    <li>• ✅ Fecha y hora de la transacción</li>
                    <li>• ✅ Número de operación (si está disponible)</li>
                    <li>• ✅ Datos del destinatario</li>
                </ul>
            </div>
        </div>
    );
}

// Componente de validación
function ValidationStep({ paymentMethod }) {
    return (
        <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
                <Clock size={40} className="text-yellow-600 animate-spin" />
            </div>
            <div>
                <h3 className="text-lg font-semibold text-gray-900">Validando tu Pago</h3>
                <p className="text-gray-600 mt-2">
                    Tu comprobante está siendo revisado por nuestro equipo. Este proceso puede tomar algunos minutos.
                </p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-900 mb-2">⏱️ Tiempo de Validación</h4>
                <ul className="text-sm text-yellow-800 space-y-1">
                    <li>• 🔄 {paymentMethod.name}: 5-15 minutos</li>
                    <li>• 📧 Recibirás confirmación por email</li>
                    <li>• 📱 También te notificaremos por WhatsApp</li>
                    <li>• 🎯 Tu pedido se procesará automáticamente</li>
                </ul>
            </div>
        </div>
    );
}

// Componente de éxito
function SuccessStep() {
    return (
        <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle size={40} className="text-green-600" />
            </div>
            <div>
                <h3 className="text-lg font-semibold text-gray-900">¡Pago Exitoso!</h3>
                <p className="text-gray-600 mt-2">
                    Tu pago ha sido procesado correctamente. Ahora puedes continuar con tu pedido.
                </p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-900 mb-2">✅ Próximos Pasos</h4>
                <ul className="text-sm text-green-800 space-y-1">
                    <li>• 📧 Recibirás confirmación por email</li>
                    <li>• 📦 Tu pedido entrará en proceso de preparación</li>
                    <li>• 🚚 Te notificaremos cuando esté listo para envío</li>
                    <li>• 📱 Podrás rastrear tu pedido en todo momento</li>
                </ul>
            </div>
        </div>
    );
}
