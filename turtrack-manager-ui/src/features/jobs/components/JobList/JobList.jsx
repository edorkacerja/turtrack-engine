import React, {useEffect} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
    LinearProgress, IconButton, Tooltip, Typography, Chip, Box,
    TablePagination, TableSortLabel
} from '@mui/material';
import {
    PlayArrow as PlayIcon,
    Stop as StopIcon,
    CalendarToday as CalendarIcon,
    AccessTime as ClockIcon
} from '@mui/icons-material';
import {
    fetchJobs,
    setCurrentPage,
    setItemsPerPage,
    setSorting,
    updateJobProgress,
    updateJobStatus
} from '../../redux/jobsSlice';
import { getStatusColor, getJobTypeColor, formatDate } from '../../utils/jobUtils';

const JobList = () => {
    const dispatch = useDispatch();
    const { jobs, status, error, currentPage, itemsPerPage, totalElements, sortBy, sortDirection } = useSelector(state => state.jobs);


    useEffect(() => {
        dispatch(fetchJobs());
    }, [dispatch, currentPage, sortBy, sortDirection]);

    useEffect(() => {
        const interval = setInterval(() => {
            jobs.forEach(job => {
                if (job.status === 'running') {
                    const newProcessed = Math.min(job.processedItems + Math.floor(Math.random() * 5), job.totalItems);
                    const newFailed = Math.floor(Math.random() * 2);
                    dispatch(updateJobProgress({ id: job.id, processedItems: newProcessed, failedItems: job.failedItems + newFailed }));
                }
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [dispatch, jobs]);


    const handleChangePage = (event, newPage) => {
        dispatch(setCurrentPage(newPage));
    };

    const handleChangeRowsPerPage = (event) => {
        const newItemsPerPage = parseInt(event.target.value, 10);
        dispatch(setItemsPerPage(newItemsPerPage));
        dispatch(setCurrentPage(0));
    };

    const handleSort = (column) => {
        const isAsc = sortBy === column && sortDirection === 'asc';
        dispatch(setSorting({ sortBy: column, sortDirection: isAsc ? 'desc' : 'asc' }));
    };

    const handleJobAction = (jobId, action) => {
        dispatch(updateJobStatus({ jobId, status: action }))
            .then(() => dispatch(fetchJobs()));  // Re-fetch jobs after status update
    };

    const renderActionButtons = (job) => {
        const actionMap = {
            'RUNNING': {
                icon: <StopIcon />,
                color: "error",
                tooltip: "Stop",
                action: "STOPPED"
            },
            'STOPPED': {
                icon: <PlayIcon />,
                color: "success",
                tooltip: "Start",
                action: "RUNNING"
            }
        };
        const { icon, color, tooltip, action } = actionMap[job.status] || {};
        return (
            icon && (
                <Tooltip title={tooltip}>
                    <IconButton onClick={() => handleJobAction(job.id, action)} color={color} size="small">
                        {icon}
                    </IconButton>
                </Tooltip>
            )
        );
    };

    const renderProgress = (job) => {
        if (!job.totalItems) return <Typography variant="body2" color="text.secondary">Progress not available</Typography>;

        const successValue = (job.processedItems / job.totalItems) * 100;
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
                        '& .MuiLinearProgress-bar': { backgroundColor: '#4caf50' }
                    }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                    <Typography variant="body2" color="success.main">Succeeded: {job.processedItems}</Typography>
                    <Typography variant="body2" color="error.main">Failed: {job.failedItems}</Typography>
                    <Typography variant="body2" color="text.secondary">Total: {job.totalItems}</Typography>
                </Box>
            </Box>
        );
    };

    const renderStartedAt = (startedAt) => {
        const { date, time } = formatDate(startedAt);
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                    <CalendarIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2">{date}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <ClockIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2">{time}</Typography>
                </Box>
            </Box>
        );
    };

    if (status === 'loading') return <LinearProgress />;
    if (status === 'failed') return <Typography color="error">Error: {error}</Typography>;

    return (
        <Paper>
            <TableContainer>
                <Table aria-label="job list">
                    <TableHead>
                        <TableRow>
                            {['id', 'status', 'jobType', 'startedAt'].map((column) => (
                                <TableCell key={column}>
                                    <TableSortLabel
                                        active={sortBy === column}
                                        direction={sortBy === column ? sortDirection : 'asc'}
                                        onClick={() => handleSort(column)}
                                    >
                                        {column.charAt(0).toUpperCase() + column.slice(1)}
                                    </TableSortLabel>
                                </TableCell>
                            ))}
                            <TableCell>Progress</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {jobs.map((job) => (
                            <TableRow key={job.id}>
                                <TableCell>{job.id}</TableCell>
                                <TableCell>
                                    <Chip label={job.status} color={getStatusColor(job.status)} size="small" />
                                </TableCell>
                                <TableCell>
                                    <Chip label={job.jobType} sx={{ backgroundColor: getJobTypeColor(job.jobType), color: 'white' }} size="small" />
                                </TableCell>
                                <TableCell>{renderStartedAt(job.startedAt)}</TableCell>
                                <TableCell>{renderProgress(job)}</TableCell>
                                <TableCell>{renderActionButtons(job)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={totalElements}
                rowsPerPage={itemsPerPage}
                page={currentPage}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
            />
        </Paper>
    );
};

export default JobList;
