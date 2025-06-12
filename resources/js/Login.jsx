import { Link } from '@inertiajs/react'
import JSEncrypt from 'jsencrypt'
import React, { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { GET } from 'sode-extend-react'
import Swal from 'sweetalert2'
import CreateReactScript from './Utils/CreateReactScript'
import Global from './Utils/Global'
import AuthRest from './actions/AuthRest'

const Login = ({ }) => {

  document.title = `Login | ${Global.APP_NAME}`

  const jsEncrypt = new JSEncrypt()
  jsEncrypt.setPublicKey(Global.PUBLIC_RSA_KEY)

  // Estados
  const [loading, setLoading] = useState(true)

  const emailRef = useRef()
  const passwordRef = useRef()
  const rememberRef = useRef()

  useEffect(() => {
    if (GET.message) Swal.fire({
      icon: 'info',
      title: 'Mensaje',
      text: GET.message,
      showConfirmButton: false,
      timer: 3000
    })
    if (GET.service) history.pushState(null, null, `/login?service=${GET.service}`)
    else history.pushState(null, null, '/login')
  }, [null])

  const onLoginSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    const email = emailRef.current.value
    const password = passwordRef.current.value

    const request = {
      email: jsEncrypt.encrypt(email),
      password: jsEncrypt.encrypt(password)
    }
    const result = await AuthRest.login(request)

    console.log('🔍 Login.jsx - result recibido:', result);

    if (!result) return setLoading(false)

    // Usar la URL de redirección devuelta por el backend
    console.log('🔍 Login.jsx - Buscando redirect_url en:', result);
    console.log('🔍 Login.jsx - result.redirect_url:', result.redirect_url);
    console.log('🔍 Login.jsx - result.data?.redirect_url:', result.data?.redirect_url);
    
    const redirectUrl = result.redirect_url || result.data?.redirect_url;
    console.log('🔍 Login.jsx - URL final de redirección:', redirectUrl);
    
    if (redirectUrl) {
      console.log('✅ Redirigiendo a:', redirectUrl);
      window.location.href = redirectUrl;
    } else {
      console.log('⚠️ No se encontró URL de redirección, recargando página');
      // Fallback: recargar la página si no hay URL específica
      location.reload();
    }
  }

  return (
    <>
      <div className="account-pages my-5">
        <div className="container">

          <div className="row justify-content-center">
            <div className="col-md-8 col-lg-6 col-xl-4">
              <div className="text-center">
                <Link href="/">
                  <img src='/assets/resources/logo.png' alt="" className="mx-auto" style={{ height: '40px' }} />
                </Link>
                <p className="text-muted mt-2 mb-4">Bienvenido a {Global.APP_NAME}</p>
              </div>
              <div className="card">
                <div className="card-body p-4">
                  <div className="text-center mb-4">
                    <h4 className="text-uppercase mt-0 font-bold">Inicia Sesión</h4>
                  </div>
                  <form onSubmit={onLoginSubmit}>
                    <div className="mb-3">
                      <label htmlFor="email" className="form-label">Correo o Usuario</label>
                      <input ref={emailRef} className="form-control" type="email" id="email" required
                        placeholder="Ingrese su correo o usuario" />
                    </div>
                    <div className="mb-3">
                      <label htmlFor="password" className="form-label">Contraseña</label>
                      <input ref={passwordRef} className="form-control" type="password" required id="password"
                        placeholder="Ingrese su contraseña" />
                    </div>
                    <div className="mb-3">
                      <div className="form-check">
                        <input ref={rememberRef} type="checkbox" className="form-check-input" id="checkbox-signin" defaultChecked style={{ cursor: 'pointer' }} />
                        <label className="form-check-label" htmlFor="checkbox-signin" style={{ cursor: 'pointer' }}>Recuerdame</label>
                      </div>
                    </div>
                    <div className="mb-3 d-grid text-center">
                      <button className="btn btn-primary" type="submit"> Iniciar Sesión </button>
                    </div>
                  </form>
                </div>
              </div>
              {/* <div className="row mt-3">
                <div className="col-12 text-center">
                  <p> <Link href="/recovery" className="text-muted ms-1"><i
                    className="fa fa-lock me-1"></i>Olvidaste tu contraseña?</Link></p>
                  <p className="text-muted">No tienes una cuenta aun? <Link href="/register"
                    className="text-white ms-1"><b>Registrate</b></Link></p>
                </div>
              </div> */}
            </div>
          </div>
        </div>
      </div>
    </>
  )
};

CreateReactScript((el, properties) => {
  createRoot(el).render(<Login {...properties} />);
})