import React from 'react';
import JobList from '../../components/JobList/JobList.jsx';
import Pagination from '../../components/Pagination/Pagination.jsx';
import JobsSidebar from '../../components/JobsSidebar/JobsSidebar.jsx';
import "./JobsDashboard.scss";

const JobsDashboard = () => {
    return (
        <div className="dashboard-container">
            <JobsSidebar/>
            <div className="jobs-dashboard">
                <h1 className="text-3xl font-bold mb-4">Jobs Dashboard</h1>
                <JobList />
                <Pagination />
            </div>
        </div>
    );
};

export default JobsDashboard;