// src/components/NavBar/NavBar.jsx
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { ExternalLink, LogIn } from 'lucide-react';
import { selectIsAuthenticated, selectCurrentUser, logout } from '../../../features/auth/redux/authSlice';
import AuthModal from '../../../features/auth/components/AuthModal/AuthModal';
import "./NavBar.scss";
import { selectSubscriptionStatus } from "../../../features/subscription/redux/subscriptionSlice.js";

const ProfileAvatar = ({ user }) => {
    if (user?.photoURL) {
        return (
            <img
                src={user.photoURL}
                alt={`${user.firstName}'s profile`}
                className="profile-avatar"
            />
        );
    }

    // If no photo, show initials
    const initials = user?.firstName && user?.lastName
        ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
        : user?.firstName?.[0]?.toUpperCase() || 'U';

    return (
        <div className="profile-initials">
            {initials}
        </div>
    );
};

const NavBar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

    const isAuthenticated = useSelector(selectIsAuthenticated);
    const user = useSelector(selectCurrentUser);
    const subscriptionStatus = useSelector(selectSubscriptionStatus);

    const handleLogout = () => {
        dispatch(logout());
        navigate('/');
    };

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <div className="navbar-logo">
                    <Link to="/" className="logo-link">TurTrack Manager</Link>
                </div>
                <ul className="navbar-links">
                    <li>
                        <Link
                            to="/"
                            className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
                        >
                            Jobs
                        </Link>
                    </li>
                    <li>
                        <a
                            href="http://localhost:8080/ui/clusters"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="nav-link"
                        >
                            Kafka UI
                            <ExternalLink className="external-link-icon" size={16} />
                        </a>
                    </li>
                    {isAuthenticated && (
                        <li>
                            <Link
                                to="/subscription"
                                className={`nav-link ${location.pathname.startsWith('/subscription') ? 'active' : ''}`}
                            >
                                {subscriptionStatus === 'active' ? 'Manage Subscription' : 'Subscribe'}
                            </Link>
                        </li>
                    )}
                    {isAuthenticated && (
                        <li>
                            <Link
                                to="/pricing"
                                className={`nav-link ${location.pathname.startsWith('/pricing') ? 'active' : ''}`}
                            >
                                Pricing
                            </Link>
                        </li>
                    )}
                </ul>
                <div className="navbar-auth">
                    {isAuthenticated ? (
                        <button
                            onClick={handleLogout}
                            className="profile-button"
                        >
                            <ProfileAvatar user={user} />
                            <span>{user?.firstName || 'Profile'}</span>
                        </button>
                    ) : (
                        <button
                            onClick={() => setIsAuthModalOpen(true)}
                            className="auth-button"
                        >
                            <LogIn />
                            <span>Sign In</span>
                        </button>
                    )}
                </div>
            </div>

            <AuthModal
                isOpen={isAuthModalOpen}
                onClose={() => setIsAuthModalOpen(false)}
            />
        </nav>
    );
};

export default NavBar;
