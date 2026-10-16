# CALZA · Tu red inmobiliaria, sin ruido

MVP web para corredores de propiedades en Chile: registra búsquedas y propiedades, comparte de forma voluntaria inventario autorizado y encuentra coincidencias según criterios verificables.

**Estado:** código de piloto funcional; no es un servicio en producción hasta configurar y desplegar Cloudflare. [Ver demo local](#ejecutar-localmente).

## Funcionalidades

- Tablero y demo interactiva con **datos enteramente ficticios**.
- Registro e inicio de sesión por invitación, contraseña con PBKDF2, sesiones mediante cookie `HttpOnly` y `SameSite=Strict`.
- CRUD de propiedades y requerimientos. Las propiedades son **privadas por defecto**; compartir exige confirmación de autorización.
- Motor de coincidencias **determinista**: venta/arriendo, tipo, comuna, moneda, límite de precio, dormitorios, baños, estacionamientos y superficie mínima. Las diferencias de moneda no se convierten automáticamente.
- Extractor de texto pegado desde WhatsApp: extracción local sin IA o, con consentimiento explícito, IA externa para proponer campos. **Siempre requiere revisión humana.**
- Contacto directo con otro corredor solo si existe una coincidencia con inventario voluntariamente compartido.
- Backend Cloudflare Workers, base de datos Cloudflare D1, frontend sin framework ni dependencias de runtime.

No es un bot que lee grupos privados ni envía mensajes a WhatsApp en segundo plano. No contiene publicaciones reales ni datos personales capturados de los grupos de origen.

## Stack

```text
Browser (HTML, CSS, JS nativo)
       │ HTTPS /api
Cloudflare Worker ── D1 (usuarios, sesiones, inventario, demandas)
       │ opcional, solo con consentimiento
       ├── OpenRouter (múltiples modelos)
       └── Cloudflare AI Gateway REST (OpenAI / Google / Anthropic / etc.)
```

La IA **no decide coincidencias**. Solo interpreta texto: los resultados se calculan con reglas trazables, sin embeddings ni vector DB en esta versión.

## Ejecutar localmente

Requiere Node.js 20+ y cuenta Cloudflare para crear D1.

```bash
npm install
npx wrangler d1 create calza-db
```

Copia el identificador `database_id` devuelto en `wrangler.jsonc` reemplazando `REEMPLAZAR_ID_D1`. Luego:

```bash
npm run db:local
cp .dev.vars.example .dev.vars
npm run dev
```

En `.dev.vars` reemplaza el código de invitación por uno **largo, aleatorio y privado**. Visita el localhost indicado por Wrangler. La demo funciona incluso antes de crear usuarios; el registro real necesita la base de datos.

## Desplegar en Cloudflare

1. Crea la base D1: `npx wrangler d1 create calza-db`, introduce su identificador en `wrangler.jsonc`.
2. Aplica el esquema: `npm run db:remote` (revísalo antes: este script crea tablas sin borrarlas).
3. Configura invitaciones: `npx wrangler secret put SIGNUP_CODE` y introduce un código largo y aleatorio.
4. **Opcional:** configura IA según las opciones de abajo. Sin IA, la captura de mensajes usa regex locales.
5. `npm run deploy`. Comprueba `/api/health` y prueba con **dos cuentas distintas** para verificar coincidencias y privacidad.
6. En el panel de Cloudflare asigna tu dominio propio si quieres. No se incluye automatización de envíos por WhatsApp.

Recomendado para el piloto: acceso restringido a corredores invitados; configurar límites WAF/rate-limit para login y extracción, políticas de retención/borrado y avisos legales antes de comercializar. D1 no equivale por sí sola a una solución con cumplimiento legal completo.

## API de IA (opcional)

### Opción sencilla: OpenRouter

Se integra mediante una única API OpenAI-compatible y permite elegir entre modelos de distintos proveedores. Configura:

```bash
npx wrangler secret put OPENROUTER_API_KEY
```

En `wrangler.jsonc`, usa:

```json
"AI_PROVIDER": "openrouter",
"AI_MODEL": "google/gemini-2.5-flash"
```

También puedes usar otros IDs publicados en el catálogo de [OpenRouter](https://openrouter.ai/models). Comprueba **costos por token, retención de datos y proveedores de inferencia** según el modelo antes de habilitarlo en usuarios reales.

### Alternativa: Cloudflare AI Gateway REST

La API unificada de Cloudflare permite modelos de terceros con una autenticación y facturación centralizadas. Configura:

```bash
npx wrangler secret put CLOUDFLARE_ACCOUNT_ID
npx wrangler secret put CLOUDFLARE_API_TOKEN
```

El token de Cloudflare necesita permiso `Account > Workers AI > Read`; el uso de modelos externos puede requerir saldo/cobros. En `wrangler.jsonc`:

```json
"AI_PROVIDER": "cloudflare",
"AI_MODEL": "google/gemini-3-flash"
```

Opcionalmente `CLOUDFLARE_AI_GATEWAY_ID` configura el gateway, sino usa `default`. API REST: `https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/v1/chat/completions`.

**Regla de privacidad:** el checkbox de la interfaz es obligatorio para invocar un proveedor externo. Las credenciales viven exclusivamente en secretos del Worker, nunca en el navegador o el repositorio.

## Probar

```bash
npm test
npm run check
```

Incluye pruebas de normalización, presupuestos, tipo, moneda y requisitos excluyentes. Antes del lanzamiento comercial, faltan pruebas end-to-end, observabilidad, recuperación de cuenta, control de abusos, consentimiento/retención granular y validación jurídica de términos.

## Estructura

```text
public/              Interfaz responsive y demo
worker/index.js      API autenticada y extracción opcional con IA
shared/matching.js   Reglas de comparación y extractor local
schema.sql           Esquema D1
wrangler.jsonc       Configuración Cloudflare Workers
.github/workflows/   Pruebas automáticas y despliegue manual
```

## Modelo de negocio

Suscripción entre corredores, validable con un piloto cerrado. CALZA no participa en la comisión inmobiliaria ni certifica disponibilidad, mandato o idoneidad jurídica de un inmueble. Un «match» solo indica que cumple los campos estructurados que fueron proporcionados.

---

Hecho para un piloto comercial en Chile. **No almacenar ni distribuir mensajes, teléfonos o datos de terceros sin autorización.**
