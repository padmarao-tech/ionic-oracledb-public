package com.oracle.Master;

import com.oracle.Common.OracleDB;
import com.oracle.Common.Encryption;
import com.oracle.Common.GeneralFunctions;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

// import java.math.BigDecimal;
import java.sql.SQLException;
import java.util.ArrayList;
// import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class User {

  @Autowired
  private OracleDB db;

  @Autowired
  private GeneralFunctions generalFunctions;

  @Autowired
  private Encryption encryption;

  //#region Login
  public Map<String, Object> login(@RequestBody Map<String, Object> data, Map<String, Object> payload)
      throws SQLException {
    Map<String, Object> retObj = new HashMap<>();
    db.Connect();

    try {
      // db.Begin();
      if (!(payload != null && payload.get("secret_key") != null)) {
        throw new Exception("Token is not valid / Expired.");
      }

      String secretKey = (String) payload.get("secret_key");
      String mobileNoEmail = (String) data.getOrDefault("mobile_no_email", null);
      String pwd = (String) data.getOrDefault("pwd", null);

      if (mobileNoEmail != null)
        mobileNoEmail = encryption.decrypt(mobileNoEmail, secretKey);
      if (pwd != null)
        pwd = encryption.decrypt(pwd, secretKey);

      if (mobileNoEmail == null || pwd == null) {
        throw new Exception("Mobile No. / eMail ID / Password Invalid");
      }

      String sql = "SELECT ID, PASSWORD, " +
          "(CASE WHEN COALESCE(LOCKOUT_ON, TO_TIMESTAMP('1978-02-28', 'YYYY-MM-DD')) + INTERVAL '10' MINUTE > CURRENT_TIMESTAMP "
          +
          "THEN 'T' ELSE 'F' END) AS IS_LOCKEDOUT, " +
          "EXTRACT(MINUTE FROM LOCKOUT_ON + INTERVAL '11' MINUTE - CURRENT_TIMESTAMP) AS LOCKOUT_TIME, " +
          "COALESCE(FAILURE_ATTEMPT, 0) AS FAILURE_ATTEMPT " +
          "FROM MAS_USERS " +
          "WHERE IS_ACTIVE = 'T' AND (MOBILE_NO = ? OR (EMAIL IS NOT NULL AND EMAIL = ?))";

      List<Map<String, Object>> rows = db.Query(sql, new Object[] { mobileNoEmail, mobileNoEmail });
      System.out.println(rows);
      if (rows.isEmpty()) {
        throw new Exception("Mobile No. / eMail ID / Password Invalid");
      }

      Map<String, Object> retData = rows.get(0);

      if (retData.get("is_lockedout").equals("T")) {
        retObj.put("lockout_time", retData.get("lockout_time"));
        throw new Exception("Lockout");
      }

      Long userId = Long.parseLong(retData.get("id").toString());
      String hashedPassword = retData.get("password").toString();
      BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
      if (passwordEncoder.matches(pwd, hashedPassword)) {
        List<Map<String, Object>> regCuss = (List<Map<String, Object>>) getUsers(Map.of("id", userId), payload)
            .get("rows");
        System.out.println(regCuss);
        // Ensure regCuss is not null or empty, then get the first row safely
        if (regCuss != null && !regCuss.isEmpty()) {
          Map<String, Object> firstRow = regCuss.get(0);
          retObj = new HashMap<>(firstRow); // Ensure retObj is assigned a new HashMap based on the first row
        } else {
          retObj = new HashMap<>(); // Initialize retObj as an empty map if regCuss is null or empty
        }
        // Map<String, Object> row = (regCuss != null) ? (Map<String, Object>)
        // regCuss.get(0) : new HashMap<>();
        // retObj.put("id", row.get("id"));
        String ip_address = (String) payload.get("ipaddress");
        String sessionToken = generalFunctions.generateSecretKey();

        String updateSql = "UPDATE MAS_USERS " +
            "SET LAST_LOGIN = CURRENT_TIMESTAMP, " +
            "SESSION_TOKEN = ?, " +
            "FAILURE_ATTEMPT = 0, " +
            "LOCKOUT_ON = NULL, " +
            "IP_ADDRESS = ? " +
            "WHERE ID = ?";
        retObj.put("session_token", sessionToken);
        System.out.println(sessionToken + " " + ip_address + " " + userId);
        db.Query(updateSql, new Object[] { sessionToken, ip_address, userId });
        retObj.put("message", "User authenticated");
      } else {
        int failureAttempt = Integer.parseInt(retData.get("FAILURE_ATTEMPT").toString());
        if (failureAttempt < 4) {
          String updateFailureAttemptSql = "UPDATE MAS_USERS " +
              "SET FAILURE_ATTEMPT = COALESCE(FAILURE_ATTEMPT, 0) + 1 " +
              "WHERE ID = ?";

          db.Query(updateFailureAttemptSql, new Object[] { userId });
          retObj.put("message", "Mobile No. / eMail ID / Password Invalid. Attempt " + (failureAttempt + 1) + "/5.");
        } else {
          String updateLockoutSql = "UPDATE MAS_USERS " +
              "SET FAILURE_ATTEMPT = COALESCE(FAILURE_ATTEMPT, 0) + 1, " +
              "LOCKOUT_ON = CURRENT_TIMESTAMP " +
              "WHERE ID = ?";

          db.Query(updateLockoutSql, new Object[] { userId });
          retObj.put("lockout_time", 10);
          retObj.put("message", "Lockout");
        }
      }
      // db.Commit();
    } catch (Exception e) {
      retObj.put("message", e.getMessage());
      // db.Rollback();
    }
    db.DBClose();
    System.out.println("retObj: " + retObj);
    return retObj;
  }
  //#endregion Login

  //#region getUsers
  public Map<String, Object> getUsers(Map<String, Object> filter, Map<String, Object> payload) throws SQLException {
    Map<String, Object> retObj = new HashMap<>();
    List<Object> params = new ArrayList<>();
    String whereClause = "";
    String limitOffset = "";
    String limitOffsetAs = "";

    if (filter.containsKey("limit")) {
      int limit = Integer.parseInt(filter.get("limit").toString());
      int offset = limit * (filter.containsKey("offset") ? Integer.parseInt(filter.get("offset").toString()) : 0);
      params.add(offset);
      params.add(limit);
      limitOffset = "OFFSET ? ROWS FETCH NEXT ? ROWS ONLY";
      limitOffsetAs = ", ? AS limit, ? AS offset";
    }

    if (filter.containsKey("id")) {
      params.add(filter.get("id"));
      whereClause += " AND a.id = ?";
    }

    if (filter.containsKey("client_id")) {
      params.add(filter.get("client_id"));
      whereClause += " AND a.client_id = ?";
    }

    if (filter.containsKey("search_text") && !filter.get("search_text").toString().isEmpty()) {
      String searchText = "%" + filter.get("search_text") + "%";
      params.add(searchText);
      params.add(searchText);
      params.add(searchText);
      whereClause += " AND (UPPER(a.name) LIKE UPPER(?) OR UPPER(a.mobile_no) LIKE UPPER(?) OR (a.email IS NOT NULL AND UPPER(a.email) LIKE UPPER(?)))";
    }

    if (!filter.containsKey("include_inactive") || !(boolean) filter.get("include_inactive")) {
      whereClause += " AND a.is_active = 'T'";
    }

    try {
      db.Connect();
      String sql = "SELECT COUNT(*) AS cnt " + limitOffsetAs +
          " FROM mas_users a " +
          " WHERE 1=1 " + whereClause;

      List<Map<String, Object>> rows = db.Query(sql, params.toArray());
      retObj.put("tot_rows", rows.size() > 0 ? Integer.parseInt(rows.get(0).get("cnt").toString()) : 0);

      sql = "SELECT a.id, a.email, a.mobile_no, a.is_active, 'T' AS is_del, a.name, a.designation_code, b.ref_designation_code, "
          +
          "b.name designation_name " +
          "FROM mas_users a " +
          "INNER JOIN mas_designations b ON (b.code = a.designation_code) " +
          "WHERE 1=1 " + whereClause +
          "ORDER BY a.mobile_no " +
          limitOffset;
      rows = db.Query(sql, params.toArray());
      // System.out.println(rows);
      if (rows.size() > 0) {
        rows.forEach(r -> {
          r.put("is_active", r.get("is_active").equals("T"));
          r.put("is_del", r.get("is_del").equals("T"));
        });
      }
      retObj.put("rows", rows);
    } catch (SQLException e) {
      retObj.put("message", e.getMessage());
    }
    return retObj;
  }
  //#endregion getUsers

  //#region checkUserSessionToken
  public void checkUserSessionToken(Map<String, Object> data) throws Exception {

    db.Connect();
    try {
      if (data.containsKey("id") && data.containsKey("session_token")) {
        Integer id = (Integer) data.get("id");
        String sessionToken = (String) data.get("session_token");

        String sql = "SELECT id, designation_code FROM mas_users WHERE id = ? AND COALESCE(session_token, '') = ?";
        Object[] params = { id, sessionToken };
        List<Map<String, Object>> user = db.Query(sql, params);
        System.out.println(user);
        if (user == null || user.size() == 0) {
          throw new Exception(
              "Your current session terminated, since you created a new session with new login.");
        }
      } else {
        throw new Exception("Token is not valid / Expired.");
      }
    } catch (Exception e) {
      System.out.println(e.getMessage());
      throw new Exception("An error occurred while checking the session token.");
    }
    db.DBClose();
  }
  //#endregion checkUserSessionToken

  //#region isEmailExist
  public boolean isEmailExist(Map<String, Object> data, Map<String, Object> payload) throws Exception {
    Integer id = data.containsKey("id")? (Integer) data.get("id"): null;
    String email = data.containsKey("email")? (String) data.get("email"): null;
    List<Object> params = new ArrayList<>();

    if (!(payload != null && payload.get("secret_key") != null)) {
      throw new Exception("Token is not valid / Expired.");
    }
    String secret_key = (String) payload.get("secret_key");

    String where_clause = "";
    if (email != null){
      email = encryption.decrypt(email, secret_key);
      params.add(email);
      where_clause += " AND email = ?";
    }

    if(id != null) {
      params.add(id);
      where_clause += " AND id = ?";
    }

    db.Connect();
    String sql = "SELECT email, designation_code FROM mas_users WHERE is_active = 'T' AND email IS NOT NULL " + where_clause;
    List<Map<String, Object>> rows = db.Query(sql, params.toArray());
    db.DBClose();
    return !rows.isEmpty();
  }
  //#endregion isEmailExist

  //#region isMobileNoExist
  public boolean isMobileNoExist(Map<String, Object> data, Map<String, Object> payload) throws Exception {
    Integer id = data.containsKey("id")? (Integer) data.get("id"): null;
    String mobile_no = data.containsKey("mobile_no")? (String) data.get("mobile_no"): null;
    List<Object> params = new ArrayList<>();

    if (!(payload != null && payload.get("secret_key") != null)) {
      throw new Exception("Token is not valid / Expired.");
    }
    String secret_key = (String) payload.get("secret_key");

    String where_clause = "";
    if (mobile_no != null){
      mobile_no = encryption.decrypt(mobile_no, secret_key);
      params.add(mobile_no);
      where_clause += " AND mobile_no = ?";
    }

    if(id != null) {
      params.add(id);
      where_clause += " AND id = ?";
    }

    db.Connect();
    String sql = "SELECT mobile_no, designation_code FROM mas_users WHERE is_active = 'T' AND mobile_no IS NOT NULL " + where_clause;
    List<Map<String, Object>> rows = db.Query(sql, params.toArray());
    System.out.println(rows+" "+ rows.isEmpty() +" " + params);
    db.DBClose();
    return !rows.isEmpty();
  }
  //#endregion isMobileNoExist

  //#region deleteUser
  public Object deleteUser(Map<String, Object> data) throws SQLException {
    Integer id = data.containsKey("id")? (Integer) data.get("id"): null;
    Map<String, Object> row = new HashMap<>();
    if(id != null){

      db.Connect();
      try {
        String sql = "DELETE FROM mas_users WHERE id = ?";
        db.Query(sql, new Object[] { id });
        row.put("message", "User deleted successfully.");
      } catch (Exception e) {
        row.put("message", e.getMessage());
        // TODO: handle exception
      }
      db.DBClose();
    }
    return row;
  }
  //#endregion deleteUser

  //#region logout
  public String logout(@RequestBody Map<String, Object> filter, Map<String, Object> payload) throws SQLException {
    db.Connect();
    Long id = payload.containsKey("id") ? Long.parseLong(payload.get("id").toString()) : null;
    String sql = "UPDATE mas_users SET last_login = NULL, session_token = NULL WHERE id = ? ";
    String[] returnValues = { "id" };
    List<Map<String, Object>> rows = db.Query(sql, new Object[] { id },returnValues);
    System.out.println(rows);
    db.DBClose();
    return rows.size() > 0 ? "User logout successful." : "Error occurred during logout.";
  }
  //#endregion logout

  //#region saveUser
  public Map<String, Object> saveUser(Map<String, Object> userData, Map<String, Object> payload) throws Exception {
    Map<String, Object> retObj = new HashMap<>();

    String name = (String) userData.get("name");
    String designationCode = (String) userData.get("designation_code");
    String mobileNo = (String) userData.get("mobile_no");
    String email = (String) userData.get("email");
    String remark = (String) userData.get("remark");
    String createdBy = (String) userData.get("cre_by");
    String updatedBy = (String) userData.get("up_by");
    Long id = userData.containsKey("id") ? Long.valueOf(userData.get("id").toString()) : null;
    String pwd = (String) userData.get("pwd");
    BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    if (pwd != null) {
      pwd = passwordEncoder.encode(pwd);
    }
    if (!(payload != null && payload.get("secret_key") != null)) {
      throw new Exception("Token is not valid / Expired.");
    }

    String secretKey = (String) payload.get("secret_key");
    designationCode = encryption.decrypt(designationCode,secretKey);
    email = encryption.decrypt(email,secretKey);
    mobileNo = encryption.decrypt(mobileNo,secretKey);

    List<Object> params = new ArrayList<>();
    params.add(name);
    params.add(designationCode);
    params.add(mobileNo);
    params.add(email);
    params.add(remark);
    db.Connect();
    if (id == null) {
      params.add(pwd);
      params.add(createdBy);
      String sql = "INSERT INTO mas_users (name, designation_code, mobile_no, email, remarks, password, cre_by) VALUES (?, ?, ?, ?, ?, ?, ?)";
      List<Map<String, Object>> row = db.Query(sql, params.toArray());
      System.out.println(row);
      retObj.put("id", null);
    } else {
      params.add(updatedBy);
      params.add(id);
      System.out.println(params);
      String sql = "UPDATE mas_users SET name = ?, designation_code = ?, mobile_no = ?, email = ?, remarks = ?, up_by = ?, up_dt = CURRENT_DATE WHERE id = ?";
      db.Query(sql, params.toArray());
    }
    db.DBClose();
    retObj.put("message", id == null ? "User saved successfully." : "User updated successfully.");
    return retObj;
  }
  //#endregion saveUser

  //#region toggleUserStatus
  public String toggleUserStatus(Map<String, Object> data) throws SQLException {
    System.out.println(data);
    String isActive = (data.get("is_active") == "true") ? "T" : "F";
    String id = (data.get("id") != null) ? (String) data.get("id") : null;

    db.Connect();

    String sql = "UPDATE mas_users SET is_active = ? WHERE id = ?";
    List<Map<String, Object>> updatedRows = db.Query(sql, new Object[] { isActive, id });

    db.DBClose();
    return updatedRows.size() > 0 ? "User status changed successfully." : "Error changing user status.";
  }
  //#endregion toggleUserStatus

  //#region getUserMenus
  public List<Map<String, Object>> getUserMenus(@RequestBody Map<String, Object> filter, Map<String, Object> payload)
      throws SQLException {
    List<Map<String, Object>> rows = new ArrayList<>();
    Long id = payload.containsKey("id") ? Long.parseLong(payload.get("id").toString()) : null;
    db.Connect();
    if (id != null) {
      String sql = "SELECT * FROM (SELECT r.code, r.name, r.ref_screen_code, r.router_link, r.order_num, r.icon_name, (SELECT COLUMN_VALUE FROM TABLE(r.RELATED_ROUTER_LINKS)) AS RELATED_ROUTER_LINKS "
          +
          "FROM mas_screens r " +
          "INNER JOIN mas_designation_screens dr ON (r.code = ANY(SELECT v.COLUMN_VALUE as SCREEN_CODES FROM TABLE(dr.SCREEN_CODES) v)) "
          +
          "LEFT OUTER JOIN mas_users u ON (u.designation_code = dr.designation_code) " +
          "WHERE u.id = ? AND r.is_active = 'T' AND r.ref_screen_code IS NULL " +
          "UNION " +
          "SELECT r1.code, r1.name, r1.ref_screen_code, r1.router_link, r1.order_num, r1.icon_name, (SELECT COLUMN_VALUE FROM TABLE(r1.RELATED_ROUTER_LINKS)) AS RELATED_ROUTER_LINKS "
          +
          "FROM mas_screens r1 " +
          "INNER JOIN mas_designation_screens dr1 ON (r1.code = ANY(SELECT v.COLUMN_VALUE as SCREEN_CODES FROM TABLE(dr1.SCREEN_CODES) v)) "
          +
          "LEFT OUTER JOIN mas_users u1 ON (u1.designation_code = dr1.designation_code) " +
          "WHERE u1.id = ? AND r1.is_active = 'T' AND r1.ref_screen_code IS NOT NULL) " +
          "ORDER BY order_num";

      rows = db.Query(sql, new Object[] { id, id });

      for (Map<String, Object> row : rows) {
        row.put("order_num", (Integer) row.get("id"));
        // row.put("related_router_links", Arrays.asList(((String) row.get("related_router_links")).split(",")));
      }
    }
    System.out.println(rows);
    db.DBClose();
    return rows;
  }
  //#endregion getUserMenus
}
