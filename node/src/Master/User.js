const gn = require("./../Common/GeneralFunctions");
const OracleDB = require("./../Common/Oracle");
const en = require("./../Common/Encryption");
const bcrypt = require("bcrypt");
const { request } = require("express");

async function login(req, payload) {
  let data = req.body;
  let retObj = {};
  const db = new OracleDB();

  try {
    // await db.Begin();

    if (!(payload && payload.secret_key)) {
      throw new Error("Token is not valid / Expired.");
    }

    const secret_key = payload.secret_key;

    let mobile_no_email = data.mobile_no_email || null;
    let pwd = data.pwd || null;

    if (mobile_no_email !== null)
      mobile_no_email = en.decrypt(mobile_no_email, secret_key);
    if (pwd !== null) pwd = en.decrypt(pwd, secret_key);

    if (!mobile_no_email || !pwd) {
      throw new Error("Mobile No. / eMail ID / Password Invalid");
    }

    let sql = `SELECT ID, PASSWORD,
                      (CASE WHEN COALESCE(LOCKOUT_ON, TO_TIMESTAMP(\'1978-02-28\',\'YYYY-MM-DD\')) + INTERVAL \'10\' MINUTE > CURRENT_TIMESTAMP
                            THEN \'T\' ELSE \'F\' END) AS IS_LOCKEDOUT,
                      EXTRACT(MINUTE FROM LOCKOUT_ON + INTERVAL \'11\' MINUTE - CURRENT_TIMESTAMP) AS LOCKOUT_TIME,
                      COALESCE(FAILURE_ATTEMPT, 0) AS FAILURE_ATTEMPT
                 FROM MAS_USERS
                WHERE IS_ACTIVE = \'T\' AND (MOBILE_NO = :1 OR (EMAIL IS NOT NULL AND EMAIL = :1))`;

    // console.log(sql,mobile_no_email);
    await db.Query(sql, [mobile_no_email, mobile_no_email]);
    const rows = await db.FetchAll()
    // console.log(rows);
    if (rows && rows.length <= 0) {
      throw new Error("Mobile No. / eMail ID / Password Invalid");
    }

    const ret_data = rows[0];

    if (ret_data && ret_data.is_lockedout == 'T') {
      retObj.lockout_time = ret_data.lockout_time;
      throw new Error("Lockout");
    }

    const user_id = ret_data.id;
    bcrypt.hash(ret_data.password, 10, (err, hash) => {
      if (err) {
        throw new Error("Error generating hash:", err);
      }
    });
    if (bcrypt.compare(pwd, ret_data.password)) {
      let reg_cuss = await getUsers({ id: user_id }, payload);
      console.log(reg_cuss);
      retObj = reg_cuss && reg_cuss.rows.length > 0 ? reg_cuss.rows[0] : {};
      const ip_address = gn.getIPAddress(req);
      const session_token = gn.generateSecretKey();
      const updateSql = `UPDATE MAS_USERS
                            SET LAST_LOGIN = CURRENT_TIMESTAMP,
                                SESSION_TOKEN = :1,
                                FAILURE_ATTEMPT = 0,
                                LOCKOUT_ON = NULL,
                                IP_ADDRESS = :2
                          WHERE ID = :3`;

      await db.Query(updateSql, [session_token, ip_address, user_id]);

      retObj.message = "User authenticated";
    } else {
      let failure_attempt = ret_data.failure_attempt;
      if (failure_attempt < 4) {
        const updateFailureAttemptSql = `UPDATE MAS_USERS
                                            SET FAILURE_ATTEMPT = COALESCE(FAILURE_ATTEMPT, 0) + 1
                                          WHERE ID = :1
                                          RETURNING FAILURE_ATTEMPT INTO :FAILURE_ATTEMPT`;

      const f_rows = await db.Query(updateFailureAttemptSql, [user_id],['FAILURE_ATTEMPT']);
      const db_failure_attempt = f_rows[0].failure_attempt;

      retObj.message = `Mobile No. / eMail ID / Password Invalid. Attempt ${db_failure_attempt}/5.`;
      } else {
        const updateLockoutSql = `UPDATE MAS_USERS
                                    SET FAILURE_ATTEMPT = COALESCE(FAILURE_ATTEMPT, 0) + 1,
                                        LOCKOUT_ON = CURRENT_TIMESTAMP
                                  WHERE ID = :1`;

        await db.Query(updateLockoutSql, [user_id]);

        retObj.lockout_time = 10;
        retObj.message = "Lockout";
      }
    }

    await db.Commit();
  } catch (error) {
    // console.error(error);
    retObj.message = error.message;
  } finally {
    await db.DBClose(); // Close the database connection
  }
  console.log(retObj);
  return retObj;
}

