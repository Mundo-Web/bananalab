/**
 * API para manejar diferentes métodos de pago dinámicamente
 */

import { toast } from 'sonner';

class PaymentMethodsAPI {
    constructor() {
        this.baseURL = '/api/payments';
    }

    /**
     * Obtener métodos de pago disponibles
     */
    async getPaymentMethods() {
        try {
            const response = await fetch(`${this.baseURL}/methods`);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data?.message ?? 'Error obteniendo métodos de pago');
            }

            return data;
        } catch (error) {
            console.error('Error fetching payment methods:', error);
            throw error;
        }
    }

    /**
     * Procesar pago dinámicamente
     */
    async processPayment(paymentData, paymentProof = null) {
        try {
            // Validar datos antes de enviar
            this.validatePaymentData(paymentData);

            const formData = new FormData();
            
            // Agregar datos del pago
            Object.keys(paymentData).forEach(key => {
                if (paymentData[key] !== null && paymentData[key] !== undefined) {
                    if (typeof paymentData[key] === 'object' && key !== 'cart') {
                        formData.append(key, JSON.stringify(paymentData[key]));
                    } else if (key === 'cart' && Array.isArray(paymentData[key])) {
                        formData.append(key, JSON.stringify(paymentData[key]));
                    } else {
                        formData.append(key, paymentData[key]);
                    }
                }
            });

            // Agregar comprobante si existe
            if (paymentProof) {
                formData.append('payment_proof', paymentProof);
            }

            const response = await fetch(`${this.baseURL}/process`, {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
                },
                body: formData
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data?.message ?? 'Error procesando el pago');
            }

            return data;
        } catch (error) {
            console.error('Error processing payment:', error);
            throw error;
        }
    }

    /**
     * Validar formato de datos de pago
     */
    validatePaymentData(paymentData) {
        const requiredFields = [
            'user_id', 'amount', 'cart', 'email', 'name', 'lastname',
            'department', 'province', 'district', 'address', 'reference',
            'payment_method'
        ];

        const missing = requiredFields.filter(field => !paymentData[field]);
        
        if (missing.length > 0) {
            throw new Error(`Campos requeridos faltantes: ${missing.join(', ')}`);
        }

        // Validar email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(paymentData.email)) {
            throw new Error('Email no válido');
        }

        // Validar monto
        if (isNaN(paymentData.amount) || paymentData.amount <= 0) {
            throw new Error('Monto no válido');
        }

        // Validar carrito
        if (!Array.isArray(paymentData.cart) || paymentData.cart.length === 0) {
            throw new Error('Carrito vacío o no válido');
        }

        return true;
    }

    /**
     * Calcular comisión para un método de pago
     */
    calculateFee(amount, feePercentage = 0, feeFixed = 0) {
        const percentageFee = (amount * feePercentage) / 100;
        const totalFee = percentageFee + feeFixed;
        return Math.round(totalFee * 100) / 100; // Redondear a 2 decimales
    }

    /**
     * Formatear monto con comisiones incluidas
     */
    formatAmountWithFees(amount, paymentMethod) {
        if (!paymentMethod) return { total: amount, fee: 0 };
        
        const fee = this.calculateFee(amount, paymentMethod.fee_percentage, paymentMethod.fee_fixed);
        const total = amount + fee;
        
        return {
            original: amount,
            fee: fee,
            total: total
        };
    }    /**
     * Mostrar notificación de éxito
     */
    showSuccessNotification(message = 'Pago procesado exitosamente') {
        toast.success("Pago Exitoso", {
            description: message,
            duration: 4000,
        });
    }    /**
     * Mostrar notificación de error
     */
    showErrorNotification(message = 'Error procesando el pago') {
        toast.error("Error en el Pago", {
            description: message,
            duration: 5000,
        });
    }
}

// Crear instancia singleton
const paymentAPI = new PaymentMethodsAPI();

// Funciones legacy mantenidas por compatibilidad
export const processMercadoPagoPayment = async (request) => {
    try {
        const response = await fetch('/api/mercadopago/preference', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
            },
            body: JSON.stringify(request)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
          if (data.status && data.redirect_url) {
            toast.info("Redirigiendo a MercadoPago", {
                description: "Te estamos redirigiendo al checkout seguro de MercadoPago...",
                duration: 1500,
            });
            
            setTimeout(() => {
                window.location.href = data.redirect_url;
            }, 1500);
            
            return data;
        }
        
        return data;
    } catch (error) {
        console.error('Error processing MercadoPago payment:', error);
        throw error;
    }
};

// Procesar pago manual (Yape/Transferencia)
export const processManualPayment = async (formData) => {
    try {
        const response = await fetch('/api/payments/manual', {
            method: 'POST',
            headers: {
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
            },
            body: formData
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error processing manual payment:', error);
        throw error;
    }
};

// Obtener información de métodos de pago disponibles
export const getPaymentMethods = async () => {
    try {
        const response = await fetch('/api/payments/methods', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching payment methods:', error);
        throw error;
    }
};

// Validar comprobante de pago
export const validatePaymentProof = async (orderId, status, notes = '') => {
    try {
        const response = await fetch('/api/payments/validate-proof', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
            },
            body: JSON.stringify({
                order_id: orderId,
                status: status, // 'approved', 'rejected'
                admin_notes: notes
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();    } catch (error) {
        console.error('Error validating payment proof:', error);
        throw error;
    }
};

// Exportar la nueva API como default y las funciones legacy como named exports
export default paymentAPI;

// También exportar la clase para casos específicos
export { PaymentMethodsAPI };