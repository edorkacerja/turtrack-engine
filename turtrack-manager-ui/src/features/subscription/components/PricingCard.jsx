import React from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PricingCard = ({
                         title,
                         price,
                         interval = "week",
                         isTestMode = false,
                         onSubscribe,
                         isProcessing = false,
                         className,
                     }) => {
    return (
        <Card className={cn("w-80 overflow-hidden shadow-md hover:shadow-lg transition-shadow", className)}>
            <CardContent className="pt-8 px-8">
                <div className="space-y-4 text-center mb-6">
                    <h3 className="font-semibold text-2xl text-gray-900">{title}</h3>
                    <div className="flex items-baseline justify-center gap-1">
                        <span className="text-4xl font-bold text-gray-900">${price}</span>
                        <span className="text-sm text-gray-500">/ {interval}</span>
                    </div>
                </div>

                <Button
                    className={cn(
                        "w-full h-12 text-base font-medium rounded-md transition-colors",
                        "bg-amber-500 hover:bg-amber-600 text-white",
                        isProcessing && "cursor-not-allowed opacity-75"
                    )}
                    onClick={onSubscribe}
                    disabled={isProcessing}
                >
                    {isProcessing ? "Processing..." : "Subscribe"}
                    {isTestMode && (
                        <span
                            className="absolute -top-2 -right-2 bg-amber-400 text-amber-900
              text-xs font-semibold px-2 py-0.5 rounded-full shadow-sm"
                        >
              TEST MODE
            </span>
                    )}
                </Button>
            </CardContent>

            <CardFooter className="px-8 pb-8">
                <div className="w-full text-center">
                    <p className="text-sm text-gray-500 mb-4">Supported payment methods:</p>
                    <div className="flex justify-center gap-3">
                        <div className="w-10 h-6 bg-[#1A1F71] rounded-md shadow-sm"></div> {/* Visa */}
                        <div className="w-10 h-6 bg-[#FF0000] rounded-md shadow-sm"></div> {/* Mastercard */}
                        <div className="w-10 h-6 bg-[#1434CB] rounded-md shadow-sm"></div> {/* AMEX */}
                        <div className="w-10 h-6 bg-black rounded-md shadow-sm"></div> {/* Other */}
                    </div>
                </div>
            </CardFooter>
        </Card>
    );
};

export default PricingCard;
