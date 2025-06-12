<?php

namespace App\Http\Controllers;

use App\Http\Classes\EmailConfig;
use App\Http\Services\ReCaptchaService;
use App\Models\Constant;
use App\Models\ModelHasRoles;
use App\Models\User;
use App\Models\Person;
use App\Models\PreUser;
use App\Models\SpecialtiesByUser;
use App\Models\Specialty;
use App\Providers\RouteServiceProvider;
use Exception;
use Illuminate\Contracts\Routing\ResponseFactory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use SoDe\Extend\Crypto;
use SoDe\Extend\JSON;
use SoDe\Extend\Response;
use SoDe\Extend\Trace;
use Spatie\Permission\Models\Role;

class AuthController extends Controller
{

  public function loginView(Request $request, string $confirmation = null)
  {
    if (Auth::check()) {
      switch (Auth::user()->getRole()) {
        case 'Admin':
          return redirect('/admin/home');
          break;
        case 'Root':
          return redirect('/admin/home');
          break;
        default:
          Auth::guard('web')->logout();
          $request->session()->invalidate();
          $request->session()->regenerateToken();
          return redirect('/login');
          break;
      }
    };


    if ($confirmation) {
      $userJpa = new User();
      try {
        //code...
        $preUserJpa = PreUser::select()
          ->where('confirmation_token', $confirmation)
          ->first();
        if (!$preUserJpa) return redirect('/login');

        $roleJpa = Role::where('relative_id', $preUserJpa->role)->first();

        $userJpa = User::create([
          'uuid' => Crypto::randomUUID(),
          'name' => $preUserJpa->name,
          'lastname' => $preUserJpa->lastname,
          'email' => $preUserJpa->email,
          'email_verified_at' => Trace::getDate('mysql'),
          'password' => $preUserJpa->password,
          'birthdate' => $preUserJpa->birthdate,
          'status' => false
        ])->assignRole($roleJpa->name);

        $specialties = JSON::parse($preUserJpa->specialties);
        foreach ($specialties as $specialty) {
          SpecialtiesByUser::create([
            'user_id' => $userJpa->id,
            'specialty_id' => $specialty
          ]);
        }

        $message = 'La confirmacion se ha realizado con exito';

        $preUserJpa->delete();
        return redirect('/login?message=' . $message);
      } catch (\Throwable $th) {
        $userJpa->delete();
        // dump($th);
        // return redirect('/login');
      }
    }

    return Inertia::render('Login', [
      'message' => $message ?? null,
      'global' => [
        'PUBLIC_RSA_KEY' => Controller::$PUBLIC_RSA_KEY,
        'APP_NAME' => env('APP_NAME', 'Trasciende'),
        'APP_URL' => env('APP_URL'),
        'APP_DOMAIN' => env('APP_DOMAIN'),
        'APP_PROTOCOL' => env('APP_PROTOCOL', 'https'),
      ],
    ])->rootView('auth');
  }

  public function registerView()
  {
    if (Auth::check()) return redirect('/home');

    $roles = Role::where('public', true)->get();
    $specialties = Specialty::all();

    return Inertia::render('Register', [
      'roles' => $roles,
      'APP_PROTOCOL' => env('APP_PROTOCOL', 'https'),
      'PUBLIC_RSA_KEY' => Controller::$PUBLIC_RSA_KEY,
      'RECAPTCHA_SITE_KEY' => env('RECAPTCHA_SITE_KEY'),
      'terms' => Constant::value('terms'),
      'specialties' => $specialties
    ])->rootView('auth');
  }

  public function confirmEmailView(Request $request, string $token)
  {
    if (Auth::check()) return redirect('/home');

    $preUserJpa = PreUser::where('token', $token)->first();
    if (!$preUserJpa) return redirect('/login');

    return Inertia::render('ConfirmEmail', [
      'email' => $preUserJpa->email
    ])->rootView('auth');
  }

  /**
   * Handle an incoming authentication request.
   */
  public function login(Request $request): HttpResponse | ResponseFactory | RedirectResponse
  {
    $response = Response::simpleTryCatch(function (Response $response) use ($request) {
      $email = $request->email;
      $password = $request->password;

      // Inicializar sesión si no existe
      if (!$request->hasSession()) {
        $request->setLaravelSession(app('session.store'));
      }

      $credentials = [
        'email' => Controller::decode($email),
        'password' => Controller::decode($password)
      ];

      // Intentar autenticación
      if (!Auth::attempt($credentials, true)) { // El true habilita "remember me"
        throw new Exception('Credenciales invalidas');
      }

      // Regenerar sesión por seguridad
      $request->session()->regenerate();
      
      // Forzar el guardado de la sesión
      $request->session()->save();
      
      // Determinar URL de redirección según el rol del usuario
      $user = Auth::user();
      $redirectUrl = '/login'; // Default fallback
      
      switch ($user->getRole()) {
        case 'Admin':
        case 'Root':
          $redirectUrl = '/admin/home';
          break;
        default:
          $redirectUrl = '/';
          break;
      }
      
      $response->data = [
        'redirect_url' => $redirectUrl,
        'session_id' => $request->session()->getId(),
        'cookies_enabled' => $request->session()->isStarted(),
        'user' => [
          'id' => $user->id,
          'name' => $user->name,
          'email' => $user->email,
          'role' => $user->getRole()
        ]
      ];
    });
    
    // Crear respuesta con headers de cookie
    $responseData = $response->toArray();
    $httpResponse = response($responseData, $response->status);
    
    // Forzar headers de sesión
    if ($request->hasSession()) {
      $sessionId = $request->session()->getId();
      $cookieName = config('session.cookie', 'laravel_session');
      
      $httpResponse->withCookie(cookie(
        $cookieName,
        $sessionId,
        config('session.lifetime', 120),
        config('session.path', '/'),
        config('session.domain'),
        config('session.secure', false),
        config('session.http_only', true),
        false,
        config('session.same_site', 'lax')
      ));
    }
    
    return $httpResponse;
  }

