<?php
/**
 * ==========================================================================
 * ALM CONTROL DE PLAGAS - CRM BACKEND PROXY (PHP)
 * ==========================================================================
 * Este script procesa el formulario de contacto y lo reenvía directamente
 * al CRM en Railway con la llave secreta en el header X-CRM-API-Key.
 * Cumple al 100% con la Guía de integración v2.
 * NO requiere Google Sheets ni herramientas de terceros.
 * ==========================================================================
 */

// Encabezados HTTP
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Manejo de preflight OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Método no permitido']);
    exit;
}

// Configuración de la integración al CRM
$crmUrl = 'https://impartial-rebirth-production-84b9.up.railway.app/api/web-form/fumigaciones_alm';
$crmKey = getenv('ALM_CRM_LLAVE') ?: '5dca44811e2b8276b640c6e3dfd2376fdaaf978c2298d8a75c82590b432f3cbe';

// Obtener los datos enviados (soporta JSON o Form Data estándar)
$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

if (!is_array($data) || empty($data)) {
    $data = $_POST;
}

// Estructura de campos exacta requerida por la Guía v2
$payload = [
    'nombre'           => trim($data['nombre'] ?? ''),
    'telefono'         => trim($data['telefono'] ?? ''),
    'correo'           => trim($data['correo'] ?? $data['email'] ?? ''),
    'empresa'          => trim($data['empresa'] ?? ''),
    'ciudad'           => trim($data['ciudad'] ?? ''),
    'tipo_instalacion' => trim($data['tipo_instalacion'] ?? $data['servicio'] ?? ''),
    'detalles'         => trim($data['detalles'] ?? $data['comentarios'] ?? ''),
    'promocion'        => trim($data['promocion'] ?? '5% de Descuento Web')
];

$jsonPayload = json_encode($payload, JSON_UNESCAPED_UNICODE);

// Función para enviar la petición Server-to-Server vía cURL
function dispatchLeadToCrm($url, $jsonBody, $apiKey) {
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => $jsonBody,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 12,
        CURLOPT_HTTPHEADER     => [
            'Content-Type: application/json',
            'X-CRM-API-Key: ' . trim($apiKey),
        ],
    ]);
    $response = curl_exec($ch);
    $statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    return ['code' => $statusCode, 'body' => $response, 'error' => $error];
}

// Primer intento
$res = dispatchLeadToCrm($crmUrl, $jsonPayload, $crmKey);

// 500: Reintentar una vez tras 2 segundos si el CRM tuvo una falla temporal (Guía v2)
if ($res['code'] >= 500) {
    error_log("CRM devolvió " . $res['code'] . ". Reintentando en 2 segundos...");
    sleep(2);
    $res = dispatchLeadToCrm($crmUrl, $jsonPayload, $crmKey);
}

if ($res['code'] !== 200) {
    error_log("CRM respondió código " . $res['code'] . ": " . $res['body']);
}

// Responder al frontend del sitio
$crmData = json_decode($res['body'], true) ?: $res['body'];
echo json_encode([
    'ok'           => ($res['code'] === 200),
    'crm_status'   => $res['code'],
    'crm_response' => $crmData
]);
