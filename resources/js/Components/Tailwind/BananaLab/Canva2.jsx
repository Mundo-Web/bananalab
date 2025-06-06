import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronDown, ArrowRight, Sparkles, BookOpen, Palette, Layers, Upload, Image as ImageIcon } from "lucide-react";
import ItemPresetsRest from "../../../Actions/Admin/ItemPresetsRest";
import AlbumRest from "../../../Actions/AlbumRest";

const animations = {
  container: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        when: "beforeChildren"
      }
    }
  },
  item: {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 120,
        damping: 12,
        mass: 0.5
      }
    }
  },
  button: {
    hover: { 
      x: -5,
      backgroundColor: "rgba(243, 244, 246, 0.8)",
      transition: { type: "spring", stiffness: 400 }
    },
    tap: { 
      scale: 0.96,
      transition: { type: "spring", stiffness: 400 }
    }
  },
  formItem: {
    hidden: { x: -20, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: { 
        type: "spring",
        stiffness: 100,
        damping: 10
      }
    },
    hover: {
      y: -2,
      transition: { 
        type: "spring",
        stiffness: 400,
        damping: 10
      }
    }
  },
  image: {
    hidden: { opacity: 0, scale: 0.95, rotate: -2 },
    visible: {
      opacity: 1,
      scale: 1,
      rotate: 0,
      transition: { 
        type: "spring",
        stiffness: 80,
        damping: 15,
        delay: 0.3
      }
    },
    hover: {
      scale: 1.02,
      transition: { type: "spring", stiffness: 300 }
    }
  },
  featureIcon: {
    hidden: { scale: 0, opacity: 0 },
    visible: (i) => ({
      scale: 1,
      opacity: 1,
      transition: {
        delay: 0.5 + i * 0.1,
        type: "spring",
        stiffness: 300
      }
    })
  }
};

const features = [
  { icon: <BookOpen size={20} />, text: "50 páginas en blanco" },
  { icon: <Palette size={20} />, text: "Personalizable" },
  { icon: <Layers size={20} />, text: "Tapa dura premium" }
];

