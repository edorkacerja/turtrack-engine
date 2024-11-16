import React, { useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
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
    updateJobStatus
} from '../../redux/jobsSlice';
import { getStatusColor, getJobTypeColor, formatDate } from '../../utils/jobUtils';
import ProgressBar from "@ramonak/react-progress-bar";
import {useTraceRender, useTraceUpdate} from "../../utils/hooksUtil.js";

const JobList = React.memo(() => {
    useTraceRender('JobList');

    const dispatch = useDispatch();
    const { jobs, currentPage, itemsPerPage, totalElements, sortBy, sortDirection } = useSelector(
        state => ({
            jobs: state.jobs.jobs,
            currentPage: state.jobs.currentPage,
            itemsPerPage: state.jobs.itemsPerPage,
            totalElements: state.jobs.totalElements,
            sortBy: state.jobs.sortBy,
            sortDirection: state.jobs.sortDirection,
        }),
        shallowEqual
    );

    useTraceUpdate({
        jobs,
        currentPage,
        itemsPerPage,
        totalElements,
        sortBy,
        sortDirection
    });
    const intervalRef = useRef(null);
    const lastFetchRef = useRef(Date.now());

    const fetchJobsData = useCallback(() => {
        const now = Date.now();
        if (now - lastFetchRef.current > 1000) {
            lastFetchRef.current = now;
            dispatch(fetchJobs());
        }
    }, [dispatch]);

    // useEffect(() => {
    //     // Set initial sorting to 'createdAt' in descending order
    //     if (sortBy !== 'createdAt' || sortDirection !== 'desc') {
    //         dispatch(setSorting({ sortBy: 'createdAt', sortDirection: 'desc' }));
    //     }
    //
    //     fetchJobsData();
    //
    //     intervalRef.current = setInterval(fetchJobsData, 100);
    //
    //     return () => {
    //         if (intervalRef.current) {
    //             clearInterval(intervalRef.current);
    //         }
    //     };
    // }, [fetchJobsData, dispatch, sortBy, sortDirection]);

    const handleChangePage = useCallback((event, newPage) => {
        dispatch(setCurrentPage(newPage));
    }, [dispatch]);

    const handleChangeRowsPerPage = useCallback((event) => {
        const newItemsPerPage = parseInt(event.target.value, 10);
        dispatch(setItemsPerPage(newItemsPerPage));
        dispatch(setCurrentPage(0));
    }, [dispatch]);

    const handleSort = useCallback((column) => {
        const isAsc = sortBy === column && sortDirection === 'asc';
        dispatch(setSorting({ sortBy: column, sortDirection: isAsc ? 'desc' : 'asc' }));
    }, [dispatch, sortBy, sortDirection]);

    const handleJobAction = useCallback((jobId, action) => {
        dispatch(updateJobStatus({ jobId, status: action }))
            .then(() => dispatch(fetchJobs()));
    }, [dispatch]);

    const renderActionButtons = useCallback((job) => {
        if (job.status !== 'RUNNING' && job.status !== 'STOPPED') return null;

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
            <Tooltip title={tooltip}>
                <IconButton onClick={() => handleJobAction(job.id, action)} color={color} size="small">
                    {icon}
                </IconButton>
            </Tooltip>
        );
    }, [handleJobAction]);

    const renderProgress = useCallback(({ totalItems, completedItems, failedItems = 0, percentCompleted, isRunning }) => {
        if (totalItems == null || percentCompleted == null) {
            return <Typography variant="body2" color="text.secondary">Progress not available</Typography>;
        }

        return (
            <Box sx={{ width: '100%', mt: 1 }}>
                <ProgressBar
                    completed={percentCompleted}
                    customLabel={`${percentCompleted.toFixed(1)}%`}
                    bgColor="#4caf50"
                    baseBgColor="#ffcccb"
                    height="20px"
                    width="100%"
                    borderRadius="10px"
                    labelAlignment="center"
                    labelColor="#ffffff"
                    labelSize="14px"
                    animateOnRender={true}
                    maxCompleted={100}
                    customLabelStyles={{
                        fontWeight: 'bold',
                        textShadow: '1px 1px 2px rgba(0,0,0,0.6)',
                    }}
                    barContainerClassName={isRunning ? "running" : ""}
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                    <Typography variant="body2" color="success.main">Succeeded: {completedItems}</Typography>
                    <Typography variant="body2" color="error.main">Failed: {failedItems}</Typography>
                    <Typography variant="body2" color="text.secondary">Total: {totalItems}</Typography>
                </Box>
            </Box>
        );
    }, []);

    const renderDateTime = useCallback((startedAt) => {
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
    }, []);

    return (
        <Paper>
            <TableContainer>
                <Table aria-label="job list">
                    <TableHead>
                        <TableRow>
                            {['id', 'createdAt', 'status', 'jobType', 'startedAt', 'completedAt'].map((column) => (
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
                                <TableCell>{renderDateTime(job.createdAt)}</TableCell>
                                <TableCell>
                                    <Chip label={job.status} color={getStatusColor(job.status)} size="small" />
                                </TableCell>
                                <TableCell>
                                    <Chip label={job.jobType} sx={{ backgroundColor: getJobTypeColor(job.jobType), color: 'white' }} size="small" />
                                </TableCell>
                                <TableCell>{renderDateTime(job.startedAt)}</TableCell>
                                <TableCell>{renderDateTime(job.finishedAt)}</TableCell>
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
});

export default JobList;