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



async function inserinforme(req, res) {
    const { id_usuario, cuatrimestre, parcial, fecha, estatus } = req.body;  

    if (!id_usuario) {
        return res.status(400).json({ message: "id_usuario es requerido" });
    }

    try {
        const pool = await testConnection();

        // Verificar si ya hay un informe "Activo" para el usuario
        const existingReport = await pool.request()
            .input('id_usuario', sql.Int, id_usuario)
            .query(`
                SELECT id_usuario FROM informe 
                WHERE id_usuario = @id_usuario AND status = 'Activo'
            `);

        if (existingReport.recordset.length > 0) {
            return res.status(400).json({ message: "Ya tienes un informe activo" });
        }

        // Insertar el informe y obtener el ID insertado
        const result = await pool.request()
            .input('id_usuario', sql.Int, id_usuario)  
            .input('cuatrimestre', sql.NVarChar, cuatrimestre)
            .input('parcial', sql.Int, parcial)
            .input('fecha', sql.DateTime, fecha)
            .input('status', sql.NVarChar, estatus)
            .query(`
                INSERT INTO informe (id_usuario, cuatrimestre, parcial, fecha, status) 
                OUTPUT INSERTED.id_informe  -- Devuelve el ID recién insertado
                VALUES (@id_usuario, @cuatrimestre, @parcial, @fecha, @status)
            `);

        const id_informe = result.recordset[0].id_informe; // Obtener el ID insertado

        res.json({ message: "ok", id_informe });  // Enviar el ID al frontend
    } catch (err) {
        console.error("❌ Error en la inserción:", err);
        res.status(500).send("Internal Server Error");
    }
}






async function auntenlogin(req, res) {
    const { empleado, password } = req.body;
    try {
        let pool = await testConnection();
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

        if (!passwordMatch) {
            return res.status(401).json({ error: "Contraseña incorrecta" });
        }

            // Buscar el id_informe del usuario con status "Activo"
        const informeResult = await pool.request()
        .input('id_usuario', sql.Int, user.id_usuario)
        .query(`
            SELECT id_informe FROM informe WHERE id_usuario = @id_usuario AND status = 'Activo'
        `);

    const id_informe = informeResult.recordset.length > 0 ? informeResult.recordset[0].id_informe : null;

        //  la API devuelve TODOS los datos necesarios
        res.json({
            mensaje: "Inicio de sesión exitoso",
            id_usuario: user.id_usuario,
            correo: user.correo,
            nombre: user.nombre,
            empleado: user.nu_empleado,
            rol: user.rol,
            id_informe
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error en el servidor" });
    }
}






async function prueba(req, res){
    const hash1 = await bcrypt.hash("BCasillas", 10);

    const hash2 = await bcrypt.hash("BCasillas", 10);

    console.log("hasg1", hash1);
    console.log("hasg2", hash2);
    const result= await bcrypt.compare("BCasillas", hash1);
    console.log("result", result);
    res.json({});
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
    inserinforme,
    auntenlogin,
    registrarUsuario,
    prueba
}