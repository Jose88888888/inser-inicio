const {testConnection} = require ('./conection');
const bcrypt = require("bcrypt");
require('dotenv').config();
const sql = require ("mssql");


async function selectAll(req, res) {
    const { table } = req.params;

    try {
        // Obtener la conexión activa
        const pool = await testConnection();
        // Consulta para traer toda la tabla (evitar SQL Injection con identificadores dinámicos)
        const result = await pool.request().query(`SELECT * FROM ${table}`);

        res.json(result.recordset);
    } catch (err) {
        console.error("❌ Error en la consulta:", err);
        res.status(500).send("Internal Server Error");
    }
}


async function selectBytipo(req, res) {
    const { table, tipo } = req.params;

    try {
        // Obtener la conexión activa
        const pool = await testConnection();    
        // Consulta parametrizada para evitar SQL Injection
        const result = await pool.request()
            .input('tipo', sql.NVarChar, tipo) // Asegura el tipo de dato
            .query(`SELECT * FROM ${table} WHERE tipo = @tipo`);

        res.json(result.recordset);
    } catch (err) {
        console.error("❌ Error en la consulta:", err);
        res.status(500).send("Internal Server Error");
    }
}

async function insertinfoacti(req, res) {
    const { valor, evidencia, observaciones } = req.body;

    try {
        // Obtener la conexión activa
        const pool = await testConnection();

        // Insertar datos en SQL Server
        const result = await pool.request()
            .input('valor', sql.Int, valor) // Asegura que 'valor' sea un número
            .input('evidencia', sql.NVarChar, evidencia)
            .input('observaciones', sql.NVarChar, observaciones)
            .query(`
                INSERT INTO informe_actividad (valor, evidencia, observaciones) 
                OUTPUT INSERTED.id
                VALUES (@valor, @evidencia, @observaciones)
            `);

        res.json({ message: "ok", id: result.recordset[0].id });
    } catch (err) {
        console.error("❌ Error en la inserción:", err);
        res.status(500).send("Internal Server Error");
    }
}

async function auntenlogin(req, res) {
    const { empleado, password } = req.body;
    try {
        let pool = await testConnection(); // ✅ Corrección aquí
        let result = await pool
            .request()
            .input("nu_empleado", sql.NVarChar, empleado)
            .query("SELECT * FROM Usuarios WHERE nu_empleado = @nu_empleado");

        if (result.recordset.length === 0) {
            return res.status(401).json({ error: "Número de empleado incorrecto" });
        }

        const user = result.recordset[0];

        // Comparar contraseña con la almacenada en la base de datos
        const passwordMatch = await bcrypt.compare(password, user.contraseña);
        console.log(password)

        if (!passwordMatch) {
            return res.status(401).json({ error: "Contraseña incorrecta" });
        }

        res.json({ mensaje: "Inicio de sesión exitoso", rol: user.rol });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error en el servidor" });
    }
}



  async function registrarUsuario(correo, nombre, nu_empleado, contraseña, rol) {
    try {
      let pool = await sql.connect(testConnection);
  
      // Encriptar la contraseña con bcrypt
      const saltRounds = 10;
      const hash = await bcrypt.hash(contraseña, saltRounds);
  
      await pool
        .request()
        .input("correo", sql.NVarChar, correo)
        .input("nombre", sql.NVarChar, nombre)
        .input("nu_empleado", sql.NVarChar, nu_empleado)
        .input("contraseña", sql.VarChar, hash) // Almacenar la contraseña encriptada
        .input("rol", sql.VarChar, rol)
        .query(
          "INSERT INTO Usuarios (correo, nombre, nu_empleado, contraseña, rol) VALUES (@correo, @nombre, @nu_empleado, @contraseña, @rol)"
        );
  
      console.log("Usuario registrado correctamente");
    } catch (error) {
      console.error("Error al registrar usuario:", error);
    }
  }





/*async function selectAll(req, res){
    try {
        const result = await db.query(`SELECT * FROM ${req.params.table}`);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
}
/*

/*async function selectBytipo(req, res){
    const {table,tipo}=req.params;
    try {
        const result = await db.query(
            `SELECT * FROM ${table} where tipo=${tipo}`,
                
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
}*/




/*async function insertinfoacti(req, res){
    const body=req.body;
    try {
        const result = await db.query(
            "insert into informe_actividad values (default, $1) RETURNING id", //query que vamos a ejecutar
            [body.parcial, ] //los valores del query
        );
        res.json({message:"ok", id:result.rows[0].id});
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
}
*/




module.exports = {
    selectAll,
    selectBytipo,
    insertinfoacti,
    auntenlogin,
    registrarUsuario
}