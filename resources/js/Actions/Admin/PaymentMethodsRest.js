import BasicRest from "../BasicRest";

class PaymentMethodsRest extends BasicRest {
    path = "admin/payment-methods";
    hasFiles = true;

    toggleStatus = async (id) => {
        try {
            const response = await fetch(`/api/admin/payment-methods/${id}/toggle`, {
                method: "PATCH",
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
                }
            });

            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result?.message ?? "Error cambiando estado");
            }

            return result;
        } catch (error) {
            console.error("Error en toggleStatus:", error.message);
            throw error;
        }
    };

    reorder = async (methods) => {
        try {
            const response = await fetch(`/api/admin/payment-methods/reorder`, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
                },
                body: JSON.stringify({ methods })
            });

            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result?.message ?? "Error reordenando métodos");
            }

            return result;
        } catch (error) {
            console.error("Error en reorder:", error.message);
            throw error;
        }
    };

    getTemplates = async () => {
        try {
            const response = await fetch(`/api/admin/payment-methods/templates`);
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result?.message ?? "Error obteniendo plantillas");
            }

            return result;
        } catch (error) {
            console.error("Error en getTemplates:", error.message);
            throw error;
        }
    };

    // Store method for creating new payment methods
    store = async (formData) => {
        try {
            const response = await fetch(`/api/${this.path}`, {
                method: "POST",
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
                },
                body: formData
            });

            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result?.message ?? "Error creando método de pago");
            }

            return result;
        } catch (error) {
            console.error("Error en store:", error.message);
            throw error;
        }
    };

    // Update method for editing existing payment methods
    update = async (formData) => {
        try {
            // Get the ID from formData
            const id = formData.get('id');
            if (!id) {
                throw new Error("ID es requerido para actualizar");
            }

            // Laravel expects PUT/PATCH for updates, but with files we need to use POST with _method
            formData.append('_method', 'PUT');

            const response = await fetch(`/api/${this.path}/${id}`, {
                method: "POST", // Using POST with _method for file uploads
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
                },
                body: formData
            });

            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result?.message ?? "Error actualizando método de pago");
            }

            return result;
        } catch (error) {
            console.error("Error en update:", error.message);
            throw error;
        }
    };

    // Destroy method for deleting payment methods
    destroy = async (id) => {
        try {
            const response = await fetch(`/api/${this.path}/${id}`, {
                method: "DELETE",
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
                }
            });

            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result?.message ?? "Error eliminando método de pago");
            }

            return result;
        } catch (error) {
            console.error("Error en destroy:", error.message);
            throw error;
        }
    };

    // List method for DataGrid
    list = async (params) => {
        try {
            const response = await fetch(`/api/${this.path}/paginate`, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
                },
                body: JSON.stringify(params)
            });

            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result?.message ?? "Error obteniendo métodos de pago");
            }

            return result;
        } catch (error) {
            console.error("Error en list:", error.message);
            throw error;
        }
    };
}

export default PaymentMethodsRest;
