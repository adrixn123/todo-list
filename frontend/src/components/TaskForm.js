// frontend/src/components/TaskForm.js
import React, { useState } from 'react';
import { FaPlus, FaSpinner } from 'react-icons/fa';

function TaskForm({ onAddTask }) {
    const [title, setTitle] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!title.trim()) {
            setError('Por favor, escribe una tarea');
            return;
        }

        setLoading(true);
        setError('');
        
        try {
            await onAddTask(title);
            setTitle('');
            setError('');
        } catch (err) {
            setError('Error al agregar tarea. Intenta de nuevo.');
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !loading) {
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
                    placeholder="¿Qué necesitas hacer hoy?"
                    className={`task-input ${error ? 'error' : ''}`}
                    disabled={loading}
                    maxLength={200}
                />
                
                <button 
                    type="submit" 
                    className="btn-add"
                    disabled={loading || !title.trim()}
                    title="Agregar tarea"
                >
                    {loading ? (
                        <FaSpinner className="spinner-icon" />
                    ) : (
                        <FaPlus />
                    )}
                    <span>{loading ? 'Agregando...' : 'Agregar'}</span>
                </button>
            </div>
            
            {error && (
                <div className="error-message">
                    ⚠️ {error}
                </div>
            )}
            
            <div className="form-info">
                <small>
                    {title.length}/200 caracteres • Presiona Enter para agregar
                </small>
            </div>
        </form>
    );
}

export default TaskForm;