import { useEffect, useState } from "react";
import Number2Currency from "../../../../Utils/Number2Currency";
import ubigeoData from "../../../../../../storage/app/utils/ubigeo.json";
import DeliveryPricesRest from "../../../../Actions/DeliveryPricesRest";
import { processCulqiPayment } from "../../../../Actions/culqiPayment";
import { processMercadoPagoPayment, processManualPayment } from "../../../../Actions/paymentMethods";
import ButtonPrimary from "./ButtonPrimary";
import ButtonSecondary from "./ButtonSecondary";
import InputForm from "./InputForm";
import SelectForm from "./SelectForm";
import OptionCard from "./OptionCard";
import { InfoIcon, CreditCard, Smartphone, Building2, Upload, Check } from "lucide-react";
import { Notify } from "sode-extend-react";

export default function ShippingStep({
    cart,
    setSale,
    setCode,
    setDelivery,
    setCart,
    onContinue,
    noContinue,
    subTotal,
    igv,
    totalFinal,
    user,
    setEnvio,
    envio,
}) {
    const [formData, setFormData] = useState({
        name: user?.name || "",
        lastname: user?.lastname || "",
        email: user?.email || "",
        department: user?.department || "",
        province: user?.province || "",
        district: user?.district || "",
        address: user?.address || "",
        number: user?.number || "",
        comment: user?.comment || "",
        reference: user?.reference || "",
        shippingOption: "delivery", // Valor predeterminado
        paymentMethod: "culqi", // Nuevo campo para método de pago
    });

    // Estados para archivos de comprobante
    const [paymentProof, setPaymentProof] = useState(null);
    const [paymentProofPreview, setPaymentProofPreview] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    
    // Estado para métodos de pago dinámicos
    const [availablePaymentMethods, setAvailablePaymentMethods] = useState([]);
    const [loadingMethods, setLoadingMethods] = useState(true);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    // Manejar selección de método de pago
    const handlePaymentMethodChange = (method) => {
        setFormData((prev) => ({ ...prev, paymentMethod: method }));
        // Limpiar archivo si cambia de método
        if (method === 'culqi' || method === 'mercadopago') {
            setPaymentProof(null);
            setPaymentProofPreview(null);
        }
    };

    // Manejar subida de comprobante
    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validar tipo de archivo
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
            if (!allowedTypes.includes(file.type)) {
                Notify.add({
                    icon: "/assets/img/icon.svg",
                    title: "Archivo no válido",
                    body: "Solo se permiten imágenes (JPG, PNG) o archivos PDF",
                    type: "danger",
                });
                return;
            }

            // Validar tamaño (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                Notify.add({
                    icon: "/assets/img/icon.svg",
                    title: "Archivo muy grande",
                    body: "El archivo no debe superar los 5MB",
                    type: "danger",
                });
                return;
            }

            setPaymentProof(file);
            
            // Crear preview si es imagen
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => setPaymentProofPreview(e.target.result);
                reader.readAsDataURL(file);
            } else {
                setPaymentProofPreview(null);
            }
        }
    };

    // Estados para manejar los valores seleccionados
    const [departamento, setDepartamento] = useState("");
    const [provincia, setProvincia] = useState("");
    const [distrito, setDistrito] = useState("");

    // Estados para las opciones dinámicas
    const [departamentos, setDepartamentos] = useState([]);
    const [provincias, setProvincias] = useState([]);
    const [distritos, setDistritos] = useState([]);

    // Estado para el precio de envío
    const [shippingCost, setShippingCost] = useState(0);

    // Cargar métodos de pago disponibles
    useEffect(() => {
        fetchPaymentMethods();
    }, []);

    const fetchPaymentMethods = async () => {
        try {
            const response = await fetch('/api/payments/methods');
            const data = await response.json();
            if (data.status) {
                setAvailablePaymentMethods(data.methods);
                // Establecer el primer método activo como predeterminado
                if (data.methods.length > 0) {
                    setFormData(prev => ({ ...prev, paymentMethod: data.methods[0].slug }));
                }
            }
        } catch (error) {
            console.error('Error fetching payment methods:', error);
        } finally {
            setLoadingMethods(false);
        }
    };

    // Cargar los departamentos al iniciar el componente
    useEffect(() => {
        const uniqueDepartamentos = [
            ...new Set(ubigeoData.map((item) => item.departamento)),
        ];
        setDepartamentos(uniqueDepartamentos);
    }, []);

    // Filtrar provincias cuando se selecciona un departamento
    useEffect(() => {
        if (departamento) {
            const filteredProvincias = [
                ...new Set(
                    ubigeoData
                        .filter((item) => item.departamento === departamento)
                        .map((item) => item.provincia)
                ),
            ];
            setProvincias(filteredProvincias);
            setProvincia(""); // Reiniciar provincia
            setDistrito(""); // Reiniciar distrito
            setDistritos([]); // Limpiar distritos
            setFormData((prev) => ({
                ...prev,
                department: departamento,
                province: "",
                district: "",
            }));
        }
    }, [departamento]);

    // Filtrar distritos cuando se selecciona una provincia
    useEffect(() => {
        if (provincia) {
            const filteredDistritos = ubigeoData
                .filter(
                    (item) =>
                        item.departamento === departamento &&
                        item.provincia === provincia
                )
                .map((item) => item.distrito);
            setDistritos(filteredDistritos);
            setDistrito(""); // Reiniciar distrito
            setFormData((prev) => ({
                ...prev,
                province: provincia,
                district: "",
            }));
        }
    }, [provincia]);

    // Consultar el precio de envío cuando se selecciona un distrito
    useEffect(() => {
        if (distrito) {
            setFormData((prev) => ({ ...prev, district: distrito }));

            // Llamar a la API para obtener el precio de envío
            const fetchShippingCost = async () => {
                try {
                    const response = await DeliveryPricesRest.getShippingCost({
                        department: departamento,
                        district: distrito,
                    });
                    setEnvio(response.data.price);
                    if (Number2Currency(response.data.price) > 0) {
                        setSelectedOption("express");
                    } else {
                        setSelectedOption("free");
                    }
                } catch (error) {
                    console.error("Error fetching shipping cost:", error);
                    alert("No se pudo obtener el costo de envío.");
                }
            };

            fetchShippingCost();
        }
    }, [distrito]);

    const handlePayment = async (e) => {
        e.preventDefault();
        
        if (!user) {
            Notify.add({
                icon: "/assets/img/icon.svg",
                title: "Iniciar Sesión",
                body: "Se requiere que inicie sesión para realizar la compra",
                type: "danger",
            });
            return;
        }

        // Validar campos obligatorios
        if (
            !formData.department ||
            !formData.province ||
            !formData.district ||
            !formData.name ||
            !formData.lastname ||
            !formData.email ||
            !formData.address ||
            !formData.reference
        ) {
            Notify.add({
                icon: "/assets/img/icon.svg",
                title: "Error en el Formulario",
                body: "Completar los datos de envío",
                type: "danger",
            });
            return;
        }

        // Validar comprobante para métodos que lo requieren
        if ((formData.paymentMethod === 'yape' || formData.paymentMethod === 'transferencia') && !paymentProof) {
            Notify.add({
                icon: "/assets/img/icon.svg",
                title: "Comprobante requerido",
                body: "Debe subir el comprobante de pago para este método",
                type: "danger",
            });
            return;
        }

        const baseRequest = {
            user_id: user?.id || "",
            name: formData?.name || "",
            lastname: formData?.lastname || "",
            fullname: `${formData?.name} ${formData?.lastname}`,
            email: formData?.email || "",
            phone: "",
            country: "Perú",
            department: departamento || "",
            province: provincia || "",
            district: distrito || "",
            ubigeo: null,
            address: formData?.address || "",
            number: formData?.number || "",
            comment: formData?.comment || "",
            reference: formData?.reference || "",
            amount: totalFinal || 0,
            delivery: envio,
            cart: cart,
            payment_method: formData.paymentMethod,
        };

        try {
            let response;
            
            switch (formData.paymentMethod) {
                case 'culqi':
                    if (!window.Culqi) {
                        console.error("❌ Culqi aún no se ha cargado.");
                        return;
                    }
                    response = await processCulqiPayment(baseRequest);
                    break;
                
                case 'mercadopago':
                    // Aquí implementarás la integración con MercadoPago
                    response = await processMercadoPagoPayment(baseRequest);
                    break;
                
                case 'yape':
                case 'transferencia':
                    // Para métodos manuales, subir comprobante
                    const formData = new FormData();
                    Object.keys(baseRequest).forEach(key => {
                        if (Array.isArray(baseRequest[key])) {
                            formData.append(key, JSON.stringify(baseRequest[key]));
                        } else {
                            formData.append(key, baseRequest[key]);
                        }
                    });
                    formData.append('payment_proof', paymentProof);
                    
                    response = await processManualPayment(formData);
                    break;
                
                default:
                    throw new Error('Método de pago no válido');
            }

            const data = response;

            if (data.status) {
                setSale(data.sale);
                setDelivery(data.delivery);
                setCode(data.code);
                setCart([]);
                
                Notify.add({
                    icon: "/assets/img/icon.svg",
                    title: "¡Pedido procesado!",
                    body: formData.paymentMethod === 'culqi' || formData.paymentMethod === 'mercadopago' 
                        ? "Su pago ha sido procesado exitosamente" 
                        : "Su pedido está pendiente de validación del comprobante",
                    type: "success",
                });
                
                onContinue();
            } else {
                Notify.add({
                    icon: "/assets/img/icon.svg",
                    title: "Error en el Pago",
                    body: data.message || "El pago ha sido rechazado",
                    type: "danger",
                });
            }
        } catch (error) {
            console.log(error);
            Notify.add({
                icon: "/assets/img/icon.svg",
                title: "Error en el Pago",
                body: "No se pudo procesar el pago",
                type: "danger",
            });
        }
    };

    const [selectedOption, setSelectedOption] = useState("free");
    return (
        <div className="grid lg:grid-cols-5 gap-8">
            <div className="lg:col-span-3">
                {/* Formulario */}
                <form
                    className="space-y-6"
                    onSubmit={(e) => e.preventDefault()}
                >
                    <div className="grid grid-cols-2 gap-4">
                        {/* Nombres */}
                        <InputForm
                            type="text"
                            label="Nombres"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Nombres"
                        />
                        {/* Apellidos */}
                        <InputForm
                            label="Apellidos"
                            type="text"
                            name="lastname"
                            value={formData.lastname}
                            onChange={handleChange}
                            placeholder="Apellidos"
                        />
                    </div>

                    {/* Correo electrónico */}

                    <InputForm
                        label="Correo electrónico"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Ej. hola@gmail.com"
                    />

                    {/* Departamento */}

                    <SelectForm
                        label="Departamento"
                        options={departamentos}
                        placeholder="Selecciona un Departamento"
                        onChange={(value) => {
                            setDepartamento(value);
                            setFormData((prev) => ({
                                ...prev,
                                department: departamento,
                            }));
                        }}
                    />

                    {/* Provincia */}

                    <SelectForm
                        disabled={!departamento}
                        label="Provincia"
                        options={provincias}
                        placeholder="Selecciona una Provincia"
                        onChange={(value) => {
                            setProvincia(value);
                            setFormData((prev) => ({
                                ...prev,
                                province: provincia,
                            }));
                        }}
                    />

                    {/* Distrito */}

                    <SelectForm
                        disabled={!provincia}
                        label="Distrito"
                        options={distritos}
                        placeholder="Selecciona un Distrito"
                        onChange={(value) => {
                            setDistrito(value);
                            setFormData((prev) => ({
                                ...prev,
                                district: distrito,
                            }));
                        }}
                    />

                    {/* Dirección */}
                    <InputForm
                        label="Avenida / Calle / Jirón"
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        placeholder="Ingresa el nombre de la calle"
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <InputForm
                            label="Número"
                            type="text"
                            name="number"
                            value={formData.number}
                            onChange={handleChange}
                            placeholder="Ingresa el número de la calle"
                        />

                        <InputForm
                            label="Dpto./ Interior/ Piso/ Lote/ Bloque (opcional)"
                            type="text"
                            name="comment"
                            value={formData.comment}
                            onChange={handleChange}
                            placeholder="Ej. Casa 3, Dpto 101"
                        />
                    </div>

                    {/* Referencia */}
                    <InputForm
                        label="Referencia"
                        type="text"
                        name="reference"
                        value={formData.reference}
                        onChange={handleChange}
                        placeholder="Ejem. Altura de la avenida..."
                    />

                    {/* Métodos de Pago */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900">Método de Pago</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Culqi - Tarjeta */}
                            <div 
                                className={`border-2 rounded-xl p-4 cursor-pointer transition-all duration-200 ${
                                    formData.paymentMethod === 'culqi' 
                                    ? 'border-primary bg-primary/5' 
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                                onClick={() => handlePaymentMethodChange('culqi')}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                                        formData.paymentMethod === 'culqi' ? 'bg-primary text-white' : 'bg-gray-100'
                                    }`}>
                                        <CreditCard size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-medium">Tarjeta de Crédito/Débito</h4>
                                        <p className="text-sm text-gray-500">Visa, Mastercard</p>
                                    </div>
                                    {formData.paymentMethod === 'culqi' && (
                                        <Check size={20} className="text-primary" />
                                    )}
                                </div>
                            </div>

                            {/* MercadoPago */}
                            <div 
                                className={`border-2 rounded-xl p-4 cursor-pointer transition-all duration-200 ${
                                    formData.paymentMethod === 'mercadopago' 
                                    ? 'border-primary bg-primary/5' 
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                                onClick={() => handlePaymentMethodChange('mercadopago')}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                                        formData.paymentMethod === 'mercadopago' ? 'bg-primary text-white' : 'bg-gray-100'
                                    }`}>
                                        <CreditCard size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-medium">MercadoPago</h4>
                                        <p className="text-sm text-gray-500">Pago online seguro</p>
                                    </div>
                                    {formData.paymentMethod === 'mercadopago' && (
                                        <Check size={20} className="text-primary" />
                                    )}
                                </div>
                            </div>

                            {/* Yape */}
                            <div 
                                className={`border-2 rounded-xl p-4 cursor-pointer transition-all duration-200 ${
                                    formData.paymentMethod === 'yape' 
                                    ? 'border-primary bg-primary/5' 
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                                onClick={() => handlePaymentMethodChange('yape')}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                                        formData.paymentMethod === 'yape' ? 'bg-primary text-white' : 'bg-gray-100'
                                    }`}>
                                        <Smartphone size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-medium">Yape</h4>
                                        <p className="text-sm text-gray-500">Pago móvil</p>
                                    </div>
                                    {formData.paymentMethod === 'yape' && (
                                        <Check size={20} className="text-primary" />
                                    )}
                                </div>
                            </div>

                            {/* Transferencia Bancaria */}
                            <div 
                                className={`border-2 rounded-xl p-4 cursor-pointer transition-all duration-200 ${
                                    formData.paymentMethod === 'transferencia' 
                                    ? 'border-primary bg-primary/5' 
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                                onClick={() => handlePaymentMethodChange('transferencia')}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                                        formData.paymentMethod === 'transferencia' ? 'bg-primary text-white' : 'bg-gray-100'
                                    }`}>
                                        <Building2 size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-medium">Transferencia Bancaria</h4>
                                        <p className="text-sm text-gray-500">Depósito o transferencia</p>
                                    </div>
                                    {formData.paymentMethod === 'transferencia' && (
                                        <Check size={20} className="text-primary" />
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Información del método seleccionado */}
                        {formData.paymentMethod === 'yape' && (
                            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                                <h4 className="font-medium text-purple-800 mb-2">Instrucciones para Yape:</h4>
                                <div className="text-sm text-purple-700 space-y-2">
                                    <p>1. Realiza el Yape al número: <strong>+51 999 888 777</strong></p>
                                    <p>2. Monto: <strong>S/ {Number2Currency(totalFinal)}</strong></p>
                                    <p>3. Toma captura del comprobante</p>
                                    <p>4. Sube la imagen abajo</p>
                                </div>
                            </div>
                        )}

                        {formData.paymentMethod === 'transferencia' && (
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                <h4 className="font-medium text-blue-800 mb-2">Datos para Transferencia:</h4>
                                <div className="text-sm text-blue-700 space-y-2">
                                    <p><strong>Banco:</strong> BCP</p>
                                    <p><strong>Cuenta Corriente:</strong> 123-456789-0-12</p>
                                    <p><strong>CCI:</strong> 00212312345678901234</p>
                                    <p><strong>Titular:</strong> BananaLab SAC</p>
                                    <p><strong>Monto:</strong> S/ {Number2Currency(totalFinal)}</p>
                                    <p className="mt-2 font-medium">Sube el voucher de la transferencia abajo</p>
                                </div>
                            </div>
                        )}

                        {/* Subida de comprobante para métodos manuales */}
                        {(formData.paymentMethod === 'yape' || formData.paymentMethod === 'transferencia') && (
                            <div className="space-y-3">
                                <label className="block text-sm font-medium text-gray-700">
                                    Comprobante de Pago *
                                </label>
                                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6">
                                    <div className="text-center">
                                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                        <div className="mt-4">
                                            <label htmlFor="payment-proof" className="cursor-pointer">
                                                <span className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors">
                                                    Subir Archivo
                                                </span>
                                                <input
                                                    id="payment-proof"
                                                    type="file"
                                                    className="hidden"
                                                    accept="image/*,.pdf"
                                                    onChange={handleFileUpload}
                                                />
                                            </label>
                                            <p className="mt-2 text-sm text-gray-500">
                                                PNG, JPG o PDF hasta 5MB
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Preview del archivo */}
                                {paymentProof && (
                                    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <Check className="text-green-600" size={20} />
                                            <div>
                                                <p className="text-sm font-medium text-green-800">
                                                    Archivo cargado: {paymentProof.name}
                                                </p>
                                                <p className="text-xs text-green-600">
                                                    {(paymentProof.size / 1024 / 1024).toFixed(2)} MB
                                                </p>
                                            </div>
                                        </div>
                                        {paymentProofPreview && (
                                            <div className="mt-3">
                                                <img 
                                                    src={paymentProofPreview} 
                                                    alt="Preview" 
                                                    className="max-w-full h-32 object-contain rounded-lg border"
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </form>
                <div className="flex gap-4 mt-4">
                    <OptionCard
                        title="Envío gratis"
                        description="Entrega entre 3 a 10 días hábiles"
                        selected={selectedOption === "free"}
                    />
                    <OptionCard
                        title="Delivery"
                        description="Delivery 24 horas"
                        selected={selectedOption === "express"}
                    />
                </div>
                <div className="flex gap-4 mt-6 bg-[#F7F9FB] p-3 rounded-xl">
                    <div className="w-5">
                        <InfoIcon className="customtext-primary" width="20px" />
                    </div>
                    <div className="text-xs font-medium customtext-neutral-dark flex flex-col gap-2">
                        <p>
                            Solo Lima Metropolitana: Dentro de las 24 horas
                            después de efectuado el pago, solo algunos distritos
                            de Lima Metropolitana.
                        </p>
                        <p>
                            {" "}
                            Distritos No incluidos: Santa María del Mar,
                            Pucusana, San Bartolo, Punta Hermosa, Lurín,
                            Pachacamac, Chorrillos, Villa el Salvador, Villa
                            María del Triunfo, San Juan de Miraflores,
                            Cieneguilla, Ate, Chosica, Huaycan, San Juan de
                            Lurigancho (hasta el Metro), Ancón, Santa Rosa,
                            Carabayllo, Puente Piedra.
                        </p>
                        <p>
                            {" "}
                            Same Day: Solo para compras efectuadas hasta las 1pm
                            del día.
                        </p>
                    </div>
                </div>
                <div className="flex gap-4 mt-4 bg-[#F7F9FB] p-3 rounded-xl">
                    <div className="w-5">
                        <InfoIcon className="customtext-primary" width="20px" />
                    </div>
                    <div className="text-xs font-medium customtext-neutral-dark flex flex-col gap-2">
                        <p>
                            Lima: 3 a 4 dias hábiles | Provincia: de 4 a 10 dias
                            hábiles
                        </p>
                    </div>
                </div>
            </div>
            {/* Resumen de compra */}
            <div className="bg-[#F7F9FB] rounded-xl shadow-lg p-6 col-span-2 h-max">
                <h3 className="text-2xl font-bold pb-6">Resumen de compra</h3>

                <div className="space-y-6 border-b-2 pb-6">
                    {cart.map((item, index) => (
                        <div key={item.id} className="rounded-lg">
                            <div className="flex items-center gap-4">
                                <div className="bg-white p-2 rounded-xl">
                                    <img
                                        src={item.type === 'custom_album' 
                                            ? `/storage/images/item_preset/${item.image}` 
                                            : `/storage/images/item/${item.image}`
                                        }
                                        alt={item.name}
                                        className="w-20 h-20 object-cover rounded"
                                    />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-medium text-lg mb-2">
                                        {item.name}
                                    </h3>

                                    {item.type === 'custom_album' ? (
                                        // Información para álbumes personalizados
                                        <>
                                            <p className="text-sm customtext-neutral-light">
                                                Tipo:{" "}
                                                <span className="customtext-neutral-dark">
                                                    Álbum Personalizado
                                                </span>
                                            </p>
                                            <p className="text-sm customtext-neutral-light">
                                                Páginas:{" "}
                                                <span className="customtext-neutral-dark">
                                                    {item.album_data?.pages_count || 'N/A'}
                                                </span>
                                            </p>
                                        </>
                                    ) : (
                                        // Información para productos regulares
                                        <p className="text-sm customtext-neutral-light">
                                            Marca:{" "}
                                            <span className="customtext-neutral-dark">
                                                {item.brand?.name || 'Sin marca'}
                                            </span>
                                        </p>
                                    )}
                                    
                                    <p className="text-sm customtext-neutral-light">
                                        Cantidad:{" "}
                                        <span className="customtext-neutral-dark">
                                            {item.quantity || 1}
                                        </span>
                                    </p>
                                  {/*  <p className="text-sm customtext-neutral-light">
                                        SKU:{" "}
                                        <span className="customtext-neutral-dark">
                                            {item.sku || ''}
                                        </span>
                                    </p> */}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="space-y-4 mt-6">
                    {/* Calcular y mostrar ahorros totales */}
                    {(() => {
                        const totalSavings = cart.reduce((acc, item) => {
                            const basePrice = item.price || 0;
                            const finalPrice = item.final_price || item.price || 0;
                            const quantity = item.quantity || 1;
                            if (basePrice > finalPrice) {
                                return acc + ((basePrice - finalPrice) * quantity);
                            }
                            return acc;
                        }, 0);
                        
                        return totalSavings > 0 ? (
                            <div className="flex justify-between">
                                <span className="text-green-600 font-medium">
                                    Ahorros totales
                                </span>
                                <span className="font-semibold text-green-600">
                                    -S/ {Number2Currency(totalSavings)}
                                </span>
                            </div>
                        ) : null;
                    })()}
                    
                    <div className="flex justify-between">
                        <span className="customtext-neutral-dark">
                            Subtotal
                        </span>
                        <span className="font-semibold">
                            S/ {Number2Currency(subTotal)}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="customtext-neutral-dark">IGV</span>
                        <span className="font-semibold">
                            S/ {Number2Currency(igv)}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="customtext-neutral-dark">Envío</span>
                        <span className="font-semibold">
                            S/ {Number2Currency(envio)}
                        </span>
                    </div>
                    <div className="py-3 border-y-2 mt-6">
                        <div className="flex justify-between font-bold text-[20px] items-center">
                            <span>Total</span>
                            <span>S/ {Number2Currency(totalFinal)}</span>
                        </div>
                    </div>
                    <div className="space-y-2 pt-4">
                        <ButtonPrimary onClick={handlePayment}>
                            {(() => {
                                switch (formData.paymentMethod) {
                                    case 'culqi':
                                        return 'Pagar con Tarjeta';
                                    case 'mercadopago':
                                        return 'Pagar con MercadoPago';
                                    case 'yape':
                                        return 'Confirmar Pago Yape';
                                    case 'transferencia':
                                        return 'Confirmar Transferencia';
                                    default:
                                        return 'Continuar';
                                }
                            })()}
                        </ButtonPrimary>

                        <ButtonSecondary onClick={noContinue}>
                            Cancelar
                        </ButtonSecondary>
                    </div>
                    <div>
                        <p className="text-sm customtext-neutral-dark">
                            Al realizar tu pedido, aceptas los 
                            <a className="customtext-primary font-bold">
                                Términos y Condiciones
                            </a>
                            , y que nosotros usaremos sus datos personales de
                            acuerdo con nuestra 
                            <a className="customtext-primary font-bold">
                                Política de Privacidad
                            </a>
                            .
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
