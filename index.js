require("dotenv").config();
const express = require("express");
const sql = require("mssql");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

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

//funcion para insertar a la tabla informe_acitivdad

app.post("/insertar-inicio-cuatrimestre", async (req, res) => {
  try {
    let pool = await sql.connect(dbConfig); //preguntar
    let { id_informe, actividades } = req.body;

    if (!id_informe || !actividades || actividades.length === 0) { //verifica que los datos sean diferentes a 0
      return res.status(400).json({ error: "Datos incompletos" });
    }

    for (let act of actividades) {
      await pool.request()
        .input("id_informe", sql.Int, id_informe)
        .input("id_actividad", sql.Int, act.id_actividad)
        .input("valor", sql.Float, act.valor)
        .input("unidad_medida", sql.NVarChar(50), act.unidad_medida)
        .input("evidencia", sql.NVarChar(255), act.evidencia)
        .input("observacion", sql.NVarChar(500), act.observacion)
        .query(`
          INSERT INTO Informe_Actividad (id_informe, id_actividad, valor, unidad_medida, evidencia, observacion) 
          VALUES (@id_informe, @id_actividad, @valor, @unidad_medida, @evidencia, @observacion)
        `);
    }

    res.status(200).json({ message: "Datos insertados correctamente" });

  } catch (error) {
    console.error("Error al insertar datos:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

module.exports = router;
