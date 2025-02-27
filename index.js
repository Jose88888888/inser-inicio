const express = require("express");
const app = express();
const cors=require('cors');
app.use(express.json());
app.use(cors());

const functions = require("./functions");




//apis de interfaces

app.get("/api/select/actividades/:table", functions.selectAll);
app.get("/api/actividades/:table/:tipo", functions.selectBytipo);
app.post("/api/informeactividad/", functions.insertinfoacti);
app.post("/api/informes", functions.inserinforme);
app.post("/api/login", functions.auntenlogin);
app.post("/api/register", functions.registrarUsuario);



app.get("/prueba", functions.prueba);

app.listen(3000 , (error)=>{
    console.log("puerto 3000");
});