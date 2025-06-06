import { Fetch } from "sode-extend-react";
import BasicRest from "../BasicRest";

class ItemPresetsRest extends BasicRest {
    path = "admin/item-presets";
    hasFiles = true;

    /**
     * Override de paginación para incluir filtro por item_id si está en la URL
     */
    paginate = async (request = {}) => {
        // Verificar si hay item_id en la URL
        const urlParams = new URLSearchParams(window.location.search);
        const itemId = urlParams.get('item_id');
        
        if (itemId) {
            request = { ...request, item_id: itemId };
        }
        
        return super.paginate(request);
    };    /**
     * Obtener presets por item usando el endpoint público
     */
    getByItem = async (itemId) => {
        try {
            const response = await fetch(`/api/items/${itemId}/presets`);
            
            if (!response.ok) {
                throw new Error("Error al obtener presets del item");
            }

            return await response.json();
        } catch (error) {
            console.error("Error en getByItem:", error.message);
            throw error;
        }
    };

    /**
     * Obtener un preset específico por su ID usando endpoint público
     */
    getPresetById = async (presetId) => {
        try {
            const response = await fetch(`/api/presets/${presetId}`);
            
            if (!response.ok) {
                throw new Error("Error al obtener el preset");
            }

            return await response.json();
        } catch (error) {
            console.error("Error en getPresetById:", error.message);
            throw error;
        }
    };

    /**
     * Crear preset para un item específico usando el endpoint anidado
     */
    saveForItem = async (itemId, formData) => {
        try {
            const response = await fetch(`/api/admin/items/${itemId}/presets`, {
                method: "POST",
                body: formData,
                headers: {
                    "X-CSRF-TOKEN": document.querySelector('meta[name="csrf_token"]').getAttribute('content'),
                },
            });

            if (!response.ok) {
                throw new Error("Error al guardar el preset");
            }

            return await response.json();
        } catch (error) {
            console.error("Error en saveForItem:", error.message);
            throw error;
        }
    };

    /**
     * Actualizar preset para un item específico usando el endpoint anidado
     */    updateForItem = async (itemId, presetId, formData) => {
        try {
            const response = await fetch(`/api/admin/items/${itemId}/presets/${presetId}`, {
                method: "PUT",
                body: formData,
                headers: {
                    "X-CSRF-TOKEN": document.querySelector('meta[name="csrf_token"]').getAttribute('content'),
                },
            });

            if (!response.ok) {
                throw new Error("Error al actualizar el preset");
            }

            return await response.json();
        } catch (error) {
            console.error("Error en updateForItem:", error.message);
            throw error;
        }
    };

    /**
     * Eliminar preset de un item específico usando el endpoint anidado
     */    deleteForItem = async (itemId, presetId) => {
        try {
            const response = await fetch(`/api/admin/items/${itemId}/presets/${presetId}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-TOKEN": document.querySelector('meta[name="csrf_token"]').getAttribute('content'),
                },
            });

            if (!response.ok) {
                throw new Error("Error al eliminar el preset");
            }

            return await response.json();
        } catch (error) {
            console.error("Error en deleteForItem:", error.message);
            throw error;
        }
    };

    /**
     * Cambiar estado activo/inactivo de un preset usando el endpoint anidado
     */
    toggleStatusForItem = async (itemId, presetId) => {
        try {
            const response = await fetch(`/api/admin/items/${itemId}/presets/${presetId}/toggle`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-TOKEN": document.querySelector('meta[name="csrf_token"]').getAttribute('content'),
                },
            });

            if (!response.ok) {
                throw new Error("Error al cambiar el estado del preset");
            }

            return await response.json();
        } catch (error) {
            console.error("Error en toggleStatusForItem:", error.message);
            throw error;
        }
    };

    /**
     * Método de compatibilidad para cambiar estado usando endpoints originales
     */
    toggleStatus = async (id) => {
        try {
            const response = await fetch(`/admin/item-presets/${id}/toggle-status`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-TOKEN": document.querySelector('meta[name="csrf_token"]').getAttribute('content'),
                },
            });

            if (!response.ok) {
                throw new Error("Error al cambiar el estado del preset");
            }

            return await response.json();
        } catch (error) {
            console.error("Error en toggleStatus:", error.message);
            throw error;
        }
    };
}

export default ItemPresetsRest;
