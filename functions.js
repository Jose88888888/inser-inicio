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
                .query(`
                    SELECT id_actividad, descripcion, tipo 
                    FROM ${table} 
                    WHERE tipo = @tipo
                `);

            res.json(result.recordset);
        } catch (err) {
            console.error("❌ Error en la consulta:", err);
            res.status(500).send("Internal Server Error");
        }
    }





    async function insertinfoacti(req, res) {
        const { id_informe, id_actividad, valor, evidencia, observacion, fecha, hora } = req.body;

        try {
            // Obtener la conexión activa
            const pool = await testConnection();
            
            // Crear un objeto Date para manejar fecha/hora
            const ahora = new Date();
            
            // Si no se proporciona fecha, usar la fecha actual
            const fechaActual = fecha || ahora.toISOString().split('T')[0];
            
            // Para la hora, usamos el formato correcto para SQL Server TIME
            let horaActual;
            if (hora) {
                horaActual = hora; // Usar la hora proporcionada
            } else {
                // Extraer solo la parte de la hora y formatearla para SQL Server
                const hh = ahora.getHours().toString().padStart(2, '0');
                const mm = ahora.getMinutes().toString().padStart(2, '0');
                const ss = ahora.getSeconds().toString().padStart(2, '0');
                horaActual = `${hh}:${mm}:${ss}`;
            }

            await pool.request()
                .input('id_informe', sql.Int, id_informe)
                .input('id_actividad', sql.Int, id_actividad)
                .input('valor', sql.Int, valor)
                .input('evidencia', sql.NVarChar, evidencia)
                .input('observacion', sql.NVarChar, observacion)
                .input('fecha', sql.Date, fechaActual)
                // No especificamos el tipo, dejamos que sql.js infiera correctamente
                .query(`
                    INSERT INTO informe_actividad (id_informe, id_actividad, valor, evidencia, observacion, fecha, hora)
                    VALUES (@id_informe, @id_actividad, @valor, @evidencia, @observacion, @fecha, '${horaActual}')
                `);

            res.status(201).json({ message: "Registro insertado correctamente." });

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

    async function getActividadesByInforme(req, res) {
        const { id_informe } = req.params;
    
        try {
            // Obtener la conexión activa
            const pool = await testConnection();
            
            const result = await pool.request()
                .input('id_informe', sql.Int, id_informe)
                .query(`
                    SELECT * FROM informe_actividad 
                    WHERE id_informe = @id_informe
                `);
    
            res.status(200).json(result.recordset);
    
        } catch (err) {
            console.error("❌ Error al obtener registros:", err);
            res.status(500).send("Internal Server Error");
        }
    }
    

// Función para actualizar un registro existente
async function updateInformeActividad(req, res) {
    const { id_informe, id_actividad } = req.params;
    const { valor, evidencia, observacion, fecha, hora } = req.body;

    try {
        // Obtener la conexión activa
        const pool = await testConnection();
        
        // Crear un objeto Date para manejar fecha/hora
        const ahora = new Date();
        
        // Si no se proporciona fecha, usar la fecha actual
        const fechaActual = fecha || ahora.toISOString().split('T')[0];
        
        // Para la hora, usamos el formato correcto para SQL Server TIME
        let horaActual;
        if (hora) {
            horaActual = hora; // Usar la hora proporcionada
        } else {
            // Extraer solo la parte de la hora y formatearla para SQL Server
            const hh = ahora.getHours().toString().padStart(2, '0');
            const mm = ahora.getMinutes().toString().padStart(2, '0');
            const ss = ahora.getSeconds().toString().padStart(2, '0');
            horaActual = `${hh}:${mm}:${ss}`;
        }

        await pool.request()
            .input('id_informe', sql.Int, id_informe)
            .input('id_actividad', sql.Int, id_actividad)
            .input('valor', sql.Int, valor)
            .input('evidencia', sql.NVarChar, evidencia)
            .input('observacion', sql.NVarChar, observacion)
            .input('fecha', sql.Date, fechaActual)
            .query(`
                UPDATE informe_actividad 
                SET valor = @valor,
                    evidencia = @evidencia,
                    observacion = @observacion,
                    fecha = @fecha,
                    hora = '${horaActual}'
                WHERE id_informe = @id_informe AND id_actividad = @id_actividad
            `);

        res.status(200).json({ message: "Registro actualizado correctamente." });

    } catch (err) {
        console.error("❌ Error al actualizar registro:", err);
        res.status(500).send("Internal Server Error");
    }
}

// Función para verificar si un registro ya existe
async function checkInformeActividadExists(req, res) {
    const { id_informe, id_actividad } = req.params;

    try {
        // Obtener la conexión activa
        const pool = await testConnection();
        
        const result = await pool.request()
            .input('id_informe', sql.Int, id_informe)
            .input('id_actividad', sql.Int, id_actividad)
            .query(`
                SELECT COUNT(*) as count 
                FROM informe_actividad 
                WHERE id_informe = @id_informe AND id_actividad = @id_actividad
            `);

        const exists = result.recordset[0].count > 0;
        res.status(200).json({ exists });

    } catch (err) {
        console.error("❌ Error al verificar registro:", err);
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
                carrera: user.carrera,
                id_informe
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Error en el servidor" });
        }
    }


    async function actualizarid(req, res) {
        const { id } = req.params; // ID del informe a actualizar
        const { status } = req.body;
        
        // Validar que se proporcione un status
        if (!status) {
            return res.status(400).json({ error: "El campo status es requerido" });
        }
        
        try {
            // Obtener la conexión activa
            const pool = await testConnection();
            
            // Actualizar el status del informe
            await pool.request()
                .input("id", sql.Int, id)
                .input("status", sql.VarChar, status)
                .query(`
                    UPDATE Informe
                    SET status = @status,
                        fecha_finalizacion = GETDATE() 
                    WHERE id_informe = @id
                `);
            
            // Verificar si se actualizó correctamente (opcional)
            const verificacion = await pool.request()
                .input("id", sql.Int, id)
                .query("SELECT * FROM Informe WHERE id_informe = @id");
                
            if (verificacion.recordset.length === 0) {
                return res.status(404).json({ error: "Informe no encontrado" });
            }
            
            res.status(200).json({ 
                mensaje: "Informe actualizado correctamente",
                status: status,
                informe: verificacion.recordset[0]
            });
        } catch (error) {
            console.error("Error al actualizar el informe:", error);
            res.status(500).json({ error: "Error interno del servidor" });
        }
    }



    async function prueba(req, res){
        const hash1 = await bcrypt.hash("LBnoriega", 10);

        const hash2 = await bcrypt.hash("LBnoriega", 10);

        console.log("hasg1", hash1);
        console.log("hasg2", hash2);
        const result= await bcrypt.compare("LBnoriega", hash1);
        console.log("result", result);
        res.json({});
    }





    async function registrarUsuario(req, res) {
        try {
            let { correo, nombre, nu_empleado, contraseña, rol, carrera} = req.body;
            
            const pool = await testConnection(); 
            const saltRounds = 10;
            const hash = await bcrypt.hash(contraseña, saltRounds);
    
            await pool
                .request()
                .input("correo", sql.NVarChar, correo)
                .input("nombre", sql.NVarChar, nombre)
                .input("nu_empleado", sql.NVarChar, nu_empleado)
                .input("contraseña", sql.VarChar, hash)
                .input("rol", sql.VarChar, rol)
                .input("carrera", sql.NVarChar, carrera)
                .query("INSERT INTO Usuarios (correo, nombre, nu_empleado, contraseña, rol, carrera) VALUES (@correo, @nombre, @nu_empleado, @contraseña, @rol, @carrera)");
    
            res.status(200).json({ mensaje: "Usuario registrado correctamente" });
        } catch (error) {
            console.error("Error al registrar usuario:", error);
            res.status(500).json({ error: "Error interno del servidor" });
        }
    }

    async function actualizarUsuario(req, res) {
        const { id } = req.params; // ID del usuario a actualizar
        const { correo, nombre, nu_empleado, rol, contraseña, carrera} = req.body;
        
        try {
            // Obtener la conexión activa
            const pool = await testConnection();
            
            // Si se proporciona contraseña, actualizarla con encriptación
            if (contraseña) {
                // Encriptar la contraseña con bcrypt
                const saltRounds = 10;
                const hash = await bcrypt.hash(contraseña, saltRounds);
                
                // Actualizar todos los campos incluyendo la contraseña
                await pool.request()
                    .input("id", sql.Int, id)
                    .input("correo", sql.NVarChar, correo)
                    .input("nombre", sql.NVarChar, nombre)
                    .input("nu_empleado", sql.NVarChar, nu_empleado)
                    .input("contraseña", sql.VarChar, hash)
                    .input("rol", sql.VarChar, rol)
                    .input("carrera", sql.NVarChar, carrera)
                    .query(`
                        UPDATE Usuarios 
                        SET correo = @correo, 
                            nombre = @nombre, 
                            nu_empleado = @nu_empleado, 
                            contraseña = @contraseña, 
                            rol = @rol,
                            carrera = @carrera
                        WHERE id_usuario = @id
                    `);
            } else {
                // Actualizar todos los campos excepto la contraseña
                await pool.request()
                    .input("id", sql.Int, id)
                    .input("correo", sql.NVarChar, correo)
                    .input("nombre", sql.NVarChar, nombre)
                    .input("nu_empleado", sql.NVarChar, nu_empleado)
                    .input("rol", sql.VarChar, rol)
                    .input("carrera", sql.NVarChar, carrera)
                    .query(`
                        UPDATE Usuarios 
                        SET correo = @correo, 
                            nombre = @nombre, 
                            nu_empleado = @nu_empleado, 
                            rol = @rol,
                            carrera = @carrera
                        WHERE id_usuario = @id
                    `);
            }
            
            res.status(200).json({ mensaje: "Usuario actualizado correctamente" });
        } catch (error) {
            console.error("Error al actualizar usuario:", error);
            res.status(500).json({ error: "Error interno del servidor" });
        }
    }


    async function eliminarUsuario(req, res) {
        const { id } = req.params; // ID del usuario a eliminar
        
        try {
            // Obtener la conexión activa
            const pool = await testConnection();
            
            // Eliminar usuario por ID
            await pool.request()
                .input("id", sql.Int, id)
                .query("DELETE FROM Usuarios WHERE id_usuario = @id");
            
            res.status(200).json({ mensaje: "Usuario eliminado correctamente" });
        } catch (error) {
            console.error("Error al eliminar usuario:", error);
            res.status(500).json({ error: "Error interno del servidor" });
        }
    }
    
    async function registrarActividad(req, res) {
        try {
            let { descripcion, tipo, status, unidad_medida } = req.body;
    
            const pool = await testConnection();
    
            await pool
                .request()
                .input("descripcion", sql.NVarChar, descripcion)
                .input("tipo", sql.NVarChar, tipo)
                .input("status", sql.NVarChar, status)
                .input("unidad_medida", sql.NVarChar, unidad_medida)
                .query(`
                    INSERT INTO actividades (descripcion, tipo, status, unidad_medida) 
                    VALUES (@descripcion, @tipo, @status, @unidad_medida)
                `);
    
            res.status(200).json({ mensaje: "Actividad registrada correctamente" });
        } catch (error) {
            console.error("Error al registrar actividad:", error);
            res.status(500).json({ error: "Error interno del servidor" });
        }
    }
    
    async function actualizarActividad(req, res) {
        const { id } = req.params; // ID de la actividad a actualizar
        const { descripcion, tipo, status, unidad_medida } = req.body;
    
        try {
            const pool = await testConnection();
    
            await pool.request()
                .input("id", sql.Int, id)
                .input("descripcion", sql.NVarChar, descripcion)
                .input("tipo", sql.NVarChar, tipo)
                .input("status", sql.NVarChar, status)
                .input("unidad_medida", sql.NVarChar, unidad_medida)
                .query(`
                    UPDATE actividades 
                    SET descripcion = @descripcion, 
                        tipo = @tipo, 
                        status = @status, 
                        unidad_medida = @unidad_medida 
                    WHERE id_actividad = @id
                `);
    
            res.status(200).json({ mensaje: "Actividad actualizada correctamente" });
        } catch (error) {
            console.error("Error al actualizar actividad:", error);
            res.status(500).json({ error: "Error interno del servidor" });
        }
    }

    
    async function eliminarActividad(req, res) {
        const { id } = req.params; // ID de la actividad a eliminar
    
        try {
            const pool = await testConnection();
    
            await pool.request()
                .input("id", sql.Int, id)
                .query("DELETE FROM actividades WHERE id_actividad = @id");
    
            res.status(200).json({ mensaje: "Actividad eliminada correctamente" });
        } catch (error) {
            console.error("Error al eliminar actividad:", error);
            res.status(500).json({ error: "Error interno del servidor" });
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
        actualizarid,
        getActividadesByInforme,
        updateInformeActividad,
        checkInformeActividadExists,
        auntenlogin,
        registrarUsuario,
        actualizarUsuario,
        eliminarUsuario,
        registrarActividad,
        actualizarActividad,
        eliminarActividad,
        prueba
    }