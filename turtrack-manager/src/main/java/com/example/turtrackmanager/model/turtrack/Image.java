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
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "image_sequence")
    @SequenceGenerator(
            name = "image_sequence",
            sequenceName = "image_seq",
            allocationSize = 1,
            initialValue = 20000000
    )
    private Long id;

    @Column(name = "original_url")
    private String originalUrl;

    @Column(name = "is_primary")
    private Boolean isPrimary;

    @Column(name = "resizable_url_template")
    private String resizableUrlTemplate;

    @Column(name = "verified")
    private Boolean verified;

    @Column(name = "thumbnail_32x32")
    private String thumbnail32x32;

    @Column(name = "thumbnail_84x84")
    private String thumbnail84x84;

    @Column(name = "thumbnail_300x300")
    private String thumbnail300x300;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id")
    private Vehicle vehicle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id")
    private Owner owner;
}