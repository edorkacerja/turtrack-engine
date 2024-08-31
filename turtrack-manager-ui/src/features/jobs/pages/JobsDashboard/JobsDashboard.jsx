import React from 'react';
import JobList from '../../components/JobList/JobList.jsx';
import JobsLeftSidebar from '../../components/JobsLeftSidebar/JobsLeftSidebar.jsx';
import "./JobsDashboard.scss";
import JobsRightSidebar from "../../components/JobsRightSidebar/JobsRightSidebar.jsx";

const JobsDashboard = () => {
    return (
        <div className="dashboard-container">
            <JobsLeftSidebar/>
            <div className="jobs-dashboard">
                <JobList />
            </div>
            {/*<JobsRightSidebar/>*/}
        </div>
    );
};

export default JobsDashboard;