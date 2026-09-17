/**
 * ==========================================================================
 * ALM CONTROL DE PLAGAS - BACKEND GOOGLE APPS SCRIPT (CRM PROXY & SPREADSHEET)
 * Lead Developer: Gastón | Agency: NegocioUp
 * ==========================================================================
 * Este script actúa como servidor backend seguro para la landing page de ALM.
 * 
 * Funcionalidades:
 * 1. Almacenamiento local en Google Sheets ("Leads Landing Page").
 * 2. Alertas automáticas inmediatas por correo electrónico a ALM y NegocioUp.
 * 3. Reenvío seguro (Server-to-Server) al CRM oficial en Railway (agencia-ai-core).
 *    - La llave secreta se resguarda en las Propiedades del Script (ALM_CRM_LLAVE),
 *      evitando exponerla en el frontend o en repositorios públicos.
 *    - En caso de fallo o caída temporal del CRM, el registro se resguarda
 *      en Sheets y correo sin pérdida de prospectos.
 * ==========================================================================
 */

// 1. CONFIGURACIÓN DE NOTIFICACIONES Y HOJA DE CÁLCULO
const NOTIFICATION_EMAIL = "gaston@negocioup.com, contacto@almcontrol.com";
const SHEET_NAME = "Leads Landing Page";

// 2. CONFIGURACIÓN DEL CRM EXTERNO (RAILWAY)
const CRM_WEBHOOK_URL = "https://impartial-rebirth-production-84b9.up.railway.app/api/web-form/fumigaciones_alm";

/**
 * Endpoint para recibir solicitudes POST desde el sitio web
 */
function doPost(e) {
  try {
    let data;
    if (e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else if (e.parameter) {
      data = e.parameter;
    } else {
      data = {};
    }

    const timestamp = data.timestamp || new Date().toLocaleString("es-MX", { timeZone: "America/Mexico_City" });
    const nombre = (data.nombre || "").trim() || "Sin Nombre";
    const empresa = (data.empresa || "").trim() || "Particular / No especificado";
    const telefono = (data.telefono || "").trim() || "Sin Teléfono";
    const correo = (data.correo || data.email || "").trim();
    const ciudad = (data.ciudad || "").trim() || "No especificada";
    const tipo_instalacion = (data.tipo_instalacion || data.servicio || "").trim() || "General";
    const detalles = (data.detalles || data.comentarios || "").trim();
    const promocion = (data.promocion || "5% de Descuento Web").trim();
    const origen = (data.origen || "Landing Page ALM 2026").trim();

    // 1. Almacenamiento actual en Google Sheets (Respaldo garantizado)
    try {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      let sheet = ss.getSheetByName(SHEET_NAME);

      if (!sheet) {
        sheet = ss.insertSheet(SHEET_NAME);
        sheet.appendRow([
          "Timestamp",
          "Nombre",
          "Empresa",
          "Teléfono",
          "Correo Electrónico",
          "Ciudad",
          "Tipo de Instalación / Servicio",
          "Detalles / Necesidad",
          "Promoción",
          "Origen Lead",
          "Estatus CRM"
        ]);
        sheet.getRange(1, 1, 1, 11).setFontWeight("bold").setBackground("#0D1B3E").setFontColor("#FFFFFF");
      }

      sheet.appendRow([
        timestamp,
        nombre,
        empresa,
        telefono,
        correo,
        ciudad,
        tipo_instalacion,
        detalles,
        promocion,
        origen,
        "NUEVO - Pendiente Contacto"
      ]);
    } catch (sheetError) {
      Logger.log("Aviso: Error registrando en Google Sheets: " + sheetError.toString());
    }

    // 2. Envío de notificación actual por correo electrónico
    try {
      sendLeadEmailNotification({
        timestamp,
        nombre,
        empresa,
        telefono,
        email: correo,
        ciudad,
        servicio: tipo_instalacion,
        comentarios: detalles,
        promocion
      });
    } catch (emailError) {
      Logger.log("Aviso: Error enviando correo de notificación: " + emailError.toString());
    }

    // 3. Reenvío seguro al CRM externo en Railway desde el servidor (Server-to-Server)
    const crmResult = sendLeadToExternalCRM({
      nombre,
      telefono,
      correo,
      empresa,
      ciudad,
      tipo_instalacion,
      detalles,
      promocion
    });

    // Respuesta estructurada al cliente web
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Lead procesado correctamente",
      lead: { nombre, empresa, telefono, correo },
      crm_synced: crmResult.success
    }))
    .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log("Error crítico en doPost: " + error.toString());
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    }))
    .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Función que despacha el prospecto al CRM externo vía HTTP POST
 * Cumple con los lineamientos de la Guía de Integración CRM v2
 */
