// src/common/components/AuthModal/AuthModal.jsx
import React, { useState } from 'react';
import { X } from 'lucide-react';
import Login from './Login.jsx';
import Register from './Register.jsx';
import "./AuthModal.scss"

const AuthModal = ({ isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState('login');

    if (!isOpen) return null;

    return (
        <div className="auth-modal-overlay" onClick={onClose}>
            <div className="auth-modal-container" onClick={e => e.stopPropagation()}>
                <button
                    onClick={onClose}
                    className="auth-modal-close"
                >
                    <X size={20} />
                </button>

                <div className="auth-modal-tabs">
                    <button
                        className={`auth-modal-tab ${activeTab === 'login' ? 'active' : ''}`}
                        onClick={() => setActiveTab('login')}
                    >
                        Login
                    </button>
                    <button
                        className={`auth-modal-tab ${activeTab === 'register' ? 'active' : ''}`}
                        onClick={() => setActiveTab('register')}
                    >
                        Register
                    </button>
                </div>

                <div className="auth-modal-content">
                    {activeTab === 'login' ? (
                        <Login onClose={onClose} />
                    ) : (
                        <Register onClose={onClose} />
                    )}
                </div>
            </div>
        </div>
    );
};

export default AuthModal;