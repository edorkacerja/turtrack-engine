package com.example.turtrackmanager.repository.manager;

import com.example.turtrackmanager.model.manager.Job;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;


@Repository
public interface JobRepository extends JpaRepository<Job, Long> {
}
