package com.example.turtrackmanager.model.turtrack;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.DynamicInsert;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "images")
@JsonIgnoreProperties(ignoreUnknown = true)
@DynamicInsert  // Ensure only non-null fields are included in INSERT statements
public class Image {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @Column(name = "external_id", unique = true)
    private Long externalId;

    @Column(name = "original_url")
    private String originalUrl;

    @Column(name = "is_primary")
    private Boolean isPrimary;

    @Column(name = "resizable_url_template")
    private String resizableUrlTemplate;

    @Column(name = "verified")
    private Boolean verified;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id")
    private Vehicle vehicle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id")
    private Owner owner;
}