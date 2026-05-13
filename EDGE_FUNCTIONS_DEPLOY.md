# Guía: Despliegue de Edge Functions en Supabase

## ¿Qué son los Edge Functions?

Los Edge Functions de Supabase son funciones serverless que se ejecutan en el edge, permitiendo:
- Procesar webhooks en tiempo real
- Automatizar acciones cuando cambian datos
- Enviar notificaciones automáticas
- Integrar servicios externos

## ✅ Requisitos

1. **CLI de Supabase instalado**
   ```bash
   npm install -g supabase
   ```

2. **Cuenta en Supabase** (ya tienes)

3. **Proyecto en Supabase** (ya configurado)

4. **Variables de entorno configuradas** en Supabase

## 🚀 Proceso de Despliegue

### Paso 1: Verificar instalación de CLI

```bash
supabase --version
```

### Paso 2: Inicializar proyecto de funciones (si no existe)

En la raíz del proyecto:

```bash
supabase functions init
```

Esto crea la carpeta `supabase/functions/` si no existe.

### Paso 3: Crear las funciones

Ya tienes los archivos:
- `supabase/functions/webhooks-payment-approved.ts`
- `supabase/functions/webhooks-shipment-tracking-updated.ts`

### Paso 4: Configurar variables secretas

Necesitas agregar las variables de entorno que usan las funciones:

```bash
# Login en Supabase
supabase login

# Agregar variables de entorno
supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxxx
supabase secrets set SUPABASE_URL=https://tu-proyecto.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

Para obtener `SUPABASE_SERVICE_ROLE_KEY`:
1. Ve a tu Dashboard de Supabase
2. Settings → API
3. Copia la "Service role secret" (con acceso completo)

### Paso 5: Desplegar funciones

```bash
# Desplegar todas las funciones
supabase functions deploy

# O desplegar funciones específicas
supabase functions deploy webhooks-payment-approved
supabase functions deploy webhooks-shipment-tracking-updated
```

### Paso 6: Verificar despliegue

```bash
# Ver estado de las funciones
supabase functions list

# Debería mostrar:
# webhooks-payment-approved (status: Active)
# webhooks-shipment-tracking-updated (status: Active)
```

## 🔗 Configurar Webhooks en Supabase

Ahora que las funciones están desplegadas, debemos configurar los webhooks.

### Webhook 1: Payment Proof Approved

1. Dashboard de Supabase → Database → Webhooks
2. New webhook
3. Configurar:
   - **Table**: `comprobantes_pago`
   - **Events**: Marcar "UPDATE"
   - **Webhook URL**: `https://tu-proyecto.supabase.co/functions/v1/webhooks-payment-approved`
   - **HTTP method**: POST

4. **HTTP Headers** (agregar):
   ```
   Authorization: Bearer tu-service-role-key
   Content-Type: application/json
   ```

### Webhook 2: Shipment Tracking Updated

1. Dashboard de Supabase → Database → Webhooks
2. New webhook
3. Configurar:
   - **Table**: `envios`
   - **Events**: Marcar "UPDATE"
   - **Webhook URL**: `https://tu-proyecto.supabase.co/functions/v1/webhooks-shipment-tracking-updated`
   - **HTTP method**: POST

4. **HTTP Headers**:
   ```
   Authorization: Bearer tu-service-role-key
   Content-Type: application/json
   ```

## 🧪 Pruebas Locales

### Ejecutar Edge Function localmente

```bash
# Levantar servidor local
supabase functions serve

# En otra terminal, hacer una petición de prueba
curl -i --location --request POST 'http://localhost:54321/functions/v1/webhooks-payment-approved' \
  --header 'Authorization: Bearer eyJ...' \
  --header 'Content-Type: application/json' \
  --data '{
    "type": "UPDATE",
         "table": "comprobantes_pago",
    "record": {
      "id": 1,
            "compra_id": 123,
            "estado": "aprobado",
            "url_archivo": "..."
    }
  }'
```

### Monitorear logs en producción

```bash
# Ver logs en tiempo real
supabase functions list --linked

# O en el dashboard:
# Database → Webhooks → Ver el webhook → Logs
```

## 🐛 Solución de Problemas

### Error: "Function not found"
- Verifica que la función esté desplegada: `supabase functions list`
- Revisa el nombre de la función en la URL

### Error: "RESEND_API_KEY is not defined"
- Asegúrate de que las secrets están configuradas:
  ```bash
  supabase secrets list
  ```
- Redeploy después de agregar secrets:
  ```bash
  supabase functions deploy
  ```

### El webhook no se ejecuta
- Verifica que el evento esté habilitado (UPDATE)
- Revisa los logs del webhook (Dashboard → Webhooks → Logs)
- Asegúrate de que la condición se cumple

### Error 401 No Authorizado
- Verifica que `SUPABASE_SERVICE_ROLE_KEY` sea correcto
- El header `Authorization` debe incluir el token

## 📊 Monitoreo y Debugging

### Ver logs de funciones
```bash
supabase functions logs webhooks-payment-approved
```

### Agregar registros personalizados
```typescript
console.log('Mi mensaje:', variable)
console.error('Error:', error)
```

Estos aparecerán en:
1. Terminal (si corres localmente)
2. Dashboard → Functions → Logs

## 🔒 Seguridad

### Buenas prácticas

1. **Nunca incluyas secrets en el código**
   ```typescript
   // ❌ MAL
   const apiKey = "re_xxxxx"

   // ✅ BIEN
   const apiKey = Deno.env.get('RESEND_API_KEY')
   ```

2. **Valida los payloads**
   ```typescript
   if (payload.type !== 'UPDATE' || !payload.record?.numero_tracking) {
     return new Response('Invalid payload', { status: 400 })
   }
   ```

3. **Usa secrets para variables sensibles**
   ```bash
   supabase secrets set MY_SECRET=value
   ```

4. **Implementa rate limiting si es necesario**
   ```typescript
   // Puedes monitorear IPs, emails, etc.
   ```

## 📝 Ejemplo Completo: Flujo de Pago

```
1. Cliente aprueba comprobante en Admin
   ↓
2. Supabase actualiza comprobantes_pago (estado = 'aprobado')
   ↓
3. Webhook se dispara → webhooks-payment-approved
   ↓
4. Edge Function obtiene datos de compra y producto
   ↓
5. Envía email a través de Resend
   ↓
6. Cliente recibe: "¡Tu pago ha sido aprobado!"
```

## 🎯 Próximos Pasos

1. Desplegar las funciones
2. Configurar los webhooks en Supabase
3. Probar con una transacción de prueba
4. Monitorear logs
5. Ajustar si es necesario

## 📚 Referencias

- [Docs: Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Docs: Database Webhooks](https://supabase.com/docs/guides/database/webhooks)
- [Repositorio de ejemplos](https://github.com/supabase/supabase/tree/master/examples/edge-functions)

¿Necesitas ayuda? Revisa los logs o contacta a soporte de Supabase.
