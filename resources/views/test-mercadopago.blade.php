<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test MercadoPago Checkout API</title>
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100 p-8">
    <div class="max-w-4xl mx-auto">
        <h1 class="text-3xl font-bold mb-8">Test MercadoPago Checkout API Integration</h1>
        
        <div class="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 class="text-xl font-semibold mb-4">1. Test API Configuration</h2>
            <button id="testConfig" class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                Test Config API
            </button>
            <div id="configResult" class="mt-4 p-4 bg-gray-50 rounded"></div>
        </div>

        <div class="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 class="text-xl font-semibold mb-4">2. Test Payment Processing</h2>
            <div class="grid grid-cols-2 gap-4 mb-4">
                <input type="text" id="cardNumber" placeholder="4509 9535 6623 3704" class="border rounded px-3 py-2">
                <input type="text" id="expirationDate" placeholder="11/25" class="border rounded px-3 py-2">
                <input type="text" id="securityCode" placeholder="123" class="border rounded px-3 py-2">
                <input type="text" id="cardholderName" placeholder="APRO" class="border rounded px-3 py-2">
            </div>
            <div class="grid grid-cols-2 gap-4 mb-4">
                <select id="identificationType" class="border rounded px-3 py-2">
                    <option value="DNI">DNI</option>
                    <option value="CI">CI</option>
                    <option value="LE">LE</option>
                </select>
                <input type="text" id="identificationNumber" placeholder="12345678" class="border rounded px-3 py-2">
            </div>
            <input type="email" id="email" placeholder="test@example.com" class="border rounded px-3 py-2 w-full mb-4">
            <input type="number" id="amount" placeholder="100" class="border rounded px-3 py-2 w-full mb-4" value="100">
            
            <button id="testPayment" class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
                Test Payment
            </button>
            <div id="paymentResult" class="mt-4 p-4 bg-gray-50 rounded"></div>
        </div>

        <div class="bg-white rounded-lg shadow-md p-6">
            <h2 class="text-xl font-semibold mb-4">3. Test Payment Methods API</h2>
            <button id="testPaymentMethods" class="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600">
                Test Payment Methods
            </button>
            <div id="paymentMethodsResult" class="mt-4 p-4 bg-gray-50 rounded"></div>
        </div>
    </div>

    <script src="https://secure.mlstatic.com/sdk/javascript/v1/mercadopago.js"></script>
    <script>
        let mp = null;
        
        // Inicializar MercadoPago
        async function initMercadoPago() {
            try {
                const response = await fetch('/api/mercadopago/config');
                const data = await response.json();
                
                if (data.status && data.config) {
                    window.Mercadopago.setPublishableKey(data.config.public_key);
                    mp = window.Mercadopago;
                    console.log('✅ MercadoPago SDK inicializado');
                    return data.config;
                } else {
                    throw new Error('No se pudo obtener la configuración');
                }
            } catch (error) {
                console.error('❌ Error inicializando MP:', error);
                throw error;
            }
        }

        // Test Config API
        document.getElementById('testConfig').addEventListener('click', async () => {
            const resultDiv = document.getElementById('configResult');
            resultDiv.innerHTML = '<div class="text-blue-500">Loading...</div>';
            
            try {
                const response = await fetch('/api/mercadopago/config');
                const data = await response.json();
                
                if (response.ok) {
                    resultDiv.innerHTML = `
                        <div class="text-green-600 font-semibold">✅ Config API Success</div>
                        <pre class="mt-2 text-sm">${JSON.stringify(data, null, 2)}</pre>
                    `;
                } else {
                    resultDiv.innerHTML = `
                        <div class="text-red-600 font-semibold">❌ Config API Error</div>
                        <pre class="mt-2 text-sm">${JSON.stringify(data, null, 2)}</pre>
                    `;
                }
            } catch (error) {
                resultDiv.innerHTML = `
                    <div class="text-red-600 font-semibold">❌ Network Error</div>
                    <div class="mt-2 text-sm">${error.message}</div>
                `;
            }
        });

        // Crear token de tarjeta
        async function createCardToken(cardData) {
            return new Promise((resolve, reject) => {
                if (!mp) {
                    reject(new Error('MercadoPago no está inicializado'));
                    return;
                }

                mp.createToken({
                    "card_number": cardData.cardNumber,
                    "security_code": cardData.securityCode,
                    "expiration_month": cardData.expirationMonth,
                    "expiration_year": cardData.expirationYear,
                    "cardholder": {
                        "name": cardData.cardholderName,
                        "identification": {
                            "type": cardData.identificationType,
                            "number": cardData.identificationNumber
                        }
                    }
                }, (status, response) => {
                    if (status === 200 || status === 201) {
                        resolve(response);
                    } else {
                        console.error('Error MP Token:', status, response);
                        reject(new Error(response.cause?.[0]?.description || 'Error creando token'));
                    }
                });
            });
        }

        // Test Payment Processing
        document.getElementById('testPayment').addEventListener('click', async () => {
            const resultDiv = document.getElementById('paymentResult');
            resultDiv.innerHTML = '<div class="text-blue-500">Processing payment...</div>';

            try {
                // Inicializar MP si no está listo
                if (!mp) {
                    await initMercadoPago();
                }

                // Crear datos de la tarjeta
                const cardData = {
                    cardNumber: document.getElementById('cardNumber').value.replace(/\s/g, '') || '4509953566233704',
                    securityCode: document.getElementById('securityCode').value || '123',
                    expirationMonth: document.getElementById('expirationDate').value.split('/')[0] || '11',
                    expirationYear: '20' + (document.getElementById('expirationDate').value.split('/')[1] || '25'),
                    cardholderName: document.getElementById('cardholderName').value || 'APRO',
                    identificationType: document.getElementById('identificationType').value,
                    identificationNumber: document.getElementById('identificationNumber').value || '12345678'
                };

                console.log('Creando token con:', cardData);

                // Crear token
                const token = await createCardToken(cardData);
                console.log('Token creado:', token);

                // Preparar datos del pago
                const paymentData = {
                    token: token.id,
                    payment_method_id: token.payment_method_id,
                    issuer_id: token.issuer_id || null,
                    installments: 1,
                    amount: parseFloat(document.getElementById('amount').value) || 100,
                    email: document.getElementById('email').value || 'test@example.com',
                    identification_type: cardData.identificationType,
                    identification_number: cardData.identificationNumber,
                    cardholder_name: cardData.cardholderName,
                    description: 'Test payment from API test page',
                    // Datos mínimos para el checkout
                    name: 'Test',
                    lastname: 'User',
                    phone: '999999999',
                    country: 'PE',
                    department: 'Lima',
                    province: 'Lima',
                    district: 'Miraflores',
                    address: 'Test Address 123',
                    cart: JSON.stringify([{
                        id: 1,
                        name: 'Test Product',
                        price: parseFloat(document.getElementById('amount').value) || 100,
                        quantity: 1
                    }])
                };

                const response = await fetch('/api/mercadopago/checkout-api', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                    },
                    body: JSON.stringify(paymentData)
                });
                
                const data = await response.json();
                
                if (response.ok && data.status) {
                    resultDiv.innerHTML = `
                        <div class="text-green-600 font-semibold">✅ Payment Success</div>
                        <div class="mt-2">
                            <strong>Payment ID:</strong> ${data.payment_id || 'N/A'}<br>
                            <strong>Status:</strong> ${data.payment_status || 'N/A'}<br>
                            <strong>Amount:</strong> $${data.amount || 'N/A'}<br>
                            <strong>Order:</strong> ${data.code || 'N/A'}
                        </div>
                        <pre class="mt-2 text-sm">${JSON.stringify(data, null, 2)}</pre>
                    `;
                } else {
                    resultDiv.innerHTML = `
                        <div class="text-red-600 font-semibold">❌ Payment Error</div>
                        <div class="mt-2 text-sm">${data.message || 'Unknown error'}</div>
                        <pre class="mt-2 text-sm">${JSON.stringify(data, null, 2)}</pre>
                    `;
                }
            } catch (error) {
                resultDiv.innerHTML = `
                    <div class="text-red-600 font-semibold">❌ Network Error</div>
                    <div class="mt-2 text-sm">${error.message}</div>
                `;
            }
        });

        // Test Payment Methods API
        document.getElementById('testPaymentMethods').addEventListener('click', async () => {
            const resultDiv = document.getElementById('paymentMethodsResult');
            resultDiv.innerHTML = '<div class="text-blue-500">Loading payment methods...</div>';
            
            try {
                const response = await fetch('/api/payment-methods');
                const data = await response.json();
                
                if (response.ok) {
                    const mercadoPagoMethod = data.find(method => method.code === 'mercado_pago');
                    
                    resultDiv.innerHTML = `
                        <div class="text-green-600 font-semibold">✅ Payment Methods Success</div>
                        <div class="mt-2">
                            <strong>MercadoPago Status:</strong> ${mercadoPagoMethod ? 'Active' : 'Not Found'}<br>
                            <strong>Total Methods:</strong> ${data.length}
                        </div>
                        <pre class="mt-2 text-sm">${JSON.stringify(data, null, 2)}</pre>
                    `;
                } else {
                    resultDiv.innerHTML = `
                        <div class="text-red-600 font-semibold">❌ Payment Methods Error</div>
                        <pre class="mt-2 text-sm">${JSON.stringify(data, null, 2)}</pre>
                    `;
                }
            } catch (error) {
                resultDiv.innerHTML = `
                    <div class="text-red-600 font-semibold">❌ Network Error</div>
                    <div class="mt-2 text-sm">${error.message}</div>
                `;
            }
        });

        // Auto-populate test card data
        document.addEventListener('DOMContentLoaded', () => {
            document.getElementById('cardNumber').value = '4509953566233704';
            document.getElementById('expirationDate').value = '11/25';
            document.getElementById('securityCode').value = '123';
            document.getElementById('cardholderName').value = 'APRO';
            document.getElementById('identificationNumber').value = '12345678';
            document.getElementById('email').value = 'test@example.com';
        });
    </script>
</body>
</html>
