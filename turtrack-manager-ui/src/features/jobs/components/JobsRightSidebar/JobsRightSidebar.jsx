import React from 'react';
import { PieChart, BarChart2, Filter, Settings, Info } from 'lucide-react';
import './JobsRightSidebar.scss';

const JobsRightSidebar = () => {
    return (
        <div className="jobs-sidebar">
            <div className="sidebar-content">
                <div className="quick-stats">
                    <h3>Create Job</h3>
                    <p>Running: 25</p>
                    <p>Completed: 100</p>
                    <p>Failed: 25</p>
                </div>

                <button className="sidebar-button">
                    <PieChart size={18} />
                    <span>Job Distribution</span>
                </button>

                <button className="sidebar-button">
                    <BarChart2 size={18} />
                    <span>Performance Metrics</span>
                </button>

                <button className="sidebar-button">
                    <Filter size={18} />
                    <span>Filter Jobs</span>
                </button>

                <button className="sidebar-button">
                    <Settings size={18} />
                    <span>Settings</span>
                </button>

                <button className="sidebar-button">
                    <Info size={18} />
                    <span>Help & Documentation</span>
                </button>
            </div>
        </div>
    );
};

export default JobsRightSidebar;