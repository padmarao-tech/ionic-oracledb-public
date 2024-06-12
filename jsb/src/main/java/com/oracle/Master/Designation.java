package com.oracle.Master;

import com.oracle.Common.OracleDB;

import oracle.net.aso.l;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.sql.SQLException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class Designation {

  @Autowired
  private OracleDB db;

  public List<Map<String, Object>> getDesignationsRootWise(Map<String, Object> filter) throws SQLException {
    String refDesignationCode = filter.containsKey("refDesignationCode") ? (String) filter.get("refDesignationCode")
        : null;

    String sql = "SELECT mas.get_json_designations(?) AS data";
    List<Map<String, Object>> rows = db.Query(sql, new Object[] { refDesignationCode });

    for (Map<String, Object> row : rows) {
      if (row.containsKey("data")) {
        row.put("data", new org.json.JSONObject(row.get("data").toString()).toMap());
      }
    }

    return rows.isEmpty() ? List.of() : (List<Map<String, Object>>) rows.get(0).get("data");
  }

  public Map<String, Object> getDesignations(Map<String, Object> filter) throws SQLException {
    Map<String, Object> retObj = new HashMap<>();
    retObj.put("rows", List.of());
    retObj.put("tot_rows", 0);
    retObj.put("message", null);

    System.out.println(filter);
    Integer limit = filter.containsKey("limit") ? (Integer) filter.get("limit") : null;
    Integer offset = ((limit != null) ? limit : 0) * ((filter.containsKey("offset") && filter.get("offset") != null) ? (Integer) filter.get("offset") : 0);

    StringBuilder whereClause = new StringBuilder(" WHERE 1=1 ");
    StringBuilder limitOffset = new StringBuilder();
    List<Object> params = new ArrayList<>();

    if (limit != null) {
      // params = new Object[] { limit, offset };
      params.add(offset);
      params.add(limit);
      limitOffset.append(" OFFSET ? ROWS FETCH NEXT ? ROWS ONLY");
    }

    if (filter.containsKey("code") && filter.get("code") != null) {
      whereClause.append(" AND code = ? ");
      // params = appendToArray(params, filter.get("code"));
      params.add(filter.get("code"));
    }

    if (filter.containsKey("includeInactive") && !(boolean) filter.get("includeInactive")) {
      whereClause.append(" AND a.is_active = 'T' ");
    }

    if (filter.containsKey("searchText") && filter.get("searchText") != null) {
      String searchText = "%" + filter.get("searchText") + "%";
      whereClause.append(" AND (UPPER(a.name) LIKE UPPER(?) OR UPPER(a.code) LIKE UPPER(?)) ");
      // params = appendToArray(params, searchText, searchText);
      params.add(searchText);
      params.add(searchText);
    }
    db.Connect();
    String sql = "SELECT a.code, a.name, a.ref_designation_code, a.is_active, " +
        "(CASE WHEN COUNT(b.id) > 0 THEN 'F' ELSE 'T' END) is_del " +
        "FROM MAS_DESIGNATIONS a " +
        "LEFT JOIN MAS_USERS b ON (b.designation_code = a.code) " +
        whereClause +
        "GROUP BY a.code, a.name, a.ref_designation_code, a.is_active " +
        "ORDER BY a.name " +
        limitOffset;
    System.out.println(params);
    List<Map<String, Object>> rows = db.Query(sql, params.toArray());
    for (Map<String, Object> row : rows) {
      row.put("is_del", row.get("is_del").equals("T"));
      row.put("is_active", row.get("is_active").equals("T"));
    }

    retObj.put("rows", rows);

    if (limit != null && rows.size() == limit) {
      sql = "SELECT COUNT(*) AS cnt FROM mas_designations a " + whereClause;
      List<Map<String, Object>> totRows = db.Query(sql, params.toArray());
      retObj.put("tot_rows", totRows.get(0).get("cnt"));
    } else {
      retObj.put("tot_rows", limit != null ? offset - limit : 0 + rows.size());
    }
    db.DBClose();
    return retObj;
  }

  public Map<String, Object> deleteDesignation(Map<String, Object> data) throws SQLException {
    Map<String, Object> retVal = new HashMap<>();
    String code = (String) data.get("code");
    db.Connect();
    try {
      if (code != null) {
        String sql = "DELETE FROM mas_designations WHERE code = ?";
        db.update(sql, new Object[] { code });
        retVal.put("message", "Designation deleted successfully.");
      }
      // db.Commit();
    } catch (SQLException e) {
      // db.Rollback();
      retVal.put("message", e.getMessage());
      throw new RuntimeException("Internal Server Error", e);
    }
    db.DBClose();

    return retVal;
  }

  public Map<String, Object> saveDesignation(Map<String, Object> data) throws SQLException {
    Map<String, Object> retVal = new HashMap<>();
    retVal.put("message", "User cannot be saved.");

    String name = (String) data.get("name");
    String code = ((String) data.get("code")).toUpperCase();
    String creBy = (String) data.get("cre_by");
    String upBy = (String) data.get("up_by");

    Object[] params = new Object[] { name, code };

    db.Connect();
    try {
      String sql = "SELECT * FROM mas_designations WHERE code = ?";
      List<Map<String, Object>> rows = db.Query(sql, new Object[] { code });

      if (rows.isEmpty()) {
        sql = "INSERT INTO mas_designations (name, code, cre_by) VALUES (?, ?, ?)";
        db.update(sql, new Object[] { name, code, creBy });
        retVal.put("message", "Designation saved successfully.");
      } else {
        sql = "UPDATE mas_designations SET name = ?, up_by = ?, up_dt = CURRENT_DATE WHERE code = ?";
        db.update(sql, new Object[] { name, upBy, code });
        retVal.put("message", "Designation updated successfully.");
      }
      // db.Commit();
    } catch (SQLException e) {
      // db.Rollback();
      retVal.put("message", e.getMessage());
      throw new RuntimeException("Internal Server Error", e);
    }
    db.DBClose();

    return retVal;
  }

  public boolean isDesignationCodeExist(Map<String, Object> data) throws SQLException {
    String designationCode = (String) data.get("designation_code");

    String sql = "SELECT code FROM mas_designations WHERE code = ?";
    List<Map<String, Object>> rows = db.Query(sql, new Object[] { designationCode });

    return !rows.isEmpty();
  }

  public boolean isDesignationNameExist(Map<String, Object> data) throws SQLException {
    String designationName = (String) data.get("designation_name");

    String sql = "SELECT name FROM mas_designations WHERE name = ?";
    List<Map<String, Object>> rows = db.Query(sql, new Object[] { designationName });

    return !rows.isEmpty();
  }

  public Map<String, Object> toggleDesignationStatus(Map<String, Object> data) throws SQLException {
    Map<String, Object> retObj = new HashMap<>();
    retObj.put("message", "Invalid.");

    String code = (String) data.get("code");
    String isActive = (Boolean) data.get("is_active") ? "T" : "F";

    try {
      if (code != null) {
        String sql = "UPDATE mas_designations SET is_active = ? WHERE code = ?";
        db.update(sql, new Object[] { isActive, code });
        retObj.put("message", "Designation status changed successfully.");
      }
      db.Commit();
    } catch (SQLException e) {
      db.Rollback();
      retObj.put("message", e.getMessage());
      throw new RuntimeException("Internal Server Error", e);
    } finally {
      db.DBClose();
    }

    return retObj;
  }

  private Object[] appendToArray(Object[] array, Object... elements) {
    Object[] newArray = new Object[array.length + elements.length];
    System.arraycopy(array, 0, newArray, 0, array.length);
    System.arraycopy(elements, 0, newArray, array.length, elements.length);
    return newArray;
  }
}
