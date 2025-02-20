require('dotenv').config();
const sql = require("mssql");

// Configuración de la base de datos
const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  port: parseInt(process.env.DB_PORT),
  options: {
    encrypt: false, // Cambia a true si usas Azure SQL
    trustServerCertificate: true, // Requerido en algunas configuraciones
  },
};

// Función para conectar a la base de datos
async function connectDB() {
  try {
    await sql.connect(dbConfig);
    console.log("Conectado a SQL Server");
  } catch (err) {
    console.error("Error al conectar a la base de datos", err);
  }
}

connectDB();

module.exports = {
    query: (text, params) => pool.query(text, params)
};
