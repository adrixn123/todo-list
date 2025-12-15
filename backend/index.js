// index.js
const express = require("express");
const cors = require("cors");
const db = require("./database/database"); // <-- tu Database.js

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

const corsOptions = {
  origin: ["http://localhost:3000"],
  methods: ["GET","POST","PUT","DELETE"],
  credentials: true
};
app.use(cors(corsOptions));

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
    const result = await db.query(
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
    const result = await db.query("DELETE FROM tasks WHERE id = ?", [id]);
    res.json({ deleted: result.affectedRows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Backend corriendo en http://localhost:${PORT}`);
});
