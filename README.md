# ASLI Backend

Este es el backend de ASLI, desarrollado en Node.js y Express. Se conecta con Google Sheets para autenticación de usuarios y gestión de tracking.

## Características

- **Login de usuarios**: Valida credenciales contra una hoja de Google Sheets.
- **Tracking filtrado**: Devuelve datos de tracking solo para el shipper autenticado.
- **Endpoints REST**: API sencilla y segura.
- **Preparado para Render y despliegue automático desde GitHub.**

## Instalación

1. Clona este repositorio:
   ```bash
   git clone https://github.com/tu-usuario/asli-backend.git
   cd asli-backend
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Coloca tu archivo de clave de Google (por ejemplo, `sinuous-pact-465518-q3-4f2769ff1cf9.json`) en la raíz del backend.  
   **¡No subas este archivo a GitHub!**

4. Crea un archivo `.env` basado en `.env.example` y completa los valores necesarios:
   ```
   GOOGLE_KEYFILE=sinuous-pact-465518-q3-4f2769ff1cf9.json
   PORT=3000
   ```

5. Inicia el servidor:
   ```bash
   npm start
   ```

## Endpoints principales

- `POST /api/login` — Login de usuario.
- `GET /api/tracking/:shipper` — Tracking filtrado por shipper.
- `GET /api/sheets` — Todos los datos de tracking.
- `GET /api/test` — Prueba de funcionamiento.

## Despliegue en Render

- Conecta este repositorio a Render.
- Configura las variables de entorno necesarias en el panel de Render.
- Sube tu archivo de clave de Google manualmente a Render (no lo subas al repo).

## Notas

- El archivo `.env` y la clave de Google **no deben subirse** al repositorio.
- El backend está preparado para ser desplegado en servicios como Render, Railway, etc. 