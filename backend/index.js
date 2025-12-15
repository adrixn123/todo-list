// =========================
// IMPORTS
// =========================
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");

// =========================
// APP CONFIG
// =========================
const app = express();
const PORT = process.env.PORT || 5000;

// =========================
// MIDDLEWARES
// =========================
app.use(express.json());

const corsOptions = {
  origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
};

app.use(cors(corsOptions));

// =========================
// DATABASE (MySQL via Railway)
// =========================
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  ssl: process.env.DB_SSL === "true",
  timezone: process.env.DB_TIMEZONE || "+00:00",
});

// Crear tabla si no existe
(async () => {
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        completed TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Tabla de tareas lista");
  } catch (err) {
    console.error("❌ Error creando tabla:", err.message);
  }
})();

// =========================
// ROUTES
// =========================

// Obtener todas las tareas
app.get("/tasks", async (req, res) => {
  try {
    const [rows] = await db.execute("SELECT * FROM tasks");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Crear nueva tarea
app.post("/tasks", async (req, res) => {
  const { title } = req.body;
  if (!title) return res.status(400).json({ error: "El título es obligatorio" });

  try {
    const [result] = await db.execute("INSERT INTO tasks (title) VALUES (?)", [title]);
    res.status(201).json({ id: result.insertId, title, completed: 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Editar tarea
app.put("/tasks/:id", async (req, res) => {
  const { id } = req.params;
  const { title, completed } = req.body;

  try {
    const [result] = await db.execute(
      "UPDATE tasks SET title = ?, completed = ? WHERE id = ?",
      [title, completed ? 1 : 0, id]
    );
    res.json({ updated: result.affectedRows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Eliminar tarea
app.delete("/tasks/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await db.execute("DELETE FROM tasks WHERE id = ?", [id]);
    res.json({ deleted: result.affectedRows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =========================
// SERVER
// =========================
app.listen(PORT, () => {
  console.log(`🚀 Backend corriendo en http://localhost:${PORT}`);
});
