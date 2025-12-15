// frontend/src/components/TaskList.js
import React from 'react';
import TaskItem from './TaskItem';
import { FaClipboardList, FaCheckCircle, FaListAlt } from 'react-icons/fa';

function TaskList({ tasks, onDeleteTask, onUpdateTask, loading, error }) {
    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner-large"></div>
                <p>Cargando tareas...</p>
                <small>Conectando con la base de datos...</small>
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-container">
                <div className="error-icon">⚠️</div>
                <h3>Error al cargar tareas</h3>
                <p>{error}</p>
                <button 
                    onClick={() => window.location.reload()} 
                    className="btn-retry"
                >
                    Reintentar
                </button>
            </div>
        );
    }

    if (tasks.length === 0) {
        return (
            <div className="empty-state">
                <div className="empty-icon">
                    <FaClipboardList />
                </div>
                <h3>¡No hay tareas pendientes!</h3>
                <p>Agrega tu primera tarea usando el formulario de arriba.</p>
                <small>Las tareas se guardan en MySQL y persisten después de reiniciar.</small>
            </div>
        );
    }

    // Separar tareas completadas y pendientes
    const pendingTasks = tasks.filter(task => !task.completed);
    const completedTasks = tasks.filter(task => task.completed);

    return (
        <div className="task-list">
            {pendingTasks.length > 0 && (
                <div className="tasks-section">
                    <h3 className="section-title">
                        <FaListAlt /> Pendientes ({pendingTasks.length})
                    </h3>
                    <div className="tasks-grid">
                        {pendingTasks.map(task => (
                            <TaskItem
                                key={task.id}
                                task={task}
                                onDelete={onDeleteTask}
                                onUpdate={onUpdateTask}
                            />
                        ))}
                    </div>
                </div>
            )}

            {completedTasks.length > 0 && (
                <div className="tasks-section">
                    <h3 className="section-title">
                        <FaCheckCircle /> Completadas ({completedTasks.length})
                    </h3>
                    <div className="tasks-grid">
                        {completedTasks.map(task => (
                            <TaskItem
                                key={task.id}
                                task={task}
                                onDelete={onDeleteTask}
                                onUpdate={onUpdateTask}
                            />
                        ))}
                    </div>
                </div>
            )}

            <div className="stats-summary">
                <div className="stat-item">
                    <span className="stat-label">Total:</span>
                    <span className="stat-value">{tasks.length}</span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">Pendientes:</span>
                    <span className="stat-value pending">{pendingTasks.length}</span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">Completadas:</span>
                    <span className="stat-value completed">{completedTasks.length}</span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">Porcentaje:</span>
                    <span className="stat-value">
                        {tasks.length > 0 
                            ? `${Math.round((completedTasks.length / tasks.length) * 100)}%`
                            : '0%'
                        }
                    </span>
                </div>
            </div>
        </div>
    );
}

export default TaskList;