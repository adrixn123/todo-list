// backend/index.js
const express = require("express");
const cors = require("cors");
const db = require("./database/database");

const app = express();
const PORT = process.env.PORT || 5000;

// Parsear JSON
app.use(express.json());

// Configurar CORS
app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true); // Permite Postman o curl
    // Permitir localhost y cualquier subdominio de Netlify
    if (
      origin.startsWith("http://localhost") || 
      origin.endsWith(".netlify.app")
    ) {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.options("*", cors());

// -------------------- RUTAS -------------------- //

// Obtener todas las tareas
app.get("/tasks", async (req, res) => {
  try {
    const tasks = await db.query("SELECT * FROM tasks");
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Crear nueva tarea
app.post("/tasks", async (req, res) => {
  const { title } = req.body;
  if (!title) return res.status(400).json({ error: "El título es obligatorio" });

  try {
    const result = await db.query("INSERT INTO tasks (title) VALUES (?)", [title]);
    const [newTask] = await db.query("SELECT * FROM tasks WHERE id = ?", [result.insertId]);
    res.status(201).json(newTask);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Editar tarea
app.put("/tasks/:id", async (req, res) => {
  const { id } = req.params;
  const { title, completed } = req.body;

  try {
    await db.query(
      "UPDATE tasks SET title = ?, completed = ? WHERE id = ?",
      [title, completed ? 1 : 0, id]
    );
    const [updatedTask] = await db.query("SELECT * FROM tasks WHERE id = ?", [id]);
    res.json(updatedTask);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Eliminar tarea
app.delete("/tasks/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query("DELETE FROM tasks WHERE id = ?", [id]);
    res.json({ message: "Tarea eliminada correctamente", deleted: result.affectedRows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Ruta de salud (health check)
app.get("/health", async (req, res) => {
  try {
    await db.query("SELECT 1 as status");
    res.json({
      status: "healthy",
      database: "connected",
      timestamp: new Date().toISOString(),
      message: "Backend funcionando correctamente"
    });
  } catch (error) {
    res.status(500).json({
      status: "unhealthy",
      database: "disconnected",
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Información de la API
app.get("/info", (req, res) => {
  res.json({
    name: "Todo List API",
    version: "1.0.0",
    status: "running",
    database: "MySQL Railway",
    endpoints: {
      tasks: "/tasks",
      health: "/health"
    }
  });
});

// -------------------- INICIO DEL SERVIDOR -------------------- //
app.listen(PORT, () => {
  console.log(`🚀 Backend corriendo en http://localhost:${PORT}`);
  console.log(`🌐 Accesible en producción vía Railway`);
});