export default function Canva2() {
    const [preset, setPreset] = useState(null);
    const [loading, setLoading] = useState(true);
    const [coverImage, setCoverImage] = useState(null);
    const [coverImagePreview, setCoverImagePreview] = useState(null);
    const [formData, setFormData] = useState({
        titulo: "",
        paginas: "",
        tapa: "",
        acabado: "",
    });
    
    // Estados para autenticación y guardado
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    const [saving, setSaving] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);

    const itemPresetsRest = new ItemPresetsRest();

    // Cargar datos del preset desde la URL
    useEffect(() => {
        const loadPresetData = async () => {
            try {
                const urlParams = new URLSearchParams(window.location.search);
                const presetId = urlParams.get('preset');
                const itemId = urlParams.get('item');
                
                console.log('URL params:', { presetId, itemId });
                
                if (presetId) {
                    console.log('Cargando preset:', presetId);
                    setLoading(true);
                    
                    // Cargar datos del preset desde el backend
                    const data = await itemPresetsRest.getPresetById(presetId);
                    console.log('Datos del preset recibidos:', data);
                    
                    if (data.success) {
                        const presetData = data.data;
                        console.log('Preset data:', presetData);
                        setPreset(presetData);
                        
                        // Configurar datos iniciales del formulario basados en el preset
                        setFormData(prev => ({
                            ...prev,
                            titulo: presetData.name || "Momentos que no quiero olvidar",
                            paginas: presetData.default_pages || (presetData.pages_options && presetData.pages_options[0]) || "",
                            tapa: presetData.default_cover || (presetData.cover_options && presetData.cover_options[0]) || "",
                            acabado: presetData.default_finish || (presetData.finish_options && presetData.finish_options[0]) || ""
                        }));
                        
                        // Si el preset tiene imagen, mostrarla como cover actual
                        if (presetData.image) {
                            setCoverImagePreview(presetData.image);
                        }
                    } else {
                        console.error('Error al cargar preset:', data.message);
                        // Usar datos por defecto si hay error
                        setPreset({
                            id: presetId,
                            name: "Preset no encontrado",
                            description: "No se pudo cargar la información del preset",
                            image: null
                        });
                    }
                    
                    setLoading(false);
                } else {
                    // Si no hay preset, usar datos por defecto
                    console.log('No hay preset ID en URL, usando datos por defecto');
                    setPreset({
                        id: null,
                        name: "Preset por defecto",
                        description: "Diseño personalizable para tu regalo especial",
                        image: null,
                        item_id: itemId || null // usar item_id de la URL si está disponible
                    });
                    setLoading(false);
                }
            } catch (error) {
                console.error('Error al cargar preset:', error);
                setPreset({
                    id: null,
                    name: "Error al cargar",
                    description: "Hubo un problema al cargar el preset",
                    image: null
                });
                setLoading(false);
            }
        };

        loadPresetData();
    }, []);

    // Verificar autenticación del usuario
    useEffect(() => {
        const checkAuthentication = async () => {
            try {
                const authData = await AlbumRest.checkAuth();
                setIsAuthenticated(authData.authenticated);
                setUser(authData.user);
            } catch (error) {
                console.error('Error al verificar autenticación:', error);
                setIsAuthenticated(false);
                setUser(null);
            }
        };

        checkAuthentication();
    }, []);

    // Manejar subida de imagen de portada
    const handleCoverImageUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            setCoverImage(file);
            
            // Crear preview de la imagen
            const reader = new FileReader();
            reader.onload = (e) => {
                setCoverImagePreview(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    };

    // Manejar clic en "Crear proyecto"
    const handleCrearProyecto = async () => {
        if (!isAuthenticated) {
            // Mostrar modal de login o redirigir a login
            setShowLoginModal(true);
            return;
        }

        // Validar que se hayan seleccionado todas las opciones
        if (!formData.titulo.trim()) {
            alert('Por favor, ingresa un título para tu álbum');
            return;
        }
        if (!formData.paginas) {
            alert('Por favor, selecciona la cantidad de páginas');
            return;
        }
        if (!formData.tapa) {
            alert('Por favor, selecciona el tipo de tapa');
            return;
        }
        if (!formData.acabado) {
            alert('Por favor, selecciona el tipo de acabado');
            return;
        }

        try {
            setSaving(true);

            // Obtener información del item y preset
            const urlParams = new URLSearchParams(window.location.search);
            let itemId = urlParams.get('item');
            let presetId = urlParams.get('preset');

            console.log('Parámetros URL:', { itemId, presetId });
            console.log('Estado preset:', preset);

            // Si no hay parámetros en URL, intentar usar datos del preset cargado
            if (!itemId && preset?.item_id) {
                itemId = preset.item_id.toString();
                console.log('Usando item_id del preset:', itemId);
            }
            if (!presetId && preset?.id) {
                presetId = preset.id.toString();
                console.log('Usando preset.id:', presetId);
            }

            // Corregir: itemId debe ser el item_id real del preset
            if (preset?.item_id) {
                itemId = preset.item_id.toString();
            }
            if (preset?.id) {
                presetId = preset.id.toString();
            }
            console.log('Corregido para backend:', { itemId, presetId });

            // Verificar que tenemos los datos necesarios
            if (!itemId || !presetId) {
                // Si aún no tenemos los datos, mostrar error más específico
                const missingData = [];
                if (!itemId) missingData.push('ID del item');
                if (!presetId) missingData.push('ID del preset');
                
                console.error('Datos faltantes para guardar álbum:', {
                    itemId,
                    presetId,
                    preset,
                    urlParams: Object.fromEntries(urlParams.entries())
                });
                
                throw new Error(`Faltan datos requeridos: ${missingData.join(', ')}. 
                    Asegúrate de acceder desde la página de selección de productos.
                    
Información de debug:
- URL item: ${urlParams.get('item')}
- URL preset: ${urlParams.get('preset')}
- Estado preset.id: ${preset?.id}
- Estado preset.item_id: ${preset?.item_id}`);
            }

            console.log('Guardando álbum con:', { itemId, presetId, preset });

            // Preparar datos del álbum
            const albumData = {
                item_id: itemId,
                item_preset_id: presetId,
                title: formData.titulo,
                description: `Álbum personalizado con ${formData.paginas} páginas, tapa ${formData.tapa}, acabado ${formData.acabado}`,
                selected_pages: parseInt(formData.paginas),
                selected_cover_type: formData.tapa,
                selected_finish: formData.acabado,
                cover_image: coverImage, // Archivo de imagen
                custom_options: {
                    // cover_preview: coverImagePreview, // NO enviar base64
                    selected_options: {
                        pages: formData.paginas,
                        cover: formData.tapa,
                        finish: formData.acabado
                    },
                    preset_data: preset // Usar el estado preset, no presetData
                }
            };

            // Guardar álbum
            console.log('Enviando datos del álbum:', albumData);
            const response = await AlbumRest.saveAlbum(albumData);
            
            if (response && response.data) {
                const albumId = response.data.album?.id || response.data.id;
                console.log('Álbum guardado exitosamente:', response.data);
                
                // Preparar parámetros para el editor
                const editorParams = new URLSearchParams({
                    album: albumId,
                    item: itemId,
                    preset: presetId,
                    pages: formData.paginas,
                    cover: formData.tapa,
                    finish: formData.acabado
                });

                // Redirigir al editor con todos los datos necesarios
                setTimeout(() => {
                    window.location.href = `/editor?${editorParams.toString()}`;
                }, 1000);
            }
        } catch (error) {
            console.error('Error al guardar álbum:', error);
            
            // Mostrar mensaje de error más específico al usuario
            let errorMessage = 'Error al guardar el álbum';
            if (error.message.includes('Faltan datos requeridos')) {
                errorMessage = error.message;
            } else if (error.message.includes('401')) {
                errorMessage = 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.';
                setIsAuthenticated(false);
                setShowLoginModal(true);
            } else if (error.message.includes('500')) {
                errorMessage = 'Error interno del servidor. Por favor, intenta nuevamente.';
            } else if (error.message.includes('network') || error.message.includes('fetch')) {
                errorMessage = 'Error de conexión. Verifica tu conexión a internet e intenta nuevamente.';
            }
            
            alert(errorMessage);
        } finally {
            setSaving(false);
        }
    };

    // Manejar redirección a login
    const handleLoginRedirect = () => {
        const currentUrl = encodeURIComponent(window.location.href);
        window.location.href = `/login?redirect=${currentUrl}`;
    };

    // Cerrar modal de login
    const handleCloseLoginModal = () => {
        setShowLoginModal(false);
    };

    return (
        <motion.div 
            className="container mx-auto px-4 py-8 max-w-7xl font-paragraph bg-gradient-to-b from-white to-purple-50 min-h-screen"
            initial="hidden"
            animate="visible"
            variants={animations.container}
        >
            {/* Alerta si no hay parámetros válidos */}
            {(() => {
                const urlParams = new URLSearchParams(window.location.search);
                const hasItemParam = urlParams.get('item');
                const hasPresetParam = urlParams.get('preset');
                
                if (!hasItemParam || !hasPresetParam) {
                    return (
                        <motion.div 
                            className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg"
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-yellow-700">
                                        <strong>Advertencia:</strong> No se detectaron parámetros válidos en la URL. 
                                        Para una experiencia completa, accede desde la página de selección de productos.
                                        <br />
                                        <span className="text-xs text-yellow-600">
                                            Parámetros esperados: item={hasItemParam ? '✓' : '✗'}, preset={hasPresetParam ? '✓' : '✗'}
                                        </span>
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    );
                }
                return null;
            })()}
            {/* Fondo decorativo */}
            <motion.div 
                className="fixed inset-0 overflow-hidden pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1 }}
            >
                {[...Array(10)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute rounded-full bg-purple-100 opacity-20"
                        style={{
                            width: Math.random() * 200 + 100,
                            height: Math.random() * 200 + 100,
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`
                        }}
                        animate={{
                            y: [0, Math.random() * 100 - 50],
                            x: [0, Math.random() * 100 - 50],
                            opacity: [0.2, 0.3, 0.2]
                        }}
                        transition={{
                            duration: Math.random() * 10 + 10,
                            repeat: Infinity,
                            repeatType: "reverse"
                        }}
                    />
                ))}
            </motion.div>

            {/* Botón Regresar con efecto premium */}
            <motion.button 
                className="flex items-center customtext-primary mb-6 p-3 rounded-xl bg-white shadow-sm hover:shadow-md transition-all z-10 relative"
                variants={animations.button}
                whileHover="hover"
                whileTap="tap"
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
            >
                <ChevronLeft className="h-5 w-5" />
                <span className="ml-2 font-medium">Regresar</span>
                <motion.span
                    className="absolute -z-10 inset-0 bg-gradient-to-r from-purple-50 to-white rounded-xl opacity-0"
                    whileHover={{ opacity: 1 }}
                />
            </motion.button>

            {/* Contenedor principal */}
            <div className="md:flex md:gap-10 md:items-start relative z-10">
                {/* Columna de información y formulario */}
                <div className="md:w-1/2">
                    {/* Título y descripción */}
                    <motion.div 
                        className="mb-8"
                        variants={animations.item}
                    >
                        {loading ? (
                            // Estado de carga
                            <div className="animate-pulse">
                                <div className="h-8 bg-gray-200 rounded mb-4"></div>
                                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            </div>
                        ) : (
                            <>
                                <motion.h1 
                                    className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent"
                                    initial={{ x: -30, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ 
                                        delay: 0.3,
                                        type: "spring",
                                        stiffness: 100
                                    }}
                                >
                                    {preset?.name || "Libro Personalizado"} <br className="hidden lg:block" /> 
                                    «Buenos Deseos de Matrimonio»
                                </motion.h1>
                                
                                <motion.p 
                                    className="text-base md:text-lg text-gray-700 leading-relaxed"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.4 }}
                                >
                                    {preset?.description || "El libro es de 22×22 cm, de tapa dura que tiene un diseño especial de boda personalizable para agregar una foto o imagen, nombres y fecha del evento. En su interior viene con 50 páginas de papel couché de 170 grs. en blanco para que los invitados puedan escribir sus mensajes."}
                                </motion.p>
                            </>
                        )}
                        
                        {/* Características destacadas */}
                        <motion.div className="mt-6 flex flex-wrap gap-3">
                            {features.map((feature, i) => (
                                <motion.div
                                    key={i}
                                    className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm"
                                    custom={i}
                                    variants={animations.featureIcon}
                                    whileHover={{ y: -2 }}
                                >
                                    <motion.span whileHover={{ scale: 1.1 }}>
                                        {feature.icon}
                                    </motion.span>
                                    <span className="text-sm font-medium">{feature.text}</span>
                                </motion.div>
                            ))}
                        </motion.div>
                    </motion.div>

                    {/* Formulario solo con título */}
                    <motion.form 
                        className="space-y-6 bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white"
                        variants={animations.container}
                        initial="hidden"
                        animate="visible"
                    >
                        {/* Título */}
                        <motion.div 
                            className="space-y-2"
                            variants={animations.formItem}
                            whileHover="hover"
                        >
                            <label className="block text-sm font-medium text-gray-700">Título del Libro</label>
                            <motion.div className="relative">
                                <motion.input
                                    type="text"
                                    value={formData.titulo}
                                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                                    className="w-full p-4 bg-purple-50/50 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:outline-none transition-all border border-purple-100"
                                    placeholder="Escribe el título de tu libro..."
                                    whileFocus={{ 
                                        scale: 1.02,
                                        boxShadow: "0 0 0 3px rgba(139, 92, 246, 0.2)",
                                        backgroundColor: "rgba(245, 243, 255, 0.8)"
                                    }}
                                />
                                <motion.span 
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-purple-400"
                                    animate={{ scale: [1, 1.1, 1] }}
                                    transition={{ repeat: Infinity, duration: 2 }}
                                >
                                    <Sparkles size={18} />
                                </motion.span>
                            </motion.div>
                        </motion.div>
                    </motion.form>
                </div>

                {/* Columna de configuración y imagen */}
                <motion.div 
                    className="mt-8 md:mt-0 md:w-1/2 sticky top-6 space-y-6"
                    variants={animations.image}
                    whileHover="hover"
                >
                    {/* Panel de configuración */}
                    <motion.div 
                        className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <motion.span
                                animate={{ rotate: [0, 5, -5, 0] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                            >
                                ⚙️
                            </motion.span>
                            Configuración
                        </h3>
                        
                        <div className="space-y-4">
                            {/* Imagen de Portada */}
                            <motion.div 
                                className="space-y-2"
                                variants={animations.formItem}
                                whileHover="hover"
                            >
                                <label className="block text-sm font-medium text-gray-700">Imagen de Portada</label>
                                
                                {/* Zona de preview de imagen actual */}
                                {coverImagePreview && (
                                    <motion.div 
                                        className="mb-3 relative group"
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        whileHover={{ scale: 1.02 }}
                                    >
                                        <img 
                                            src={coverImagePreview} 
                                            alt="Vista previa de portada"
                                            className="w-full max-w-[150px] h-[150px] object-cover rounded-lg border-2 border-purple-100 shadow-sm mx-auto"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-2">
                                            <span className="text-white text-xs font-medium">Portada actual</span>
                                        </div>
                                    </motion.div>
                                )}
                                
                                {/* Input de archivo con diseño compacto */}
                                <motion.div
                                    className="relative border-2 border-dashed border-purple-300 rounded-xl p-4 hover:border-purple-400 transition-colors cursor-pointer bg-purple-50/30"
                                    whileHover={{ backgroundColor: "rgba(245, 243, 255, 0.5)" }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleCoverImageUpload}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    <div className="text-center">
                                        <motion.div
                                            className="mx-auto w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mb-2"
                                            whileHover={{ scale: 1.1 }}
                                        >
                                            <Upload className="w-4 h-4 text-purple-600" />
                                        </motion.div>
                                        <p className="text-xs text-gray-600 mb-1">
                                            <span className="font-medium text-purple-600">Subir imagen</span>
                                        </p>
                                        <p className="text-xs text-gray-500">PNG, JPG, JPEG</p>
                                        {coverImage && (
                                            <motion.p 
                                                className="text-xs text-green-600 mt-2 font-medium"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                            >
                                                ✓ {coverImage.name}
                                            </motion.p>
                                        )}
                                    </div>
                                </motion.div>
                            </motion.div>

                            {/* Páginas */}
                            <motion.div 
                                className="space-y-2"
                                variants={animations.formItem}
                                whileHover="hover"
                            >
                                <label className="block text-sm font-medium text-gray-700">Cantidad de Páginas</label>
                                <motion.div className="relative">
                                    <motion.select
                                        value={formData.paginas}
                                        onChange={(e) => setFormData({ ...formData, paginas: e.target.value })}
                                        className="w-full p-3 bg-purple-50/50 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:outline-none transition-all border border-purple-100 appearance-none"
                                        whileFocus={{ 
                                            scale: 1.02,
                                            boxShadow: "0 0 0 3px rgba(139, 92, 246, 0.2)",
                                            backgroundColor: "rgba(245, 243, 255, 0.8)"
                                        }}
                                    >
                                        {preset?.pages_options ? (
                                            preset.pages_options.map((option, index) => (
                                                <option key={index} value={option}>{option}</option>
                                            ))
                                        ) : (
                                            <>
                                                <option value="24 páginas">24 páginas</option>
                                                <option value="50 páginas">50 páginas</option>
                                                <option value="100 páginas">100 páginas</option>
                                            </>
                                        )}
                                    </motion.select>
                                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-purple-400 pointer-events-none" />
                                </motion.div>
                            </motion.div>

                            {/* Tipo de Tapa */}
                            <motion.div 
                                className="space-y-2"
                                variants={animations.formItem}
                                whileHover="hover"
                            >
                                <label className="block text-sm font-medium text-gray-700">Tipo de Tapa</label>
                                <motion.div className="relative">
                                    <motion.select
                                        value={formData.tapa}
                                        onChange={(e) => setFormData({ ...formData, tapa: e.target.value })}
                                        className="w-full p-3 bg-purple-50/50 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:outline-none transition-all border border-purple-100 appearance-none"
                                        whileFocus={{ 
                                            scale: 1.02,
                                            boxShadow: "0 0 0 3px rgba(139, 92, 246, 0.2)",
                                            backgroundColor: "rgba(245, 243, 255, 0.8)"
                                        }}
                                    >
                                        {preset?.cover_options ? (
                                            preset.cover_options.map((option, index) => (
                                                <option key={index} value={option}>{option}</option>
                                            ))
                                        ) : (
                                            <>
                                                <option value="Tapa Dura Personalizable">Tapa Dura Personalizable</option>
                                                <option value="Tapa Blanda">Tapa Blanda</option>
                                            </>
                                        )}
                                    </motion.select>
                                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-purple-400 pointer-events-none" />
                                </motion.div>
                            </motion.div>

                            {/* Tipo de Acabado */}
                            <motion.div 
                                className="space-y-2"
                                variants={animations.formItem}
                                whileHover="hover"
                            >
                                <label className="block text-sm font-medium text-gray-700">Tipo de Acabado</label>
                                <motion.div className="relative">
                                    <motion.select
                                        value={formData.acabado}
                                        onChange={(e) => setFormData({ ...formData, acabado: e.target.value })}
                                        className="w-full p-3 bg-purple-50/50 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:outline-none transition-all border border-purple-100 appearance-none"
                                        whileFocus={{ 
                                            scale: 1.02,
                                            boxShadow: "0 0 0 3px rgba(139, 92, 246, 0.2)",
                                            backgroundColor: "rgba(245, 243, 255, 0.8)"
                                        }}
                                    >
                                        {preset?.finish_options ? (
                                            preset.finish_options.map((option, index) => (
                                                <option key={index} value={option}>{option}</option>
                                            ))
                                        ) : (
                                            <>
                                                <option value="Limado">Limado</option>
                                                <option value="Brillante">Brillante</option>
                                                <option value="Mate">Mate</option>
                                            </>
                                        )}
                                    </motion.select>
                                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-purple-400 pointer-events-none" />
                                </motion.div>
                            </motion.div>

                            {/* Botón Crear proyecto */}
                            <motion.div className="pt-4">
                                <motion.button
                                    onClick={handleCrearProyecto}
                                    disabled={saving}
                                    className={`block text-center w-full py-3 px-4 rounded-xl font-bold text-sm shadow-lg hover:shadow-xl transition-all relative overflow-hidden group ${
                                        saving 
                                            ? 'bg-gray-400 cursor-not-allowed' 
                                            : isAuthenticated
                                                ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white'
                                                : 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
                                    }`}
                                    whileHover={!saving ? { 
                                        scale: 1.02,
                                        boxShadow: "0 10px 25px -5px rgba(139, 92, 246, 0.4)"
                                    } : {}}
                                    whileTap={!saving ? { scale: 0.98 } : {}}
                                >
                                    <span className="relative z-10 flex items-center justify-center gap-2">
                                        {saving ? (
                                            <>
                                                <motion.div 
                                                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                                                    animate={{ rotate: 360 }}
                                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                                />
                                                Guardando...
                                            </>
                                        ) : isAuthenticated ? (
                                            <>
                                                <Sparkles size={16} />
                                                Crear proyecto
                                                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                            </>
                                        ) : (
                                            <>
                                                <span>🔐</span>
                                                Inicia sesión para crear
                                                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </span>
                                    {!saving && (
                                        <motion.span
                                            className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                                                isAuthenticated 
                                                    ? 'bg-gradient-to-r from-pink-600 to-purple-700'
                                                    : 'bg-gradient-to-r from-red-600 to-orange-700'
                                            }`}
                                        />
                                    )}
                                </motion.button>
                            </motion.div>
                        </div>
                    </motion.div>

                    {/* Vista previa del libro */}
                    <motion.div 
                        className="bg-white rounded-2xl p-6 flex flex-col items-center justify-center shadow-2xl border-2 border-white relative overflow-hidden"
                        initial={{ rotate: -2, scale: 0.95 }}
                        animate={{ rotate: 0, scale: 1 }}
                        whileHover={{ 
                            scale: 1.03,
                            boxShadow: "0 20px 40px -10px rgba(0, 0, 0, 0.15)"
                        }}
                    >
                        {loading ? (
                            // Estado de carga
                            <div className="animate-pulse">
                                <div className="w-full h-[300px] bg-gray-200 rounded-lg"></div>
                            </div>
                        ) : (
                            <>
                                {/* Imagen principal */}
                                <motion.img
                                    src={coverImagePreview || preset?.image || "/assets/img/backgrounds/resources/default-image.png"}
                                    alt="Vista previa del libro personalizado"
                                    className="max-w-full h-auto max-h-[400px] rounded-lg shadow-md transform transition-transform group-hover:scale-105"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                />
                                
                                {/* Overlay para mostrar que se puede personalizar */}
                                {!coverImagePreview && (
                                    <motion.div 
                                        className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center"
                                        initial={{ opacity: 0 }}
                                        whileHover={{ opacity: 1 }}
                                    >
                                        <div className="bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-sm flex items-center gap-2">
                                            <ImageIcon size={16} className="text-purple-500" />
                                            <span className="text-sm font-medium">Sube tu portada</span>
                                        </div>
                                    </motion.div>
                                )}
                                
                                {/* Indicador de imagen personalizada */}
                                {coverImagePreview && (
                                    <motion.div 
                                        className="absolute top-4 right-4 bg-green-500 text-white px-2 py-1 rounded-full shadow-sm flex items-center gap-1"
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ delay: 0.5, type: "spring" }}
                                    >
                                        <span className="text-xs font-medium">✓ Personalizada</span>
                                    </motion.div>
                                )}
                            </>
                        )}
                        
                        {/* Badge de información */}
                        <motion.div 
                            className="absolute bottom-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full shadow-sm flex items-center gap-2"
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.8 }}
                        >
                            <Sparkles size={14} className="text-purple-500" />
                            <span className="text-xs font-medium">
                                {preset?.name || "Edición Especial"}
                            </span>
                        </motion.div>
                    </motion.div>
                </motion.div>
            </div>

            {/* Modal de Login */}
            <AnimatePresence>
                {showLoginModal && (
                    <motion.div 
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleCloseLoginModal}
                    >
                        <motion.div 
                            className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl"
                            initial={{ scale: 0.8, opacity: 0, y: 50 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.8, opacity: 0, y: 50 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="text-center">
                                <motion.div 
                                    className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.2, type: "spring" }}
                                >
                                    <span className="text-2xl">🔐</span>
                                </motion.div>
                                
                                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                                    ¡Inicia sesión para continuar!
                                </h3>
                                
                                <p className="text-gray-600 mb-6">
                                    Para guardar tu álbum personalizado necesitas tener una cuenta activa.
                                </p>

                                <div className="space-y-3">
                                    <motion.button
                                        onClick={handleLoginRedirect}
                                        className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        Iniciar sesión
                                    </motion.button>
                                    
                                    <motion.button
                                        onClick={handleCloseLoginModal}
                                        className="w-full py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        Continuar sin guardar
                                    </motion.button>
                                </div>

                                <p className="text-sm text-gray-500 mt-4">
                                    ¿No tienes cuenta? 
                                    <a href="/crear-cuenta" className="text-purple-600 hover:underline ml-1">
                                        Regístrate gratis
                                    </a>
                                </p>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}