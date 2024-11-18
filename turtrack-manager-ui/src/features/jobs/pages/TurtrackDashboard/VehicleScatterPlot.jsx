import React from "react";
import {
    ScatterChart,
    Scatter,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceArea,
    Legend,
} from "recharts";
import { makeStyles } from "@mui/styles";
import { Card, CardContent, Typography } from "@mui/material";

const useStyles = makeStyles({
    scatterPlotContainer: {
        margin: "20px 0",
        padding: "20px",
        borderRadius: "8px",
        backgroundColor: "#f9f9f9",
    },
});

const generateVehicleData = () => {
    const bodyTypes = ["Sedan", "SUV", "Truck", "Coupe", "Convertible", "Minivan"];
    const trimTypes = ["Base", "Sport", "Luxury", "Offroad", "Electric"];

    const data = [];

    bodyTypes.forEach((bodyType, bodyIndex) => {
        let numVehicles;
        let tripRatioBase;
        const trimDistribution = {
            Base: 0.4,
            Sport: 0.25,
            Luxury: 0.2,
            Offroad: 0.1,
            Electric: 0.05,
        };

        switch (bodyType) {
            case "SUV":
                numVehicles = 80;
                tripRatioBase = 4.0;
                break;
            case "Sedan":
                numVehicles = 20;
                tripRatioBase = 2.5;
                break;
            case "Truck":
                numVehicles = 7;
                tripRatioBase = 3.5;
                break;
            case "Coupe":
                numVehicles = 10;
                tripRatioBase = 2.0;
                break;
            case "Convertible":
                numVehicles = 2;
                tripRatioBase = 1.5;
                break;
            case "Minivan":
                numVehicles = 15;
                tripRatioBase = 2.8;
                break;
            default:
                numVehicles = 30;
                tripRatioBase = 2.0;
        }

        trimTypes.forEach((trimType, trimIndex) => {
            const trimCount = Math.floor(numVehicles * trimDistribution[trimType]);
            for (let i = 0; i < trimCount; i++) {
                data.push({
                    bodyType,
                    trimType,
                    column: bodyIndex * 5 + trimIndex, // Group same body types together
                    tripsPerDay: +(tripRatioBase + Math.random() * 1.5).toFixed(2), // More realistic trips ratio
                    daysListed: Math.floor(Math.random() * 100 + 20),
                });
            }
        });
    });

    return data;
};

const VehicleScatterPlot = () => {
    const classes = useStyles();
    const data = generateVehicleData();

    const bodyTypes = ["Sedan", "SUV", "Truck", "Coupe", "Convertible", "Minivan"];
    const trimTypes = ["Base", "Sport", "Luxury", "Offroad", "Electric"];

    const bodyTypeColors = ["#e3f2fd", "#e8f5e9", "#fffde7", "#f3e5f5", "#ede7f6", "#fbe9e7"];
    const trimTypeColors = ["#ff0000", "#00ff00", "#0000ff", "#ffa500", "#800080"];

    return (
        <Card className={classes.scatterPlotContainer}>
            <CardContent>
                <Typography variant="h5" gutterBottom>
                    Vehicle Scatter Plot
                </Typography>
                <ResponsiveContainer width="100%" height={600}>
                    <ScatterChart>
                        <CartesianGrid />
                        <XAxis
                            type="number"
                            dataKey="column"
                            name="Column"
                            tickCount={30}
                            tickFormatter={(tick) => {
                                const bodyIndex = Math.floor(tick / 5);
                                const trimIndex = tick % 5;
                                return `${bodyTypes[bodyIndex]} - ${trimTypes[trimIndex]}`;
                            }}
                        />
                        <YAxis type="number" dataKey="tripsPerDay" name="Trips/Day" />
                        <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                        <Legend />

                        {bodyTypes.map((bodyType, index) => (
                            <ReferenceArea
                                key={bodyType}
                                x1={index * 5 - 0.5}
                                x2={(index + 1) * 5 - 0.5}
                                label={bodyType}
                                fill={bodyTypeColors[index]}
                                fillOpacity={0.5}
                                stroke="none"
                            />
                        ))}

                        {trimTypes.map((trimType, index) => (
                            <Scatter
                                key={trimType}
                                name={trimType}
                                data={data.filter((d) => d.trimType === trimType)}
                                fill={trimTypeColors[index]}
                            />
                        ))}
                    </ScatterChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
};

export default VehicleScatterPlot;
