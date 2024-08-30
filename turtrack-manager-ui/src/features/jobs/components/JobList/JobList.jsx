import React from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
    LinearProgress, Button, IconButton, Tooltip, Typography, Chip, Box
} from '@mui/material';
import {
    PlayArrow as PlayIcon,
    Pause as PauseIcon,
    Stop as StopIcon,
    ArrowUpward as ArrowUpIcon,
    ArrowDownward as ArrowDownIcon
} from '@mui/icons-material';

const JobList = ({ jobs, onSort, sortBy, sortDirection, onJobAction }) => {
    const handleSort = (key) => {
        onSort(key);
    };

    const getSortIcon = (key) => {
        if (sortBy === key) {
            return sortDirection === 'asc' ? <ArrowUpIcon fontSize="small" /> : <ArrowDownIcon fontSize="small" />;
        }
        return null;
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'RUNNING': return 'success';
            case 'PAUSED': return 'warning';
            case 'STOPPED': return 'error';
            case 'COMPLETED': return 'info';
            default: return 'default';
        }
    };

    const getJobTypeColor = (jobType) => {
        switch (jobType.toLowerCase()) {
            case 'import': return 'primary';
            case 'export': return 'secondary';
            case 'analysis': return 'info';
            case 'cleanup': return 'warning';
            default: return 'default';
        }
    };

    const renderActionButtons = (job) => {
        switch (job.status) {
            case 'RUNNING':
                return (
                    <>
                        <Tooltip title="Pause">
                            <IconButton onClick={() => onJobAction(job.id, 'pause')} color="warning" size="small">
                                <PauseIcon />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Stop">
                            <IconButton onClick={() => onJobAction(job.id, 'stop')} color="error" size="small">
                                <StopIcon />
                            </IconButton>
                        </Tooltip>
                    </>
                );
            case 'PAUSED':
                return (
                    <>
                        <Tooltip title="Resume">
                            <IconButton onClick={() => onJobAction(job.id, 'resume')} color="success" size="small">
                                <PlayIcon />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Stop">
                            <IconButton onClick={() => onJobAction(job.id, 'stop')} color="error" size="small">
                                <StopIcon />
                            </IconButton>
                        </Tooltip>
                    </>
                );
            case 'STOPPED':
                return (
                    <Tooltip title="Start">
                        <IconButton onClick={() => onJobAction(job.id, 'start')} color="success" size="small">
                            <PlayIcon />
                        </IconButton>
                    </Tooltip>
                );
            default:
                return null;
        }
    };

    const renderProgress = (job) => {
        if (job.totalItems === null || job.totalItems === undefined) {
            return (
                <Typography variant="body2" color="text.secondary">
                    Progress not available
                </Typography>
            );
        }

        const successValue = (job.completedItems / job.totalItems) * 100;
        const failureValue = (job.failedItems / job.totalItems) * 100;

        return (
            <Box sx={{ width: '100%', mt: 1 }}>
                <LinearProgress
                    variant="buffer"
                    value={successValue}
                    valueBuffer={successValue + failureValue}
                    sx={{
                        height: 10,
                        borderRadius: 5,
                        backgroundColor: '#ffcccb',
                        '& .MuiLinearProgress-bar': {
                            backgroundColor: '#4caf50'
                        },
                        '& .MuiLinearProgress-dashed': {
                            backgroundImage: 'none'
                        }
                    }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                    <Typography variant="body2" color="success.main">
                        Succeeded: {job.completedItems}
                    </Typography>
                    <Typography variant="body2" color="error.main">
                        Failed: {job.failedItems}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Total: {job.totalItems}
                    </Typography>
                </Box>
            </Box>
        );
    };

    const parseDate = (input) => {
        if (input === null || input === undefined) {
            return null;
        }

        // Handle date as an array of numbers
        if (Array.isArray(input) && input.length >= 7) {
            const [year, month, day, hour, minute, second, microsecond] = input;
            // Note: JavaScript months are 0-indexed, so we subtract 1 from the month
            return new Date(Date.UTC(year, month - 1, day, hour, minute, second, microsecond / 1000));
        }

        // If it's already a Date object, return it
        if (input instanceof Date) {
            return isNaN(input.getTime()) ? null : input;
        }

        // If it's a number, assume it's a timestamp
        if (typeof input === 'number') {
            const date = new Date(input);
            return isNaN(date.getTime()) ? null : date;
        }

        // If it's a string, try parsing as ISO 8601
        if (typeof input === 'string') {
            const date = new Date(input);
            return isNaN(date.getTime()) ? null : date;
        }

        // If it's none of the above, return null
        return null;
    };

    const formatDate = (input) => {
        const date = parseDate(input);
        if (!date) return 'Not available';

        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
            timeZone: 'UTC'  // Adjust this if your times are not in UTC
        });
    };

    // Sort jobs by startedAt date, most recent first
    const sortedJobs = [...jobs].sort((a, b) => {
        const dateA = parseDate(a.startedAt);
        const dateB = parseDate(b.startedAt);
        if (!dateA && !dateB) return 0;
        if (!dateA) return 1;
        if (!dateB) return -1;
        return dateB.getTime() - dateA.getTime();
    });

    return (
        <TableContainer component={Paper}>
            <Table aria-label="job list">
                <TableHead>
                    <TableRow>
                        {['ID', 'Status', 'Job Type', 'Started At', 'Progress', 'Actions'].map((header) => (
                            <TableCell key={header} sortDirection={sortBy === header.toLowerCase() ? sortDirection : false}>
                                <Tooltip title={`Sort by ${header}`} placement="top-start" enterDelay={300}>
                                    <Button
                                        onClick={() => handleSort(header.toLowerCase().replace(' ', ''))}
                                        endIcon={getSortIcon(header.toLowerCase().replace(' ', ''))}
                                    >
                                        {header}
                                    </Button>
                                </Tooltip>
                            </TableCell>
                        ))}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {sortedJobs.map((job) => (
                        <TableRow key={job.id}>
                            <TableCell>{job.id}</TableCell>
                            <TableCell>
                                <Chip label={job.status} color={getStatusColor(job.status)} size="small" />
                            </TableCell>
                            <TableCell>
                                <Chip label={job.jobType} color={getJobTypeColor(job.jobType)} size="small" />
                            </TableCell>
                            <TableCell>{formatDate(job.startedAt)}</TableCell>
                            <TableCell>{renderProgress(job)}</TableCell>
                            <TableCell>{renderActionButtons(job)}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default JobList;