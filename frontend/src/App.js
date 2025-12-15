// frontend/src/App.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TaskForm from './components/TaskForm';
import TaskList from './components/TaskList';
import { FaDatabase, FaServer, FaReact, FaGithub } from 'react-icons/fa';
import './App.css';

// Configurar axios
axios.defaults.baseURL = 'http://localhost:5000';
axios.defaults.timeout = 10000; // 10 segundos

function App() {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [backendStatus, setBackendStatus] = useState('checking');
    const [dbStatus, setDbStatus] = useState('checking');

    // Verificar estado del backend y base de datos
    const checkSystemStatus = async () => {
        try {
            setBackendStatus('checking');
            const healthResponse = await axios.get('/health');
            
            if (healthResponse.data.database === 'connected') {
                setDbStatus('connected');
                setBackendStatus('connected');
            } else {
                setDbStatus('disconnected');
                setBackendStatus('connected');
            }
            
            return true;
        } catch (err) {
            setBackendStatus('disconnected');
            setDbStatus('disconnected');
            setError('No se puede conectar con el servidor backend');
            return false;
        }
    };

    // Obtener todas las tareas
    const fetchTasks = async () => {
        try {
            setLoading(true);
            setError('');
            
            const isHealthy = await checkSystemStatus();
            if (!isHealthy) {
                setLoading(false);
                return;
            }
            
            const response = await axios.get('/tasks');
            setTasks(response.data);
        } catch (err) {
            console.error('Error al obtener tareas:', err);
            
            if (err.code === 'ECONNABORTED') {
                setError('El servidor está tardando demasiado. Verifica que esté corriendo.');
            } else if (err.response?.status === 404) {
                setError('Endpoint no encontrado. Verifica la URL del backend.');
            } else if (!err.response) {
                setError('No se puede conectar con el servidor. Asegúrate de que el backend esté corriendo en el puerto 5000.');
            } else {
                setError(`Error ${err.response.status}: ${err.response.data?.error || 'Error desconocido'}`);
            }
        } finally {
            setLoading(false);
        }
    };

    // Cargar tareas al iniciar
    useEffect(() => {
        fetchTasks();
    }, []);

    // Agregar nueva tarea
    const handleAddTask = async (title) => {
        try {
            const response = await axios.post('/tasks', { title });
            setTasks([response.data, ...tasks]);
            return response.data;
        } catch (err) {
            console.error('Error al agregar tarea:', err);
            throw new Error('No se pudo agregar la tarea. Verifica la conexión.');
        }
    };

    // Actualizar tarea
    const handleUpdateTask = async (id, updatedData) => {
        try {
            const response = await axios.put(`/tasks/${id}`, updatedData);
            setTasks(tasks.map(task => 
                task.id === id ? response.data : task
            ));
            return response.data;
        } catch (err) {
            console.error('Error al actualizar tarea:', err);
            throw new Error('No se pudo actualizar la tarea.');
        }
    };

    // Eliminar tarea
    const handleDeleteTask = async (id) => {
        try {
            await axios.delete(`/tasks/${id}`);
            setTasks(tasks.filter(task => task.id !== id));
        } catch (err) {
            console.error('Error al eliminar tarea:', err);
            throw new Error('No se pudo eliminar la tarea.');
        }
    };

    // Refrescar datos
    const handleRefresh = () => {
        setError('');
        fetchTasks();
    };

    return (
        <div className="app">
            {/* Header */}
            <header className="app-header">
                <div className="header-content">
                    <h1>
                        <span className="app-icon">📋</span>
                        To-Do List App
                    </h1>
                    <p className="app-subtitle">
                        Aplicación Full Stack con React, Node.js y MySQL
                    </p>
                </div>

                {/* Status Indicators */}
                <div className="status-container">
                    <div className="status-item">
                        <div className={`status-dot ${backendStatus}`}></div>
                        <span className="status-text">
                            <FaServer /> Backend: 
                            {backendStatus === 'connected' ? ' Conectado' : 
                             backendStatus === 'disconnected' ? ' Desconectado' : 
                             ' Verificando...'}
                        </span>
                    </div>
                    
                    <div className="status-item">
                        <div className={`status-dot ${dbStatus}`}></div>
                        <span className="status-text">
                            <FaDatabase /> MySQL: 
                            {dbStatus === 'connected' ? ' Conectado' : 
                             dbStatus === 'disconnected' ? ' Desconectado' : 
                             ' Verificando...'}
                        </span>
                    </div>

                    <button 
                        onClick={handleRefresh}
                        className="btn-refresh"
                        title="Actualizar datos"
                    >
                        🔄 Actualizar
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="app-main">
                <div className="container">
                    {/* Error Banner */}
                    {error && (
                        <div className="error-banner">
                            <div className="error-content">
                                <span className="error-icon">⚠️</span>
                                <span className="error-text">{error}</span>
                            </div>
                            <button 
                                onClick={handleRefresh}
                                className="btn-banner-retry"
                            >
                                Reintentar conexión
                            </button>
                        </div>
                    )}

                    {/* Tech Stack Info */}
                    <div className="tech-stack">
                        <div className="tech-item">
                            <div className="tech-icon react">
                                <FaReact />
                            </div>
                            <div className="tech-info">
                                <h4>Frontend</h4>
                                <p>React 18 + Axios</p>
                            </div>
                        </div>
                        
                        <div className="tech-item">
                            <div className="tech-icon node">
                                <FaServer />
                            </div>
                            <div className="tech-info">
                                <h4>Backend</h4>
                                <p>Node.js + Express</p>
                            </div>
                        </div>
                        
                        <div className="tech-item">
                            <div className="tech-icon mysql">
                                <FaDatabase />
                            </div>
                            <div className="tech-info">
                                <h4>Base de Datos</h4>
                                <p>MySQL 8.0</p>
                            </div>
                        </div>
                    </div>

                    {/* Task Form Card */}
                    <div className="card">
                        <div className="card-header">
                            <h2>➕ Agregar Nueva Tarea</h2>
                            <small>Las tareas se guardan en la base de datos MySQL</small>
                        </div>
                        <TaskForm onAddTask={handleAddTask} />
                    </div>

                    {/* Task List Card */}
                    <div className="card">
                        <div className="card-header">
                            <h2>📄 Lista de Tareas</h2>
                            <small>
                                {tasks.length} tareas en total • 
                                {tasks.filter(t => !t.completed).length} pendientes • 
                                {tasks.filter(t => t.completed).length} completadas
                            </small>
                        </div>
                        <TaskList
                            tasks={tasks}
                            onDeleteTask={handleDeleteTask}
                            onUpdateTask={handleUpdateTask}
                            loading={loading}
                            error={error}
                        />
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="app-footer">
                <div className="footer-content">
                    <div className="footer-section">
                        <h4>To-Do List App</h4>
                        <p>Aplicación Full Stack de ejemplo</p>
                        <p>Base de datos: MySQL</p>
                    </div>
                    
                    <div className="footer-section">
                        <h4>Tecnologías</h4>
                        <ul>
                            <li>React 18</li>
                            <li>Node.js + Express</li>
                            <li>MySQL 8.0</li>
                            <li>Axios + REST API</li>
                        </ul>
                    </div>
                    
                    <div className="footer-section">
                        <h4>Características</h4>
                        <ul>
                            <li>CRUD completo</li>
                            <li>Base de datos persistente</li>
                            <li>Interfaz responsive</li>
                            <li>Manejo de errores</li>
                        </ul>
                    </div>
                </div>
                
                <div className="footer-bottom">
                    <p>© 2024 To-Do List App • Full Stack con MySQL</p>
                    <button 
                        className="btn-github"
                        onClick={() => window.open('https://github.com', '_blank')}
                    >
                        <FaGithub /> Ver en GitHub
                    </button>
                </div>
            </footer>
        </div>
    );
}

export default App;