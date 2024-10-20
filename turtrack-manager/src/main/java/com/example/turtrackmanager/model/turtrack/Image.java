package com.example.turtrackmanager.model.turtrack;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.annotation.Nullable;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.DynamicInsert;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "images", indexes = {
        @Index(name = "idx_image_external_id", columnList = "external_id")
})
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class Image {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @Column(name = "external_id")
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
    @Nullable
    private Vehicle vehicle;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id")
    @Nullable
    private Owner owner;
}