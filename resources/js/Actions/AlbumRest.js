import { Fetch } from "sode-extend-react";
import { Notify } from "sode-extend-react";

class AlbumRest {
    /**
     * Check if the user is authenticated
     * @returns {Object} Authentication status and user data
     */
    static checkAuth = async () => {
        try {
            const { status, result } = await Fetch("./api/auth/check", {
                method: "GET"
            });

            return {
                authenticated: status && result.status === 200,
                user: result?.data?.user || null,
                message: result?.message || null
            };
        } catch (error) {
            console.error("Error checking authentication:", error);
            return {
                authenticated: false,
                user: null,
                message: "Error al verificar autenticación"
            };
        }
    };    /**
     * Save a new album
     * @param {Object} albumData Album data including cover image and options
     * @returns {Object} Response from the server
     */
    static saveAlbum = async (albumData) => {
        try {
            console.log('Guardando álbum:', albumData);
            
            // Create FormData for file upload
            const formData = new FormData();
            
            // Add all album fields to FormData
            Object.keys(albumData).forEach(key => {
                if (albumData[key] !== null && albumData[key] !== undefined) {
                    if (key === 'custom_options' && typeof albumData[key] === 'object') {
                        formData.append(key, JSON.stringify(albumData[key]));
                    } else {
                        formData.append(key, albumData[key]);
                    }
                }
            });

            // Añadir campos requeridos por el backend (compatibilidad)
            if (albumData.selected_pages !== undefined) {
                formData.append('pages', albumData.selected_pages);
            }
            if (albumData.selected_cover_type !== undefined) {
                formData.append('cover_type', albumData.selected_cover_type);
            }
            if (albumData.selected_finish !== undefined) {
                formData.append('finish_type', albumData.selected_finish);
            }

            console.log('FormData preparada');

            const response = await fetch("./api/albums", {
                method: "POST",
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                },
                credentials: "include" // Asegura que la cookie de sesión se envíe
            });

            // Mostrar respuesta de error detallada en consola
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Respuesta RAW del backend:', errorText);
                let errorJson;
                try {
                    errorJson = JSON.parse(errorText);
                } catch (e) {
                    errorJson = { message: errorText };
                }
                throw new Error(errorJson?.message || 'Error al guardar el álbum');
            }

            const result = await response.json();
            console.log('Respuesta del servidor:', result);

            if (!response.ok || result.status !== 201) {
                throw new Error(result?.message || "Error al guardar el álbum");
            }

            Notify.add({
                icon: "/assets/img/icon.svg",
                title: "Álbum guardado",
                body: "Tu álbum se ha guardado exitosamente",
                type: "success"
            });

            return result;
        } catch (error) {
            console.error('Error en saveAlbum:', error);
            Notify.add({
                icon: "/assets/img/icon.svg",
                title: "Error",
                body: error.message,
                type: "danger"
            });
            throw error;
        }
    };

    /**
     * Get user's albums
     * @returns {Array} List of user's albums
     */
    static getUserAlbums = async () => {
        try {
            const { status, result } = await Fetch("./api/albums", {
                method: "GET"
            });

            if (!status || result.status !== 200) {
                throw new Error(result?.message || "Error al obtener álbumes");
            }

            return result.data;
        } catch (error) {
            Notify.add({
                icon: "/assets/img/icon.svg",
                title: "Error",
                body: error.message,
                type: "danger"
            });
            return [];
        }
    };

    /**
     * Get a specific album by UUID
     * @param {string} uuid Album UUID
     * @returns {Object} Album data
     */
    static getAlbum = async (uuid) => {
        try {
            const { status, result } = await Fetch(`./api/albums/${uuid}`, {
                method: "GET"
            });

            if (!status || result.status !== 200) {
                throw new Error(result?.message || "Error al obtener el álbum");
            }

            return result.data;
        } catch (error) {
            Notify.add({
                icon: "/assets/img/icon.svg",
                title: "Error",
                body: error.message,
                type: "danger"
            });
            throw error;
        }
    };
}

export default AlbumRest;
