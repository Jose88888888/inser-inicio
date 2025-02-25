require("dotenv").config();
const sql = require("mssql");

const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: "127.0.0.1",
  database: process.env.DB_DATABASE,
  port: 1434,  // SQL Server Express debe estar configurado en este puerto
  options: {
    encrypt: false, // Cambia a true si usas Azure SQL
    trustServerCertificate: true,
  },
};


async function testConnection() {
  try {
    console.log("Intentando conectar a:", dbConfig);
    return await sql.connect(dbConfig);
    console.log("✅ Conectado exitosamente a SQL Server Express");
  } catch (err) {
    console.error("❌ Error al conectar a la base de datos:", err);
  }
}


module.exports={
  testConnection
}