async function getUsers(filter, payload) {
  // console.log(filter);
  const retObj = {};
  const limit = filter && filter.limit ? filter.limit : null;
  const offset = limit * (filter && filter.offset ? filter.offset : 0);
  let whereClause = "";
  let limit_offset = "";
  let limit_offset_as = "";
  const params = [];

  if (filter.limit) {
    params.push(offset, limit);
    limit_offset = `OFFSET :${params.length} ROWS FETCH NEXT :${params.length - 1} ROWS ONLY`;
    limit_offset_as = `, :${params.length - 1} AS limit, :${params.length} AS offset`;
  }

  if (filter.id) {
    params.push(filter.id);
    whereClause += " AND a.id = :"+ (params.length);
  }

  if (filter.client_id) {
    params.push(filter.client_id);
    whereClause += " AND a.client_id = :"+ (params.length);
  }

  if (filter.search_text && filter.search_text.length > 0) {
    const searchText = `%${filter.search_text}%`;
    params.push(searchText,searchText,searchText);
    whereClause += ` AND (
          UPPER(a.name) like UPPER(:${(params.length - 2)}) OR
          UPPER(a.mobile_no) like UPPER(:${(params.length - 1)}) OR
          (a.email IS NOT NULL AND UPPER(a.email) like UPPER(:${(params.length)}))
      )`;
  }

  if (!filter.include_inactive || filter.include_inactive !== true) {
    whereClause += " AND a.is_active = 'T'";
  }

  const db = new OracleDB(); // Replace YourDatabaseClass with your database handling class

  try {
    // Get total rows
    let sql = `SELECT COUNT(*) AS cnt ${limit_offset_as}
          FROM mas_users a
          WHERE 1=1 ${whereClause}`;

    await db.Query(sql, params);
    let rows = await db.FetchAll();

    rows.forEach((r) => {
      r.cnt = parseInt(r.cnt);
    });
    retObj.tot_rows = rows.length > 0 ? rows[0].cnt : 0;
    // params.push(limit, offset);

    // Get actual data
    sql = `SELECT a.id, a.email, a.mobile_no, a.is_active, a.last_login, 'T' AS is_del, a.name, a.designation_code, b.ref_designation_code,
          b.name designation_name
          FROM mas_users a
          INNER JOIN mas_designations b ON (b.code = a.designation_code)
          WHERE 1=1 ${whereClause}
          ORDER BY a.mobile_no
          ${limit_offset}`;

    await db.Query(sql, params);
    rows = await db.FetchAll();
    console.log(rows);
    const secretKey = payload.secret_key;
    if (rows && rows.length > 0) {
      rows.forEach((r) => {
        // if (r.id !== null) {
        //     const encryptedId = en.encrypt(r.id, secretKey);
        //     r.id = encryptedId;
        // }
        // if (r.designation_code !== null) {
        //     const encryptedDesignationCode = en.encrypt(r.designation_code, secretKey);
        //     r.designation_code = encryptedDesignationCode;
        // }
        r.is_active = r.is_active === 'T';
        r.is_del = r.is_del === 'T';
      });
    }
    retObj.rows = rows;
  } catch (error) {
    console.log(error.message);
    retObj.rows = [];
    retObj.tot_rows = 0;
    // retObj.message = error.message;
  }
  db.DBClose(); // Assuming you have a method to close the database connection
  return retObj;
}

