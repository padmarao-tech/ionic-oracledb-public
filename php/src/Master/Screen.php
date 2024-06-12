<?php

namespace FL\Master;

class Screen
{
  function getScreens($filter)
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
      $limit_offset .= ' LIMIT :1 OFFSET :2';
      $limit_offset_as .= ', :1 AS limit, :2 AS offset';
    }

    if (isset($filter->designation_code) && is_string($filter->designation_code)) {
      $designation_code = $filter->designation_code;
      $params[] = $designation_code;
      $where_clause .= 'AND b.designation_code =:' . count($params) . '';
    }

    $db = new \FL\Common\OracleDB();
    try {
      $sql = 'SELECT a.* ,(case when a.cnt > 0 then \'Y\' ELSE \'N\' END)completed,ROWNUM RN
                FROM (SELECT a.code ,a.name, a.ref_screen_code ,a.router_link ,a.order_num ,a.icon_name,count(b.id)cnt 
                        FROM mas_screens a 
                             LEFT JOIN mas_designation_screens b ON ( a.code = b.screen_code '.$where_clause.')
                       WHERE a.is_active = \'Y\' 
                    GROUP BY a.code ,a.name, a.ref_screen_code ,a.router_link ,a.order_num ,a.icon_name
                    ORDER BY a.ref_screen_code ,a.order_num)a
                    ';
      // var_dump($sql);
      $db->Query($sql, $params);
      $rows = $db->FetchAll();
      foreach ($rows as &$r) {
        $r['ORDER_NUM'] = intval($r['ORDER_NUM']);
        $r['COMPLETED'] = ($r['COMPLETED'] =='Y');
      }
      $retObj['rows'] = $rows;

      // get total rows
      if (!\is_null($limit) && count($rows) == $limit) {
        $sql = 'SELECT count(*) AS cnt' . $limit_offset_as . '
                    FROM mas_screens AS a
                    WHERE true ' . $where_clause;
        $db->Query($sql, $params);
        $tot_rows = $db->FetchAll();
        foreach ($tot_rows as &$r) {
          $r['CNT'] = intval($r['CNT']);
        }

        $retObj['tot_rows'] = (count($tot_rows) > 0) ? $tot_rows[0]['CNT'] : count($rows);
      } else {
        $retObj['tot_rows'] = ((!\is_null($offset)) ? $offset : 0) + \count($rows);
      }
    } catch (\Exception $e) {
      $retObj['message'] = \FL\Common\ErrorHandler::custom($e);
    }
    $db->DBClose();

    return $retObj;
  }

  function saveScreen($data)
  {
    $retVal = ['message' => 'Screen cannot be saved.'];
    $name = isset($data->state_name) ? $data->state_name : null;
    $code = isset($data->state_code) ? strtoupper($data->state_code) : null;
    $cre_by = isset($data->cre_by) ? ($data->cre_by) : null;
    $up_by = isset($data->up_by) ? ($data->up_by) : null;

    $params = array();
    $params[] = $name;
    $params[] = $code;

    $db = new \FL\Common\OracleDB();
    try {
      $sql = 'SELECT * FROM mas.screens WHERE code = $1';
      $db->Query($sql, [$code]);
      $rows = $db->FetchAll();
      if (count($rows) < 1) {
        $params[] = $cre_by;
        $sql = 'INSERT INTO mas.screens ( name, code, cre_by)
                VALUES ($1, $2, $3)
                RETURNING code';
        $db->Query($sql, $params);
        $rows = $db->FetchAll();

        if (count($rows) > 0) {
          $retVal['code'] = $rows[0]['code'];
          $retVal['message'] = "Screen saved successfully.";
        }
      } else {
        $params[] = $up_by;
        $params[] = $code;
        $sql = 'UPDATE mas.screens
                SET name = $1, code = $2, up_by = $3, up_dt = NOW()
                WHERE code = $4';
        $db->Query($sql, $params);
        $retVal['message'] = "Screen update successfully.";
      }
    } catch (\Exception $e) {
      $retVal['message'] = $e->getMessage();
    }
    $db->DBClose();
    return $retVal;
  }

}
