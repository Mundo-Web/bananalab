import { useEffect, useState } from "react";
import CartStep from "./Components/CartStep";
import ShippingStep from "./Components/ShippingStep";
import ConfirmationStep from "./Components/ConfirmationStep";
import { Local } from "sode-extend-react";
import Global from "../../../Utils/Global";

export default function CheckoutSteps({ cart, setCart, user }) {
    const [currentStep, setCurrentStep] = useState(1);
    
    // Detectar parámetros de URL para pagos exitosos
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const step = urlParams.get('step');
        const status = urlParams.get('status');
        const paymentType = urlParams.get('payment_type');
        const orderNumber = urlParams.get('order');
        
        console.log('🔍 CheckoutSteps: Parámetros URL detectados:', { step, status, paymentType, orderNumber });
        
        if (step === '3' && status === 'success' && paymentType === 'mercadopago') {
            console.log('✅ CheckoutSteps: Pago exitoso de MercadoPago detectado, navegando al paso 3');
            setCurrentStep(3);
            
            if (orderNumber) {
                setCode(orderNumber);
                // Mostrar notificación de éxito
                if (window.Notify) {
                    window.Notify.add({
                        icon: "/assets/img/icon.svg",
                        title: "¡Pago exitoso!",
                        body: "Tu pago con MercadoPago ha sido procesado correctamente.",
                        type: "success",
                    });
                }
            }
            
            // Limpiar la URL para evitar confusiones
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, []);
    
    // Calcular el precio total incluyendo IGV
    const totalPrice = cart.reduce((acc, item) => {
        const finalPrice = item.final_price;
        return acc + finalPrice * item.quantity; // Sumar el precio total por cantidad
    }, 0);

    // Calcular el subtotal sin IGV (precio base)
    const subTotal = (totalPrice / 1.18).toFixed(2);

    // Calcular el IGV (18% del subtotal)
    const igv = (subTotal * 0.18).toFixed(2);

    // Estado para el costo de envío
    const [envio, setEnvio] = useState(0);

    // Calcular el total final (subtotal sin IGV + IGV + envío)
    const totalFinal =
        parseFloat(subTotal) + parseFloat(igv) + parseFloat(envio);
    const [sale, setSale] = useState([]);
    const [code, setCode] = useState([]);
    const [delivery, setDelivery] = useState([]);

    // Sincronizar carrito con localStorage al cargar
    useEffect(() => {
        console.log('🔄 CheckoutSteps: Sincronizando carrito con localStorage...');
        const savedCart = Local.get(`${Global.APP_CORRELATIVE}_cart`) || [];
        console.log('📦 CheckoutSteps: Carrito desde localStorage:', savedCart);
        if (savedCart.length > 0 && JSON.stringify(savedCart) !== JSON.stringify(cart)) {
            console.log('✅ CheckoutSteps: Actualizando carrito desde localStorage');
            setCart(savedCart);
        }
    }, []);

    // Escuchar eventos de actualización del carrito
    useEffect(() => {
        const handleCartUpdate = (event) => {
            console.log('📢 CheckoutSteps: Carrito actualizado:', event.detail);
            const updatedCart = Local.get(`${Global.APP_CORRELATIVE}_cart`) || [];
            console.log('🔄 CheckoutSteps: Cargando carrito actualizado:', updatedCart);
            setCart(updatedCart);
        };

        window.addEventListener('cartUpdated', handleCartUpdate);
        
        return () => {
            window.removeEventListener('cartUpdated', handleCartUpdate);
        };
    }, [setCart]);

    useEffect(() => {
        const script = document.createElement("script");
        script.src = "https://checkout.culqi.com/js/v4";
        script.async = true;
        script.onload = () => {
            console.log("✅ Culqi cargado correctamente.");

            // 🔹 Definir culqi() en window para capturar el token
            window.culqi = function () {
                if (window.Culqi.token) {
                    console.log("✅ Token recibido:", window.Culqi.token.id);
                    // Aquí puedes enviar el token a tu backend
                } else if (window.Culqi.order) {
                    console.log("✅ Orden recibida:", window.Culqi.order);
                } else {
                    console.error("❌ Error en Culqi:", window.Culqi.error);
                }
            };
        };

        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
        };

        return null; // No renderiza nada, solo carga Culqi en el contexto de la app
    }, []);
    return (
        <div className="min-h-screen  py-12 px-primary 2xl:px-0 2xl:max-w-7xl mx-auto">
            <div className="bg-white   p-8 rounded-xl">
                {/* Steps indicator */}
                <div className="mb-8">
                    <div className="flex items-center justify-between max-w-3xl mx-auto">
                        <div
                            className={`text-sm ${
                                currentStep === 1
                                    ? "customtext-primary font-medium"
                                    : "customtext-neutral-dark"
                            }`}
                        >
                            1. Carrito de compra
                        </div>
                        <div
                            className={`text-sm ${
                                currentStep === 2
                                    ? "customtext-primary font-medium"
                                    : "customtext-neutral-dark"
                            }`}
                        >
                            2. Detalles de envío
                        </div>
                        <div
                            className={`text-sm ${
                                currentStep === 3
                                    ? "customtext-primary font-medium"
                                    : "customtext-neutral-dark"
                            }`}
                        >
                            3. Orden confirmada
                        </div>
                    </div>
                    <div className="mt-4 h-1 max-w-3xl mx-auto bg-gray-200">
                        <div
                            className="h-1 bg-primary transition-all duration-500"
                            style={{
                                width: `${((currentStep - 1) / 2) * 100}%`,
                            }}
                        />
                    </div>
                </div>

                {/* Steps content */}
                {currentStep === 1 && (
                    <CartStep
                        cart={cart}
                        setCart={setCart}
                        onContinue={() => setCurrentStep(2)}
                        subTotal={subTotal}
                        envio={envio}
                        igv={igv}
                        totalFinal={totalFinal}
                    />
                )}

                {currentStep === 2 && (
                    <ShippingStep
                        setCode={setCode}
                        setDelivery={setDelivery}
                        cart={cart}
                        setSale={setSale}
                        setCart={setCart}
                        onContinue={() => setCurrentStep(3)}
                        noContinue={() => setCurrentStep(1)}
                        subTotal={subTotal}
                        envio={envio}
                        setEnvio={setEnvio}
                        igv={igv}
                        totalFinal={totalFinal}
                        user={user}
                    />
                )}

                {currentStep === 3 && (
                    <ConfirmationStep
                        code={code}
                        delivery={delivery}
                        cart={sale}
                        subTotal={subTotal}
                        envio={envio}
                        igv={igv}
                        totalFinal={totalFinal}
                    />
                )}
            </div>
        </div>
    );
}
