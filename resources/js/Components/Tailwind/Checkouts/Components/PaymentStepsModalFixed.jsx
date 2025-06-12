import { useState, useEffect } from "react";
import { X, ChevronRight, ChevronLeft, CheckCircle, Clock, Copy, Upload, AlertCircle, QrCode, CreditCard, Smartphone, Building2 } from "lucide-react";
import Number2Currency from "../../../../Utils/Number2Currency";

export default function PaymentStepsModalFixed({ 
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
    const [mercadoPagoLoading, setMercadoPagoLoading] = useState(false);

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
            cci: config.cci || '',
            holder_name: config.holder_name || '',
        };

        let result = text;
        Object.entries(variables).forEach(([key, value]) => {
            const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
            result = result.replace(regex, value);
        });

        return result;
    };

    // Función para manejar MercadoPago con redirección directa
    const handleMercadoPagoPayment = async () => {
        try {
            setMercadoPagoLoading(true);
            console.log('Iniciando proceso de pago MercadoPago...');            // Crear preferencia
            const preferenceResponse = await fetch('http://localhost:8000/api/mercadopago/preference', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                },
                body: JSON.stringify({
                    amount: amount,
                    title: 'Compra BananaLab',
                    description: 'Productos BananaLab',
                    checkout_data: checkoutData
                })
            });

            if (!preferenceResponse.ok) {
                throw new Error(`Error ${preferenceResponse.status}: ${preferenceResponse.statusText}`);
            }            const preferenceData = await preferenceResponse.json();
            console.log('Preferencia creada:', preferenceData);            if (preferenceData.status && (preferenceData.init_point || preferenceData.sandbox_init_point)) {
                // Usar sandbox_init_point para cuentas de prueba o init_point para producción
                const redirectUrl = preferenceData.sandbox_init_point || preferenceData.init_point;
                const isSandbox = !!preferenceData.sandbox_init_point;
                console.log(`Redirigiendo a MercadoPago (${isSandbox ? 'SANDBOX' : 'PRODUCCIÓN'}):`, redirectUrl);
                window.location.href = redirectUrl;
            } else {
                throw new Error(preferenceData.message || 'Error al crear la preferencia de pago');
            }
        } catch (error) {
            console.error('Error en pago MercadoPago:', error);
            setMercadoPagoLoading(false);
            alert('Error al procesar el pago: ' + error.message);
        }
    };

    const handleCopyText = (text) => {
        navigator.clipboard.writeText(text);
        // Aquí podrías agregar un toast de confirmación
    };

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (file && onFileUpload) {
            onFileUpload(file);
        }
    };

    const handleNextStep = () => {
        setCompletedSteps([...completedSteps, currentStep]);
        setCurrentStep(currentStep + 1);
    };

    const handlePaymentComplete = () => {
        setIsProcessing(true);
        setTimeout(() => {
            onPaymentSuccess();
            onClose();
        }, 2000);
    };

    const renderStepContent = () => {
        const step = currentStep;

        // MercadoPago Gateway
        if (paymentMethod.slug === 'mercadopago' && paymentMethod.type === 'gateway') {
            if (step === 1) {
                return (
                    <div className="space-y-6">
                        <div className="text-center">
                            <div className={`inline-flex items-center justify-center w-16 h-16 bg-${colorClass}-100 rounded-full mb-4`}>
                                {getMethodIcon(paymentMethod.type)}
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                Pago con {paymentMethod.name}
                            </h3>
                            <p className="text-gray-600 mb-6">
                                Serás redirigido a MercadoPago para completar tu pago de forma segura
                            </p>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Total a pagar:</span>
                                <span className="text-2xl font-bold text-gray-900">
                                    S/ {Number2Currency(amount)}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-start space-x-3">
                                <CheckCircle size={20} className="text-green-500 mt-0.5" />
                                <span className="text-sm text-gray-600">
                                    Pago 100% seguro con encriptación SSL
                                </span>
                            </div>
                            <div className="flex items-start space-x-3">
                                <CheckCircle size={20} className="text-green-500 mt-0.5" />
                                <span className="text-sm text-gray-600">
                                    Acepta tarjetas de crédito, débito y otros métodos
                                </span>
                            </div>
                            <div className="flex items-start space-x-3">
                                <CheckCircle size={20} className="text-green-500 mt-0.5" />
                                <span className="text-sm text-gray-600">
                                    Confirmación inmediata del pago
                                </span>
                            </div>
                        </div>

                        <button
                            onClick={handleMercadoPagoPayment}
                            disabled={mercadoPagoLoading}
                            className={`w-full bg-${colorClass}-600 hover:bg-${colorClass}-700 disabled:bg-gray-400 text-white py-3 px-6 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2`}
                        >
                            {mercadoPagoLoading ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    <span>Procesando...</span>
                                </>
                            ) : (
                                <>
                                    <CreditCard size={20} />
                                    <span>Pagar con MercadoPago</span>
                                    <ChevronRight size={20} />
                                </>
                            )}
                        </button>
                    </div>
                );
            }
        }

        // QR Code payments
        if (paymentMethod.type === 'qr') {
            if (step === 1) {
                return (
                    <div className="space-y-6">
                        <div className="text-center">
                            <div className={`inline-flex items-center justify-center w-16 h-16 bg-${colorClass}-100 rounded-full mb-4`}>
                                {getMethodIcon(paymentMethod.type)}
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                Pago con {paymentMethod.name}
                            </h3>
                            <p className="text-gray-600 mb-6">
                                Escanea el código QR con tu aplicación móvil
                            </p>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-gray-600">Total a pagar:</span>
                                <span className="text-2xl font-bold text-gray-900">
                                    S/ {Number2Currency(amount)}
                                </span>
                            </div>
                        </div>

                        {config.qr_image && (
                            <div className="text-center">
                                <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-lg">
                                    <img 
                                        src={config.qr_image} 
                                        alt="Código QR" 
                                        className="w-48 h-48 mx-auto"
                                    />
                                </div>
                            </div>
                        )}

                        {instructions.step1 && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <div className="flex items-start space-x-3">
                                    <QrCode size={20} className="text-blue-600 mt-0.5" />
                                    <div>
                                        <h4 className="font-medium text-blue-900 mb-1">Instrucciones:</h4>
                                        <p className="text-sm text-blue-800">
                                            {replaceVariables(instructions.step1)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={handleNextStep}
                            className={`w-full bg-${colorClass}-600 hover:bg-${colorClass}-700 text-white py-3 px-6 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2`}
                        >
                            <span>He realizado el pago</span>
                            <ChevronRight size={20} />
                        </button>
                    </div>
                );
            }

            if (step === 2) {
                return (
                    <div className="space-y-6">
                        <div className="text-center">
                            <div className={`inline-flex items-center justify-center w-16 h-16 bg-${colorClass}-100 rounded-full mb-4`}>
                                <Upload size={24} className={`text-${colorClass}-600`} />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                Comprobante de pago
                            </h3>
                            <p className="text-gray-600 mb-6">
                                Sube tu comprobante para confirmar el pago
                            </p>
                        </div>

                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                            <input
                                type="file"
                                id="payment-proof"
                                className="hidden"
                                accept="image/*,.pdf"
                                onChange={handleFileUpload}
                            />
                            <label htmlFor="payment-proof" className="cursor-pointer">
                                <Upload size={48} className="mx-auto text-gray-400 mb-4" />
                                <p className="text-gray-600 mb-2">
                                    Haz clic para subir tu comprobante
                                </p>
                                <p className="text-sm text-gray-500">
                                    PNG, JPG o PDF (máx. 10MB)
                                </p>
                            </label>
                        </div>

                        {paymentProof && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <div className="flex items-center space-x-3">
                                    <CheckCircle size={20} className="text-green-600" />
                                    <span className="text-green-800">
                                        Comprobante subido: {paymentProof.name}
                                    </span>
                                </div>
                            </div>
                        )}

                        <div className="flex space-x-3">
                            <button
                                onClick={() => setCurrentStep(1)}
                                className="flex-1 border border-gray-300 text-gray-700 py-3 px-6 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                            >
                                <ChevronLeft size={20} />
                                <span>Volver</span>
                            </button>
                            <button
                                onClick={handlePaymentComplete}
                                disabled={!paymentProof || isProcessing}
                                className={`flex-1 bg-${colorClass}-600 hover:bg-${colorClass}-700 disabled:bg-gray-400 text-white py-3 px-6 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2`}
                            >
                                {isProcessing ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                        <span>Procesando...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Confirmar Pago</span>
                                        <CheckCircle size={20} />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                );
            }
        }

        // Manual payments (Bank transfers, etc.)
        if (paymentMethod.type === 'manual') {
            if (step === 1) {
                return (
                    <div className="space-y-6">
                        <div className="text-center">
                            <div className={`inline-flex items-center justify-center w-16 h-16 bg-${colorClass}-100 rounded-full mb-4`}>
                                {getMethodIcon(paymentMethod.type)}
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                {paymentMethod.name}
                            </h3>
                            <p className="text-gray-600 mb-6">
                                Realiza tu transferencia con los siguientes datos
                            </p>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-gray-600">Total a pagar:</span>
                                <span className="text-2xl font-bold text-gray-900">
                                    S/ {Number2Currency(amount)}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {config.bank_name && (
                                <div className="bg-white border border-gray-200 rounded-lg p-4">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <span className="text-sm text-gray-500">Banco</span>
                                            <p className="font-medium text-gray-900">{config.bank_name}</p>
                                        </div>
                                        <button
                                            onClick={() => handleCopyText(config.bank_name)}
                                            className="text-blue-600 hover:text-blue-700"
                                        >
                                            <Copy size={20} />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {config.account_number && (
                                <div className="bg-white border border-gray-200 rounded-lg p-4">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <span className="text-sm text-gray-500">Número de cuenta</span>
                                            <p className="font-medium text-gray-900">{config.account_number}</p>
                                        </div>
                                        <button
                                            onClick={() => handleCopyText(config.account_number)}
                                            className="text-blue-600 hover:text-blue-700"
                                        >
                                            <Copy size={20} />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {config.cci && (
                                <div className="bg-white border border-gray-200 rounded-lg p-4">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <span className="text-sm text-gray-500">CCI</span>
                                            <p className="font-medium text-gray-900">{config.cci}</p>
                                        </div>
                                        <button
                                            onClick={() => handleCopyText(config.cci)}
                                            className="text-blue-600 hover:text-blue-700"
                                        >
                                            <Copy size={20} />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {config.holder_name && (
                                <div className="bg-white border border-gray-200 rounded-lg p-4">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <span className="text-sm text-gray-500">Titular</span>
                                            <p className="font-medium text-gray-900">{config.holder_name}</p>
                                        </div>
                                        <button
                                            onClick={() => handleCopyText(config.holder_name)}
                                            className="text-blue-600 hover:text-blue-700"
                                        >
                                            <Copy size={20} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {instructions.step1 && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <div className="flex items-start space-x-3">
                                    <AlertCircle size={20} className="text-blue-600 mt-0.5" />
                                    <div>
                                        <h4 className="font-medium text-blue-900 mb-1">Instrucciones importantes:</h4>
                                        <p className="text-sm text-blue-800">
                                            {replaceVariables(instructions.step1)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={handleNextStep}
                            className={`w-full bg-${colorClass}-600 hover:bg-${colorClass}-700 text-white py-3 px-6 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2`}
                        >
                            <span>He realizado la transferencia</span>
                            <ChevronRight size={20} />
                        </button>
                    </div>
                );
            }

            if (step === 2) {
                return (
                    <div className="space-y-6">
                        <div className="text-center">
                            <div className={`inline-flex items-center justify-center w-16 h-16 bg-${colorClass}-100 rounded-full mb-4`}>
                                <Upload size={24} className={`text-${colorClass}-600`} />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                Comprobante de transferencia
                            </h3>
                            <p className="text-gray-600 mb-6">
                                Sube tu voucher para confirmar la transferencia
                            </p>
                        </div>

                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                            <input
                                type="file"
                                id="payment-proof"
                                className="hidden"
                                accept="image/*,.pdf"
                                onChange={handleFileUpload}
                            />
                            <label htmlFor="payment-proof" className="cursor-pointer">
                                <Upload size={48} className="mx-auto text-gray-400 mb-4" />
                                <p className="text-gray-600 mb-2">
                                    Haz clic para subir tu voucher
                                </p>
                                <p className="text-sm text-gray-500">
                                    PNG, JPG o PDF (máx. 10MB)
                                </p>
                            </label>
                        </div>

                        {paymentProof && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <div className="flex items-center space-x-3">
                                    <CheckCircle size={20} className="text-green-600" />
                                    <span className="text-green-800">
                                        Voucher subido: {paymentProof.name}
                                    </span>
                                </div>
                            </div>
                        )}

                        <div className="flex space-x-3">
                            <button
                                onClick={() => setCurrentStep(1)}
                                className="flex-1 border border-gray-300 text-gray-700 py-3 px-6 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                            >
                                <ChevronLeft size={20} />
                                <span>Volver</span>
                            </button>
                            <button
                                onClick={handlePaymentComplete}
                                disabled={!paymentProof || isProcessing}
                                className={`flex-1 bg-${colorClass}-600 hover:bg-${colorClass}-700 disabled:bg-gray-400 text-white py-3 px-6 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2`}
                            >
                                {isProcessing ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                        <span>Procesando...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Confirmar Pago</span>
                                        <CheckCircle size={20} />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                );
            }
        }

        return null;
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
                    <h2 className="text-lg font-semibold text-gray-900">
                        Proceso de Pago
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6">
                    {renderStepContent()}
                </div>
            </div>
        </div>
    );
}
