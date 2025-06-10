import React, { useState, useEffect } from 'react';
import { Check, X, Eye, FileText, Image } from 'lucide-react';

const PaymentProofValidation = () => {
    const [pendingSales, setPendingSales] = useState([]);
    const [selectedSale, setSelectedSale] = useState(null);
    const [loading, setLoading] = useState(true);
    const [validating, setValidating] = useState(false);

    useEffect(() => {
        fetchPendingSales();
    }, []);

    const fetchPendingSales = async () => {
        try {
            const response = await fetch('/api/admin/sales/pending-verification');
            const data = await response.json();
            setPendingSales(data.sales || []);
        } catch (error) {
            console.error('Error fetching pending sales:', error);
        } finally {
            setLoading(false);
        }
    };

    const validatePayment = async (saleId, status, notes = '') => {
        setValidating(true);
        try {
            const response = await fetch('/api/payments/validate-proof', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
                },
                body: JSON.stringify({
                    sale_id: saleId,
                    status: status,
                    admin_notes: notes
                })
            });

            const data = await response.json();
            
            if (data.status) {
                // Remover de la lista de pendientes
                setPendingSales(prev => prev.filter(sale => sale.id !== saleId));
                setSelectedSale(null);
                alert('Comprobante ' + (status === 'approved' ? 'aprobado' : 'rechazado') + ' exitosamente');
            } else {
                alert('Error: ' + data.message);
            }
        } catch (error) {
            console.error('Error validating payment:', error);
            alert('Error validando el comprobante');
        } finally {
            setValidating(false);
        }
    };

    const ViewPaymentProof = ({ sale }) => {
        const [notes, setNotes] = useState('');
        
        if (!sale.payment_proof_path) {
            return <div className="text-center text-gray-500">No hay comprobante disponible</div>;
        }

        const isImage = sale.payment_proof_path.match(/\.(jpg|jpeg|png|gif)$/i);
        const proofUrl = `/storage/${sale.payment_proof_path}`;

        return (
            <div className="space-y-4">
                <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-2">Información del Pedido</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div><strong>Código:</strong> {sale.code}</div>
                        <div><strong>Cliente:</strong> {sale.fullname}</div>
                        <div><strong>Email:</strong> {sale.email}</div>
                        <div><strong>Método:</strong> {sale.payment_method}</div>
                        <div><strong>Monto:</strong> S/ {sale.amount}</div>
                        <div><strong>Fecha:</strong> {new Date(sale.created_at).toLocaleDateString()}</div>
                    </div>
                </div>

                <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-4">Comprobante de Pago</h3>
                    
                    {isImage ? (
                        <img 
                            src={proofUrl} 
                            alt="Comprobante de pago" 
                            className="max-w-full h-auto border rounded"
                        />
                    ) : (
                        <div className="flex items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded">
                            <div className="text-center">
                                <FileText size={48} className="mx-auto text-gray-400 mb-2" />
                                <p className="text-gray-600">Archivo PDF</p>
                                <a 
                                    href={proofUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                >
                                    <Eye size={16} className="mr-2" />
                                    Ver PDF
                                </a>
                            </div>
                        </div>
                    )}
                </div>

                <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-2">Notas del Administrador</h3>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Agregar notas sobre la validación..."
                        className="w-full p-3 border rounded resize-none"
                        rows="3"
                    />
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={() => validatePayment(sale.id, 'approved', notes)}
                        disabled={validating}
                        className="flex items-center px-6 py-3 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                    >
                        <Check size={16} className="mr-2" />
                        {validating ? 'Procesando...' : 'Aprobar Pago'}
                    </button>
                    
                    <button
                        onClick={() => validatePayment(sale.id, 'rejected', notes)}
                        disabled={validating}
                        className="flex items-center px-6 py-3 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
                    >
                        <X size={16} className="mr-2" />
                        {validating ? 'Procesando...' : 'Rechazar Pago'}
                    </button>
                    
                    <button
                        onClick={() => setSelectedSale(null)}
                        className="px-6 py-3 bg-gray-500 text-white rounded hover:bg-gray-600"
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        );
    };

    if (loading) {
        return <div className="text-center py-8">Cargando comprobantes pendientes...</div>;
    }

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-2xl font-bold mb-6">Validación de Comprobantes de Pago</h1>
            
            {selectedSale ? (
                <ViewPaymentProof sale={selectedSale} />
            ) : (
                <div className="space-y-4">
                    {pendingSales.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            No hay comprobantes pendientes de validación
                        </div>
                    ) : (
                        pendingSales.map(sale => (
                            <div key={sale.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-center">
                                    <div className="grid grid-cols-4 gap-4 flex-1">
                                        <div>
                                            <strong>Código:</strong> {sale.code}
                                        </div>
                                        <div>
                                            <strong>Cliente:</strong> {sale.fullname}
                                        </div>
                                        <div>
                                            <strong>Método:</strong> 
                                            <span className="ml-1 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                                {sale.payment_method}
                                            </span>
                                        </div>
                                        <div>
                                            <strong>Monto:</strong> S/ {sale.amount}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setSelectedSale(sale)}
                                        className="flex items-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                    >
                                        <Eye size={16} className="mr-2" />
                                        Revisar
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default PaymentProofValidation;
