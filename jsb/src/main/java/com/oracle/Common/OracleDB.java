package com.oracle.Common;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DataSourceUtils;
import org.springframework.stereotype.Service;

import oracle.security.o3logon.a;

import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;
import javax.sql.DataSource;

import java.sql.CallableStatement;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.sql.Types;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class OracleDB {

  @Autowired
  private MyConfig myConfig;

  // private JdbcTemplate jdbcTemplate;
  private Connection connection;
  private DataSource dataSource;

  @PostConstruct
  public void init() throws SQLException {
    dataSource = createDataSource();
    this.Connect();
    // if (!this.connection.isValid(2)) {
    // }
  }

  private DataSource createDataSource() {
    org.springframework.jdbc.datasource.DriverManagerDataSource dataSource = new org.springframework.jdbc.datasource.DriverManagerDataSource();
    dataSource.setDriverClassName("oracle.jdbc.driver.OracleDriver");
    dataSource
        .setUrl("jdbc:oracle:thin:@" + myConfig.getHost() + ":" + myConfig.getPort() + ":" + myConfig.getDatabase());
    dataSource.setUsername(myConfig.getUser());
    dataSource.setPassword(myConfig.getPassword());
    return dataSource;
  }

  public void Connect() throws SQLException {
    this.connection = DataSourceUtils.getConnection(dataSource);
    if (!this.connection.isValid(2)) {
      throw new SQLException("Failed to establish a connection.");
    } else {
      System.out.println("Connected...");
    }
  }
  // public void Connect() throws SQLException {
  // try {
  // this.connection = DataSourceUtils.getConnection(dataSource);
  // if (this.connection.isValid(2)) {
  // System.out.println("OracleDB Connected...");
  // } else {
  // throw new SQLException("Failed to establish a connection.");
  // }
  // } catch (Exception e) {
  // System.out.println(e);
  // }
  // }

  // public List<Map<String, Object>> Query(String sql, Object[] params) throws
  // SQLException {
  // List<Map<String, Object>> resultList = jdbcTemplate.queryForList(sql,
  // params);
  // return (resultList.size() > 0) ? resultList.stream()
  // .map(this::convertKeysToLowerCase)
  // .collect(Collectors.toList()) : resultList;
  // }
  public List<Map<String, Object>> Query(String sql, Object[] params) throws SQLException {
    return Query(sql, params, null);
  }

  public List<Map<String, Object>> Query(String sql, Object[] params, String[] returningColumns) throws SQLException {
    List<Map<String, Object>> returningValues = new ArrayList<>();
    if (returningColumns != null && returningColumns.length > 0) {
      String placeholders = String.join(", ", returningColumns);
      StringBuilder returningInto = new StringBuilder();
      for (String column : returningColumns) {
        if (returningInto.length() > 0) {
          returningInto.append(", ");
        }
        returningInto.append("?");
      }
      // sql = sql + " RETURNING " + placeholders + " INTO " + returningInto.toString();
    }
    System.out.println(sql);
    try (CallableStatement callableStatement = this.connection.prepareCall(sql.toString())) {

      setParameters(callableStatement, params);
      // Registering the out parameters for the RETURNING INTO clause
      if (returningColumns != null && returningColumns.length > 0) {
        System.out.println(returningColumns[0]);
        // for (int i = 0; i < returningColumns.length; i++) {
        //   callableStatement.registerOutParameter(params.length + i + 1, Types.NUMERIC); // Adjust type as needed
        // }
      }

      if (returningColumns != null && returningColumns.length > 0) {
        Integer id = callableStatement.executeUpdate();
        System.out.println(id + " " +callableStatement.getResultSet());
        Map<String, Object> row = new HashMap<>();
        // for (int i = 0; i < returningColumns.length; i++) {
        //   row.put(returningColumns[i].toLowerCase(),
        //       callableStatement.getObject(params.length + i + 1));
        //   System.out.println(row+ "  " + callableStatement.getObject(params.length + i + 1));
        // }
        if(id != null || id != 0){
          row.put("id", callableStatement.getUpdateCount());
          returningValues.add(row);
        }
        // try (ResultSet rs = callableStatement.getGeneratedKeys()) {
        //   System.out.println(rs);
        //   while (rs.next()) {
        //     // Map<String, Object> row = new HashMap<>();
        //     ResultSetMetaData metaData = rs.getMetaData();
        //     int columnCount = metaData.getColumnCount();
        //     for (int i = 1; i <= columnCount; i++) {
        //       Object value = rs.getObject(i);
        //       if (value instanceof oracle.sql.TIMESTAMP) {
        //         value = ((oracle.sql.TIMESTAMP) value).timestampValue();
        //       }
        //       row.put(metaData.getColumnName(i).toLowerCase(), value);
        //     }
        //     returningValues.add(row);
        //   }
        // }
        return returningValues;
      } else {
        callableStatement.execute();
        try (ResultSet resultSet = callableStatement.getResultSet()) {
          return resultSetToList(resultSet);
        }
      }
      // boolean isResultSet = preparedStatement.execute();

      // System.out.println(isResultSet);
      // if (isResultSet) {
      // try (ResultSet resultSet = callableStatement.getResultSet()) {
      // return resultSetToList(resultSet);
      // }
      // } else {
      // int rowsAffected = callableStatement.getUpdateCount();
      // System.out.println(rowsAffected);
      // if (rowsAffected > 0 && returningColumns != null && returningColumns.length >
      // 0) {
      // try (ResultSet rs = callableStatement.getGeneratedKeys()) {
      // System.out.println(rs);
      // while (rs.next()) {
      // Map<String, Object> row = new HashMap<>();
      // ResultSetMetaData metaData = rs.getMetaData();
      // int columnCount = metaData.getColumnCount();
      // for (int i = 1; i <= columnCount; i++) {
      // Object value = rs.getObject(i);
      // if (value instanceof oracle.sql.TIMESTAMP) {
      // value = ((oracle.sql.TIMESTAMP) value).timestampValue();
      // }
      // row.put(metaData.getColumnName(i).toLowerCase(), value);
      // }
      // returningValues.add(row);
      // }
      // }
      // }
      // return returningValues;
      // }
    } catch (SQLException e) {
      System.err.println("SQL Error: " + e.getMessage());
      throw e;
    }
  }

  private void setParameters(PreparedStatement preparedStatement, Object[] params) throws SQLException {
    if (params != null) {
      for (int i = 0; i < params.length; i++) {
        preparedStatement.setObject(i + 1, params[i]);
      }
    }
  }

  private List<Map<String, Object>> resultSetToList(ResultSet resultSet) throws SQLException {
    List<Map<String, Object>> resultList = new ArrayList<>();
    if (resultSet != null) {
      ResultSetMetaData metaData = resultSet.getMetaData();
      int columnCount = metaData.getColumnCount();

      while (resultSet.next()) {
        Map<String, Object> row = new HashMap<>();
        for (int i = 1; i <= columnCount; i++) {
          row.put(metaData.getColumnName(i).toLowerCase(), resultSet.getObject(i));
        }
        resultList.add(row);
      }
    }

    return resultList;
  }

  public int update(String sql, Object[] params) throws SQLException {
    int rowsAffected = 0;
    try (PreparedStatement preparedStatement = this.connection.prepareStatement(sql)) {
      setParameters(preparedStatement, params);
      rowsAffected = preparedStatement.executeUpdate();
      System.out.println(rowsAffected);
    } catch (SQLException e) {
      System.err.println("SQL Error: " + e.getMessage());
      throw e;
    }
    return rowsAffected;
  }

  private Map<String, Object> convertKeysToLowerCase(Map<String, Object> originalMap) {
    Map<String, Object> data = new HashMap<>();
    originalMap.keySet().forEach(action -> data.put(action.toLowerCase(), originalMap.get(action)));
    try {
      return data;
    } catch (Exception e) {
      System.out.println("Error converting keys to lowercase: " + originalMap + " " + e.getMessage());
    }
    return originalMap;
  }

  public void Begin() throws SQLException {
    // this.connection =
    // DataSourceUtils.getConnection(jdbcTemplate.getDataSource());
    this.connection.setAutoCommit(false);
    System.out.println("Transaction begun successfully.");
  }

  public void Commit() throws SQLException {
    // this.connection =
    // DataSourceUtils.getConnection(jdbcTemplate.getDataSource());
    System.out.println("Commit started.");
    try {
      System.out.println("Commit successfully.");
      this.connection.commit();
    } finally {
      this.connection.setAutoCommit(true);
    }
  }

  public void Rollback() throws SQLException {
    // Connection connection =
    // DataSourceUtils.getConnection(jdbcTemplate.getDataSource());
    System.out.println("Rollback...");
    try {
      connection.rollback();
    } finally {
      connection.setAutoCommit(true);
    }
  }

  public String getVersion() throws SQLException {
    return this.connection.getMetaData().getDatabaseProductVersion();
  }

  @PreDestroy
  public void DBClose() throws SQLException {
    System.out.println("DBClosed...");

    // Connection connection =
    // DataSourceUtils.getConnection(jdbcTemplate.getDataSource());
    if (this.connection != null && !this.connection.isClosed()) {
      this.connection.close();
    }
  }

}
