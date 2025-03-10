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


app.post("/api/insert/register", functions.registrarUsuario);
app.put("/api/admin/update/:id", functions.actualizarUsuario);
app.delete("/api/admin/delete/:id", functions.eliminarUsuario);

app.post("/api/insert/actividad", functions.registrarActividad);
app.put("/api/admin/updateacti/:id", functions.actualizarActividad);
app.delete("/api/admin/deleteacti/:id", functions.eliminarActividad);

app.get("/prueba", functions.prueba);

app._router.stack.forEach((r) => {
    if (r.route && r.route.path) {
        console.log(r.route.path);
    }
});

app.listen(3000 , (error)=>{
    console.log("puerto 3000");
});