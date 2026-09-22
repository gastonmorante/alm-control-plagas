/**
 * Servidor proxy opcional en Node.js / Express para ALM Control de Plagas
 * Uso opcional si se prefiere desplegar en Railway, Vercel, Render o VPS en lugar de Google Apps Script.
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Determinar el directorio raíz del proyecto (donde están index.html, assets, js, css)
let rootDir = path.resolve(__dirname, '..');
if (!fs.existsSync(path.join(rootDir, 'index.html')) && fs.existsSync(path.join(__dirname, 'index.html'))) {
  rootDir = __dirname;
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos de la landing page
app.use(express.static(rootDir));

const CRM_URL = 'https://impartial-rebirth-production-84b9.up.railway.app/api/web-form/fumigaciones_alm';
const CRM_KEY = process.env.ALM_CRM_LLAVE || '5dca44811e2b8276b640c6e3dfd2376fdaaf978c2298d8a75c82590b432f3cbe';

// Endpoint para el formulario (acepta tanto /api/contact como /send-crm.php)
app.post(['/api/contact', '/send-crm.php'], async (req, res) => {
  const body = req.body || {};

  // Formato exacto conforme a la Guía v2
  const crmPayload = {
    nombre: (body.nombre || '').trim(),
    telefono: (body.telefono || '').trim(),
    correo: (body.correo || body.email || '').trim(),
    empresa: (body.empresa || '').trim(),
    ciudad: (body.ciudad || '').trim(),
    tipo_instalacion: (body.tipo_instalacion || body.servicio || '').trim(),
    detalles: (body.detalles || body.comentarios || '').trim(),
    promocion: (body.promocion || '5% de Descuento Web').trim()
  };

  try {
    if (!CRM_KEY) {
      console.warn('ALM_CRM_LLAVE no configurada en variables de entorno');
    }

    let crmResponse = await fetch(CRM_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CRM-API-Key': CRM_KEY.trim()
      },
      body: JSON.stringify(crmPayload)
    });

    let status = crmResponse.status;

    // Si responde 500, reintentar una vez pasados unos segundos (Guía v2)
    if (status >= 500) {
      console.warn(`CRM respondió ${status}. Reintentando una vez en 2 segundos...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      crmResponse = await fetch(CRM_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CRM-API-Key': CRM_KEY.trim()
        },
        body: JSON.stringify(crmPayload)
      });
      status = crmResponse.status;
    }

    const data = await crmResponse.json().catch(() => ({}));

    if (status === 200) {
      console.log('Lead registrado con éxito en CRM:', data);
    } else if (status === 400) {
      console.error('CRM Error 400 (Dato inválido):', data);
    } else if (status === 401) {
      console.error('CRM Error 401 (Llave o header no coincide):', data);
    } else {
      console.error(`CRM respondió ${status}:`, data);
    }

    // Siempre responder éxito al usuario para no perder el prospecto
    return res.status(200).json({ ok: true, crmStatus: status, crmResponse: data });
  } catch (err) {
    console.error('Error al contactar al CRM:', err);
    return res.status(200).json({ ok: true, error: err.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'ALM CRM Proxy Server' });
});

// Servir la página principal
app.get('/', (req, res) => {
  res.sendFile(path.join(rootDir, 'index.html'));
});

// Fallback para cualquier otra ruta de navegación
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(rootDir, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor proxy de ALM activo en el puerto ${PORT}`);
});