function sendLeadToExternalCRM(lead) {
  try {
    // La llave se lee exclusivamente de las Propiedades del Script (Project Settings > Script Properties)
    const scriptProperties = PropertiesService.getScriptProperties();
    const apiKey = scriptProperties.getProperty("ALM_CRM_LLAVE");

    if (!apiKey) {
      Logger.log("CRM AVISO: La propiedad ALM_CRM_LLAVE no está configurada en las Propiedades del Script. Por favor agrégala en Configuración del Proyecto.");
      return { success: false, error: "missing_api_key" };
    }

    // Estructura exacta requerida por la Guía v2 del CRM
    const payload = {
      nombre: lead.nombre,
      telefono: lead.telefono,
      correo: lead.correo,
      empresa: lead.empresa,
      ciudad: lead.ciudad,
      tipo_instalacion: lead.tipo_instalacion,
      detalles: lead.detalles,
      promocion: lead.promocion
    };

    const options = {
      method: "post",
      contentType: "application/json",
      headers: {
        "X-CRM-API-Key": apiKey.trim()
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true // Permite capturar 400, 401, 500 sin lanzar excepción fatal
    };

    const response = UrlFetchApp.fetch(CRM_WEBHOOK_URL, options);
    const statusCode = response.getResponseCode();
    const responseBody = response.getContentText();

    if (statusCode === 200) {
      Logger.log("CRM ÉXITO (HTTP 200): " + responseBody);
      return { success: true, statusCode, responseBody };
    } else {
      Logger.log("CRM ERROR HTTP " + statusCode + ": " + responseBody);
      return { success: false, statusCode, responseBody };
    }

  } catch (err) {
    // Si el CRM falla, el error se registra en logs pero el lead NUNCA se pierde
    Logger.log("CRM EXCEPCIÓN DE RED: " + err.toString());
    return { success: false, error: err.toString() };
  }
}

/**
 * Endpoint de prueba o verificación de estado (GET)
 */
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "online",
    system: "ALM Control de Plagas Backend & CRM Proxy API",
    version: "2026.2"
  }))
  .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Envío de alerta por correo electrónico
 */
function sendLeadEmailNotification(lead) {
  const subject = `🚨 [NUEVO LEAD ALM] - ${lead.empresa} (${lead.ciudad})`;
  
  const body = `
==================================================
  NUEVA SOLICITUD DE COTIZACIÓN DE BLINDAJE SANITARIO
==================================================

• Nombre: ${lead.nombre}
• Empresa: ${lead.empresa}
• Teléfono: ${lead.telefono}
• Correo Electrónico: ${lead.email}
• Ciudad / Zona: ${lead.ciudad}
• Tipo de Instalación / Servicio: ${lead.servicio}
• Promoción: ${lead.promocion}
• Fecha y Hora: ${lead.timestamp}

--------------------------------------------------
Detalles / Comentarios del Cliente:
${lead.comentarios || 'Sin notas adicionales.'}
--------------------------------------------------

Verifica la hoja de cálculo de Google Sheets para dar seguimiento comercial inmediato.
  `;

  try {
    MailApp.sendEmail(NOTIFICATION_EMAIL, subject, body);
  } catch (err) {
    Logger.log("Error enviando correo de notificación: " + err.toString());
  }
}
