import { Fetch, Notify } from "sode-extend-react";

export const processMercadoPagoPayment = (request) => {
    return new Promise(async (resolve, reject) => {
      try {
        console.log("Datos para MercadoPago:", request)
  
        // Crear preferencia en el servidor
        const { status, result } = await Fetch("./api/payments/mercadopago/create-preference", {
          method: "POST",
          body: JSON.stringify(request),
        })
  
        if (!status || !result.preference_id) {
          Notify.add({
            icon: "/assets/img/icon.svg",
            title: "Error",
            body: result?.message || "Error al crear la preferencia de pago",
            type: "danger",
          })
          reject(result?.message || "Error al crear la preferencia de pago")
          return
        }
  
        console.log("✅ Preferencia creada:", result)
  
        // Inicializar el checkout de MercadoPago
        const mp = new window.MercadoPago(result.public_key, {
          locale: "es-PE",
        })
  
        // Crear botón de pago
        // const checkout = mp.checkout({
        //   preference: {
        //     id: result.preference_id,
        //   },
        //   render: {
        //     container: "#mercadopago-button-container",
        //     label: "Pagar",
        //   },
        // })
  
        // Simular clic en el botón para abrir el checkout
        setTimeout(() => {
            window.location.href = result.redirect_url
        //   const mpButton = document.querySelector("#mercadopago-button-container button")
        //   if (mpButton) {
        //     mpButton.click()
        //   } else {
        //     window.location.href = result.redirect_url
        //   }
        }, 500)
  
        // Devolver información para seguimiento
        resolve(result)
      } catch (error) {
        console.error("Error en processMercadoPagoPayment:", error)
        Notify.add({
          icon: "/assets/img/icon.svg",
          title: "Error",
          body: error.message || "Error en la integración con MercadoPago",
          type: "danger",
        })
        reject(error.message || "Error en la integración con MercadoPago")
      }
    })
  }
