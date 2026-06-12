import { createServer } from "node:http";
import { readFileSync, existsSync, statSync } from "node:fs";
import { dirname, extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "..");
loadEnv();

const PORT = Number(process.env.PORT || 3000);
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;

const server = createServer(async (request, response) => {
  setCorsHeaders(response);

  if (request.method === "OPTIONS") {
    response.writeHead(204);
    response.end();
    return;
  }

  if (request.method === "POST" && request.url === "/api/send-whatsapp") {
    await handleSendWhatsApp(request, response);
    return;
  }

  if (request.method === "GET") {
    sendStaticFile(request, response);
    return;
  }

  sendJSON(response, 404, { error: "Ruta no encontrada" });
});

server.listen(PORT, () => {
  console.log(`Mini Farmacia WhatsApp API escuchando en http://localhost:${PORT}`);
});

async function handleSendWhatsApp(request, response) {
  try {
    const { telefono, mensaje } = await readJSONBody(request);

    if (!telefono || !mensaje) {
      sendJSON(response, 400, { error: "telefono y mensaje son requeridos" });
      return;
    }

    if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID) {
      sendJSON(response, 500, { error: "Credenciales de WhatsApp no configuradas" });
      return;
    }

    const whatsappResponse = await fetch(`https://graph.facebook.com/v20.0/${PHONE_NUMBER_ID}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: cleanPhone(telefono),
        type: "text",
        text: {
          preview_url: true,
          body: mensaje,
        },
      }),
    });

    const data = await whatsappResponse.json();

    if (!whatsappResponse.ok) {
      sendJSON(response, whatsappResponse.status, {
        error: "No se pudo enviar el mensaje de WhatsApp",
        details: data,
      });
      return;
    }

    sendJSON(response, 200, { ok: true, data });
  } catch (error) {
    sendJSON(response, 500, { error: "Error interno del servidor", details: error.message });
  }
}

function loadEnv() {
  const envPath = join(__dirname, ".env");
  if (!existsSync(envPath)) return;

  const envFile = readFileSync(envPath, "utf8");
  envFile.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;

    const separator = trimmed.indexOf("=");
    if (separator === -1) return;

    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim().replace(/^["']|["']$/g, "");
    if (key && process.env[key] === undefined) process.env[key] = value;
  });
}

function readJSONBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";

    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1000000) {
        request.destroy();
        reject(new Error("Payload demasiado grande"));
      }
    });

    request.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("JSON invalido"));
      }
    });

    request.on("error", reject);
  });
}

function cleanPhone(phone) {
  return String(phone).replace(/\D/g, "");
}

function setCorsHeaders(response) {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function sendStaticFile(request, response) {
  const requestPath = request.url === "/" ? "/index.html" : decodeURIComponent(request.url.split("?")[0]);
  const filePath = normalize(join(publicDir, requestPath));

  if (!filePath.startsWith(publicDir) || !existsSync(filePath) || !statSync(filePath).isFile()) {
    sendJSON(response, 404, { error: "Archivo no encontrado" });
    return;
  }

  response.writeHead(200, { "Content-Type": getContentType(filePath) });
  response.end(readFileSync(filePath));
}

function getContentType(filePath) {
  const types = {
    ".css": "text/css; charset=utf-8",
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".svg": "image/svg+xml",
  };
  return types[extname(filePath)] || "application/octet-stream";
}

function sendJSON(response, statusCode, payload) {
  response.writeHead(statusCode, { "Content-Type": "application/json" });
  response.end(JSON.stringify(payload));
}