async function getUserMenus(filter, payload) {
  let rows = [];
  let params = [];
  let whereClause = "";
  let id = payload && payload.id && payload.id > 0 ? payload.id : null;

  params.push(id);
  params.push(id);

  if (id !== null) {
    const db = new OracleDB();

    const sql = `SELECT * FROM (SELECT r.code, r.name, r.ref_screen_code, r.router_link, r.order_num, r.icon_name, (SELECT COLUMN_VALUE FROM TABLE(r.RELATED_ROUTER_LINKS))AS RELATED_ROUTER_LINKS
                  FROM mas_screens r
                      INNER JOIN mas_designation_screens dr ON (r.code = ANY(SELECT v.COLUMN_VALUE as SCREEN_CODES FROM TABLE(dr.SCREEN_CODES) v))
                      LEFT OUTER JOIN mas_users u ON (u.designation_code = dr.designation_code)
                WHERE u.id = :1 AND r.is_active = \'T\' AND r.ref_screen_code IS NULL
                UNION
              SELECT r1.code, r1.name, r1.ref_screen_code, r1.router_link, r1.order_num, r1.icon_name, (SELECT COLUMN_VALUE FROM TABLE(r1.RELATED_ROUTER_LINKS))AS RELATED_ROUTER_LINKS
                      FROM mas_screens r1
                          INNER JOIN mas_designation_screens dr1 ON (r1.code = ANY(SELECT v.COLUMN_VALUE as SCREEN_CODES FROM TABLE(dr1.SCREEN_CODES) v))
                          LEFT OUTER JOIN mas_users u1 ON (u1.designation_code = dr1.designation_code)
                      WHERE u1.id = :2 AND r1.is_active = \'T\' AND r1.ref_screen_code IS NOT NULL)
                ORDER BY order_num`;

    try {
      await db.Query(sql, params);
      rows = await db.FetchAll();
      // rows.forEach((r) => {
      //   r.order_num = parseInt(r.order_num);
      //   r.related_router_links = r.related_router_links
      //     ? JSON.parse(r.related_router_links)
      //     : null;
      // });
    } catch (error) {
      console.error(error);
    }
    db.DBClose();
  }

  return rows;
}

async function isEmailExist(data, payload) {
  let email = data.email || null;
  const designation_code = data.designation_code || null;
  const id = data.id || (payload.id > 0 ? payload.id : null);
  let rows = [];

  const secret_key = payload.secret_key;

  let params = [email];

  const db = new OracleDB();

  if (email !== null) {
    email = en.decrypt(email, secret_key);
  }

  let where_clause = "";

  // Uncomment the following block if you need to use id in the query
  // if (id !== null) {
  //   params.push(id);
  //   where_clause = 'AND id != ?';
  // }

  if (["SB", "SP", "MB", "CLIENT"].includes(designation_code)) {
    params.push(designation_code);
    const sql =
      `SELECT email, designation_code FROM mas_users WHERE is_active = 'T' AND email IS NOT NULL AND designation_code IS NOT NULL AND email = :1 AND designation_code = :2 ` +
      where_clause;

    await db.Query(sql, params);
    rows = await db.FetchAll();
  } else {
    const sql =
      `SELECT email, designation_code FROM mas_users WHERE is_active = 'T' AND email IS NOT NULL AND email = :1 ` +
      where_clause;

    await db.Query(sql, params);
    rows = await db.FetchAll();
  }

  return rows && rows.length > 0;
}

async function isMobileNoExist(data, payload) {
  let mobile_no = data.mobile_no || null;
  const designation_code = data.designation_code || null;
  const id = data.id || (payload.id > 0 ? payload.id : null);
  const secret_key = payload.secret_key;

  let params = [mobile_no];
  let rows = [];
  const db = new OracleDB();

  if (mobile_no !== null) {
    mobile_no = en.decrypt(mobile_no, secret_key);
  }

  let where_clause = "";

  // Uncomment the following block if you need to use id in the query
  // if (id !== null) {
  //   params.push(id);
  //   where_clause = 'AND id != ?';
  // }

  if (["SB", "SP", "MB", "CLIENT"].includes(designation_code)) {
    params.push(designation_code);
    const sql =
      `SELECT mobile_no, designation_code
      FROM mas_users
      WHERE is_active = 'T' AND mobile_no IS NOT NULL AND
      designation_code IS NOT NULL AND mobile_no = :1 AND designation_code = :2 `+
      where_clause;

    await db.Query(sql, params);
    rows = await db.FetchAll();
  } else {
    const sql =
      `SELECT mobile_no, designation_code
      FROM mas_users
      WHERE is_active = 'T' AND mobile_no IS NOT NULL AND mobile_no = :1 ` +
      where_clause;

    await db.Query(sql, params);
    rows = await db.FetchAll();
  }

  return rows && rows.length > 0;
}

