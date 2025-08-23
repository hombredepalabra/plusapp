# 📋 DOCUMENTACIÓN COMPLETA PARA EL BACKEND

## 🎯 Resumen del Frontend

Esta aplicación React + TypeScript implementa un sistema completo de autenticación con 2FA que incluye:

- ✅ Login con email/password
- ✅ Autenticación de dos factores (TOTP)
- ✅ Recuperación de contraseña
- ✅ Dashboard completo
- ✅ Gestión de perfil
- ✅ Configuración de seguridad 2FA
- ✅ Tipado fuerte TypeScript (sin `any`)

## 🔧 Endpoints Requeridos del Backend

### 1. 🔐 Autenticación Básica

#### `POST /api/auth/login`
```json
// Request
{
  "email": "usuario@email.com",
  "password": "contraseña123"
}

// Response (Sin 2FA)
{
  "success": true,
  "requiresTwoFactor": false,
  "token": "jwt_token_aqui",
  "user": {
    "id": "user_uuid",
    "email": "usuario@email.com",
    "name": "Nombre Usuario",
    "twoFactorEnabled": false,
    "createdAt": "2025-01-01T00:00:00Z",
    "lastLogin": "2025-01-01T00:00:00Z"
  }
}

// Response (Con 2FA)
{
  "success": true,
  "requiresTwoFactor": true,
  "tempToken": "token_temporal_para_2fa",
  "message": "Ingresa tu código 2FA"
}
```

#### `POST /api/auth/verify-2fa`
```json
// Request
{
  "token": "token_temporal_del_login",
  "totpCode": "123456"
}

// Response
{
  "success": true,
  "token": "jwt_token_final",
  "user": {
    "id": "user_uuid",
    "email": "usuario@email.com",
    "name": "Nombre Usuario",
    "twoFactorEnabled": true,
    "createdAt": "2025-01-01T00:00:00Z",
    "lastLogin": "2025-01-01T00:00:00Z"
  }
}
```

### 2. 👤 Gestión de Usuario

#### `GET /api/users/profile`
```json
// Headers: Authorization: Bearer <token>

// Response
{
  "id": "user_uuid",
  "email": "usuario@email.com",
  "name": "Nombre Usuario",
  "twoFactorEnabled": true,
  "createdAt": "2025-01-01T00:00:00Z",
  "lastLogin": "2025-01-01T00:00:00Z"
}
```

#### `POST /api/auth/change-password`
```json
// Headers: Authorization: Bearer <token>
// Request
{
  "currentPassword": "contraseña_actual",
  "newPassword": "nueva_contraseña"
}

// Response
{
  "success": true,
  "message": "Contraseña actualizada exitosamente"
}
```

### 3. 🔄 Recuperación de Contraseña

#### `POST /api/auth/forgot-password`
```json
// Request
{
  "email": "usuario@email.com"
}

// Response
{
  "success": true,
  "message": "Email de recuperación enviado"
}
```

#### `POST /api/auth/reset-password`
```json
// Request
{
  "token": "token_de_recuperacion_del_email",
  "newPassword": "nueva_contraseña"
}

// Response
{
  "success": true,
  "message": "Contraseña restablecida exitosamente"
}
```

### 4. 🛡️ Configuración 2FA

#### `POST /api/auth/setup-2fa`
```json
// Headers: Authorization: Bearer <token>

// Response
{
  "secret": "JBSWY3DPEHPK3PXP", // Base32 secret
  "qrCodeUrl": "otpauth://totp/SecureApp:usuario@email.com?secret=JBSWY3DPEHPK3PXP&issuer=SecureApp",
  "manualEntryKey": "JBSW Y3DP EHPK 3PXP", // Espaciado para fácil lectura
  "backupCodes": [
    "12345678",
    "87654321",
    "11223344",
    "44332211",
    "55667788",
    "88776655",
    "99887766",
    "66778899",
    "33445566",
    "66554433"
  ]
}
```

#### `POST /api/auth/enable-2fa`
```json
// Headers: Authorization: Bearer <token>
// Request
{
  "totpCode": "123456" // Código del usuario para verificar configuración
}

// Response
{
  "success": true,
  "recoveryCodes": [
    "12345678",
    "87654321",
    "11223344",
    "44332211",
    "55667788",
    "88776655",
    "99887766",
    "66778899",
    "33445566",
    "66554433"
  ]
}
```

#### `POST /api/auth/disable-2fa`
```json
// Headers: Authorization: Bearer <token>
// Request
{
  "totpCode": "123456" // Código actual para confirmar deshabilitación
}

// Response
{
  "success": true
}
```

