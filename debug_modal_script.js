// Script de debug para pegar en la consola del navegador
// Ejecutar en la página del checkout

console.log('🔧 SCRIPT DE DEBUG MERCADOPAGO INICIADO');

// 1. Verificar que el SDK de MercadoPago esté cargado
console.log('1. SDK MercadoPago:', typeof window.MercadoPago !== 'undefined' ? '✅ Cargado' : '❌ No cargado');

// 2. Verificar el estado de React (si está disponible)
if (typeof window.React !== 'undefined') {
    console.log('2. React:', '✅ Disponible');
} else {
    console.log('2. React:', '❌ No disponible globalmente');
}

// 3. Buscar elementos del formulario de checkout
const checkoutForm = document.querySelector('form');
console.log('3. Formulario checkout:', checkoutForm ? '✅ Encontrado' : '❌ No encontrado');

// 4. Buscar botón de pago
const paymentButtons = document.querySelectorAll('button');
console.log('4. Botones encontrados:', paymentButtons.length);

// 5. Verificar si hay algún modal abierto
const modals = document.querySelectorAll('[class*="modal"], [class*="fixed"], [class*="z-"]');
console.log('5. Elementos tipo modal:', modals.length);

// 6. Verificar estilos que puedan estar ocultando el modal
function checkModalVisibility() {
    const possibleModals = document.querySelectorAll('[style*="z-index"], [class*="z-"]');
    possibleModals.forEach((el, index) => {
        const styles = window.getComputedStyle(el);
        if (styles.position === 'fixed' || styles.position === 'absolute') {
            console.log(`Modal candidato ${index}:`, {
                element: el,
                display: styles.display,
                visibility: styles.visibility,
                opacity: styles.opacity,
                zIndex: styles.zIndex,
                position: styles.position
            });
        }
    });
}

// 7. Función para forzar la apertura del modal (si está disponible)
function forceOpenModal() {
    // Buscar elementos con texto relacionado a MercadoPago
    const mpElements = document.querySelectorAll('*');
    mpElements.forEach(el => {
        if (el.textContent && el.textContent.toLowerCase().includes('mercadopago')) {
            console.log('Elemento MercadoPago encontrado:', el);
        }
    });
}

// Ejecutar verificaciones
checkModalVisibility();
forceOpenModal();

// 8. Monitorear cambios en el DOM para detectar cuando aparezca el modal
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    // Buscar si el nodo agregado contiene "mercadopago" o es un modal
                    if (node.querySelector && node.querySelector('[class*="modal"], [class*="fixed"]')) {
                        console.log('🎯 Nuevo modal detectado:', node);
                    }
                    if (node.textContent && node.textContent.toLowerCase().includes('mercadopago')) {
                        console.log('🎯 Nuevo elemento MercadoPago:', node);
                    }
                }
            });
        }
    });
});

// Iniciar observación
observer.observe(document.body, {
    childList: true,
    subtree: true
});

console.log('🔧 Observador de DOM iniciado. Realizaré log de cualquier modal que aparezca.');
console.log('🔧 Para detener el observador, ejecuta: observer.disconnect()');

// 9. Función de utilidad para simular click en botón de pago
function simulatePaymentClick() {
    const buttons = document.querySelectorAll('button');
    buttons.forEach((btn, index) => {
        if (btn.textContent && (
            btn.textContent.toLowerCase().includes('pagar') || 
            btn.textContent.toLowerCase().includes('mercadopago') ||
            btn.textContent.toLowerCase().includes('tarjeta')
        )) {
            console.log(`Botón de pago encontrado ${index}:`, btn.textContent, btn);
        }
    });
}

simulatePaymentClick();

console.log('🔧 SCRIPT DE DEBUG COMPLETADO');
console.log('💡 Ahora intenta hacer clic en el botón de pago y revisa los logs en la consola');
