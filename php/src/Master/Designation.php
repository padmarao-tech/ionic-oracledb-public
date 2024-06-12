<?php

namespace FL\Master;

class Designation
{
  function getDesignationsRootWise($filter)
  {
    $ref_designation_code = isset($filter->ref_designation_code) ? $filter->ref_designation_code : null;

    $db = new \FL\Common\OracleDB();

    $sql = 'SELECT mas.get_json_designations($1) AS data';
    $db->Query($sql, [$ref_designation_code]);
    $rows = $db->FetchAll();

    foreach ($rows as &$r) {
      $r['data'] = isset($r['data']) ? json_decode($r['data'], true) : [];
    }
    $db->DBClose();

    return (count($rows) > 0) ? ($rows[0]['data']) : [];
  }

  function getDesignations($filter)
  {
    $retObj = ['rows' => [], 'tot_rows' => 0, 'message' => null];
    $limit = isset($filter->limit) ? $filter->limit : null;
    $offset = $limit * (isset($filter->offset) ? $filter->offset : 0);

    $where_clause = "";
    $limit_offset = "";
    $limit_offset_as = "";
    $params = [];

    if (isset($filter->limit) && $filter->limit) {
      $params[] = $limit;
      $params[] = $offset;
      $limit_offset .= ' OFFSET :2 ROWS FETCH NEXT :1 ROWS ONLY';
      $limit_offset_as .= ', :1 AS limit, :2 AS offset';
    }

    if (isset($filter->code) && is_string($filter->code)) {
      $code = $filter->code;
      $params[] = $code;
      $where_clause .= ' AND code =:' . count($params) . '';
    }

    if (!(isset($filter->include_inactive) && $filter->include_inactive === true)) {
      $where_clause .= ' AND a.is_active = \'T\'';
    }

    if (isset($filter->search_text) && strlen($filter->search_text) > 0) {

      $search_text = '%' . $filter->search_text . '%';
      $params[] = $search_text;
      $param_cnt = ':' . count($params);
      $where_clause .= ' AND (
                                  UPPER(a.name) like UPPER(' . $param_cnt . ') OR
                                  UPPER(a.code) like UPPER(' . $param_cnt . ')
                                 )';
    }


    $db = new \FL\Common\OracleDB();
    try {
      $sql = 'SELECT *
                From (SELECT a.code, a.name, a.ref_designation_code, a.is_active,
                              (case when count(b.id) > 0 then \'F\' ELSE \'T\' END)is_del,
                              ROW_NUMBER() OVER (ORDER BY a.NAME DESC) AS RN
                        FROM MAS_DESIGNATIONS a
                              LEFT JOIN MAS_USERS b on (b.designation_code = a.code)
                        WHERE 1=1 ' . $where_clause . '
                     GROUP BY a.code, a.name, a.ref_designation_code, a.is_active
                      )a' . $limit_offset;
      // var_dump($sql);
      $db->Query($sql, $params);
      $rows = $db->FetchAll();
      foreach ($rows as &$r) {
        $r['is_del'] = ($r['is_del'] == 'T');
        // $r['IS_SYSTEM'] = ($r['IS_SYSTEM'] == 'Y');
        $r['is_active'] = ($r['is_active'] == 'T');
      }
      $retObj['rows'] = $rows;

      // get total rows
      if (!\is_null($limit) && count($rows) == $limit) {
        $sql = 'SELECT count(*) AS cnt' . $limit_offset_as . '
                    FROM mas_designations a
                    WHERE 1=1 ' . $where_clause;
        $db->Query($sql, $params);
        $tot_rows = $db->FetchAll();
        foreach ($tot_rows as &$r) {
          $r['CNT'] = intval($r['CNT']);
        }

        $retObj['tot_rows'] = (count($tot_rows) > 0) ? $tot_rows[0]['CNT'] : count($rows);
      } else {
        $retObj['tot_rows'] = ((!\is_null($offset)) ? $offset-$limit : 0) + \count($rows);
      }
    } catch (\Exception $e) {
      $retObj['message'] = \FL\Common\ErrorHandler::custom($e);
    }
    $db->DBClose();

    return $retObj;
  }

  function deleteDesignation($data)
  {
    $retVal = [];
    $code = isset($data->code) ? $data->code : null;
    $db = new \FL\Common\OracleDB();
    try {
      if (!is_null($code)) {
        $sql = 'DELETE FROM mas_designations WHERE code = :1';
        $db->Query($sql, [$code]);
        $retVal['message'] = "Designation deleted successfully.";
      }
      $db->Commit();
    } catch (\Exception $e) {
      $db->RollBack();
      $retVal['message'] = $e->getMessage();
      header("HTTP/1.1 500 Internal Server Error");
    }
    $db->DBClose();
    return $retVal;
  }

