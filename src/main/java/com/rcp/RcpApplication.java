package com.rcp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class RcpApplication {
    public static void main(String[] args) {
        SpringApplication.run(RcpApplication.class, args);
    }
}
