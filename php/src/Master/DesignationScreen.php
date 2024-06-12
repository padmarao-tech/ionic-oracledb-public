<?php

namespace FL\Master;

class DesignationScreen
{
  function getScreens($filter)
  {
    $retObj = ['rows' => [], 'tot_rows' => 0, 'message' => null];
    $limit = isset($filter->limit) ? $filter->limit : null;
    $offset = $limit * (isset($filter->offset) ? $filter->offset : 0);

    $where_clause = "";
    $when_clause = "";
    $limit_offset = "";
    $limit_offset_as = "";
    $params = [];

    if (isset($filter->limit) && $filter->limit) {
      $params[] = $limit;
      $params[] = $offset;
      $limit_offset .= ' LIMIT $1 OFFSET $2';
      $limit_offset_as .= ', $1 AS limit, $2 AS offset';
    }

    if (isset($filter->designation_code) && is_string($filter->designation_code)) {
      $designation_code = $filter->designation_code;
      $params[] = $designation_code;
      $when_clause .= ' dr.designation_code =$' . count($params) . '';
    } else {
      $when_clause .= ' FALSE ';
    }

    $db = new \FL\Common\OracleDB();
    try {
      $sql = 'WITH RECURSIVE a AS (
        SELECT r.code, r.name, r.ref_screen_code, r.router_link, TO_JSONB(r.related_router_links) AS related_router_links, r.order_num, r.icon_name,
               (CASE WHEN ' . $when_clause . ' THEN TRUE ELSE FALSE END)AS completed
          FROM mas.designation_screens AS r
              INNER JOIN mas.designation_screens AS dr ON (r.code = ANY(dr.screen_code))
              LEFT OUTER JOIN mas_users AS u ON (u.designation_code = dr.designation_code)
              LEFT OUTER JOIN mas_users AS o ON (o.designation_code = dr.designation_code)
        WHERE TRUE AND r.is_active = true
        UNION
        SELECT r.code, r.name, r.ref_screen_code, r.router_link, TO_JSONB(r.related_router_links) AS related_router_links, r.order_num, r.icon_name,
               FALSE AS completed
          FROM mas.designation_screens AS r
              INNER JOIN a ON (a.ref_screen_code = r.code)
      )
      SELECT * FROM a ORDER BY order_num ASC;';
      // var_dump($sql);
      $db->Query($sql, $params);
      $rows = $db->FetchAll();
      foreach ($rows as &$r) {
        $r['order_num'] = intval($r['order_num']);
        $r['completed'] = ($r['completed'] == 't');
      }
      $retObj['rows'] = $rows;

      // get total rows
      if (!\is_null($limit) && count($rows) == $limit) {
        $sql = 'SELECT count(*) AS cnt' . $limit_offset_as . '
                    FROM mas.designation_screens AS a
                    WHERE true ' . $where_clause;
        $db->Query($sql, $params);
        $tot_rows = $db->FetchAll();
        foreach ($tot_rows as &$r) {
          $r['cnt'] = intval($r['cnt']);
        }

        $retObj['tot_rows'] = (count($tot_rows) > 0) ? $tot_rows[0]['cnt'] : count($rows);
      } else {
        $retObj['tot_rows'] = ((!\is_null($offset)) ? $offset : 0) + \count($rows);
      }
    } catch (\Exception $e) {
      $retObj['message'] = \FL\Common\ErrorHandler::custom($e);
    }
    $db->DBClose();

    return $retObj;
  }

  function SaveDesignationScreens($data)
  {
    $retVal = ['message' => 'cannot be saved.'];
    $screen_code = isset($data->screen_code) ? $data->screen_code : null;
    $designation_code = isset($data->designation_code) ? strtoupper($data->designation_code) : null;
    $cre_by = isset($data->cre_by) ? ($data->cre_by) : null;
    $up_by = isset($data->up_by) ? ($data->up_by) : null;

    $arr_screen_code = '';
    $params = array();
    $params[] = $designation_code;

    if (gettype($screen_code) === 'array') {
      if (count($screen_code) > 0) {
        $arr_screen_code .= 'ARRAY[';
        foreach ($screen_code as &$sc) {
          if (isset($sc) && gettype($sc) === 'string') {
            $params[] = $sc;
            $arr_screen_code .= '$' . count($params) . ', ';
          }
        }
        $arr_screen_code = rtrim($arr_screen_code, ', ') . ']';
        if ($arr_screen_code == 'ARRAY[]') {
          $arr_screen_code = 'NULL';
        }
      } else {
        $arr_screen_code = 'NULL';
      }
    } else {
      $arr_screen_code = 'NULL';
    }


    $db = new \FL\Common\OracleDB();
    try {
      $sql = 'SELECT * FROM mas.designation_screens WHERE designation_code = $1';
      $db->Query($sql, [$designation_code]);
      $rows = $db->FetchAll();
      if (count($rows) < 1) {
        $sql = 'INSERT INTO mas.designation_screens ( designation_code, screen_code )
                VALUES ($1, ' . $arr_screen_code . ')
                RETURNING designation_code';
        $db->Query($sql, $params);
        $rows = $db->FetchAll();

        if (count($rows) > 0) {
          $retVal['designation_code'] = $rows[0]['designation_code'];
          $retVal['message'] = "saved successfully.";
        }
      } else {
        $sql = 'UPDATE mas.designation_screens
                SET screen_code = ' . $arr_screen_code . '
                WHERE designation_code = $1';
        $db->Query($sql, $params);
        $retVal['message'] = "update successfully.";
      }
    } catch (\Exception $e) {
      $retVal['message'] = $e->getMessage();
    }
    $db->DBClose();
    return $retVal;
  }
}
