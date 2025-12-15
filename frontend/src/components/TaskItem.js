// frontend/src/components/TaskItem.js
import React, { useState } from 'react';
import { 
    FaEdit, FaTrash, FaSave, FaTimes, 
    FaCheck, FaClock, FaCalendarAlt 
} from 'react-icons/fa';

function TaskItem({ task, onDelete, onUpdate }) {
    const [isEditing, setIsEditing] = useState(false);
    const [editedTitle, setEditedTitle] = useState(task.title);
    const [isCompleted, setIsCompleted] = useState(task.completed);
    const [loading, setLoading] = useState(false);

    const handleEdit = () => {
        setIsEditing(true);
        setEditedTitle(task.title);
    };

    const handleSave = async () => {
        if (!editedTitle.trim()) {
            alert('El título no puede estar vacío');
            return;
        }

        setLoading(true);
        try {
            await onUpdate(task.id, { 
                title: editedTitle.trim(),
                completed: isCompleted
            });
            setIsEditing(false);
        } catch (error) {
            console.error('Error al actualizar:', error);
            alert('Error al guardar cambios');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setEditedTitle(task.title);
        setIsCompleted(task.completed);
        setIsEditing(false);
    };

    const handleToggleComplete = async () => {
        const newCompletedState = !isCompleted;
        setIsCompleted(newCompletedState);
        
        try {
            await onUpdate(task.id, { 
                completed: newCompletedState 
            });
        } catch (error) {
            console.error('Error al actualizar estado:', error);
            setIsCompleted(!newCompletedState); // Revertir si hay error
            alert('Error al actualizar tarea');
        }
    };

    const handleDelete = async () => {
        if (window.confirm(`¿Eliminar la tarea "${task.title}"?`)) {
            try {
                await onDelete(task.id);
            } catch (error) {
                console.error('Error al eliminar:', error);
                alert('Error al eliminar tarea');
            }
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
            return `Hoy a las ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
        } else if (diffDays === 1) {
            return `Ayer a las ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
        } else {
            return date.toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    };

    return (
        <div className={`task-item ${isCompleted ? 'completed' : ''} ${isEditing ? 'editing' : ''}`}>
            <div className="task-content">
                {isEditing ? (
                    <div className="edit-mode">
                        <div className="edit-header">
                            <input
                                type="text"
                                value={editedTitle}
                                onChange={(e) => setEditedTitle(e.target.value)}
                                className="edit-input"
                                autoFocus
                                maxLength={200}
                            />
                            <small className="char-count">
                                {editedTitle.length}/200
                            </small>
                        </div>
                        
                        <div className="edit-buttons">
                            <button 
                                onClick={handleSave} 
                                className="btn-save"
                                disabled={loading || !editedTitle.trim()}
                            >
                                <FaSave /> {loading ? 'Guardando...' : 'Guardar'}
                            </button>
                            <button 
                                onClick={handleCancel} 
                                className="btn-cancel"
                                disabled={loading}
                            >
                                <FaTimes /> Cancelar
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="view-mode">
                        <div className="task-header">
                            <button 
                                className={`task-checkbox ${isCompleted ? 'checked' : ''}`}
                                onClick={handleToggleComplete}
                                title={isCompleted ? 'Marcar como pendiente' : 'Marcar como completada'}
                            >
                                {isCompleted ? <FaCheck /> : ''}
                            </button>
                            
                            <div className="task-info">
                                <h3 className="task-title">{task.title}</h3>
                                <div className="task-meta">
                                    <span className="task-date">
                                        <FaCalendarAlt /> {formatDate(task.created_at)}
                                    </span>
                                    {task.updated_at !== task.created_at && (
                                        <span className="task-updated">
                                            <FaClock /> Editada: {formatDate(task.updated_at)}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        <div className="task-actions">
                            <button 
                                onClick={handleEdit} 
                                className="btn-edit"
                                title="Editar tarea"
                            >
                                <FaEdit /> Editar
                            </button>
                            <button 
                                onClick={handleDelete} 
                                className="btn-delete"
                                title="Eliminar tarea"
                            >
                                <FaTrash /> Eliminar
                            </button>
                        </div>
                    </div>
                )}
            </div>
            
            <div className="task-status">
                {isCompleted ? (
                    <span className="status-badge completed-badge">
                        <FaCheck /> Completada
                    </span>
                ) : (
                    <span className="status-badge pending-badge">
                        <FaClock /> Pendiente
                    </span>
                )}
            </div>
        </div>
    );
}

export default TaskItem;