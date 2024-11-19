import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, CreditCard, AlertCircle } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

const ManageSubscriptionPage = () => {
    // Sample data - in a real app, this would come from your backend
    const subscriptionData = {
        currentPlan: "Professional",
        status: "Active",
        billingCycle: "Monthly",
        nextBillingDate: "2024-12-15",
        usageStats: {
            apiCalls: "8,542",
            storage: "75%",
            users: "12/15"
        },
        paymentHistory: [
            {
                date: "2024-11-15",
                amount: "$49.99",
                status: "Paid",
                invoice: "INV-2024-11"
            },
            {
                date: "2024-10-15",
                amount: "$49.99",
                status: "Paid",
                invoice: "INV-2024-10"
            },
            {
                date: "2024-09-15",
                amount: "$49.99",
                status: "Paid",
                invoice: "INV-2024-09"
            }
        ]
    };

    return (
        <div className="p-6 space-y-6 max-w-6xl mx-auto">
            {/* Subscription Overview Section */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Subscription Overview</CardTitle>
                        <CardDescription>Your current plan and usage details</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">Current Plan</span>
                                <Badge variant="default">{subscriptionData.currentPlan}</Badge>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">Status</span>
                                <Badge variant="success" className="bg-green-500">
                                    {subscriptionData.status}
                                </Badge>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">Billing Cycle</span>
                                <span>{subscriptionData.billingCycle}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">Next Billing Date</span>
                                <span>{subscriptionData.nextBillingDate}</span>
                            </div>
                            <div className="pt-4 border-t">
                                <h4 className="text-sm font-medium mb-3">Usage Statistics</h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm">API Calls</span>
                                        <span>{subscriptionData.usageStats.apiCalls}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm">Storage Used</span>
                                        <span>{subscriptionData.usageStats.storage}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm">Team Members</span>
                                        <span>{subscriptionData.usageStats.users}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Payment Method</CardTitle>
                        <CardDescription>Manage your payment details</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center space-x-4 p-4 border rounded-lg">
                                <CreditCard className="h-6 w-6" />
                                <div>
                                    <p className="font-medium">•••• •••• •••• 4242</p>
                                    <p className="text-sm text-gray-500">Expires 12/25</p>
                                </div>
                            </div>
                            <Button variant="outline" className="w-full">
                                Update Payment Method
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Billing History Section */}
            <Card>
                <CardHeader>
                    <CardTitle>Billing History</CardTitle>
                    <CardDescription>View and download your past invoices</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Invoice</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {subscriptionData.paymentHistory.map((payment) => (
                                <TableRow key={payment.invoice}>
                                    <TableCell>{payment.date}</TableCell>
                                    <TableCell>{payment.amount}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="bg-green-50">
                                            {payment.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="sm">
                                            <Download className="h-4 w-4 mr-2" />
                                            Download
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Alert for upcoming payment */}
            <Card className="bg-yellow-50">
                <CardContent className="flex items-center space-x-4 p-4">
                    <AlertCircle className="h-6 w-6 text-yellow-600" />
                    <div>
                        <p className="font-medium text-yellow-800">Upcoming Payment</p>
                        <p className="text-sm text-yellow-700">
                            Your next payment of $49.99 will be processed on {subscriptionData.nextBillingDate}
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default ManageSubscriptionPage;