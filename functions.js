const {testConnection} = require ('./conection');
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
    const { valor, unidad_de_medida, evidencia, observaciones } = req.body;

    try {
        // Obtener la conexión activa
        const pool = await testConnection();

        // Insertar datos en SQL Server
        const result = await pool.request()
            .input('valor', sql.Int, valor) // Asegura que 'valor' sea un número
            .input('unidad_de_medida', sql.NVarChar, unidad_de_medida)
            .input('evidencia', sql.NVarChar, evidencia)
            .input('observaciones', sql.NVarChar, observaciones)
            .query(`
                INSERT INTO informe_actividad (valor, unidad_de_medida, evidencia, observaciones) 
                OUTPUT INSERTED.id
                VALUES (@valor, @unidad_de_medida, @evidencia, @observaciones)
            `);

        res.json({ message: "ok", id: result.recordset[0].id });
    } catch (err) {
        console.error("❌ Error en la inserción:", err);
        res.status(500).send("Internal Server Error");
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
    insertinfoacti
}