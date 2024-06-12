package com.oracle.Common;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
public class MyConfig {

    @Value("${oracle.host}")
    private String host;

    @Value("${oracle.port}")
    private String port;

    @Value("${oracle.database}")
    private String database;

    @Value("${oracle.user}")
    private String user;

    @Value("${oracle.password}")
    private String password;

    // Getters
    public String getHost() { return host; }
    public String getPort() { return port; }
    public String getDatabase() { return database; }
    public String getUser() { return user; }
    public String getPassword() { return password; }
}

