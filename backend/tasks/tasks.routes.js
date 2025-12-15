// backend/tasks/tasks.routes.js
const express = require('express');
const router = express.Router();
const db = require('../database/database');

// 📋 OBTENER TODAS LAS TAREAS
router.get('/', async (req, res) => {
    try {
        console.log('📥 Solicitando todas las tareas...');
        const tasks = await db.query('SELECT * FROM tasks ORDER BY created_at DESC');
        console.log(`✅ ${tasks.length} tareas encontradas`);
        res.json(tasks);
    } catch (error) {
        console.error('❌ Error al obtener tareas:', error);
        res.status(500).json({ 
            error: 'Error del servidor',
            message: error.message 
        });
    }
});

// 🔍 OBTENER UNA TAREA POR ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`📥 Buscando tarea con ID: ${id}`);
        
        const task = await db.getOne('SELECT * FROM tasks WHERE id = ?', [id]);
        
        if (!task) {
            console.log(`❌ Tarea ${id} no encontrada`);
            return res.status(404).json({ error: 'Tarea no encontrada' });
        }
        
        console.log(`✅ Tarea ${id} encontrada: ${task.title}`);
        res.json(task);
    } catch (error) {
        console.error(`❌ Error al buscar tarea ${id}:`, error);
        res.status(500).json({ error: error.message });
    }
});

// ➕ CREAR UNA NUEVA TAREA
router.post('/', async (req, res) => {
    try {
        const { title } = req.body;
        console.log('📝 Creando nueva tarea:', title);
        
        if (!title || title.trim() === '') {
            console.log('❌ Título vacío recibido');
            return res.status(400).json({ error: 'El título es requerido' });
        }
        
        const sql = 'INSERT INTO tasks (title) VALUES (?)';
        const result = await db.query(sql, [title.trim()]);
        
        // Obtener la tarea recién creada
        const newTask = await db.getOne('SELECT * FROM tasks WHERE id = ?', [result.insertId]);
        
        console.log(`✅ Tarea creada con ID: ${newTask.id}`);
        res.status(201).json(newTask);
    } catch (error) {
        console.error('❌ Error al crear tarea:', error);
        res.status(500).json({ error: error.message });
    }
});

// ✏️ ACTUALIZAR UNA TAREA
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, completed } = req.body;
        
        console.log(`✏️ Actualizando tarea ${id}:`, { title, completed });
        
        // Verificar si la tarea existe
        const task = await db.getOne('SELECT * FROM tasks WHERE id = ?', [id]);
        if (!task) {
            console.log(`❌ Tarea ${id} no encontrada para actualizar`);
            return res.status(404).json({ error: 'Tarea no encontrada' });
        }
        
        // Preparar datos para actualizar
        const updateData = {};
        if (title !== undefined) updateData.title = title;
        if (completed !== undefined) updateData.completed = completed;
        
        // Construir SQL dinámicamente
        const setClause = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
        const values = [...Object.values(updateData), id];
        
        const sql = `UPDATE tasks SET ${setClause} WHERE id = ?`;
        await db.query(sql, values);
        
        // Obtener la tarea actualizada
        const updatedTask = await db.getOne('SELECT * FROM tasks WHERE id = ?', [id]);
        
        console.log(`✅ Tarea ${id} actualizada correctamente`);
        res.json(updatedTask);
    } catch (error) {
        console.error(`❌ Error al actualizar tarea ${id}:`, error);
        res.status(500).json({ error: error.message });
    }
});

// 🗑️ ELIMINAR UNA TAREA
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`🗑️ Eliminando tarea ${id}...`);
        
        // Verificar si la tarea existe
        const task = await db.getOne('SELECT * FROM tasks WHERE id = ?', [id]);
        if (!task) {
            console.log(`❌ Tarea ${id} no encontrada para eliminar`);
            return res.status(404).json({ error: 'Tarea no encontrada' });
        }
        
        await db.query('DELETE FROM tasks WHERE id = ?', [id]);
        
        console.log(`✅ Tarea ${id} eliminada: "${task.title}"`);
        res.json({ 
            message: 'Tarea eliminada correctamente',
            deletedTask: task 
        });
    } catch (error) {
        console.error(`❌ Error al eliminar tarea ${id}:`, error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
