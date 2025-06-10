import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import CreateReactScript from '../../Utils/CreateReactScript';

const PaymentInstructions = ({ paymentMethod, amount = 0 }) => {
    const [instructions, setInstructions] = useState(null);
    const [configuration, setConfiguration] = useState({});

    useEffect(() => {
        if (paymentMethod) {
            setInstructions(paymentMethod.instructions || {});
            setConfiguration(paymentMethod.configuration || {});
        }
    }, [paymentMethod]);

    if (!paymentMethod || !instructions) {
        return (
            <div className="alert alert-info">
                <i className="mdi mdi-information-outline me-2"></i>
                Selecciona un método de pago para ver las instrucciones.
            </div>
        );
    }

    const replaceVariables = (text) => {
        if (!text) return '';
        
        return text
            .replace(/{amount}/g, `S/ ${amount.toFixed(2)}`)
            .replace(/{phone_number}/g, configuration.phone_number || '[Número no configurado]')
            .replace(/{bank_name}/g, configuration.bank_name || '[Banco no configurado]')
            .replace(/{account_type}/g, configuration.account_type || '[Tipo de cuenta no configurado]')
            .replace(/{account_number}/g, configuration.account_number || '[Número de cuenta no configurado]')
            .replace(/{cci}/g, configuration.cci || '[CCI no configurado]')
            .replace(/{account_holder}/g, configuration.account_holder || '[Titular no configurado]')
            .replace(/{document_number}/g, configuration.document_number || '[Documento no configurado]')
            .replace(/{currency}/g, configuration.currency || 'PEN')
            .replace(/{contact_person}/g, configuration.contact_person || '[Contacto no configurado]')
            .replace(/{contact_phone}/g, configuration.contact_phone || '[Teléfono no configurado]')
            .replace(/{pickup_address}/g, configuration.pickup_address || '[Dirección no configurada]')
            .replace(/{pickup_hours}/g, configuration.pickup_hours || '[Horarios no configurados]')
            .replace(/{reference}/g, configuration.reference || '[Referencia no configurada]');
    };

    const renderQRCode = () => {
        if (!instructions.qr_display || !configuration.qr_code) return null;

        return (
            <div className="text-center mb-4">
                <div className="qr-container bg-light p-3 rounded border d-inline-block">
                    <img 
                        src={`/storage/payment_config/${configuration.qr_code}`}
                        alt={`Código QR ${paymentMethod.display_name}`}
                        className="img-fluid"
                        style={{ maxWidth: '200px', maxHeight: '200px' }}
                        onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'block';
                        }}
                    />
                    <div style={{ display: 'none' }} className="text-muted p-4">
                        <i className="mdi mdi-qrcode fs-1"></i>
                        <p className="mb-0">QR no disponible</p>
                    </div>
                </div>
                {instructions.show_phone && configuration.phone_number && (
                    <div className="mt-2">
                        <small className="text-muted">
                            O busca manualmente: <strong>{configuration.phone_number}</strong>
                        </small>
                    </div>
                )}
            </div>
        );
    };

    const renderInfoSection = (title, items) => {
        if (!items || items.length === 0) return null;

        return (
            <div className="mb-4">
                <h6 className="text-primary mb-3">
                    <i className="mdi mdi-information me-2"></i>
                    {title}
                </h6>
                <div className="info-list bg-light p-3 rounded">
                    {items.map((item, index) => (
                        <div key={index} className="mb-2" dangerouslySetInnerHTML={{ 
                            __html: replaceVariables(item) 
                        }} />
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="payment-instructions">
            <div className="card">
                <div className="card-header bg-primary text-white">
                    <h5 className="mb-0">
                        <i className={`mdi ${getPaymentIcon(paymentMethod.type)} me-2`}></i>
                        {instructions.title || `Instrucciones para ${paymentMethod.display_name}`}
                    </h5>
                </div>
                <div className="card-body">
                    {/* QR Code Section */}
                    {renderQRCode()}

                    {/* Amount Display */}
                    {amount > 0 && (
                        <div className="alert alert-success text-center mb-4">
                            <h4 className="mb-0">
                                <i className="mdi mdi-cash me-2"></i>
                                Monto a pagar: <strong>S/ {amount.toFixed(2)}</strong>
                            </h4>
                        </div>
                    )}

                    {/* Bank Information */}
                    {renderInfoSection('Datos bancarios', instructions.bank_info)}

                    {/* Contact Information */}
                    {renderInfoSection('Información de contacto', instructions.contact_info)}

                    {/* Account Information */}
                    {renderInfoSection('Datos de la cuenta', instructions.account_info)}

                    {/* Steps */}
                    {instructions.steps && instructions.steps.length > 0 && (
                        <div className="mb-4">
                            <h6 className="text-primary mb-3">
                                <i className="mdi mdi-format-list-numbered me-2"></i>
                                Pasos a seguir:
                            </h6>
                            <ol className="steps-list">
                                {instructions.steps.map((step, index) => (
                                    <li key={index} className="mb-2" dangerouslySetInnerHTML={{ 
                                        __html: replaceVariables(step) 
                                    }} />
                                ))}
                            </ol>
                        </div>
                    )}

                    {/* Custom Instructions */}
                    {configuration.instructions_text && (
                        <div className="mb-4">
                            <h6 className="text-primary mb-3">
                                <i className="mdi mdi-message-text me-2"></i>
                                Instrucciones adicionales:
                            </h6>
                            <div className="alert alert-info">
                                {configuration.instructions_text}
                            </div>
                        </div>
                    )}

                    {/* Important Note */}
                    {instructions.note && (
                        <div className="alert alert-warning">
                            <i className="mdi mdi-alert-circle-outline me-2"></i>
                            <strong>Importante:</strong> {replaceVariables(instructions.note)}
                        </div>
                    )}

                    {/* Payment Proof Requirement */}
                    {paymentMethod.requires_proof && (
                        <div className="alert alert-danger">
                            <i className="mdi mdi-camera me-2"></i>
                            <strong>Comprobante requerido:</strong> No olvides subir la imagen del comprobante de pago para completar tu pedido.
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
                .payment-instructions {
                    max-width: 600px;
                    margin: 0 auto;
                }
                
                .qr-container {
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }
                
                .info-list {
                    border-left: 4px solid #007bff;
                }
                
                .steps-list li {
                    padding: 8px 0;
                    border-bottom: 1px solid #eee;
                }
                
                .steps-list li:last-child {
                    border-bottom: none;
                }
                
                @media (max-width: 768px) {
                    .payment-instructions {
                        margin: 0 10px;
                    }
                    
                    .qr-container img {
                        max-width: 150px !important;
                        max-height: 150px !important;
                    }
                }
            `}</style>
        </div>
    );
};

const getPaymentIcon = (type) => {
    switch (type) {
        case 'qr': return 'mdi-qrcode';
        case 'manual': return 'mdi-bank';
        case 'gateway': return 'mdi-credit-card';
        default: return 'mdi-credit-card';
    }
};

CreateReactScript((el, properties) => {
    const { method, amount } = properties;
    
    createRoot(el).render(
        <PaymentInstructions 
            paymentMethod={method} 
            amount={amount || 0} 
            {...properties} 
        />
    );
});

export default PaymentInstructions;
