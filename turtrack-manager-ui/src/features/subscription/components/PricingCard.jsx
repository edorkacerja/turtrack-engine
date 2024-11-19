import React from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";


const PricingCard = ({
                         title,
                         price,
                         interval,
                         features,
                         isPopular = false,
                         isCurrentPlan = false,
                         isTestMode = false,
                         onSubscribe,
                         isProcessing = false,
                         priceId,
                         className,
                     }) => {
    return (
        <Card
            className={cn(
                "relative w-full overflow-hidden",
                isPopular ? "border-amber-500 border-2 shadow-lg" : "border shadow-md",
                "hover:shadow-lg transition-all duration-200",
                className
            )}
        >
            {isPopular && (
                <div className="absolute top-0 right-0 left-0 bg-amber-500 text-white text-center py-1 px-4 text-sm font-medium">
                    Most Popular
                </div>
            )}

            {isCurrentPlan && (
                <div className="absolute top-0 right-0 left-0 bg-green-500 text-white text-center py-1 px-4 text-sm font-medium">
                    Current Plan
                </div>
            )}

            <CardContent className={cn("pt-8 px-8", (isPopular || isCurrentPlan) && "pt-12")}>
                <div className="space-y-4 text-center mb-6">
                    <h3 className="font-semibold text-2xl text-gray-900">{title}</h3>
                    <div className="flex items-baseline justify-center gap-1">
                        <span className="text-4xl font-bold text-gray-900">${price}</span>
                        <span className="text-sm text-gray-500">/ {interval}</span>
                    </div>

                    <div className="space-y-3 mt-6">
                        {features.map((feature, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <Check className="h-5 w-5 text-amber-500" />
                                <span className="text-gray-600 text-sm">{feature}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <Button
                    className={cn(
                        "w-full h-12 text-base font-medium rounded-md transition-colors",
                        isCurrentPlan
                            ? "bg-green-500 hover:bg-green-600 text-white"
                            : isPopular
                                ? "bg-amber-500 hover:bg-amber-600 text-white"
                                : "bg-gray-800 hover:bg-gray-900 text-white",
                        isProcessing && "cursor-not-allowed opacity-75"
                    )}
                    onClick={() => onSubscribe(priceId)}
                    disabled={isProcessing || isCurrentPlan}
                >
                    {isProcessing ? "Processing..." : isCurrentPlan ? "Current Plan" : "Subscribe"}
                </Button>
            </CardContent>

            <CardFooter className="px-8 pb-8">
                <div className="w-full text-center">
                    <p className="text-sm text-gray-500 mb-4">Supported payment methods:</p>
                    <div className="flex justify-center gap-3">
                        <div className="w-10 h-6 bg-[#1A1F71] rounded-md shadow-sm"></div>
                        <div className="w-10 h-6 bg-[#FF0000] rounded-md shadow-sm"></div>
                        <div className="w-10 h-6 bg-[#1434CB] rounded-md shadow-sm"></div>
                        <div className="w-10 h-6 bg-black rounded-md shadow-sm"></div>
                    </div>
                </div>
            </CardFooter>
        </Card>
    );
};

export default PricingCard;
