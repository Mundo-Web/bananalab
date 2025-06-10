import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronDown, ArrowRight, Sparkles, BookOpen, Palette, Layers, Upload, Image as ImageIcon, LogIn } from "lucide-react";
import ItemPresetsRest from "../../../Actions/Admin/ItemPresetsRest";
import AlbumRest from "../../../Actions/AlbumRest";

// Componente CustomSelect para selects suaves y profesionales
const CustomSelect = ({ value, onChange, placeholder, options = [], disabled = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedLabel, setSelectedLabel] = useState('');

    useEffect(() => {
        if (value && options.length > 0) {
            const selected = options.find(opt => (opt.value || opt) === value);
            setSelectedLabel(selected ? (selected.label || selected) : value);
        } else {
            setSelectedLabel('');
        }
    }, [value, options]);

    const handleSelect = (optionValue, optionLabel) => {
        onChange(optionValue);
        setSelectedLabel(optionLabel);
        setIsOpen(false);
    };

    if (disabled || options.length === 0) {
        return (
            <div className="w-full p-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-400 cursor-not-allowed flex items-center justify-between">
                <span>{placeholder}</span>
                <ChevronDown size={16} className="text-gray-400" />
            </div>
        );
    }

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full p-3 border border-gray-300 rounded-lg bg-white text-left cursor-pointer 
                         hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent 
                         transition-all duration-200 ease-out flex items-center justify-between"
            >
                <span className={selectedLabel ? "text-gray-900" : "text-gray-400"}>
                    {selectedLabel || placeholder}
                </span>
                <ChevronDown 
                    size={16} 
                    className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
                />
            </button>
            
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.96 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto"
                    >
                        {options.map((option, index) => {
                            const optionValue = option.value || option;
                            const optionLabel = option.label || option;
                            const isSelected = optionValue === value;
                            return (
                                <button
                                    key={index}
                                    type="button"
                                    onClick={() => handleSelect(optionValue, optionLabel)}
                                    className={`w-full px-3 py-2.5 text-left transition-colors duration-150 
                                              first:rounded-t-lg last:rounded-b-lg focus:outline-none
                                              ${isSelected 
                                                ? 'bg-purple-50 text-purple-700 font-medium' 
                                                : 'hover:bg-gray-50 hover:text-gray-900'
                                              }`}
                                >
                                    {optionLabel}
                                </button>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
            
            {/* Overlay para cerrar al hacer click fuera */}
            {isOpen && (
                <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsOpen(false)}
                />
            )}
        </div>
    );
};

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

    // Función para generar features dinámicos basados en preset y formData
    const getDynamicFeatures = () => {
        const dynamicFeatures = [];
        
        // Feature de páginas - siempre muestra la cantidad actual
        const paginasTexto =  `${formData.paginas} páginas` || 
            (preset?.default_pages ? `${preset.default_pages} páginas` : "50 páginas");
        dynamicFeatures.push({
            icon: <BookOpen size={20} />,
            text: paginasTexto
        });

        // Feature personalizable - siempre presente
        dynamicFeatures.push({
            icon: <Palette size={20} />,
            text: "Personalizable"
        });

        // Feature de tapa - basado en selección del usuario o default del preset
        const tapaTexto = `Tapa ${formData.tapa}` || `Tapa ${preset?.default_cover}` || "Tapa dura premium";
        dynamicFeatures.push({
            icon: <Layers size={20} />,
            text: tapaTexto
        });

        return dynamicFeatures;
    };

    // Función para obtener el título dinámico
    const getDynamicTitle = () => {
        // Si el usuario ha escrito un título, usar ese
        if (formData.titulo && formData.titulo.trim() !== "") {
            return formData.titulo;
        }
        
        // Si no, usar el nombre del preset o el nombre del item
        return preset?.name || preset?.item?.name || "Libro Personalizado";
    };

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
                        
                        // Parsear las opciones JSON si vienen como strings
                        let parsedPresetData = { ...presetData };
                        
                        // Parsear pages_options si es string
                        if (typeof presetData.pages_options === 'string') {
                            try {
                                parsedPresetData.pages_options = JSON.parse(presetData.pages_options);
                            } catch (e) {
                                console.warn('Error parsing pages_options:', e);
                                parsedPresetData.pages_options = [];
                            }
                        }
                        
                        // Parsear cover_options si es string
                        if (typeof presetData.cover_options === 'string') {
                            try {
                                parsedPresetData.cover_options = JSON.parse(presetData.cover_options);
                            } catch (e) {
                                console.warn('Error parsing cover_options:', e);
                                parsedPresetData.cover_options = [];
                            }
                        }
                        
                        // Parsear finish_options si es string
                        if (typeof presetData.finish_options === 'string') {
                            try {
                                parsedPresetData.finish_options = JSON.parse(presetData.finish_options);
                            } catch (e) {
                                console.warn('Error parsing finish_options:', e);
                                parsedPresetData.finish_options = [];
                            }
                        }
                        
                        setPreset(parsedPresetData);
                        
                        // Configurar datos iniciales del formulario basados en el preset
                        setFormData(prev => ({
                            ...prev,
                            titulo: "", // Empezar vacío para que muestre el nombre del preset por defecto
                            paginas: parsedPresetData.default_pages || 
                                    (parsedPresetData.pages_options && Array.isArray(parsedPresetData.pages_options) && 
                                     parsedPresetData.pages_options[0]?.label) || 
                                    "50 páginas",
                            tapa: parsedPresetData.default_cover || 
                                  (parsedPresetData.cover_options && Array.isArray(parsedPresetData.cover_options) && 
                                   parsedPresetData.cover_options[0]?.label) || 
                                  "Tapa Dura Personalizable",
                            acabado: parsedPresetData.default_finish || 
                                    (parsedPresetData.finish_options && Array.isArray(parsedPresetData.finish_options) && 
                                     parsedPresetData.finish_options[0]?.label) || 
                                    "Limado"
                        }));
                        
                        // Si el preset tiene imagen, mostrarla como cover actual
                        if (presetData.image && typeof presetData.image === 'string') {
                            // Asegurar que la imagen tenga la ruta correcta
                            const imagePath = presetData.image.startsWith('/') ? 
                                presetData.image : 
                                `/storage/images/item_preset/${presetData.image}`;
                            setCoverImagePreview(imagePath);
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
    };    // Manejar clic en "Crear proyecto"
    const handleCrearProyecto = async (e) => {
        // Prevenir comportamiento por defecto
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        // Verificar autenticación primero
        if (!isAuthenticated) {
            console.log('Usuario no autenticado, mostrando modal de login');
            // Mostrar modal de login sin redirigir
            setShowLoginModal(true);
            return false; // Retornar false explícitamente
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
    // Cerrar modal de login
    const handleCloseLoginModal = () => {
        console.log('Cerrando modal de login');
        setShowLoginModal(false);
    };

    // Manejo de login redirect con prevención de navegación inmediata
    const handleLoginRedirect = (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        console.log('Redirigiendo a login');
        const currentUrl = encodeURIComponent(window.location.href);
        // Usar setTimeout para evitar conflictos con el estado del modal
        setTimeout(() => {
            window.location.href = `/iniciar-sesion?redirect=${currentUrl}`;
        }, 100);
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
                      className="flex items-center  mb-6 p-3 rounded-xl transition-all z-10 relative"
                variants={animations.button}
                whileHover="hover"
                whileTap="tap"
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                      onClick={() => window.history.back()}
                    >
                      <ChevronLeft className="h-6 w-6" />
                      <span className="ml-1 font-medium">Regresar</span>
                    </motion.button>
          

            {/* Contenedor principal */}
            <div className="md:flex md:gap-10 md:items-start relative z-10">
                {/* Columna izquierda - Información y todas las opciones */}
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
                                    {getDynamicTitle()}
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
                            {getDynamicFeatures().map((feature, i) => (
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

                    {/* Formulario con todas las opciones */}
                    <motion.form 
                        className="space-y-6 bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white"
                        variants={animations.container}
                        initial="hidden"
                        animate="visible"
                    >
                        {/* Título */}
                        <motion.div 
                            className="space-y-2"
                            
                        >
                            <label className="block text-sm font-medium text-gray-700">Título del Libro</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={formData.titulo}
                                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                                    className="w-full p-3 bg-white rounded-lg border border-gray-300 text-sm 
                                             focus:ring-2 focus:ring-purple-600 focus:border-transparent focus:outline-none 
                                             hover:border-gray-400 transition-all duration-200 ease-out
                                             placeholder:text-gray-400"
                                    placeholder={`${preset?.name || preset?.item?.name || "Libro Personalizado"} (personaliza tu título)`}
                                />
                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                                    <Sparkles size={16} />
                                </div>
                            </div>
                        </motion.div>

                        {/* Páginas */}
                        <motion.div 
                            className="space-y-2"
                         
                        >
                            <label className="block text-sm font-medium text-gray-700">Cantidad de Páginas</label>
                            <CustomSelect
                                value={formData.paginas}
                                onChange={(value) => setFormData({ ...formData, paginas: value })}
                                placeholder="Selecciona páginas"
                                options={preset?.pages_options && Array.isArray(preset.pages_options) 
                                    ? preset.pages_options 
                                    : [
                                        { value: "24 páginas", label: "24 páginas" },
                                        { value: "50 páginas", label: "50 páginas" },
                                        { value: "100 páginas", label: "100 páginas" }
                                    ]
                                }
                            />
                        </motion.div>

                        {/* Tipo de Tapa */}
                        <motion.div 
                            className="space-y-2"
                          
                        >
                            <label className="block text-sm font-medium text-gray-700">Tipo de Tapa</label>
                            <CustomSelect
                                value={formData.tapa}
                                onChange={(value) => setFormData({ ...formData, tapa: value })}
                                placeholder="Selecciona tipo de tapa"
                                options={preset?.cover_options && Array.isArray(preset.cover_options) 
                                    ? preset.cover_options 
                                    : [
                                        { value: "Tapa Dura Personalizable", label: "Tapa Dura Personalizable" },
                                        { value: "Tapa Blanda", label: "Tapa Blanda" }
                                    ]
                                }
                            />
                        </motion.div>

                        {/* Tipo de Acabado */}
                        <motion.div 
                            className="space-y-2"
                           
                        >
                            <label className="block text-sm font-medium text-gray-700">Tipo de Acabado</label>
                            <CustomSelect
                                value={formData.acabado}
                                onChange={(value) => setFormData({ ...formData, acabado: value })}
                                placeholder="Selecciona tipo de acabado"
                                options={preset?.finish_options && Array.isArray(preset.finish_options) 
                                    ? preset.finish_options 
                                    : [
                                        { value: "Limado", label: "Limado" },
                                        { value: "Brillante", label: "Brillante" },
                                        { value: "Mate", label: "Mate" }
                                    ]
                                }
                            />
                        </motion.div>

                        {/* Botón Crear proyecto */}
                        <motion.div className="pt-4">
                            <motion.button
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleCrearProyecto(e);
                                }}
                                disabled={saving }
                                className={`block text-center w-full py-4 px-6 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all relative overflow-hidden group ${
                                    saving 
                                        ? 'bg-gray-400 cursor-not-allowed' 
                                        : isAuthenticated
                                            ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white'
                                            : 'bg-gradient-to-r from-purple-600 to-pink-500 text-white'
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
                                                className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                            />
                                            Guardando...
                                        </>
                                    ) : isAuthenticated ? (
                                        <>
                                            <Sparkles size={20} />
                                            Crear proyecto
                                            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                        </>
                                    ) : (
                                        <>
                                            
                                            Inicia sesión para crear
                                            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </span>
                                {!saving && (
                                    <motion.span
                                        className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                                            isAuthenticated 
                                                ? 'bg-gradient-to-r from-pink-600 to-purple-700'
                                                : 'bg-gradient-to-r from-pink-600 to-purple-700'
                                        }`}
                                    />
                                )}
                            </motion.button>
                        </motion.div>
                    </motion.form>
                </div>

                {/* Columna derecha - Zona de drag & drop para imagen */}
                <motion.div 
                    className="mt-8 md:mt-0 md:w-1/2 sticky top-6"
                    variants={animations.image}
                    whileHover="hover"
                >
                    {/* Zona de drag & drop grande */}
                    <motion.div 
                        className="bg-white rounded-2xl shadow-2xl border-2 border-white relative overflow-hidden min-h-[600px] flex flex-col"
                        initial={{ rotate: -1, scale: 0.95 }}
                        animate={{ rotate: 0, scale: 1 }}
                        whileHover={{ 
                            scale: 1.02,
                            boxShadow: "0 20px 40px -10px rgba(0, 0, 0, 0.15)"
                        }}
                    >
                        {loading ? (
                            // Estado de carga
                            <div className="animate-pulse flex-1 flex items-center justify-center">
                                <div className="w-full h-[500px] bg-gray-200 rounded-lg m-6"></div>
                            </div>
                        ) : (
                            <>
                                {/* Zona de drop principal */}
                                <motion.div
                                    className="flex-1 relative cursor-pointer group"
                                    whileHover={{ backgroundColor: "rgba(245, 243, 255, 0.3)" }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleCoverImageUpload}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />
                                    
                                    {coverImagePreview ? (
                                        // Imagen cargada
                                        <div className="relative h-full min-h-[500px] flex items-center justify-center p-6">
                                            <motion.img
                                                src={coverImagePreview}
                                                alt="Portada personalizada"
                                                className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: 0.2 }}
                                                onError={(e) => {
                                                    console.warn('Error al cargar imagen:', coverImagePreview);
                                                    e.target.src = "/assets/img/backgrounds/resources/default-image.png";
                                                }}
                                            />
                                            
                                            {/* Overlay para reemplazar imagen */}
                                            <motion.div 
                                                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                                initial={{ opacity: 0 }}
                                            >
                                                <div className="bg-white/90 backdrop-blur px-6 py-3 rounded-full shadow-lg flex items-center gap-3">
                                                    <Upload className="w-5 h-5 text-purple-600" />
                                                    <span className="font-medium text-gray-800">Cambiar imagen</span>
                                                </div>
                                            </motion.div>

                                            {/* Badge de imagen personalizada */}
                                            <motion.div 
                                                className="absolute top-4 right-4 bg-purple-500 text-white px-3 py-2 rounded-full shadow-lg flex items-center gap-2"
                                                initial={{ scale: 0, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                transition={{ delay: 0.5, type: "spring" }}
                                            >
                                                <span className="text-sm font-medium">✓ Imagen personalizada</span>
                                            </motion.div>
                                        </div>
                                    ) : (
                                        // Zona de drop vacía
                                        <div className="h-full min-h-[500px] flex flex-col items-center justify-center p-8 border-4 border-dashed border-purple-200 m-6 rounded-2xl bg-gradient-to-br from-purple-50/50 to-pink-50/50">
                                            <motion.div
                                                className="text-center"
                                                initial={{ y: 20, opacity: 0 }}
                                                animate={{ y: 0, opacity: 1 }}
                                                transition={{ delay: 0.3 }}
                                            >
                                                <motion.div
                                                    className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mb-6 mx-auto"
                                                    whileHover={{ scale: 1.1, rotate: 5 }}
                                                    animate={{ y: [0, -5, 0] }}
                                                    transition={{ repeat: Infinity, duration: 2 }}
                                                >
                                                    <Upload className="w-10 h-10 text-purple-600" />
                                                </motion.div>
                                                
                                                <h3 className="text-2xl font-bold text-gray-800 mb-4">
                                                    Arrastra tu imagen aquí
                                                </h3>
                                                
                                                <p className="text-gray-600 mb-6 max-w-md">
                                                    O haz clic para seleccionar una imagen desde tu dispositivo. 
                                                    Esta será la portada de tu libro personalizado.
                                                </p>
                                                
                                                <motion.div 
                                                    className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-full font-semibold shadow-lg"
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                >
                                                    Seleccionar imagen
                                                </motion.div>
                                                
                                                <p className="text-sm text-gray-500 mt-4">
                                                    Formatos soportados: PNG, JPG, JPEG
                                                </p>
                                                
                                                {/* Vista previa de preset si existe */}
                                                {preset?.image && (
                                                    <motion.div 
                                                        className="mt-6 p-4 bg-white/50 rounded-xl"
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        transition={{ delay: 0.8 }}
                                                    >
                                                        <p className="text-sm text-gray-600 mb-2">Vista previa del diseño:</p>
                                                        <img 
                                                            src={preset.image} 
                                                            alt="Diseño preset" 
                                                            className="w-24 h-24 object-cover rounded-lg mx-auto opacity-60"
                                                            onError={(e) => {
                                                                e.target.style.display = 'none';
                                                            }}
                                                        />
                                                    </motion.div>
                                                )}
                                            </motion.div>
                                        </div>
                                    )}
                                </motion.div>

                                {/* Footer con información */}
                                <motion.div 
                                    className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 border-t border-purple-100"
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.6 }}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Sparkles size={18} className="text-purple-500" />
                                            <span className="font-medium text-gray-800">
                                                {preset?.name || "Diseño Personalizado"}
                                            </span>
                                        </div>
                                        
                                        {/*{coverImage && (
                                            <motion.div 
                                                className="text-sm text-green-600 font-medium flex items-center gap-1"
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                            >
                                                <span>✓</span>
                                                {coverImage.name}
                                            </motion.div>
                                        )} */}
                                    </div>
                                </motion.div>
                            </>
                        )}
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
                               
                                
                                <h3 className="text-2xl font-bold customtext-neutral-dark mb-2">
                                    ¡Inicia sesión para continuar!
                                </h3>
                                
                                <p className="text-gray-600 mb-6">
                                    Para guardar tu álbum personalizado necesitas tener una cuenta activa.
                                </p>

                                <div className="space-y-3">
                                    <motion.button
                                        type="button"
                                        onClick={handleLoginRedirect}
                                        className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all cursor-pointer block text-center"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        Iniciar sesión
                                    </motion.button>
                                    
                                    <motion.button
                                        type="button"
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