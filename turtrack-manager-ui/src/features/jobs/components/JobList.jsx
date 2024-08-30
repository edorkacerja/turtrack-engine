import React from 'react';

const JobList = ({ jobs, onSort, sortBy, onJobAction }) => {
    const handleSort = (key) => {
        onSort(key);
    };

    return (
        <table className="min-w-full bg-white border border-gray-300">
            <thead>
            <tr>
                <th className="px-4 py-2 cursor-pointer" onClick={() => handleSort('id')}>
                    ID {sortBy === 'id' && '▼'}
                </th>
                <th className="px-4 py-2 cursor-pointer" onClick={() => handleSort('name')}>
                    Name {sortBy === 'name' && '▼'}
                </th>
                <th className="px-4 py-2 cursor-pointer" onClick={() => handleSort('status')}>
                    Status {sortBy === 'status' && '▼'}
                </th>
                <th className="px-4 py-2 cursor-pointer" onClick={() => handleSort('dateStarted')}>
                    Date Started {sortBy === 'dateStarted' && '▼'}
                </th>
                <th className="px-4 py-2">Progress</th>
                <th className="px-4 py-2">Actions</th>
            </tr>
            </thead>
            <tbody>
            {jobs.map((job) => (
                <tr key={job.id}>
                    <td className="px-4 py-2">{job.id}</td>
                    <td className="px-4 py-2">{job.name}</td>
                    <td className="px-4 py-2">{job.status}</td>
                    <td className="px-4 py-2">{new Date(job.dateStarted).toLocaleString()}</td>
                    <td className="px-4 py-2">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                                className="bg-blue-600 h-2.5 rounded-full"
                                style={{ width: `${(job.processedItems / job.totalItems) * 100}%` }}
                            ></div>
                        </div>
                        <span className="text-sm">{`${job.processedItems}/${job.totalItems}`}</span>
                    </td>
                    <td className="px-4 py-2">
                        {job.status === 'running' && (
                            <>
                                <button onClick={() => onJobAction(job.id, 'pause')} className="mr-2 text-yellow-500">Pause</button>
                                <button onClick={() => onJobAction(job.id, 'stop')} className="text-red-500">Stop</button>
                            </>
                        )}
                        {job.status === 'paused' && (
                            <>
                                <button onClick={() => onJobAction(job.id, 'resume')} className="mr-2 text-green-500">Resume</button>
                                <button onClick={() => onJobAction(job.id, 'stop')} className="text-red-500">Stop</button>
                            </>
                        )}
                        {job.status === 'stopped' && (
                            <button onClick={() => onJobAction(job.id, 'start')} className="text-green-500">Start</button>
                        )}
                    </td>
                </tr>
            ))}
            </tbody>
        </table>
    );
};

export default JobList;