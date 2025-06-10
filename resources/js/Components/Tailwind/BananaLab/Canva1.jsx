import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, X, ArrowRight, Heart, Share2, Edit, Star, Clock, Users, Zap, Award, Shield, Palette } from "lucide-react";
import ItemPresetsRest from "../../../Actions/Admin/ItemPresetsRest";

// Animaciones configuradas
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
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 10
      }
    },
    hover: {
      y: -5,
      scale: 1.03,
      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
      transition: { duration: 0.2 }
    }
  },
  modal: {
    overlay: {
      hidden: { opacity: 0 },
      visible: { opacity: 1 },
      exit: { opacity: 0 }
    },
    content: {
      hidden: { scale: 0.9, opacity: 0 },
      visible: { 
        scale: 1, 
        opacity: 1,
        transition: { type: "spring", damping: 25 }
      },
      exit: { scale: 0.9, opacity: 0 }
    }
  },
  button: {
    hover: { x: -3 },
    tap: { scale: 0.95 }
  },
  title: {
    hidden: { x: -20, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.5 }
    }
  }
};



const CardBanana = ({ producto, onClick }) => {
  
  const [isHovered, setIsHovered] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  // Calcular precio con descuento
  const precioOriginal = Number(producto.precio) || 29.99;
  const descuento = Number(producto.descuento) || 0;
  //si precio original el mayor a descuento entonces el precio final sera descuento sino precio original
  const precioFinal = descuento > 0 && precioOriginal > descuento ? descuento : precioOriginal;

  const descuentoPorcentaje = descuento > 0 ? ((precioOriginal - precioFinal) / precioOriginal) * 100 : 0;

  // Datos simulados para enriquecer la información
  /*const rating = producto.rating || (4.2 + Math.random() * 0.8);
  const totalReviews = producto.reviews || Math.floor(Math.random() * 500) + 50;
  const popularidad = producto.popularidad || Math.floor(Math.random() * 100);
  const tiempoEdicion = producto.tiempo_edicion || Math.floor(Math.random() * 10) + 5;
  const dificultad = producto.dificultad || ['Fácil', 'Intermedio', 'Avanzado'][Math.floor(Math.random() * 3)];
  */
  return (
    <motion.div
      className="block bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all cursor-pointer relative group"
      variants={animations.item}
      whileHover={{
        scale: 1.02,
        boxShadow: "0px 12px 24px rgba(0, 0, 0, 0.15)",
        transition: { duration: 0.3 },
      }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(producto.id)}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      {/* Badge de popularidad */}
      {/*popularidad > 70 && (
        <div className="absolute top-3 left-3 z-20">
          <motion.div 
            className="bg-gradient-to-r from-orange-400 to-red-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Zap size={12} />
            Popular
          </motion.div>
        </div>
      )*/}

      {/* Botón de favorito */}
     {/* <div className="absolute top-3 right-3 z-20">
        <motion.button
          className={`p-2 rounded-full backdrop-blur-sm ${isFavorite ? 'bg-red-500 text-white' : 'bg-white/80 text-gray-600'} shadow-lg`}
          onClick={(e) => {
            e.stopPropagation();
            setIsFavorite(!isFavorite);
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Heart size={16} fill={isFavorite ? "currentColor" : "none"} />
        </motion.button>
      </div> */}

      {/* Descuento badge */}
      {descuentoPorcentaje > 0 && (
        <div className="absolute top-3 right-3 z-20">
          <motion.div 
            className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            -{Math.round(descuentoPorcentaje)}%
          </motion.div>
        </div>
      )}

      {/* Imagen del producto */}
      <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 relative overflow-hidden">
        <motion.img 
          src={producto.imagen}
          alt={producto.titulo}
          className="w-full h-full object-cover"
          initial={{ scale: 1 }}
          animate={{ scale: isHovered ? 1.05 : 1 }}
          transition={{ duration: 0.3 }}
          onError={(e) => e.target.src = "/assets/img/backgrounds/resources/default-image.png"}
        />

        {/* Overlay con información adicional */}
      {/*  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex items-center justify-between text-white text-sm">
              <div className="flex items-center gap-2">
                <Clock size={14} />
                <span>{tiempoEdicion} min</span>
              </div>
              <div className="flex items-center gap-1">
                <Palette size={14} />
                <span className="capitalize">{dificultad}</span>
              </div>
            </div>
          </div>
        </div> */}

        {/* Efecto hover central */}
        <AnimatePresence>
          {isHovered && (
            <motion.div 
              className="absolute inset-0 bg-black/20 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-white text-primary rounded-full p-4 shadow-xl"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 180 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Edit size={24} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Contenido de la tarjeta mejorado */}
      <div className="p-5">
        {/* Título y rating */}
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-bold text-gray-800 text-lg line-clamp-1 flex-1">
            {producto.titulo}
          </h3>
        </div>

        {/* Rating y reviews */}
     {/*   <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-1">
            <Star size={16} className="text-yellow-400 fill-current" />
            <span className="text-sm font-semibold text-gray-700">
              {Number(rating || 4.5).toFixed(1)}
            </span>
          </div>
          <span className="text-sm text-gray-500">
            ({totalReviews} reviews)
          </span>
        </div> */}

        {/* Descripción */}
        <p className="text-gray-600 text-sm line-clamp-2 mb-4">
          {producto.descripcion}
        </p>

        {/* Características rápidas */}
     {/*   <div className="flex items-center gap-4 mb-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Users size={12} />
            <span>{totalReviews}+ usuarios</span>
          </div>
          <div className="flex items-center gap-1">
            <Shield size={12} />
            <span>Calidad garantizada</span>
          </div>
        </div> */}

        {/* Precio y CTA */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            {descuentoPorcentaje > 0 && (
              <span className="text-sm text-gray-400 line-through">
                S/ {Number(precioOriginal).toFixed(2)}
              </span>
            )}
            <span className="text-xl font-bold text-primary">
              S/ {Number(precioFinal).toFixed(2)}
            </span>
          </div>
          
        {/*  <motion.div
            className="bg-primary text-white px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2"
            whileHover={{ scale: 1.05, backgroundColor: "#4F46E5" }}
            whileTap={{ scale: 0.95 }}
          >
            <Edit size={14} />
            Editar
          </motion.div> */}
        </div>

        {/* Información adicional del preset */}
        {producto.item_preset_id && (
          <div className="mt-3 flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
              <Award size={12} />
              Diseño personalizable
            </div>
           {/* {producto.design_layers && (
              <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                {producto.design_layers.length} capas
              </div>
            )} */}
          </div>
        )}
      </div>

      {/* Link directo (manteniendo funcionalidad original) */}
      <a
        href={`/canva2?item=${producto.item_id || producto.id}&preset=${producto.item_preset_id || producto.id}`}
        className="absolute inset-0 z-10"
        aria-label={`Editar ${producto.titulo}`}
      />
    </motion.div>
  );
};

const ProductoModal = ({ producto, onClose }) => {
  const [selectedColor, setSelectedColor] = useState(producto.colores?.[0] || "#FF5733");
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('detalles');

  // Calcular precio con descuento
  const precioOriginal = Number(producto.precio) || 29.99;
  const descuento = Number(producto.descuento) || 0;
  //si precio original el mayor a descuento entonces el precio final sera descuento sino precio original
  const precioFinal = descuento > 0 && precioOriginal > descuento ? descuento : precioOriginal;
  const descuentoPorcentaje = descuento > 0 ? ((precioOriginal - precioFinal) / precioOriginal) * 100 : 0;
  
  // Datos enriquecidos
  const rating = producto.rating || (4.2 + Math.random() * 0.8);
  const totalReviews = producto.reviews || Math.floor(Math.random() * 500) + 50;
  const tiempoEdicion = producto.tiempo_edicion || Math.floor(Math.random() * 10) + 5;
  const dificultad = producto.dificultad || ['Fácil', 'Intermedio', 'Avanzado'][Math.floor(Math.random() * 3)];
  const compatibilidad = ['Impresión', 'Digital', 'Redes Sociales'];
  const dimensiones = ['1080x1080', '1920x1080', '2480x3508'];
  
  const tabs = [
    { id: 'detalles', label: 'Detalles', icon: <Edit size={16} /> },
    { id: 'especificaciones', label: 'Especificaciones', icon: <Shield size={16} /> },
    { id: 'reviews', label: 'Reviews', icon: <Star size={16} /> }
  ];

  return (
    <motion.div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      variants={animations.modal.overlay}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <motion.div 
        className="bg-white rounded-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden"
        variants={animations.modal.content}
      >
        {/* Header del modal mejorado */}
        <div className="bg-gradient-to-r from-primary to-purple-600 text-white p-6">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">{producto.titulo}</h2>
              <div className="flex items-center gap-4 text-sm opacity-90">
                <div className="flex items-center gap-1">
                  <Star size={16} className="fill-current text-yellow-300" />
                  <span>{Number(rating || 4.5).toFixed(1)} ({totalReviews} reviews)</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock size={16} />
                  <span>{tiempoEdicion} min de edición</span>
                </div>
                <div className="flex items-center gap-1">
                  <Palette size={16} />
                  <span>{dificultad}</span>
                </div>
              </div>
            </div>
            <motion.button
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              onClick={onClose}
              whileHover={{ rotate: 90, scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <X className="h-6 w-6" />
            </motion.button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row h-full">
          {/* Panel izquierdo - Imágenes */}
          <div className="lg:w-1/2 p-6 bg-gray-50">
            <div className="space-y-4">
              <div className="bg-white rounded-xl overflow-hidden shadow-sm">
                <div className="aspect-square relative">
                  <img 
                    src={producto.imagen} 
                    alt={producto.titulo}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 left-4 flex gap-2">
                    {descuento > 0 && (
                      <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                        -{descuento}% OFF
                      </div>
                    )}
                    <div className="bg-primary text-white px-3 py-1 rounded-full text-sm font-bold">
                      Premium
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Miniaturas */}
              <div className="grid grid-cols-4 gap-3">
                {[1, 2, 3, 4].map((item) => (
                  <motion.div
                    key={item}
                    className="bg-white rounded-lg overflow-hidden aspect-square cursor-pointer shadow-sm hover:shadow-md transition-shadow"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <img 
                      src={producto.imagen} 
                      alt={`Vista ${item}`}
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Panel derecho - Información */}
          <div className="lg:w-1/2 flex flex-col">
            <div className="p-6 flex-1 overflow-y-auto">
              {/* Precio destacado */}
              <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-xl p-6 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    {descuentoPorcentaje > 0 && (
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg text-gray-500 line-through">
                          S/ {Number(precioOriginal).toFixed(2)}
                        </span>
                        <span className="bg-red-100 text-red-600 text-sm font-bold px-3 py-1 rounded-full">
                          -{Math.round(descuentoPorcentaje)}% OFF
                        </span>
                      </div>
                    )}
                    <p className="text-4xl font-bold text-primary mb-1">
                      S/ {Number(precioFinal).toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-600">Precio especial por tiempo limitado</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Ahorro</div>
                    <div className="text-2xl font-bold text-green-600">
                      S/ {Number(precioOriginal - precioFinal).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabs de información */}
              <div className="mb-6">
                <div className="flex border-b border-gray-200">
                  {tabs.map((tab) => (
                    <motion.button
                      key={tab.id}
                      className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors ${
                        activeTab === tab.id 
                          ? 'border-b-2 border-primary text-primary' 
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                      onClick={() => setActiveTab(tab.id)}
                      whileHover={{ y: -1 }}
                    >
                      {tab.icon}
                      {tab.label}
                    </motion.button>
                  ))}
                </div>

                <div className="mt-4">
                  {activeTab === 'detalles' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      <p className="text-gray-700 leading-relaxed">{producto.descripcion}</p>
                      
                      {/* Características destacadas */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-blue-50 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Users className="text-blue-600" size={18} />
                            <span className="font-semibold text-blue-800">Popularidad</span>
                          </div>
                          <p className="text-sm text-blue-700">Usado por {totalReviews}+ diseñadores</p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Zap className="text-green-600" size={18} />
                            <span className="font-semibold text-green-800">Edición rápida</span>
                          </div>
                          <p className="text-sm text-green-700">Solo {tiempoEdicion} minutos</p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'especificaciones' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      <div className="grid grid-cols-1 gap-4">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <Shield size={18} className="text-primary" />
                            Compatibilidad
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {compatibilidad.map((item, index) => (
                              <span key={index} className="bg-white px-3 py-1 rounded-full text-sm border">
                                {item}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <Palette size={18} className="text-primary" />
                            Dimensiones disponibles
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {dimensiones.map((dim, index) => (
                              <span key={index} className="bg-white px-3 py-1 rounded-full text-sm border font-mono">
                                {dim}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'reviews' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-4">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="text-center">
                            <div className="text-3xl font-bold text-yellow-600">{Number(rating || 4.5).toFixed(1)}</div>
                            <div className="flex text-yellow-400">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} size={16} className={i < Math.floor(rating) ? "fill-current" : ""} />
                              ))}
                            </div>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-600">Basado en {totalReviews} reviews</p>
                            <div className="text-sm text-gray-500 mt-1">
                              98% de los usuarios lo recomiendan
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Reviews simulados */}
                      <div className="space-y-3">
                        {['Excelente diseño, muy fácil de personalizar', 'Perfecto para mis proyectos', 'Calidad profesional'].map((review, index) => (
                          <div key={index} className="border rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="flex text-yellow-400">
                                {[...Array(5)].map((_, i) => (
                                  <Star key={i} size={12} className="fill-current" />
                                ))}
                              </div>
                              <span className="text-sm text-gray-500">Usuario verificado</span>
                            </div>
                            <p className="text-sm text-gray-700">{review}</p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer con acciones */}
            <div className="p-6 bg-gray-50 border-t">
              <div className="space-y-4">
                {/* Botón principal */}
                <motion.a
                  href={`/canva2?item=${producto.item_id || producto.id}&preset=${producto.item_preset_id || producto.id}`}
                  className="w-full bg-gradient-to-r from-primary to-purple-600 text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 text-lg"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Edit size={20} />
                  Comenzar a Editar
                </motion.a>
                
                {/* Botones secundarios */}
                <div className="flex gap-3">
                  <motion.button
                    className="flex-1 border-2 border-primary text-primary py-3 rounded-xl font-medium flex items-center justify-center gap-2"
                    whileHover={{ scale: 1.02, backgroundColor: "#f8fafc" }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Heart size={18} /> Guardar
                  </motion.button>
                  <motion.button
                    className="flex-1 border-2 border-gray-300 text-gray-700 py-3 rounded-xl font-medium flex items-center justify-center gap-2"
                    whileHover={{ scale: 1.02, backgroundColor: "#f8fafc" }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Share2 size={18} /> Compartir
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default function Canva1({ data, filteredData }) {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [presets, setPresets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const itemPresetsRest = new ItemPresetsRest();

  // Obtener el item ID de la URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const itemId = urlParams.get('item');
    
    if (itemId) {
      loadItemPresets(itemId);
    } else {
      // Si no hay item seleccionado, usar datos estáticos como fallback
      //setPresets(productos);
      setLoading(false);
    }
  }, []);

  const loadItemPresets = async (itemId) => {
    try {
      setLoading(true);
      console.log('Cargando presets para item:', itemId);
      
      // Cargar presets del item usando el método específico
      const response = await itemPresetsRest.getByItem(itemId);
      
      if (response && response.data) {
        console.log('Presets cargados:', response.data);
        
        // Transformar los presets al formato esperado por el componente
        const transformedPresets = response.data.map(preset => ({
          id: preset.id,
          imagen: `/storage/images/item_preset/${preset.image}`,
          titulo: preset.name || `Preset ${preset.id}`,
          descripcion: preset.description || "Diseño predefinido personalizable con múltiples opciones de personalización",
          precio: preset?.price,
          descuento: preset?.discount, 
          item_preset_id: preset.id,
          item_id: itemId,
          design_layers: preset.design_layers,
          // Datos adicionales para mejorar la UI
          /*rating: 4.2 + Math.random() * 0.8,
          reviews: Math.floor(Math.random() * 500) + 50,
          popularidad: Math.floor(Math.random() * 100),
          tiempo_edicion: Math.floor(Math.random() * 15) + 5,
          dificultad: ['Fácil', 'Intermedio', 'Avanzado'][Math.floor(Math.random() * 3)],
          categoria: 'Diseño Digital',*/
          fecha_creacion: new Date().toISOString(),
          //descargas: Math.floor(Math.random() * 1000) + 100
        }));

        setPresets(transformedPresets);
        setSelectedItem({ id: itemId });
      } else {
        console.warn('No se encontraron presets para el item:', itemId);
        setPresets([]);
      }
    } catch (error) {
      console.error('Error al cargar presets:', error);
      // En caso de error, usar datos estáticos como fallback
      setPresets(productos);
    } finally {
      setLoading(false);
    }
  };

  const handleProductClick = (id) => {
    setSelectedProduct(presets.find(p => p.id === id));
  };

  return (
    <motion.div 
      className="container mx-auto px-4 py-8 max-w-7xl font-paragraph"
      initial="hidden"
      animate="visible"
      variants={animations.container}
    >
      {/* Header mejorado */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <motion.button 
          className="flex items-center text-primary hover:text-primary/80 transition-colors"
          variants={animations.button}
          whileHover="hover"
          whileTap="tap"
          onClick={() => window.history.back()}
        >
          <ChevronLeft className="h-6 w-6" />
          <span className="ml-1 font-medium">Regresar</span>
        </motion.button>

        {/* Estadísticas */}
        {presets.length > 0 && (
          <div className="flex items-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Palette size={16} />
              <span>{presets.length} diseños disponibles</span>
            </div>
           {/* <div className="flex items-center gap-1">
              <Users size={16} />
              <span>Más de 1000+ usuarios</span>
            </div>
            <div className="flex items-center gap-1">
              <Award size={16} />
              <span>Calidad premium</span>
            </div> */}
          </div>
        )}
      </div>

      {/* Título mejorado */}
      <motion.div 
        className="mb-8"
        variants={animations.title}
      >
        <h1 className="text-4xl md:text-5xl font-bold mb-4  customtext-primary">
          {selectedItem ? 'Elige tu diseño predefinido' : 'Diseños predefinidos'}
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl">
          Selecciona uno de nuestros diseños profesionales y personalízalo a tu gusto. 
          Todos los diseños incluyen múltiples capas editables y son perfectos para cualquier ocasión.
        </p>
        
        {/* Filtros rápidos */}
      {/*  <div className="flex items-center gap-3 mt-6">
          <span className="text-sm font-medium text-gray-700">Filtros populares:</span>
          <div className="flex flex-wrap gap-2">
            {['Más populares', 'Recientes', 'Mejor valorados', 'Edición rápida'].map((filter, index) => (
              <motion.button
                key={filter}
                className="px-4 py-2 bg-gray-100 hover:bg-primary hover:text-white text-gray-700 rounded-full text-sm font-medium transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {filter}
              </motion.button>
            ))}
          </div>
        </div> */}
      </motion.div>

      {/* Estado de carga mejorado */}
      {loading && (
        <motion.div 
          className="flex flex-col justify-center items-center py-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/20 border-t-primary"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Palette className="h-6 w-6 text-primary animate-pulse" />
            </div>
          </div>
          <motion.div 
            className="mt-6 text-center"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Cargando diseños increíbles</h3>
            <p className="text-gray-600">Preparando los mejores diseños para ti...</p>
          </motion.div>
        </motion.div>
      )}

      {/* Grid de productos/presets */}
      {!loading && (
        <>
          {presets.length > 0 ? (
            <motion.div 
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
              variants={animations.container}
            >
              <AnimatePresence>
                {presets.map((producto) => (
                  <motion.div
                    key={producto.id}
                    variants={animations.item}
                    layoutId={`product-${producto.id}`}
                  >
                    <CardBanana 
                      producto={producto} 
                      onClick={handleProductClick} 
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div 
              className="text-center py-20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="max-w-md mx-auto">
                <div className="bg-gray-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                  <Palette className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-4">
                  {selectedItem ? 
                    'No hay diseños disponibles' :
                    'No se encontraron diseños'
                  }
                </h3>
                <p className="text-gray-600 mb-8 leading-relaxed">
                  {selectedItem ? 
                    'Este producto aún no tiene diseños predefinidos disponibles. ¡Pero puedes crear tu propio diseño desde cero!' :
                    'Parece que no hay diseños cargados en este momento. Intenta recargar la página o contacta con soporte.'
                  }
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <motion.button 
                    className="bg-primary text-white px-8 py-3 rounded-xl hover:opacity-90 transition-all font-medium flex items-center justify-center gap-2"
                    onClick={() => window.history.back()}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <ChevronLeft size={18} />
                    Regresar al producto
                  </motion.button>
                  <motion.button 
                    className="border-2 border-primary text-primary px-8 py-3 rounded-xl hover:bg-primary hover:text-white transition-all font-medium flex items-center justify-center gap-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Edit size={18} />
                    Crear desde cero
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </>
      )}

      {/* Modal de producto */}
     {/* <AnimatePresence>
        {selectedProduct && (
          <ProductoModal 
            producto={selectedProduct} 
            onClose={() => setSelectedProduct(null)} 
          />
        )}
      </AnimatePresence> */}
    </motion.div>
  );
}