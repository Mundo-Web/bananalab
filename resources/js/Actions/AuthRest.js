import { Fetch, Notify } from "sode-extend-react"

class AuthRest {
  static login = async (request) => {
    try {

      const { status, result } = await Fetch('./api/login', {
        method: 'POST',
        body: JSON.stringify(request),
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      })
      if (!status) throw new Error(result?.message || 'Error al iniciar sesion')

      // Debug: mostrar la respuesta completa
      console.log('🔍 AuthRest.login - Respuesta completa:', { status, result });
      console.log('🔍 AuthRest.login - result.data:', result?.data);

      Notify.add({
        icon: '/assets/img/icon.svg',
        title: 'Operacion correcta',
        body: 'Se inicio sesion correctamente'
      })

      return result
    } catch (error) {
      Notify.add({
        icon: '/assets/img/icon.svg',
        title: 'Error',
        body: error.message,
        type: 'danger'
      })
      return false
    }
  }

  static signup = async (request) => {
    try {

      const { status, result } = await Fetch('./api/signup', {
        method: 'POST',
        body: JSON.stringify(request),
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      })
      if (!status) throw new Error(result?.message || 'Error al registrar el usuario')

      Notify.add({
        icon: '/assets/img/icon.svg',
        title: 'Operacion correcta',
        body: 'Se registro el usuario correctamente'
      })

      return result.data
    } catch (error) {
      Notify.add({
        icon: '/assets/img/icon.svg',
        title: 'Error',
        body: error.message,
        type: 'danger'
      })
      return null
    }
  }
}

export default AuthRest