## 🔑 Implementación TOTP (Time-based One-Time Password)

### Librerías Recomendadas:
- **Python**: `pyotp`, `qrcode`

### Ejemplo de implementación (Python):
```python
import pyotp
import qrcode
import io
import base64

def setup_2fa(user_email, issuer_name="SecureApp"):
    # Generar secret único para el usuario
    secret = pyotp.random_base32()
    
    # Crear URL TOTP
    totp_uri = pyotp.totp.TOTP(secret).provisioning_uri(
        name=user_email,
        issuer_name=issuer_name
    )
    
    # Generar códigos de recuperación
    backup_codes = [
        f"{random.randint(10000000, 99999999)}" 
        for _ in range(10)
    ]
    
    return {
        "secret": secret,
        "qrCodeUrl": totp_uri,
        "manualEntryKey": " ".join([secret[i:i+4] for i in range(0, len(secret), 4)]),
        "backupCodes": backup_codes
    }

def verify_totp(secret, token):
    totp = pyotp.TOTP(secret)
    return totp.verify(token, valid_window=1)  # 30 segundos de ventana
```

## 🗄️ Estructura de Base de Datos Sugerida

### Tabla: `users`
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL
);
```

### Tabla: `recovery_codes`
```sql
CREATE TABLE recovery_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    code VARCHAR(8) NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Tabla: `password_reset_tokens`
```sql
CREATE TABLE password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🔒 Configuración de JWT

### Claims Sugeridos:
```json
{
  "sub": "user_uuid",
  "email": "usuario@email.com",
  "name": "Nombre Usuario",
  "2fa": true,
  "iat": 1704067200,
  "exp": 1704153600
}
```

## 🚨 Manejo de Errores

### Códigos de Error Esperados:
```json
// Login fallido
{
  "success": false,
  "message": "Credenciales inválidas",
  "code": "INVALID_CREDENTIALS"
}

// 2FA requerido pero no enviado
{
  "success": false,
  "message": "Código 2FA requerido",
  "code": "2FA_REQUIRED"
}

// Código 2FA inválido
{
  "success": false,
  "message": "Código 2FA inválido o expirado",
  "code": "INVALID_2FA_CODE"
}

// Token JWT expirado
{
  "success": false,
  "message": "Token expirado",
  "code": "TOKEN_EXPIRED"
}

// Usuario no encontrado
{
  "success": false,
  "message": "Usuario no encontrado",
  "code": "USER_NOT_FOUND"
}

// Contraseña actual incorrecta
{
  "success": false,
  "message": "Contraseña actual incorrecta",
  "code": "WRONG_PASSWORD"
}
```

## 📱 Aplicaciones de Autenticación Compatibles

El sistema es compatible con cualquier aplicación TOTP estándar:
- Google Authenticator
- Microsoft Authenticator
- Authy
- 1Password
- Bitwarden
- LastPass Authenticator

## 🔐 Consideraciones de Seguridad

1. **Rate Limiting**: Implementar límites en intentos de login y 2FA
2. **Token Temporal**: Los tokens temporales para 2FA deben expirar en 5-10 minutos
3. **Códigos de Recuperación**: Hashear y almacenar de forma segura
4. **Logs de Seguridad**: Registrar intentos fallidos y accesos exitosos
5. **HTTPS**: Obligatorio para todas las comunicaciones
6. **CORS**: Configurar correctamente para el dominio del frontend

## ⚙️ Variables de Entorno del Frontend

El frontend usa estas variables (ya configuradas):
```
REACT_APP_BACKEND_URL=https://tu-backend.com
```

## 🧪 Casos de Prueba

### Login Normal:
1. Login con credenciales válidas sin 2FA → Acceso directo
2. Login con credenciales inválidas → Error

### Login con 2FA:
1. Login válido → Prompt 2FA → Código correcto → Acceso
2. Login válido → Prompt 2FA → Código incorrecto → Error
3. Login válido → Prompt 2FA → Timeout → Re-login

### Configuración 2FA:
1. Usuario genera QR → Escanea → Verifica → Habilitado
2. Usuario ingresa clave manual → Verifica → Habilitado
3. Usuario desea deshabilitar → Código correcto → Deshabilitado

### Recuperación:
1. Forgot password → Email válido → Recibe link → Reset exitoso
2. Forgot password → Email inválido → Error graceful
3. Reset password → Token válido → Nueva contraseña → Éxito
4. Reset password → Token expirado → Error

¡El frontend está 100% listo y documentado! 🚀