  public function loginTest(Request $request): HttpResponse | ResponseFactory | RedirectResponse
  {
    $response = Response::simpleTryCatch(function (Response $response) use ($request) {
      $email = $request->email;
      $password = $request->password;

      // Para pruebas, intentar login sin desencriptar primero
      $loginSuccess = false;
      
      // Intentar sin encriptar
      if (Auth::attempt(['email' => $email, 'password' => $password])) {
        $loginSuccess = true;
      } else {
        // Si falla, intentar con encriptación (método original)
        if (Auth::attempt(['email' => Controller::decode($email), 'password' => Controller::decode($password)])) {
          $loginSuccess = true;
        }
      }
      
      if (!$loginSuccess) {
        throw new Exception('Credenciales invalidas');
      }

      $request->session()->regenerate();
      
      // Determinar URL de redirección según el rol del usuario
      $user = Auth::user();
      $redirectUrl = '/login'; // Default fallback
      
      switch ($user->getRole()) {
        case 'Admin':
        case 'Root':
          $redirectUrl = '/admin/home';
          break;
        default:
          $redirectUrl = '/';
          break;
      }
      
      $response->data = [
        'redirect_url' => $redirectUrl,
        'user' => [
          'id' => $user->id,
          'name' => $user->name,
          'email' => $user->email,
          'role' => $user->getRole()
        ]
      ];
    });
    return response($response->toArray(), $response->status);
  }

  public function signup(Request $request): HttpResponse | ResponseFactory | RedirectResponse
  {
    $response = new Response();
    try {
      $request->validate([
        'name' => 'required|string|max:255',
        'lastname' => 'required|string|max:255',
        'email' => 'required|string|email|max:255|unique:users',
        'password' => 'required|string',
        'confirmation' => 'required|string',
        'captcha' => 'required|string',
        'terms' => 'required|accepted',
        'specialties' => 'required|array'
      ]);

      $body = $request->all();

      if (!isset($request->password) || !isset($request->confirmation)) throw new Exception('Debes ingresar una contraseña para el nuevo usuario');
      if (Controller::decode($request->password) != Controller::decode($request->confirmation)) throw new Exception('Las contraseñas deben ser iguales');

      if (!ReCaptchaService::verify($request->captcha)) throw new Exception('Captcha invalido. Seguro que no eres un robot?');

      $roleExists = Role::where('relative_id', $body['role'])->exists();

      if (!$roleExists) throw new Exception('El rol que ingresaste no existe, que intentas hacer?');

      $preUserJpa = PreUser::updateOrCreate([
        'email' => $body['email']
      ], [
        'name' => $body['name'],
        'lastname' => $body['lastname'],
        'email' => $body['email'],
        'role' => $body['role'],
        'password' => Controller::decode($body['password']),
        'confirmation_token' => Crypto::randomUUID(),
        'token' => Crypto::randomUUID(),
        'specialties' => JSON::stringify($body['specialties'])
      ]);

      $content = Constant::value('confirm-email');
      $content = str_replace('{URL_CONFIRM}', env('APP_URL') . '/confirmation/' . $preUserJpa->confirmation_token, $content);

      $mailer = EmailConfig::config();
      $mailer->Subject = 'Confirmacion - ' . env('APP_NAME');
      $mailer->Body = $content;
      $mailer->addAddress($preUserJpa->email);
      $mailer->isHTML(true);
      $mailer->send();

      $response->status = 200;
      $response->message = 'Operacion correcta';
      $response->data = $preUserJpa->token;
    } catch (\Throwable $th) {
      $response->status = 400;
      $response->message = $th->getMessage();
    } finally {
      return response(
        $response->toArray(),
        $response->status
      );
    }
  }

  /**
   * Destroy an authenticated session.
   */
  public function destroy(Request $request)
  {
    $response = new Response();
    try {
      Auth::guard('web')->logout();

      $request->session()->invalidate();
      $request->session()->regenerateToken();

      $response->status = 200;
      $response->message = 'Cierre de sesion exitoso';
    } catch (\Throwable $th) {
      $response->status = 400;
      $response->message = $th->getMessage();
    } finally {
      return response(
        $response->toArray(),
        $response->status
      );
    }
  }
}
