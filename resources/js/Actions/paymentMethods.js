/**
 * Funciones para manejar diferentes métodos de pago
 */

// Procesar pago con MercadoPago
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
        
        // Si el pago fue exitoso, redirigir a MercadoPago
        if (data.status && data.redirect_url) {
            // Mostrar mensaje de redirección
            if (window.Notify) {
                window.Notify.add({
                    icon: "/assets/img/icon.svg",
                    title: "Redirigiendo a MercadoPago",
                    body: "Te estamos redirigiendo al checkout seguro de MercadoPago...",
                    type: "info",
                });
            }
            
            // Redirigir después de un breve delay
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

        return await response.json();
    } catch (error) {
        console.error('Error validating payment proof:', error);
        throw error;
    }
};
