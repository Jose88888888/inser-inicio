const db = require ('./conection');
require('dotenv').config();



async function selectAll(req, res){
    try {
        const result = await db.query(`SELECT * FROM ${req.params.table}`);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
}



async function selectBytipo(req, res){
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
}




async function insertinfoacti(req, res){
    const body=req.body;
    try {
        const result = await db.query(
            "insert into informes values (default, $1) RETURNING id", //query que vamos a ejecutar
            [body.parcial, ] //los valores del query
        );
        res.json({message:"ok", id:result.rows[0].id});
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
}





module.exports = {
    selectAll,
    selectBytipo,
    insertinfoacti
}