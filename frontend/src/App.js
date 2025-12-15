
// frontend/src/App.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TaskForm from './components/TaskForm';
import TaskList from './components/TaskList';
import { FaDatabase, FaServer, FaReact, FaGithub, FaSync } from 'react-icons/fa';
import './App.css';

// ==================== CONFIGURACIÓN DE AXIOS ====================
// IMPORTANTE: Para producción, necesitas desplegar el backend primero
const isDevelopment = process.env.NODE_ENV === 'development';
const API_URL = isDevelopment 
  ? 'http://localhost:5000'  // Para desarrollo local
  : process.env.REACT_APP_API_URL || 'https://todo-list-ggr1.onrender.com'; // CAMBIA ESTA URL

console.log('🔧 Entorno:', process.env.NODE_ENV);
console.log('🌐 API URL:', API_URL);
console.log('📡 Backend configurado para:', API_URL);

// Configurar axios globalmente
axios.defaults.baseURL = API_URL;
axios.defaults.timeout = 15000; // 15 segundos para producción

// Interceptor para logging
axios.interceptors.request.use(config => {
  console.log(`📤 ${config.method?.toUpperCase()} ${config.url}`);
  return config;
}, error => {
  console.error('❌ Error en petición:', error);
  return Promise.reject(error);
});

axios.interceptors.response.use(response => {
  console.log(`📥 ${response.status} ${response.config.url}`);
  return response;
}, error => {
  console.error('❌ Error en respuesta:', error.message);
  return Promise.reject(error);
});

