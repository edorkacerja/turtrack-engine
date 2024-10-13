package com.example.turtrackmanager.util;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;

public class DateTimeUtil {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy/MM/dd");

    /**
     * Converts a date string in the format "yyyy/MM/dd" to LocalDateTime.
     * The time is set to start of day (00:00:00).
     *
     * @param dateString the date string to convert
     * @return LocalDateTime object representing the input date at start of day
     * @throws DateTimeParseException if the input string cannot be parsed
     */
    public static LocalDateTime convertStringToDateTime(String dateString) throws DateTimeParseException {
        LocalDate date = LocalDate.parse(dateString, DATE_FORMATTER);
        return date.atStartOfDay();
    }

    /**
     * Converts a date string in the format "yyyy/MM/dd" to LocalDateTime with a specific time.
     *
     * @param dateString the date string to convert
     * @param hour the hour of day (0-23)
     * @param minute the minute of hour (0-59)
     * @param second the second of minute (0-59)
     * @return LocalDateTime object representing the input date and time
     * @throws DateTimeParseException if the input string cannot be parsed
     * @throws IllegalArgumentException if the time parameters are invalid
     */
    public static LocalDateTime convertStringToDateTime(String dateString, int hour, int minute, int second)
            throws DateTimeParseException, IllegalArgumentException {
        LocalDate date = LocalDate.parse(dateString, DATE_FORMATTER);
        return date.atTime(hour, minute, second);
    }
}