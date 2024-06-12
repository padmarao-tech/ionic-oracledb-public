const gn = require("./../Common/GeneralFunctions");
const OracleDB = require("./../Common/Oracle");
const en = require("./../Common/Encryption");
const bcrypt = require("bcrypt");
const { request } = require("express");

async function getDesignations(filter) {
  const retObj = { rows: [], tot_rows: 0, message: null };

  const db = new OracleDB();
  const limit = filter && filter.limit ? filter.limit : null;
  const offset = limit * (filter && filter.offset ? filter.offset : 0);
  try {
    let where_clause = "";
    let params = [];

    let limit_offset = ``;
    let limit_offset_as = ``;

    if (filter.limit) {
      params.push(offset, limit);
      limit_offset = `OFFSET :${params.length - 1} ROWS FETCH NEXT :${params.length} ROWS ONLY`;
      limit_offset_as = `, :${params.length - 1} AS limit, :${params.length} AS offset`;
    }

    if (filter.code && typeof filter.code === "string") {
      params.push(filter.code);
      where_clause += " AND code = :"+params.length;
    }

    if (!filter.include_inactive) {
      where_clause += " AND a.is_active = \'T\'";
    }

    if (filter.search_text && filter.search_text != '') {
      const search_text = "%" + filter.search_text + "%";
      params.push(search_text, search_text);
      where_clause += ` AND (
        UPPER(a.name) LIKE UPPER(:${params.length - 1}) OR
        UPPER(a.code) LIKE UPPER(:${params.length})
      )`;
    }
    const countQuery = `
    SELECT COUNT(*) AS cnt ${limit_offset_as}
    FROM mas_designations a
    WHERE 1=1 ${where_clause}`;
    
    await db.Query(countQuery, params);
    const countResult = await db.FetchAll();
    retObj.tot_rows = countResult.length > 0 ? countResult[0].cnt : 0;
    // params.push(offset, limit);

    const sql = `
    SELECT *
    From (SELECT a.code, a.name, a.ref_designation_code, a.is_active,
                  (case when count(b.id) > 0 then \'F\' ELSE \'T\' END)is_del,
                  ROW_NUMBER() OVER (ORDER BY a.NAME DESC) AS RN
            FROM MAS_DESIGNATIONS a
                  LEFT JOIN MAS_USERS b on (b.designation_code = a.code)
            WHERE 1=1 ${where_clause}
         GROUP BY a.code, a.name, a.ref_designation_code, a.is_active
          )a
      ORDER BY name 
      ${limit_offset}`;
      
    await db.Query(sql, params);
    const result = await db.FetchAll();

    retObj.rows = result.map((r) => ({
      ...r,
      is_del: r.is_del === 'T',
      is_active: r.is_active === 'T',
    }));
  } catch (error) {
    console.log(error);
    retObj.message = error.message;
  }
  db.DBClose();

  return retObj;
}

async function toggleDesignationStatus(data) {
  const retObj = { message: "Invalid ." };
  const code = data.code || null;
  const is_active = data.is_active === true ? "T" : "F";
  const user_id = data.user_id || null;

  const db = new OracleDB();

  try {

    if (code !== null) {
      const sql = "UPDATE mas_designations SET is_active = :1 WHERE code = :2";
      await db.Query(sql, [is_active, code]);

      retObj.message = "Designation status changed successfully.";
    }

    db.Commit();
  } catch (error) {
    // Handle errors here
    retObj.message = error.message;
  }
  await db.DBClose();
  return retObj;
}

async function saveDesignation(data) {
  const retVal = { message: "User cannot be saved." };
  const name = data.name || null;
  const code = data.code ? data.code.toUpperCase() : null;
  const cre_by = data.cre_by || null;
  const up_by = data.up_by || null;

  try {
    const db = new OracleDB();

    if (!/^[A-Za-z()._ ]*$/.test(name) || !/^[A-Za-z()._ ]*$/.test(code)) {
      throw new Error("Invalid pattern. Please check your input.");
    }

    let sql = "SELECT * FROM mas_designations WHERE code = :1";
    await db.Query(sql, [code]);
    let rows = await db.FetchAll();
    console.log(rows);
    if (rows && rows.length > 0) {
      sql =`UPDATE mas_designations SET name = :1, up_by = :2, up_dt = CURRENT_DATE WHERE code = :3`;
      await db.Query(sql, [name, up_by, code]);
      retVal.message = "Designation updated successfully.";
    } else {
      sql =`INSERT INTO mas_designations (name, code, cre_by) VALUES (:1, :2, :3)`;
      rows = await db.Query(sql, [name, code, cre_by]);
      // await db.FetchAll()
      console.log(rows);
      if (rows.rowsAffected > 0) {
        retVal.code = code;
        retVal.message = "Designation saved successfully.";
      }
    }
    await db.Commit();
  } catch (error) {
    // Handle errors here
    console.log(error);
    retVal.message = error.message;
  }

  return retVal;
}

async function deleteDesignation(data) {
  const retVal = {};
  const code = data.code || null;

  if (code !== null) {
    
    const db = new OracleDB;
    try {

      const queryText = "DELETE FROM mas_designations WHERE code = :1";
      await db.Query(queryText, [code]);

      retVal.message = "Designation deleted successfully.";
      await db.Commit();
    } catch (error) {
      // Handle errors here
      console.log(error);
      retVal.message = error.message;
    } 
    await db.DBClose();
  }

  return retVal;
}

module.exports = { getDesignations, toggleDesignationStatus, saveDesignation, deleteDesignation };
