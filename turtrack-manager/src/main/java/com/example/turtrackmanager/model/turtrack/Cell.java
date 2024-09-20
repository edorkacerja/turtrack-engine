package com.example.turtrackmanager.model.turtrack;

import lombok.*;
import lombok.experimental.Accessors;

@Data
@Getter
@Setter
@AllArgsConstructor
@Accessors(chain = true)
public class Cell {
    private String id;
    private String country;
    private Integer cellSize;
    private String status;
    private Double topRightLat;
    private Double topRightLng;
    private Double bottomLeftLat;
    private Double bottomLeftLng;
    private String searchLastUpdated;

    public Cell() {
        this.status = "success";
    }

    // You can add additional methods here if needed, such as:
    public boolean isFailed() {
        return "failed".equals(this.status);
    }
}