// ==================== COMPONENTE PRINCIPAL ====================
function App() {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [backendStatus, setBackendStatus] = useState('checking');
    const [dbStatus, setDbStatus] = useState('checking');
    const [apiUrl, setApiUrl] = useState(API_URL);

    // Verificar estado del backend y base de datos
    const checkSystemStatus = async () => {
        try {
            setBackendStatus('checking');
            console.log('🔄 Verificando estado del backend en:', API_URL);
            
            const healthResponse = await axios.get('/health');
            console.log('✅ Respuesta de health:', healthResponse.data);
            
            if (healthResponse.data.database === 'connected') {
                setDbStatus('connected');
                setBackendStatus('connected');
                setError('');
            } else {
                setDbStatus('disconnected');
                setBackendStatus('connected');
                setError('Base de datos desconectada');
            }
            
            return true;
        } catch (err) {
            console.error('❌ Error verificando estado:', err);
            
            if (err.code === 'ECONNABORTED') {
                setError(`Timeout: El backend no responde en ${API_URL}`);
            } else if (err.response) {
                setError(`Error ${err.response.status}: ${err.response.data?.error || 'Error del servidor'}`);
            } else if (err.request) {
                setError(`No se pudo conectar con el backend en ${API_URL}. Verifica que esté desplegado.`);
            } else {
                setError(`Error: ${err.message}`);
            }
            
            setBackendStatus('disconnected');
            setDbStatus('disconnected');
            return false;
        }
    };

    // Obtener todas las tareas
    const fetchTasks = async () => {
        try {
            setLoading(true);
            setError('');
            
            console.log('📥 Obteniendo tareas de:', API_URL + '/tasks');
            const isHealthy = await checkSystemStatus();
            
            if (!isHealthy) {
                console.log('⚠️  Backend no saludable, omitiendo fetch de tareas');
                setLoading(false);
                return;
            }
            
            const response = await axios.get('/tasks');
            console.log(`✅ ${response.data.length} tareas obtenidas`);
            setTasks(response.data);
        } catch (err) {
            console.error('❌ Error al obtener tareas:', err);
            
            if (err.code === 'ECONNABORTED') {
                setError('Timeout: El servidor está tardando demasiado.');
            } else if (err.response?.status === 404) {
                setError('Endpoint no encontrado. Verifica la configuración del backend.');
            } else if (!err.response) {
                setError(`No se puede conectar con el servidor en ${API_URL}`);
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
            console.log('➕ Agregando tarea:', title);
            const response = await axios.post('/tasks', { title });
            console.log('✅ Tarea agregada:', response.data);
            setTasks([response.data, ...tasks]);
            return response.data;
        } catch (err) {
            console.error('❌ Error al agregar tarea:', err);
            const errorMsg = err.response?.data?.error || 'No se pudo agregar la tarea. Verifica la conexión.';
            throw new Error(errorMsg);
        }
    };

    // Actualizar tarea
    const handleUpdateTask = async (id, updatedData) => {
        try {
            console.log(`✏️ Actualizando tarea ${id}:`, updatedData);
            const response = await axios.put(`/tasks/${id}`, updatedData);
            console.log('✅ Tarea actualizada:', response.data);
            setTasks(tasks.map(task => 
                task.id === id ? response.data : task
            ));
            return response.data;
        } catch (err) {
            console.error(`❌ Error al actualizar tarea ${id}:`, err);
            const errorMsg = err.response?.data?.error || 'No se pudo actualizar la tarea.';
            throw new Error(errorMsg);
        }
    };

    // Eliminar tarea
    const handleDeleteTask = async (id) => {
        try {
            console.log(`🗑️ Eliminando tarea ${id}`);
            await axios.delete(`/tasks/${id}`);
            console.log('✅ Tarea eliminada');
            setTasks(tasks.filter(task => task.id !== id));
        } catch (err) {
            console.error(`❌ Error al eliminar tarea ${id}:`, err);
            const errorMsg = err.response?.data?.error || 'No se pudo eliminar la tarea.';
            throw new Error(errorMsg);
        }
    };

    // Refrescar datos
    const handleRefresh = () => {
        console.log('🔄 Refrescando datos...');
        setError('');
        fetchTasks();
    };

    // Cambiar URL del backend manualmente (para debugging)
    const handleChangeBackendUrl = () => {
        const newUrl = window.prompt('Introduce la nueva URL del backend:', apiUrl);
        if (newUrl && newUrl !== apiUrl) {
            setApiUrl(newUrl);
            axios.defaults.baseURL = newUrl;
            console.log('🔧 URL del backend cambiada a:', newUrl);
            handleRefresh();
        }
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
                        Aplicación Full Stack con React, Node.js y MySQL en Railway
                    </p>
                    
                    <div className="environment-badge">
                        {isDevelopment ? '🛠️ DESARROLLO' : '🚀 PRODUCCIÓN'}
                        <small>Backend: {API_URL}</small>
                    </div>
                </div>

                {/* Status Indicators */}
                <div className="status-container">
                    <div className="status-item">
                        <div className={`status-dot ${backendStatus}`}></div>
                        <span className="status-text">
                            <FaServer /> Backend: 
                            {backendStatus === 'connected' ? ' ✅ Conectado' : 
                             backendStatus === 'disconnected' ? ' ❌ Desconectado' : 
                             ' 🔄 Verificando...'}
                        </span>
                    </div>
                    
                    <div className="status-item">
                        <div className={`status-dot ${dbStatus}`}></div>
                        <span className="status-text">
                            <FaDatabase /> MySQL Railway: 
                            {dbStatus === 'connected' ? ' ✅ Conectado' : 
                             dbStatus === 'disconnected' ? ' ❌ Desconectado' : 
                             ' 🔄 Verificando...'}
                        </span>
                    </div>

                    <div className="action-buttons">
                        <button 
                            onClick={handleRefresh}
                            className="btn-refresh"
                            title="Actualizar datos"
                        >
                            <FaSync /> Actualizar
                        </button>
                        
                        <button 
                            onClick={handleChangeBackendUrl}
                            className="btn-config"
                            title="Cambiar URL del backend"
                        >
                            🔧 Configurar
                        </button>
                    </div>
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
                                <div className="error-details">
                                    <span className="error-text">{error}</span>
                                    <small className="error-url">
                                        URL intentada: {API_URL}
                                    </small>
                                </div>
                            </div>
                            <div className="error-actions">
                                <button 
                                    onClick={handleRefresh}
                                    className="btn-banner-retry"
                                >
                                    🔄 Reintentar
                                </button>
                                <button 
                                    onClick={() => window.open('https://railway.app', '_blank')}
                                    className="btn-railway"
                                >
                                    🚂 Ver Railway
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Deployment Instructions */}
                    {!isDevelopment && backendStatus === 'disconnected' && (
                        <div className="deploy-instructions">
                            <h3>🚀 ¿Primer despliegue?</h3>
                            <p>Tu frontend está en Netlify, pero necesitas desplegar el backend:</p>
                            <ol>
                                <li>Despliega tu backend en Railway o Render</li>
                                <li>Actualiza <code>REACT_APP_API_URL</code> en Netlify</li>
                                <li>Configura CORS en tu backend para permitir Netlify</li>
                            </ol>
                            <div className="instruction-links">
                                <button onClick={() => window.open('https://railway.app', '_blank')}>
                                    🚂 Desplegar en Railway
                                </button>
                                <button onClick={() => window.open('https://render.com', '_blank')}>
                                    🌐 Desplegar en Render
                                </button>
                            </div>
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
                                <small>Host: Netlify</small>
                            </div>
                        </div>
                        
                        <div className="tech-item">
                            <div className="tech-icon node">
                                <FaServer />
                            </div>
                            <div className="tech-info">
                                <h4>Backend</h4>
                                <p>Node.js + Express</p>
                                <small>
                                    {isDevelopment ? 'Local:5000' : 'Railway/Render'}
                                </small>
                            </div>
                        </div>
                        
                        <div className="tech-item">
                            <div className="tech-icon mysql">
                                <FaDatabase />
                            </div>
                            <div className="tech-info">
                                <h4>Base de Datos</h4>
                                <p>MySQL 8.0</p>
                                <small>Railway Cloud</small>
                            </div>
                        </div>
                    </div>

                    {/* Task Form Card */}
                    <div className="card">
                        <div className="card-header">
                            <h2>➕ Agregar Nueva Tarea</h2>
                            <small>
                                Las tareas se guardan en MySQL en Railway
                                {backendStatus === 'disconnected' && 
                                    ' (Backend desconectado - modo demostración)'}
                            </small>
                        </div>
                        <TaskForm 
                            onAddTask={handleAddTask} 
                            disabled={backendStatus === 'disconnected'}
                        />
                    </div>

                    {/* Task List Card */}
                    <div className="card">
                        <div className="card-header">
                            <h2>📄 Lista de Tareas</h2>
                            <small>
                                {backendStatus === 'connected' ? (
                                    <>
                                        {tasks.length} tareas en total • 
                                        {tasks.filter(t => !t.completed).length} pendientes • 
                                        {tasks.filter(t => t.completed).length} completadas
                                    </>
                                ) : (
                                    'Modo demostración - Conecta el backend para ver tareas reales'
                                )}
                            </small>
                        </div>
                        <TaskList
                            tasks={tasks}
                            onDeleteTask={handleDeleteTask}
                            onUpdateTask={handleUpdateTask}
                            loading={loading}
                            error={error}
                            backendConnected={backendStatus === 'connected'}
                        />
                    </div>

                    {/* Backend Configuration Help */}
                    <div className="config-help">
                        <h3>🔧 Configuración necesaria</h3>
                        <div className="config-steps">
                            <div className="step">
                                <div className="step-number">1</div>
                                <div className="step-content">
                                    <h4>Desplegar Backend</h4>
                                    <p>Sube tu backend a Railway o Render</p>
                                    <code>cd backend && git push railway main</code>
                                </div>
                            </div>
                            <div className="step">
                                <div className="step-number">2</div>
                                <div className="step-content">
                                    <h4>Configurar CORS</h4>
                                    <p>Permite tu dominio de Netlify en el backend</p>
                                    <code>origin: ['https://tudominio.netlify.app']</code>
                                </div>
                            </div>
                            <div className="step">
                                <div className="step-number">3</div>
                                <div className="step-content">
                                    <h4>Actualizar Variables</h4>
                                    <p>En Netlify, agrega REACT_APP_API_URL</p>
                                    <code>REACT_APP_API_URL=https://tu-backend.railway.app</code>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="app-footer">
                <div className="footer-content">
                    <div className="footer-section">
                        <h4>To-Do List App</h4>
                        <p>Aplicación Full Stack de ejemplo</p>
                        <p>Base de datos: MySQL en Railway</p>
                        <p>Frontend: Netlify</p>
                    </div>
                    
                    <div className="footer-section">
                        <h4>Tecnologías</h4>
                        <ul>
                            <li>React 18 - Netlify</li>
                            <li>Node.js + Express - Railway</li>
                            <li>MySQL 8.0 - Railway</li>
                            <li>Axios + REST API</li>
                        </ul>
                    </div>
                    
                    <div className="footer-section">
                        <h4>Enlaces útiles</h4>
                        <ul>
                            <li>
                                <button 
                                    onClick={() => window.open('https://railway.app', '_blank')}
                                    className="footer-link"
                                >
                                    🚂 Railway (Backend)
                                </button>
                            </li>
                            <li>
                                <button 
                                    onClick={() => window.open('https://netlify.com', '_blank')}
                                    className="footer-link"
                                >
                                    🌐 Netlify (Frontend)
                                </button>
                            </li>
                            <li>
                                <button 
                                    onClick={() => window.open('https://github.com', '_blank')}
                                    className="footer-link"
                                >
                                    💻 Código en GitHub
                                </button>
                            </li>
                        </ul>
                    </div>
                </div>
                
                <div className="footer-bottom">
                    <p>© 2024 To-Do List App • Full Stack con MySQL Railway</p>
                    <div className="footer-actions">
                        <button 
                            className="btn-github"
                            onClick={() => window.open('https://github.com', '_blank')}
                        >
                            <FaGithub /> GitHub
                        </button>
                        <button 
                            className="btn-deploy"
                            onClick={handleRefresh}
                        >
                            <FaSync /> Verificar conexión
                        </button>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default App;