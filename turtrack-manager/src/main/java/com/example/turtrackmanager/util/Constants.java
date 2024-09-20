package com.example.turtrackmanager.util;


public final class Constants {

    private Constants() {
        // Private constructor to prevent instantiation
    }

    public static final String CALIBRATOR_URL = "http://localhost:5000";


    public static final class Kafka {
        public static final String TO_BE_SCRAPED_CELLS_TOPIC = "TO-BE-SCRAPED-cells-topic";
        public static final String TO_BE_SCRAPED_DR_AVAILABILITY_TOPIC = "TO-BE-SCRAPED-dr-availability-topic";
        public static final String TO_BE_SCRAPED_VEHICLE_DETAILS_TOPIC = "TO-BE-SCRAPED-vehicle-details-topic";
        public static final String SCRAPED_DR_AVAILABILITY_TOPIC = "SCRAPED-dr-availability-topic";
        public static final String SCRAPED_VEHICLE_SKELETON_TOPIC = "SCRAPED-vehicle-skeleton-topic";
        public static final String SCRAPED_VEHICLE_DETAILS_TOPIC = "SCRAPED-vehicle-details-topic";
        public static final String PROCESSED_DR_AVAILABILITY_TOPIC = "PROCESSED-dr-availability-topic";
        public static final String PROCESSED_VEHICLE_DETAILS_TOPIC = "PROCESSED-vehicle-details-topic";
        public static final String PROCESSED_VEHICLE_SKELETON_TOPIC = "PROCESSED-vehicle-skeleton-topic";
        public static final String DLQ_CELLS_TOPIC = "DLQ-cells-topic";
        public static final String DLQ_DR_AVAILABILITY_TOPIC = "DLQ-dr-availability-topic";
        public static final String DLQ_VEHICLE_DETAILS_TOPIC = "DLQ-vehicle-details-topic";
    }

}