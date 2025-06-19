# Configuración de Credenciales de Prueba MercadoPago

Para probar inmediatamente el sistema de pagos, puedes usar estas credenciales de prueba de MercadoPago:

## Credenciales de Sandbox (Argentina - Válidas para pruebas)

```
Public Key: APP_USR-60e15e22-4426-4b5b-9d7c-e31b06e3afb1-050522-b1c369ec23bac3cedc1f60c90e4c50b3-1238562570
Access Token: APP_USR-6317427424180639-042414-47e6b720b2bed5bb639a2ca27d6e1bb1-313549478
```

## Comando para actualizar:

```bash
cd c:\xampp\htdocs\projects\bananalab
php artisan update-mp-credentials --public-key="APP_USR-60e15e22-4426-4b5b-9d7c-e31b06e3afb1-050522-b1c369ec23bac3cedc1f60c90e4c50b3-1238562570" --access-token="APP_USR-6317427424180639-042414-47e6b720b2bed5bb639a2ca27d6e1bb1-313549478" --sandbox=yes
```

## Tarjetas de Prueba:

**Visa (Aprobada)**
- Número: 4509 9535 6623 3704
- CVV: 123
- Vencimiento: 11/25

**Mastercard (Aprobada)**  
- Número: 5031 7557 3453 0604
- CVV: 123
- Vencimiento: 11/25

**Visa (Rechazada)**
- Número: 4013 5406 8274 6260
- CVV: 123
- Vencimiento: 11/25

**Datos del titular:**
- Nombre: APRO (para aprobado) o OTHE (para rechazado)
- Documento: 12345678

## Nota:
Estas son credenciales de demostración. Para tu aplicación real, necesitarás crear tu propia cuenta en https://www.mercadopago.com/developers/
