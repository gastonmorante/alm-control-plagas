/**
 * ==========================================================================
 * ALM CONTROL DE PLAGAS - BACKEND GOOGLE APPS SCRIPT (CRM LITE)
 * Lead Developer: Gastón | Agency: NegocioUp
 * ==========================================================================
 */

// CONFIGURACIÓN DE NOTIFICACIONES POR CORREO
const NOTIFICATION_EMAIL = "gaston@negocioup.com, contacto@almcontrol.com"; // Modificar según convenga
const SHEET_NAME = "Leads Landing Page";

/**
 * Endpoint para recibir solicitudes POST desde el sitio web
 */
function doPost(e) {
  try {
    let data;
    if (e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else {
      data = e.parameter;
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);

    // Crear la pestaña si no existe
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      sheet.appendRow([
        "Timestamp",
        "Nombre",
        "Empresa",
        "Teléfono",
        "Email",
        "Ciudad",
        "Servicio Requerido",
        "Comentarios / Notas",
        "Origen Lead",
        "Estatus CRM"
      ]);
      sheet.getRange(1, 1, 1, 10).setFontWeight("bold").setBackground("#0D1B3E").setFontColor("#FFFFFF");
    }

    const timestamp = data.timestamp || new Date().toLocaleString("es-MX", { timeZone: "America/Mexico_City" });
    const nombre = data.nombre || "Sin Nombre";
    const empresa = data.empresa || "Particular";
    const telefono = data.telefono || "Sin Teléfono";
    const email = data.email || "Sin Email";
    const ciudad = data.ciudad || "No especificada";
    const servicio = data.servicio || "General";
    const comentarios = data.comentarios || "";
    const origen = data.origen || "Landing Page Web 2026";
    const estatus = "NUEVO - Pendiente Contacto";

    // Insertar la fila con los datos del prospecto
    sheet.appendRow([
      timestamp,
      nombre,
      empresa,
      telefono,
      email,
      ciudad,
      servicio,
      comentarios,
      origen,
      estatus
    ]);

    // Enviar alerta inmediata por correo a Gastón / ALM
    sendLeadEmailNotification({
      timestamp,
      nombre,
      empresa,
      telefono,
      email,
      ciudad,
      servicio,
      comentarios
    });

    // Respuesta JSON estructurada
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Lead registrado correctamente en Google Sheets",
      lead: { nombre, empresa, telefono }
    }))
    .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log("Error en doPost: " + error.toString());
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    }))
    .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Endpoint de prueba o verificación de estado (GET)
 */
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "online",
    system: "ALM Control de Plagas CRM Bridge API",
    version: "2026.1"
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
• Email: ${lead.email}
• Ciudad / Zona: ${lead.ciudad}
• Servicio Requerido: ${lead.servicio}
• Fecha y Hora: ${lead.timestamp}

--------------------------------------------------
Notas / Comentarios del Cliente:
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
