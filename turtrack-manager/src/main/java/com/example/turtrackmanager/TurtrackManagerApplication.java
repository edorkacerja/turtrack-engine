package com.example.turtrackmanager;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;

@SpringBootApplication
@EntityScan("com.example.turtrackmanager.model.turtrack")
public class TurtrackManagerApplication {

	public static void main(String[] args) {
		SpringApplication.run(TurtrackManagerApplication.class, args);
	}

}
