import { Link, useLocation } from 'react-router-dom';
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
                    <li><Link to="/kafka-ui" className={`nav-link ${location.pathname === '/kafka-ui' ? 'active' : ''}`}>Kafka UI</Link></li>
                    {/*<li><Link to="/jobs/create" className={`nav-link ${location.pathname === '/jobs/create' ? 'active' : ''}`}>Create Job</Link></li>*/}
                </ul>
                <div className="navbar-placeholder"></div>
            </div>
        </nav>
    );
};

export default NavBar;