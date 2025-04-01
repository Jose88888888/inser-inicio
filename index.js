const express = require("express");
const fs = require('fs');
const app = express();
const cors=require('cors');
const multer = require('multer');
const path = require('path');
const { promisify } = require('util');
app.use(express.json());
app.use(cors());

const functions = require("./functions");

const getCurrentCuatrimestre = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    
    if (month >= 1 && month <= 4) return `${year}E`;
    if (month >= 5 && month <= 8) return `${year}M`;
    return `${year}S`;
};

// Definir la ubicación en el frontend
const frontendPath = path.join(__dirname, '../inser-inicio/backend/uploads/');

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        const cuatrimestre = getCurrentCuatrimestre();
        
        // Obtener el número de empleado desde el cuerpo de la solicitud
        const empleadoNum = req.body.empleadoNum || 'sin-empleado';
        
        // Crear path con cuatrimestre y número de empleado
        const uploadPath = path.join(frontendPath, cuatrimestre, empleadoNum.toString());

        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }

        cb(null, uploadPath);
    },
    filename: function(req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: function(req, file, cb) {
        const filetypes = /jpeg|jpg|png|gif|pdf|docx?|xlsx?/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);

        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb('Error: Solo se permiten imágenes y documentos de oficina');
        }
    },
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB límite de tamaño
    }
});





//apis de interfaces

app.get("/api/select/actividades/:table", functions.selectAll);
app.get("/api/actividades/:table/:tipo", functions.selectBytipo);
app.post("/api/informeactividad/", upload.single('evidencia'), functions.insertinfoacti);
app.post("/api/informes", functions.inserinforme);
app.post("/api/login", functions.auntenlogin);
app.put("/api/informes/actualizar/:id", functions.actualizarid);


app.get("/api/informeactividad/informe/:id_informe", functions.getActividadesByInforme)
app.get("/api/informeactividad/check/:id_informe/:id_actividad", functions.checkInformeActividadExists)
app.put("/api/update/informeactividad/:id_informe/:id_actividad", upload.single('evidencia'), functions.updateInformeActividad);
app.get('/api/file-details', (req, res) => {
    const cuatrimestre = req.query.cuatrimestre || getCurrentCuatrimestre();
    const directoryPath = path.join(__dirname, '..inser-inicio/backend/uploads/', cuatrimestre);

    fs.readdir(directoryPath, (err, files) => {
        if (err) {
            return res.status(500).json({ message: "No se pueden leer los archivos", error: err });
        }
        
        const fileDetails = files
            .filter(file => !file.startsWith('.'))
            .map(file => {
                const stats = fs.statSync(path.join(directoryPath, file));
                return {
                    name: file,
                    size: stats.size,
                    lastModified: stats.mtime,
                    type: path.extname(file)
                };
            });
        
        res.json(fileDetails);
    });
});



app.get('/api/empleados-files', (req, res) => {
    const cuatrimestre = req.query.cuatrimestre || getCurrentCuatrimestre();
    const cuatrimestrePath = path.join(__dirname, '../inser-inicio/backend/uploads/', cuatrimestre);
    
    if (!fs.existsSync(cuatrimestrePath)) {
        return res.status(404).json({ message: "Cuatrimestre no encontrado" });
    }
    
    fs.readdir(cuatrimestrePath, (err, empleadoDirs) => {
        if (err) {
            return res.status(500).json({ message: "Error al leer el directorio del cuatrimestre", error: err });
        }
        
        // Filtrar para obtener solo directorios
        const empleadosConArchivos = empleadoDirs
            .filter(dir => {
                const dirPath = path.join(cuatrimestrePath, dir);
                return fs.statSync(dirPath).isDirectory();
            })
            .map(id_usuario => {
                const empleadoPath = path.join(cuatrimestrePath, id_usuario);
                let files = [];
                
                try {
                    // Leer los archivos de cada empleado
                    const fileNames = fs.readdirSync(empleadoPath);
                    
                    files = fileNames.map(fileName => {
                        const filePath = path.join(empleadoPath, fileName);
                        const stats = fs.statSync(filePath);
                        
                        return {
                            name: fileName,
                            size: stats.size,
                            lastModified: stats.mtime,
                            type: path.extname(fileName)
                        };
                    });
                } catch (error) {
                    console.error(`Error al leer archivos del empleado ${id_usuario}:`, error);
                }
                
                return {
                    id: id_usuario,
                    files: files
                };
            });
        
        res.json(empleadosConArchivos);
    });
});



app.get('/api/view-file/:cuatrimestre/:empleadoId/:fileName', (req, res) => {
    const { cuatrimestre, empleadoId, fileName } = req.params;
    const filePath = path.join(
        __dirname, 
        '../inser-inicio/backend/uploads/', 
        cuatrimestre, 
        empleadoId, 
        fileName
    );
    
    // Verificar si el archivo existe
    if (!fs.existsSync(filePath)) {
        return res.status(404).send('Archivo no encontrado');
    }
    
    // Obtener el tipo MIME para servir el archivo correctamente
    const mimeType = getMimeType(filePath);
    
    // Establecer el tipo de contenido y servir el archivo
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
    
    // Stream del archivo al cliente
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
});


 
     

app.post("/api/insert/register", functions.registrarUsuario);
app.put("/api/admin/update/:id", functions.actualizarUsuario);
app.delete("/api/admin/delete/:id", functions.eliminarUsuario);

app.post("/api/insert/actividad", functions.registrarActividad);
app.put("/api/admin/updateacti/:id", functions.actualizarActividad);
app.delete("/api/admin/deleteacti/:id", functions.eliminarActividad);

app.post("/api/update/informes/finalizar-cuatrimestre", functions.finalizarCuatrimestre);

app.get("/prueba", functions.prueba);



app.listen(3000 , (error)=>{
    console.log("puerto 3000");
});

