const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Si existe la variable de entorno GOOGLE_KEY_JSON, escribe el archivo temporalmente
if (process.env.GOOGLE_KEY_JSON) {
  const keyFilePath = path.join(__dirname, 'google-key.json');
  fs.writeFileSync(keyFilePath, process.env.GOOGLE_KEY_JSON);
  process.env.GOOGLE_KEYFILE = keyFilePath;
}

// Middleware
app.use(cors({
  origin: ['https://asli.cl', 'http://localhost:5500'],
  credentials: true
}));
app.use(express.json());

// Configurar Google Sheets con cuenta de servicio
const keyFile = process.env.GOOGLE_KEYFILE || path.join(__dirname, 'sinuous-pact-465518-q3-4f2769ff1cf9.json');
const auth = new google.auth.GoogleAuth({
  keyFile: keyFile,
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});

const sheets = google.sheets({ version: 'v4', auth });

// IDs de las hojas
const LOGIN_SHEET_ID = '1a5jNhLXQvdAR2hDU6K5_qhpiwjlDhK4oovCXym2_3AM'; // Hoja LOGIN
const TRACKING_SHEET_ID = '1a5jNhLXQvdAR2hDU6K5_qhpiwjlDhK4oovCXym2_3AM'; // Hoja de tracking

// Endpoint de login
app.post('/api/login', async (req, res) => {
  try {
    const { usuario, clave } = req.body;
    
    if (!usuario || !clave) {
      return res.status(400).json({ error: 'Usuario y clave requeridos' });
    }

    // Leer datos de login
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: LOGIN_SHEET_ID,
      range: 'LOGIN!A2:C', // Desde A2 para saltar headers
    });

    const rows = response.data.values || [];
    
    // Buscar usuario
    const user = rows.find(row => 
      row[0] === usuario && row[1] === clave
    );

    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Retornar datos del usuario (sin la clave)
    res.json({
      success: true,
      usuario: user[0],
      shipper: user[2]
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Endpoint para obtener datos de tracking filtrados por shipper
app.get('/api/tracking/:shipper', async (req, res) => {
  try {
    const { shipper } = req.params;
    
    console.log('=== DEBUG TRACKING ===');
    console.log('Shipper buscado:', shipper);
    
    // Leer datos de tracking
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: TRACKING_SHEET_ID,
      range: 'REGISTROS!A:Y', // Leer solo la hoja REGISTROS hasta columna Y
    });

    const rows = response.data.values || [];
    const headers = rows[0]; // Primera fila son headers
    
    console.log('Headers encontrados:', headers);
    console.log('Total de filas (sin headers):', rows.length - 1);
    
    // Buscar la columna SHIPPER (ignorando mayúsculas y espacios)
    const shipperIndex = headers.findIndex(h => h && h.toString().replace(/\s+/g, '').toUpperCase() === 'SHIPPER');
    console.log('Índice de columna SHIPPER:', shipperIndex);
    
    if (shipperIndex === -1) {
      console.log('❌ ERROR: No se encontró columna SHIPPER');
      console.log('Columnas disponibles:', headers.map((h, i) => `${i}: ${h}`));
      return res.status(500).json({ error: 'Columna SHIPPER no encontrada' });
    }
    
    // Mostrar todos los SHIPPER únicos en la hoja
    const allShippers = [...new Set(rows.slice(1).map(row => row[shipperIndex]).filter(Boolean))];
    console.log('Todos los SHIPPER en la hoja:', allShippers);
    
    // Filtrar por shipper logueado (ignorando mayúsculas y espacios)
    const filteredData = rows.slice(1).filter(row => {
      if (shipperIndex < 0) return false;
      const cell = (row[shipperIndex] || '').replace(/\s+/g, '').toUpperCase();
      const param = shipper.replace(/\s+/g, '').toUpperCase();
      
      console.log(`Comparando: "${row[shipperIndex]}" (${cell}) vs "${shipper}" (${param})`);
      
      if (cell === param) {
        console.log('✅ MATCH encontrado!');
        return true;
      } else {
        console.log('❌ NO MATCH');
        return false;
      }
    });

    console.log('Registros filtrados encontrados:', filteredData.length);

    // Convertir a objetos con headers
    const result = filteredData.map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index] || '';
      });
      return obj;
    });

    console.log('=== FIN DEBUG ===');

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error obteniendo tracking:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Endpoint para obtener todos los datos de tracking (sin filtro)
app.get('/api/sheets', async (req, res) => {
  try {
    console.log('=== DEBUG SHEETS ENDPOINT ===');
    
    // Leer datos de tracking
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: TRACKING_SHEET_ID,
      range: 'REGISTROS!A:Y', // Leer solo la hoja REGISTROS hasta columna Y
    });

    const rows = response.data.values || [];
    
    console.log('Total de filas obtenidas:', rows.length);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'No se encontraron datos' });
    }

    res.json({
      success: true,
      values: rows
    });

  } catch (error) {
    console.error('Error obteniendo datos de sheets:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Endpoint de prueba
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend funcionando correctamente' });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
}); 
