package com.example.turtrackmanager.config;

import com.zaxxer.hikari.HikariDataSource;
import jakarta.persistence.EntityManagerFactory;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.orm.jpa.EntityManagerFactoryBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean;
import org.springframework.transaction.PlatformTransactionManager;

import javax.sql.DataSource;
import java.util.HashMap;
import java.util.Map;

@Configuration
@EnableJpaRepositories(
        basePackages = "com.example.turtrackmanager.repository.manager",
        entityManagerFactoryRef = "managerEntityManagerFactory",
        transactionManagerRef = "managerTransactionManager"
)
@Slf4j
public class TurtrackManagerDatasourceConfig {


    @Bean
    @ConfigurationProperties("spring.datasource.manager")
    public DataSourceProperties managerDataSourceProperties() {
        return new DataSourceProperties();
    }

    @Bean
    public DataSource managerDataSource() {
        DataSourceProperties properties = managerDataSourceProperties();
        log.info("Connecting to manager database: {}", properties.getUrl());
        log.info("Using username: {}", properties.getUsername());
        return properties.initializeDataSourceBuilder().build();
    }

    @Bean
    public LocalContainerEntityManagerFactoryBean managerEntityManagerFactory(
            EntityManagerFactoryBuilder builder) {
        Map<String, Object> properties = new HashMap<>();
        properties.put("hibernate.hbm2ddl.auto", "update");
        properties.put("hibernate.show_sql", "true");
        properties.put("hibernate.format_sql", "true");

        return builder
                .dataSource(managerDataSource())
                .packages("com.example.turtrackmanager.model.manager")
                .persistenceUnit("manager")
                .properties(properties)
                .build();
    }

    @Bean
    public PlatformTransactionManager managerTransactionManager(
            @Qualifier("managerEntityManagerFactory") EntityManagerFactory entityManagerFactory) {
        return new JpaTransactionManager(entityManagerFactory);
    }

}