  function saveDesignation($data)
  {
    $retVal = ['message' => 'User cannot be saved.'];
    $name = isset($data->name) ? $data->name : null;
    $code = isset($data->code) ? strtoupper($data->code) : null;
    $cre_by = isset($data->cre_by) ? ($data->cre_by) : null;
    $up_by = isset($data->up_by) ? ($data->up_by) : null;

    $params = array();
    $params[] = $name;
    $params[] = $code;

    $db = new \FL\Common\OracleDB();
    try {
      $sql = 'SELECT * FROM mas_designations WHERE code = :1';
      $db->Query($sql, [$code]);
      $rows = $db->FetchAll();
      if (count($rows) < 1) {
        $params[] = $cre_by;
        $sql = 'INSERT INTO mas_designations ( name, code, cre_by)
                VALUES (:1, :2, :3)';
        $db->Query($sql, $params);
        // $rows = $db->FetchAll();

        // if (count($rows) > 0) {
        // $retVal['code'] = $rows[0]['code'];
        $retVal['message'] = "Designation saved successfully.";
        // }
      } else {
        $params[] = $up_by;
        $sql = 'UPDATE mas_designations
                SET name = :1, up_by = :3, up_dt = CURRENT_DATE
                WHERE code = :2';
        $db->Query($sql, $params);
        $retVal['message'] = "Designation updated successfully.";
      }
      $db->Commit();
    } catch (\Exception $e) {
      $db->RollBack();
      $retVal['message'] = $e->getMessage();
      header("HTTP/1.1 500 Internal Server Error");
    }
    $db->DBClose();
    return $retVal;
  }

  function isDesignationCodeExist($data)
  {
    $id = isset($data->id) ? $data->id : ((isset($payload['id']) && $payload['id'] > 0) ? $payload['id'] : null);

    $where_clause = "";
    $params = array();

    if (isset($data->designation_code) && is_string($data->designation_code)) {
      $designation_code = $data->designation_code;
      $params[] = $designation_code;
      $where_clause = ' AND code = :' . count($params) . '';
    }

    $db = new \FL\Common\OracleDB();
    $sql = 'SELECT code FROM mas_designations WHERE 1 = 1 ' . $where_clause;
    $db->Query($sql, $params);
    $rows = $db->FetchAll();
    $db->DBClose();
    return (count($rows) > 0);
  }

  function isDesignationNameExist($data)
  {
    $id = isset($data->id) ? $data->id : ((isset($payload['id']) && $payload['id'] > 0) ? $payload['id'] : null);

    $where_clause = "";
    $params = array();

    if (isset($data->designation_name) && is_string($data->designation_name)) {
      $designation_name = $data->designation_name;
      $params[] = $designation_name;
      $where_clause = ' AND name = :' . count($params) . '';
    }

    $db = new \FL\Common\OracleDB();
    $sql = 'SELECT name FROM mas_designations WHERE 1 = 1 ' . $where_clause;
    $db->Query($sql, $params);
    $rows = $db->FetchAll();
    $db->DBClose();
    return (count($rows) > 0);
  }

  function toggleDesignationStatus($data)
  {
    $retObj = ['message' => 'Invalid .'];
    $code = isset($data->code) ? $data->code : null;
    $is_active = (isset($data->is_active) && $data->is_active === true) ? 'T' : 'F';
    $user_id = isset($data->user_id) ? $data->user_id : null;
    // var_dump($data);

    $db = new \FL\Common\OracleDB();
    try {
      // $db->Begin();

      if (!is_null($code)) {

        $sql = "UPDATE mas_designations SET is_active = :1 WHERE code = :2";
        $db->query($sql, [$is_active, $code]);
        // $actAction = new \LWMIS\LOG\ActAction();
        // if ($is_active === 't') {
        //   $actAction->save($db, (object)[
        //     'act_id' => $id,
        //     'action_code' => 'ACT_ACTIVATED',
        //     'user_id' => $user_id
        //   ]);
        // } else {
        //   $actAction->save($db, (object)[
        //     'act_id' => $id,
        //     'action_code' => 'ACT_DEACTIVATED',
        //     'user_id' => $user_id
        //   ]);
        // }

        $retObj['message'] = 'Designation status changed successfully.';
      }

      $db->Commit();
    } catch (\Exception $e) {
      $db->RollBack();
      $retObj['message'] = $e->getMessage();
    }
    $db->DBClose();
    return $retObj;
  }

}
