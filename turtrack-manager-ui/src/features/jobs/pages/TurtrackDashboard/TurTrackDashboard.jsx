import React from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    IconButton,
    Grid,
    Paper
} from '@mui/material';
import { CalendarToday } from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import './TurTrackDashboard.scss';
import VehicleScatterPlot from "@/features/jobs/pages/TurtrackDashboard/VehicleScatterPlot.jsx";

const TurTrackDashboard = () => {
    // Sample data
    const vehicleTypes = [
        { name: 'Cars', value: 59.50, color: '#FF8787' },
        { name: 'SUVs', value: 35.50, color: '#FFB676' },
        { name: 'Minivans', value: 4.00, color: '#76E4FF' },
        { name: 'Trucks', value: 1.00, color: '#7676FF' }
    ];

    const priceDistributionData = [
        { range: '25-30', count: 2 },
        { range: '30-35', count: 5 },
        { range: '35-40', count: 8 },
        { range: '40-45', count: 18 },
        { range: '45-50', count: 30 },
        { range: '50-55', count: 28 },
        { range: '55-60', count: 28 },
        { range: '60-65', count: 20 },
        { range: '65-70', count: 19 },
        { range: '70-75', count: 12 },
        { range: '75-80', count: 14 },
        { range: '80+', count: 18 }
    ];

    const protectionPlans = [
        { name: '60 Plan', value: 25, color: '#FF8787' },
        { name: '75 Plan', value: 20, color: '#FFB676' },
        { name: '80 Plan', value: 15, color: '#76E4FF' },
        { name: '85 Plan', value: 15, color: '#7676FF' }
    ];

    const metrics = [
        { title: 'Vehicle Found', value: '200' },
        { title: 'All Star Host', value: '86.50%' },
        { title: 'Free Delivery', value: '0.00%' },
        { title: 'Unlimited Miles', value: '100' }
    ];

    return (
        <Box className="dashboard-container">
            <Box className="dashboard-header">
                <Box>
                    <Typography variant="h4" component="h1">Vehicles</Typography>
                    <Typography variant="subtitle1" color="textSecondary">
                        Vehicles from your search query.
                    </Typography>
                </Box>
                <Box className="date-selector">
                    <Typography variant="body1">This year</Typography>
                    <IconButton size="small">
                        <CalendarToday />
                    </IconButton>
                </Box>
            </Box>

            <Grid container spacing={3} className="metrics-grid">
                {metrics.map((metric, index) => (
                    <Grid item xs={12} sm={6} md={3} key={index}>
                        <Card className="metric-card">
                            <CardContent>
                                <Typography variant="subtitle2" color="textSecondary">
                                    {metric.title}
                                </Typography>
                                <Typography variant="h4" component="div">
                                    {metric.value}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            <Grid container spacing={3} className="charts-grid">
                <Grid item xs={12} md={6}>
                    <Card className="chart-card">
                        <CardContent>
                            <Typography variant="h6">Vehicle Types</Typography>
                            <Box className="vehicle-types-content">
                                <Box className="legend">
                                    {vehicleTypes.map((type) => (
                                        <Box key={type.name} className="legend-item">
                                            <Box
                                                className="legend-color"
                                                style={{ backgroundColor: type.color }}
                                            />
                                            <Typography variant="body2">
                                                {type.name} ({type.value}%)
                                            </Typography>
                                        </Box>
                                    ))}
                                </Box>
                                <PieChart width={200} height={200}>
                                    <Pie
                                        data={vehicleTypes}
                                        cx={100}
                                        cy={100}
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={4}
                                        dataKey="value"
                                    >
                                        {vehicleTypes.map((entry) => (
                                            <Cell key={entry.name} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <text x={100} y={100} textAnchor="middle" dominantBaseline="middle">
                                        {vehicleTypes[0].value}%
                                        <tspan x={100} y={120} fontSize={12}>Cars</tspan>
                                    </text>
                                </PieChart>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Card className="chart-card">
                        <CardContent>
                            <Typography variant="h6">Price Distribution</Typography>
                            <Box className="chart-container">
                                <BarChart width={500} height={200} data={priceDistributionData}>
                                    <XAxis dataKey="range" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="count" fill="#8884d8" />
                                </BarChart>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Card className="chart-card">
                        <CardContent>
                            <Typography variant="h6">Booking Rate</Typography>
                            <Box className="chart-container">
                                <BarChart width={500} height={200} data={priceDistributionData}>
                                    <XAxis dataKey="range" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="count" fill="#8884d8" />
                                </BarChart>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Card className="chart-card">
                        <CardContent>
                            <Typography variant="h6">Protection Plan</Typography>
                            <Box className="protection-plan-content">
                                <Box className="legend">
                                    {protectionPlans.map((plan) => (
                                        <Box key={plan.name} className="legend-item">
                                            <Box
                                                className="legend-color"
                                                style={{ backgroundColor: plan.color }}
                                            />
                                            <Typography variant="body2">
                                                {plan.name} ({plan.value}%)
                                            </Typography>
                                        </Box>
                                    ))}
                                </Box>
                                <PieChart width={200} height={200}>
                                    <Pie
                                        data={protectionPlans}
                                        cx={100}
                                        cy={100}
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={4}
                                        dataKey="value"
                                    >
                                        {protectionPlans.map((entry) => (
                                            <Cell key={entry.name} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <text x={100} y={100} textAnchor="middle" dominantBaseline="middle">
                                        {protectionPlans[0].value}%
                                        <tspan x={100} y={120} fontSize={12}>{protectionPlans[0].name}</tspan>
                                    </text>
                                </PieChart>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={36} md={30}>
                    <VehicleScatterPlot/>
                </Grid>
            </Grid>
        </Box>
    );
};

export default TurTrackDashboard;