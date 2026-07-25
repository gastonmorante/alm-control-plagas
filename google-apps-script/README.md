# Instructivo de Configuración: Google Apps Script Web App (Backend ALM)

Este documento explica paso a paso cómo desplegar el puente de datos en **Google Apps Script** para vincular el formulario de la Landing Page de ALM Control de Plagas directamente con una hoja de cálculo en **Google Sheets** y recibir alertas por correo.

---

## Paso 1: Crear la Hoja de Cálculo en Google Drive
1. Ve a [Google Sheets](https://sheets.google.com) y crea una nueva hoja de cálculo.
2. Nómbrala **`ALM Control de Plagas - CRM Leads 2026`**.

---

## Paso 2: Abrir el Editor de Apps Script
1. En el menú superior de la hoja de cálculo, haz clic en **Extensiones** > **Apps Script**.
2. Borra todo el código que aparece por defecto en el editor.
3. Abre el archivo [`Code.gs`](file:///e:/NegocioUp%20Business/alm/google-apps-script/Code.gs) de este proyecto y copia todo su contenido.
4. Pega el contenido en el editor de Apps Script.
5. Ajusta la variable `NOTIFICATION_EMAIL` en la parte superior con los correos que deben recibir las alertas de nuevos prospectos:
   ```javascript
   const NOTIFICATION_EMAIL = "gaston@negocioup.com, contacto@almcontrol.com";
   ```

---

## Paso 3: Desplegar como Aplicación Web (Web App)
1. En la esquina superior derecha del editor de Apps Script, haz clic en el botón azul **Implementar** (Deploy) > **Nueva implementación** (New deployment).
2. Haz clic en el ícono de engranaje ⚙️ junto a *Seleccionar tipo* y elige **Aplicación web** (Web app).
3. Configura los siguientes parámetros exactos:
   - **Descripción**: `ALM Lead Capture API v1`
   - **Ejecutar como**: `Yo` (tu cuenta de Google)
   - **Quién tiene acceso**: **`Cualquiera`** (Anyone) *(Es fundamental para permitir envíos desde el sitio web sin login)*.
4. Haz clic en **Implementar**.
5. Otorga los permisos necesarios cuando Google lo solicite (haz clic en *Avanzado* > *Ir a Proyecto (no seguro)* > *Permitir*).

---

## Paso 4: Conectar la URL del Web App en la Landing Page
1. Copia la **URL de la aplicación web** generada (tendrá una forma similar a `https://script.google.com/macros/s/AKfycbx.../exec`).
2. Abre el archivo `index.html` del proyecto web e inserta tu URL en la variable global JavaScript en el encabezado `<head>`:
   ```html
   <script>
     window.ALM_GAS_ENDPOINT = "TU_URL_DE_GOOGLE_APPS_SCRIPT_AQUI";
   </script>
   ```

¡Listo! A partir de este momento, cualquier cotización solicitada en la landing page se guardará automáticamente en Google Sheets y enviará un correo de notificación instantáneo a Gastón y al equipo de ALM.
