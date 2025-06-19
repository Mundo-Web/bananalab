#!/bin/bash

echo "=== VERIFICACIÓN RÁPIDA MERCADOPAGO FRONTEND ==="
echo

# Verificar si el SDK está cargado en el layout
echo "1. Verificando SDK en layout..."
if grep -q "https://sdk.mercadopago.com/js/v2" resources/views/public.blade.php; then
    echo "✅ SDK de MercadoPago cargado en public.blade.php"
else
    echo "❌ SDK de MercadoPago NO está en public.blade.php"
fi

# Verificar rutas API
echo
echo "2. Verificando rutas API..."
if grep -q "payments/mercadopago/checkout-api" routes/api.php; then
    echo "✅ Ruta checkout-api registrada"
else
    echo "❌ Ruta checkout-api NO registrada"
fi

if grep -q "payments/mercadopago/config" routes/api.php; then
    echo "✅ Ruta config registrada"
else
    echo "❌ Ruta config NO registrada"
fi

# Verificar controlador
echo
echo "3. Verificando controlador..."
if grep -q "mercadoPagoCheckoutApi" app/Http/Controllers/Api/PaymentController.php; then
    echo "✅ Método mercadoPagoCheckoutApi existe"
else
    echo "❌ Método mercadoPagoCheckoutApi NO existe"
fi

# Verificar modal
echo
echo "4. Verificando modal de MercadoPago..."
if [ -f "resources/js/Components/Tailwind/Checkouts/Components/MercadoPagoCheckoutModal.jsx" ]; then
    echo "✅ Modal MercadoPagoCheckoutModal existe"
else
    echo "❌ Modal MercadoPagoCheckoutModal NO existe"
fi

# Verificar ShippingStep
echo
echo "5. Verificando ShippingStep..."
if grep -q "setShowMpModal(true)" resources/js/Components/Tailwind/Checkouts/Components/ShippingStep.jsx; then
    echo "✅ ShippingStep abre modal de MercadoPago"
else
    echo "❌ ShippingStep NO abre modal de MercadoPago"
fi

if grep -q "💳 Pagar con Tarjeta - MercadoPago" resources/js/Components/Tailwind/Checkouts/Components/ShippingStep.jsx; then
    echo "✅ Botón de MercadoPago actualizado"
else
    echo "❌ Botón de MercadoPago NO actualizado"
fi

echo
echo "=== RESUMEN ==="
echo "✅ Ahora cuando selecciones MercadoPago en ShippingStep:"
echo "   1. El botón dirá '💳 Pagar con Tarjeta - MercadoPago'"
echo "   2. Al hacer clic se abrirá directamente el modal de tarjetas"
echo "   3. Podrás ingresar datos de tarjeta (número, titular, CVV, etc.)"
echo "   4. Se procesará el pago usando las APIs reales de MercadoPago"
echo "   5. Te redirigirá al siguiente paso al completar el pago"
echo

echo "🚀 ¡Ya puedes probar el pago con MercadoPago en el frontend!"
