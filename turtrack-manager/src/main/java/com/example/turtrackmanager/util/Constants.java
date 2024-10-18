package com.example.turtrackmanager.util;


public final class Constants {

    private Constants() {
        // Private constructor to prevent instantiation
    }

    public static final String CALIBRATOR_URL = "http://localhost:5000";


    public static final class RabbitMQ {
        public static final String TO_BE_SCRAPED_CELLS_QUEUE = "TO-BE-SCRAPED-cells-queue";
        public static final String TO_BE_SCRAPED_DR_AVAILABILITY_QUEUE = "TO-BE-SCRAPED-dr-availability-queue";
        public static final String TO_BE_SCRAPED_VEHICLE_DETAILS_QUEUE = "TO-BE-SCRAPED-vehicle-details-queue";
        public static final String SCRAPED_DR_AVAILABILITY_QUEUE = "SCRAPED-dr-availability-queue";
        public static final String SCRAPED_CELLS_QUEUE = "SCRAPED-cells-queue";
        public static final String SCRAPED_VEHICLE_SKELETON_QUEUE = "SCRAPED-vehicle-skeleton-queue";
        public static final String SCRAPED_VEHICLE_DETAILS_QUEUE = "SCRAPED-vehicle-details-queue";
        public static final String DLQ_CELLS_QUEUE = "DLQ-cells-queue";
        public static final String DLQ_DR_AVAILABILITY_QUEUE = "DLQ-dr-availability-queue";
        public static final String DLQ_VEHICLE_DETAILS_QUEUE = "DLQ-vehicle-details-queue";
    }

}