import React, { useState } from 'react';
import { FaPlus, FaSpinner, FaExclamationTriangle } from 'react-icons/fa';

function TaskForm({ onAddTask, disabled }) {
    const [title, setTitle] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (disabled) {
            setError('Backend desconectado. No se pueden agregar tareas.');
            return;
        }

        if (!title.trim()) {
            setError('Por favor, escribe una tarea');
            return;
        }

        setLoading(true);
        setError('');
        
        try {
            await onAddTask(title);
            setTitle('');
        } catch (err) {
            setError(err.message || 'Error al agregar tarea');
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !loading && !disabled) {
            handleSubmit(e);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="task-form">
            <div className="form-group">
                <input
                    type="text"
                    value={title}
                    onChange={(e) => {
                        setTitle(e.target.value);
                        setError('');
                    }}
                    onKeyPress={handleKeyPress}
                    placeholder={disabled ? "Backend desconectado..." : "¿Qué necesitas hacer hoy?"}
                    className={`task-input ${error ? 'error' : ''} ${disabled ? 'disabled' : ''}`}
                    disabled={loading || disabled}
                    maxLength={200}
                />
                
                <button 
                    type="submit" 
                    className={`btn-add ${disabled ? 'disabled' : ''}`}
                    disabled={loading || !title.trim() || disabled}
                    title={disabled ? "Conecta el backend primero" : "Agregar tarea"}
                >
                    {disabled ? (
                        <FaExclamationTriangle />
                    ) : loading ? (
                        <FaSpinner className="spinner-icon" />
                    ) : (
                        <FaPlus />
                    )}
                    <span>
                        {disabled ? 'Desconectado' : 
                         loading ? 'Agregando...' : 'Agregar'}
                    </span>
                </button>
            </div>
            
            {error && (
                <div className="error-message">
                    {disabled ? <FaExclamationTriangle /> : '⚠️'} {error}
                </div>
            )}
            
            <div className="form-info">
                <small>
                    {disabled ? '🔌 Conecta el backend para habilitar' : 
                     `${title.length}/200 caracteres • Presiona Enter para agregar`}
                </small>
            </div>
        </form>
    );
}

export default TaskForm;