async function logout(data, payload) {
  let retObj = {};
  const db = new OracleDB();
  try {
    // db.Begin();

    if (!payload || !payload.secret_key) {
      throw new Error("Token is not valid / Expired.");
    }
    const secret_key = payload.secret_key;

    // Key(encrypted) fields
    const session_id = data.session_id || null;

    const id = session_id ? parseInt(en.decrypt(session_id, secret_key)) : null;

    if (id && id > 0) {
      const sql =
        "UPDATE mas_users SET last_login = NULL, session_token = NULL WHERE id = :1";
      await db.Query(sql, [id]);

      // Log Registered Customer Action
      // You'll need to implement the equivalent functionality for logging user actions in Node.js

      // Remove secret_key from payload
      delete payload.secret_key;
      if (payload.user_type) {
        delete payload.user_type;
      }
      if (payload.id) {
        delete payload.id;
      }

      retObj.message = "User logout successful.";
    }

    db.Commit();
  } catch (error) {
    db.Rollback();
    // Adjust error handling according to your application needs
    retObj.message = "Error occurred during logout: " + error.message;
  }
  db.DBClose();
  return retObj;
}

async function saveUser(data, payload) {
  let retObj = { id: null, message: "User cannot be saved." };

  let name = (data && data.hasOwnProperty('name'))? data.name: null;
  let designation_code = (data && data.hasOwnProperty('designation_code'))? data.designation_code: null;
  let mobile_no = (data && data.hasOwnProperty('mobile_no'))? data.mobile_no: null;
  let email = (data && data.hasOwnProperty('email'))? data.email: null;
  let remark = (data && data.hasOwnProperty('remark'))? data.remark: null;
  let cre_by = (data && data.hasOwnProperty('cre_by'))? data.cre_by: null;
  let up_by = (data && data.hasOwnProperty('up_by'))? data.up_by: null;
  let id = (data && data.hasOwnProperty('id'))? data.id: null;
  let pwd = (data && data.hasOwnProperty('pwd'))? data.pwd: null;

  const db = new OracleDB();
  try {
    // db.Begin();
    if (!payload || !payload.secret_key) {
      throw new Error("Token is not valid / Expired.");
    }
    const secret_key = payload.secret_key;

    // Decrypt encrypted fields
    if (pwd) pwd = en.decrypt(pwd, secret_key);
    if (mobile_no) mobile_no = en.decrypt(mobile_no, secret_key);
    if (email) email = en.decrypt(email, secret_key);
    if (designation_code) designation_code = en.decrypt(designation_code, secret_key);

    let sql = "";
    let params = [];
    pwd = bcrypt.hash(pwd, 10)
    if (id === null || id === undefined) {
      sql = `INSERT INTO mas_users
                    (name, designation_code, mobile_no, email, password, remarks, cre_by)
                  VALUES (:1, :2, :3, :4, :5, :6, :7) RETURNING id INTO :id`;

      params = [ name, designation_code, mobile_no, email, pwd, remark, cre_by];
      rows = await db.Query(sql, params, ['id']);
    } else {
      sql = `UPDATE mas_users SET
                      name = :1, designation_code = :2, mobile_no = :3, email = :4,
                      remarks = :5, up_by = :6, up_dt = CURRENT_DATE
                    WHERE id = :7`;

      params = [ name, designation_code, mobile_no, email, remark, up_by, id];
      rows = await db.Query(sql, params);
    }

    // rows = await db.FetchAll();
    console.log(rows);
    if (rows) {
      retObj = {
        id: id?id: rows.lastRowid,
        message: id ? "User updated successfully." : "User saved successfully.",
      };
    }
    db.Commit();
  } catch (error) {
    console.error("Error saving user:", error);
    db.Rollback();
    throw error;
  }
  db.DBClose()
  return retObj;
}


async function toggleUserStatus(data) {
  const retObj = { message: "Invalid ." };
  const id = data.id || null;
  const is_active = data.is_active === true ? "T" : "F";
  const user_id = data.user_id || null;

  const db = new OracleDB();

  try {

    if (id !== null) {
      const sql = "UPDATE mas_users SET is_active = :1 WHERE id = :2";
      await db.Query(sql, [is_active, id]);

      retObj.message = "User status changed successfully.";
    }
    await db.Commit();
  } catch (error) {
    // Handle errors here
    retObj.message = error.message;
  }
  await db.DBClose();

  return retObj;
}

module.exports = { login, getUsers, getUserMenus, isEmailExist, logout, isMobileNoExist, saveUser, toggleUserStatus };
