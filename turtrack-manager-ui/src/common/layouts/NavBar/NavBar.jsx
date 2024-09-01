import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import "./NavBar.scss"

const NavBar = () => {
    const location = useLocation();

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <div className="navbar-logo">
                    <Link to="/" className="logo-link">TurTrack Manager</Link>
                </div>
                <ul className="navbar-links">
                    <li><Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>Jobs</Link></li>
                    <li>
                        <a
                            href="http://localhost:8080/ui/clusters"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="nav-link flex items-center"
                        >
                            Kafka UI
                            <ExternalLink className="external-link-icon" size={16} />
                        </a>
                    </li>
                    {/*<li><Link to="/jobs/create" className={`nav-link ${location.pathname === '/jobs/create' ? 'active' : ''}`}>Create Job</Link></li>*/}
                </ul>
                <div className="navbar-placeholder"></div>
            </div>
        </nav>
    );
};

export default NavBar;