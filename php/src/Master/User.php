<?php

namespace FL\Master;

class User
{
  function login($data, &$payload)
  {
    $retObj = [];

    $db = new \FL\Common\OracleDB();
    $gn = new \FL\Common\GeneralFunctions();
    try {
      // $db->Begin();
      if (!(isset($payload) && isset($payload['secret_key']))) {
        throw new \Exception('Token is not valid / Expired.');
      }
      $secret_key = $payload['secret_key'];

      // Key(encrypted) fields
      $mobile_no_email = isset($data->mobile_no_email) ? $data->mobile_no_email : null;
      $pwd = isset($data->pwd) ? $data->pwd : null;
      $uuid = isset($data->uuid)?$data->uuid:null;

      // decrypt
      $encryption = new \FL\Common\Encryption();
      if (!is_null($mobile_no_email)) $mobile_no_email = $encryption->decrypt($mobile_no_email, $secret_key);
      if (!is_null($pwd)) $pwd = $encryption->decrypt($pwd, $secret_key);

      if (\is_null($mobile_no_email) or \is_null($pwd)) {
        throw new \Exception('Mobile No. / eMail ID / Password Invalid');
      }

      // Other fields
      $module = isset($data->module) ? $data->module : null;

      $sql = 'SELECT ID, PASSWORD,
                     (CASE WHEN COALESCE(LOCKOUT_ON, TO_TIMESTAMP(\'1978-02-28\',\'YYYY-MM-DD\')) + INTERVAL \'10\' MINUTE > CURRENT_TIMESTAMP
                                THEN \'T\' ELSE \'F\' END) AS IS_LOCKEDOUT,
                      EXTRACT(MINUTE FROM LOCKOUT_ON + INTERVAL \'11\' MINUTE - CURRENT_TIMESTAMP) AS LOCKOUT_TIME,
                      COALESCE(FAILURE_ATTEMPT, 0) AS FAILURE_ATTEMPT
                FROM MAS_USERS
               WHERE IS_ACTIVE = \'T\' AND (MOBILE_NO = :1 OR (EMAIL IS NOT NULL AND EMAIL = :1))';
      // var_dump($sql, $mobile_no_email);
      $db->Query($sql, [$mobile_no_email]);

      $rows = $db->FetchAll();
      if (count($rows) <= 0) {
        throw new \Exception('Mobile No. / eMail ID / Password Invalid');
      }

      foreach ($rows as &$r) {
        $r['id'] = \intval($r['id']);
        $r['is_lockedout'] = ($r['is_lockedout'] == 'Y');
        $r['lockout_time'] = isset($r['lockout_time']) ? \intval($r['lockout_time']) : 0;
        $r['failure_attempt'] = isset($r['failure_attempt']) ? \intval($r['failure_attempt']) : 0;
      }
      $ret_data = $rows[0];

      if ($ret_data['is_lockedout']) {
        $retObj['lockout_time'] = $ret_data['lockout_time'];
        throw new \Exception('Lockout');
      }

      // $retObj['ret_data'] = $ret_data;
      $user_id = $ret_data['id'];
      // var_dump($pwd,$ret_data['password'],password_verify($pwd, $ret_data['password']));die();
      if (password_verify($pwd, $ret_data['password'])) {
        // Get details before updating last login
        $reg_cuss = $this->getUsers((object)['id' => $user_id]);
        // var_dump($reg_cuss);
        $retObj = (isset($reg_cuss) && count($reg_cuss['rows']) > 0) ? ($reg_cuss['rows'][0]) : [];
        // var_dump($retObj);
        // Update session token
        $ip_address = $gn->getIPAddress();
        $session_token = $gn->generateSecretKey();
        $sql = 'UPDATE MAS_USERS
                   SET LAST_LOGIN = CURRENT_TIMESTAMP,
                       SESSION_TOKEN = :1,
                       FAILURE_ATTEMPT = 0,
                       LOCKOUT_ON = NULL,
                       IP_ADDRESS = :2,
                       uuid = :3
                 WHERE ID = :4';
        $result = $db->Query($sql, [ $session_token, $ip_address, $uuid, $user_id ],[], true);

        // Log Registered Customer Action
        // $UserAction = new \FL\LOG\UserAction();
        // $result = $UserAction->save($db, (object)[
        //   'user_id' => $user_id,
        //   'action_code' => 'U_LOGIN'
        // ]);

        // send token to client and for future session verifications
        $payload['id'] = $user_id;
        $payload['session_token'] = $session_token;
        $payload['company_address'] = $retObj['company_address'];
        $payload['company_name'] = $retObj['company_name'];

        // Remove secret_key from $payload
        unset($payload['secret_key']);

        $retObj['message'] = "User authenticated";
      } else {
        $failure_attempt = $ret_data['failure_attempt'];
        if ($failure_attempt < 4) {
          $sql = 'UPDATE MAS_USERS
                     SET failure_attempt = COALESCE(failure_attempt, 0) + 1
                   WHERE ID = :1
                   RETURNING failure_attempt INTO :failure_attempt';
          $f_rows = $db->Query($sql, [$user_id], ['failure_attempt']);
          // var_dump($f_rows,count($f_rows),$f_rows[0],$f_rows[0]['FAILURE_ATTEMPT']);
          // $f_rows = $db->FetchAll();
          // var_dump($f_rows);
          if (count($f_rows) > 0) {
            foreach ($f_rows as &$r) {
              $r['failure_attempt'] = intval($r['failure_attempt']);
            }
            $db_failure_attempt = $f_rows[0]['failure_attempt'];

            // Log Registered Customer Action
            // $registeredCustomerAction = new \FL\LOG\UserAction();
            // $registeredCustomerAction->save($db, (object)[
            //   'registered_customer_id' => $registered_customer_id,
            //   'action_code' => 'RC_NLOGIN',
            //   'note' => ('Failure attempt: '.$db_failure_attempt)
            // ]);
          }

          $retObj['message'] = "Mobile No. / eMail ID / Password Invalid. Attempt " . ($failure_attempt + 1) . "/5.";
        } else {
          $sql = 'UPDATE MAS_USERS
                     SET FAILURE_ATTEMPT = COALESCE(FAILURE_ATTEMPT, 0) + 1,
                         LOCKOUT_ON = CURRENT_TIMESTAMP
                   WHERE ID = :1';
          $result = $db->Query($sql, [$user_id]);
          if(!$result){
            throw new \Exception('Please contact admin');
          }

          $retObj['lockout_time'] = 10;
          $retObj['message'] = 'Lockout';

          // Log Registered Customer Action
          // $registeredCustomerAction = new \FL\LOG\UserAction();
          // $registeredCustomerAction->save($db, (object)[
          //   'registered_customer_id' => $registered_customer_id,
          //   'action_code' => 'RC_NLOGIN',
          //   'note' => ('Failure attempt: maximum reached. Lockout initiated.')
          // ]);
        }
      }

      // Finished
      $db->Commit();
    } catch (\Throwable $th) {
      $db->RollBack();
      $retObj['message'] = \FL\Common\ErrorHandler::custom($th);
    }
    $db->DBClose();

    return $retObj;
  }

  function register($data, &$payload)
  {
    $retObj = [];

    $name             = isset($data->name) ? $data->name            : NULL;
    $designation_code = isset($data->designation_code) ? $data->designation_code : NULL;
    $phone_no        = isset($data->phone_no) ? $data->phone_no       : NULL;
    $email            = isset($data->email) ? $data->email           : NULL;
    $password         = isset($data->password) ? $data->password        : NULL;
    $cre_by           = isset($data->cre_by) ? $data->cre_by          : NULL;
    $up_by           = isset($data->up_by) ? $data->up_by          : NULL;
    // $pwd = password_hash($password, PASSWORD_BCRYPT);
    $pwd = $password;

    $db = new \FL\Common\OracleDB();
    try {
      // $db->Begin();

      if (!(isset($payload) && isset($payload['secret_key']))) {
        throw new \Exception('Token is not valid / Expired.');
      }
      $secret_key = $payload['secret_key'];

      // decrypt
      $encryption = new \FL\Common\Encryption();
      if (!is_null($pwd)) $pwd = $encryption->decrypt($pwd, $secret_key);

      $pwd = password_hash($pwd, PASSWORD_BCRYPT);

      $sql = 'INSERT INTO mas_users
        ( name, designation_code,
        mobile_no, email, password,
        cre_by) VALUES
        ($1, $2, $3, $4, $5, $6)RETURNING id';
      // var_dump($sql,$type, $discipline_id, $name, $gender, $father_name, $mother_name, $dob, $blood_group, $address, $district_id,
      // $block_id, $pincode, $mobile_no, $email, $pwd, $aadhar_no, $p_address, $p_district_id, $p_block_id, $p_pincode);
      // die();
      $db->Query(
        $sql,
        [
          $name, $designation_code, $phone_no, $email, $pwd, $cre_by
        ]
      );

      $rows = $db->FetchAll();
      // var_dump(count($rows));
      if (count($rows) > 0) {
        // $user_id = $rows[0]['id'];
        // $rand_no = rand(100000, 999999);
        // $sql = 'INSERT INTO log.user_verification (user_id,code) values ($1, $2)RETURNING id';
        // $db->Query($sql, [$user_id, $rand_no]);

        // $sql = 'INSERT INTO doc.attachments (user_id,type_code,file_name, file_type, file_size, storage_name)
        //         VALUES ($1, $2, $3, $4, $5, $6)RETURNING id';
        // $db->Query($sql, [$user_id, $type_code, $file_name, $file_type, $file_size, $storage_name]);
        $retObj['message'] = 'User registered successfully.';
        // if ($retObj['message']) {
        //   // $this->Upload();
        // }
      }

      $db->Commit();
    } catch (\Throwable $th) {
      $db->RollBack();
      $retObj['message'] = $th->getMessage();;
    }

    $db->DBClose();

    return $retObj;
  }

  function saveUser($data, &$payload)
  {
    $retVal = ['message' => 'User cannot be saved.'];
    $name = isset($data->name)? $data->name : null;
    $designation_code = isset($data->designation_code)? $data->designation_code : null;
    $mobile_no = isset($data->mobile_no)? $data->mobile_no : null;
    $email = isset($data->email)? $data->email : null;
    $pwd = isset($data->pwd)? $data->pwd : '12345678';
    $cre_by = isset($data->cre_by)? $data->cre_by : null;
    $up_by = isset($data->up_by)? $data->up_by : null;

    $id = isset($data->id)? $data->id : null;

    if (!(isset($payload) && isset($payload['secret_key']))) {
      throw new \Exception('Token is not valid / Expired.');
    }
    $secret_key = $payload['secret_key'];

    $encryption = new \FL\Common\Encryption();
    if (!is_null($email)) $email = $encryption->decrypt($email, $secret_key);
    if (!is_null($designation_code)) $designation_code = $encryption->decrypt($designation_code, $secret_key);
    if (!is_null($mobile_no)) $mobile_no = $encryption->decrypt($mobile_no, $secret_key);
    if (!is_null($pwd)) $pwd = $encryption->decrypt($pwd, $secret_key);

    $password = password_hash($pwd, PASSWORD_BCRYPT);

    $db = new \FL\Common\OracleDB();

    $params = [];
    $params[] = $name;
    $params[] = $designation_code;
    $params[] = $mobile_no;
    $params[] = $email;

    try {
      if (is_null($id)) {
        $params[] = $password;
        $params[] = $cre_by;
        $sql = 'INSERT INTO mas_users
                            ( NAME, DESIGNATION_CODE, MOBILE_NO, EMAIL, PASSWORD, CRE_BY)
                    VALUES (:1, :2, :3, :4, :5,
                            :6)RETURNING ID INTO :id';
        // var_dump($sql);
        $rows = $db->Query($sql,$params, ['id']);
        // $rows = $db->FetchAll();
        // var_dump($rows);
        if (count($rows) > 0) {
          foreach($rows as &$r){
            $retVal['id'] = intval($r['id']);
          }
          $retVal['message'] = "User saved successfully.";
        }
      } else {
        $params[] = $up_by;
        $params[] = $id;
        $sql = 'UPDATE mas_users
                   SET NAME = :1, DESIGNATION_CODE = :2, MOBILE_NO = :3, EMAIL = :4, UP_BY = :5
                 WHERE id = :6';
        $db->Query($sql,$params);
        $retVal['message'] = "User updated successfully.";
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

  function deleteUser($data)
  {
    $retVal = [];
    $id = isset($data->id) ? $data->id : null;

    if (!is_null($id)) {
      $db = new \FL\Common\OracleDB();
      try {
        $sql = 'DELETE FROM mas_users WHERE id = :1';
        $db->Query($sql, [$id]);
        $retVal['message'] = "User deleted successfully.";
        $db->Commit();
      } catch (\Exception $e){
        $db->RollBack();
        $retVal['message'] = $e->getMessage();
        header("HTTP/1.1 500 Internal Server Error");
      }
      $db->DBClose();
    }
    return $retVal;
  }

  function toggleUserStatus($data)
  {
    $retObj = ['message' => 'Invalid .'];
    $id = isset($data->id) ? $data->id : null;
    $is_active = (isset($data->is_active) && $data->is_active == true) ? 'Y' : 'N';
    $user_id = isset($data->user_id) ? $data->user_id : null;
    // var_dump($data);

    $db = new \FL\Common\OracleDB();
    try {
      // $db->Begin();

      if (!is_null($id)) {

        $sql = "UPDATE mas_users SET is_active = :1 WHERE id = :2";
        $db->query($sql, [$is_active, $id]);

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

        $retObj['message'] = 'User status changed successfully.';
      }

      $db->Commit();
    } catch (\Exception $e) {
      $db->RollBack();
      $retObj['message'] = $e->getMessage();
    }
    $db->DBClose();
    return $retObj;
  }

  function isAadharExistUser($data)
  {
    $aadhar_no = isset($data->aadhar_no) ? $data->aadhar_no : NULL;
    $rows = [];
    $sql = 'SELECT aadhar_no
                FROM mas_users
               WHERE aadhar_no = $1';
    $db = new \FL\Common\OracleDB();
    $db->Query($sql, [$aadhar_no]);

    $rows = $db->FetchAll();

    return (count($rows) > 0);
  }

  function checkSessionToken($data)
  {
    $id = isset($data->id) ? $data->id : null;
    $session_token = isset($data->session_token) ? $data->session_token : null;
    $params = [];
    $params[] = $id;
    $params[] = $session_token;

    if (\is_null($id) or \is_null($session_token)) {
      throw new \Exception('Token is not valid / Expired.');
    }

    $db = new \FL\Common\OracleDB();
    $sql = 'SELECT ID FROM MAS_USERS WHERE ID = :1 AND COALESCE(SESSION_TOKEN, \'\') = :2';
    $db->Query($sql, $params);
    $rows = $db->FetchAll();
    $db->DBClose();

    if (count($rows) <= 0) {
      throw new \Exception('Your current session terminated, since you created new session with new login.');
    }

    return;
  }

  function checkSchemeUserSessionToken($data)
  {
    $retObj = ['error_message' => null];
    $id = isset($data->id) ? $data->id : null;
    $session_token = isset($data->session_token) ? $data->session_token : null;
    $params = [];
    $params[] = $id;
    $params[] = $session_token;

    $db = new \FL\Common\OracleDB();
    try {
      if (is_null($id) or is_null($session_token)) {
        $retObj['error_message'] = 'Token is not valid / Expired.';
      } else {
        $sql = 'SELECT a.id, a.designation_code
                  FROM mas_users AS a
                       INNER JOIN mas_designations AS b ON (b.code = a.designation_code)
                 WHERE a.id = $1 and COALESCE(a.session_token, \'\') = $2';
        $db->Query($sql, $params);
        $rows = $db->FetchAll();
        foreach ($rows as &$r) {
          $r['id'] = intval($r['id']);
        }

        if (count($rows) <= 0) {
          $retObj['error_message'] = 'Your current session terminated, since you created new session with new login.';
        } else {
          $ud = $rows[0];
        }
      }
    } catch (\Throwable $th) {
      $retObj['error_message'] = $th->getMessage();
    }
    $db->DBClose();

    if (!is_null($retObj['error_message'])) {
      throw new \Exception($retObj['error_message']);
    }

    return;
  }

  function checkOfficialUserSessionToken($data)
  {
    $retObj = ['error_message' => null];
    $id = isset($data->id) ? $data->id : null;
    $session_token = isset($data->session_token) ? $data->session_token : null;
    $params = [];
    $params[] = $id;
    $params[] = $session_token;

    $db = new \FL\Common\OracleDB();
    try {
      if (is_null($id) or is_null($session_token)) {
        $retObj['error_message'] = 'Token is not valid / Expired.';
      } else {
        $sql = 'SELECT a.id, a.designation_code
                  FROM mas_users AS a
                       INNER JOIN mas_designations AS b ON (b.code = a.designation_code)
                 WHERE a.id = $1 and COALESCE(a.session_token, \'\') = $2';
        $db->Query($sql, $params);
        $rows = $db->FetchAll();
        foreach ($rows as &$r) {
          $r['id'] = intval($r['id']);
        }

        if (count($rows) <= 0) {
          $retObj['error_message'] = 'Your current session terminated, since you created new session with new login.';
        } else {
          $ud = $rows[0];
        }
      }
    } catch (\Throwable $th) {
      $retObj['error_message'] = $th->getMessage();
    }
    $db->DBClose();

    if (!is_null($retObj['error_message'])) {
      throw new \Exception($retObj['error_message']);
    }

    return;
  }

  function isMobileNoExist($data, &$payload)
  {
    $mobile_no = isset($data->mobile_no) ? $data->mobile_no : null;
    $id = isset($data->id) ? $data->id : ((isset($payload['id']) && $payload['id'] > 0) ? $payload['id'] : null);

    $where_clause = "";
    $params = array();
    $params[] = $mobile_no;

    if (!is_null($id)) {
      $params[] = $id;
      $where_clause = 'AND id != :' . count($params);
    }

    $db = new \FL\Common\OracleDB();
    $sql = 'SELECT mobile_no FROM mas_users WHERE is_active = \'Y\' AND mobile_no = :1 ' . $where_clause;
    $db->Query($sql, $params);
    $rows = $db->FetchAll();
    $db->DBClose();
    return (count($rows) > 0);
  }

  function isEmailExist($data, &$payload)
  {
    $email = isset($data->email) ? $data->email : null;
    $id = isset($data->id) ? $data->id : ((isset($payload['id']) && $payload['id'] > 0) ? $payload['id'] : null);

    $where_clause = "";
    $params = array();
    $params[] = $email;

    if (!is_null($id)) {
      $params[] = $id;
      $where_clause = 'AND id != :' . count($params);
    }

    $db = new \FL\Common\OracleDB();
    $sql = 'SELECT email FROM mas_users WHERE is_active = \'Y\' AND email IS NOT NULL AND email = :1 ' . $where_clause;
    $db->Query($sql, $params);
    $rows = $db->FetchAll();
    $db->DBClose();
    return (count($rows) > 0);
  }

  function getUsers($filter)
  {
    $retObj = [];
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

    if (isset($filter->ID) && $filter->ID) {
      $ID = $filter->ID;
      $params[] = $ID;
      $where_clause .= ' AND a.ID = :' . count($params);
    }

    if (isset($filter->designation_code) && $filter->designation_code) {
      $designation_code = $filter->designation_code;
      $params[] = $designation_code;
      $where_clause .= ' AND a.DESIGNATION_CODE = :' . count($params);
    }

    if (isset($filter->uuid))
    {
      $uuid = $filter->uuid;
      $params[] = $uuid;
      $where_clause .= ' AND COALESCE(a.uuid, \'000&&&!!!&&&000\') = :'.count($params);
    }

    if (isset($filter->search_text) && strlen($filter->search_text) > 0) {
      $search_text = '%' . $filter->search_text . '%';
      $params[] = $search_text;
      $param_cnt = ':' . count($params);
      $where_clause .= ' AND (
                              UPPER(a.name) like UPPER(' . $param_cnt . ') OR
                              UPPER(a.mobile_no) like UPPER(' . $param_cnt . ') OR
                              (a.email IS NOT NULL AND UPPER(a.email) like UPPER(' . $param_cnt . '))
                             )';
    }

    if (!(isset($filter->include_inactive) && $filter->include_inactive === true)) {
      $where_clause .= ' AND a.is_active = \'T\'';
    }

    $db = new \FL\Common\OracleDB();
    try {
      // get total rows
      $sql = 'SELECT COUNT(*) AS CNT' . $limit_offset_as . '
                FROM MAS_USERS a
               WHERE 1 = 1 ' . $where_clause;
      // var_dump($sql);
      $db->Query($sql, $params);
      $rows = $db->FetchAll();
      foreach ($rows as &$r) {
        $r['cnt'] = intval($r['cnt']);
      }
      // var_dump($rows);
      $retObj['tot_rows'] = (count($rows) > 0) ? $rows[0]['cnt'] : 0;
      // get actual data
      $sql = 'SELECT a.ID, a.EMAIL, a.MOBILE_NO, a.IS_ACTIVE, a.LAST_LOGIN,
                             COALESCE((CASE WHEN a.DESIGNATION_CODE = \'ADMN\' THEN \'F\' ELSE \'T\' END), \'Y\') IS_DEL,
                             a.NAME,a.DESIGNATION_CODE,a.COMPANY_ID,b.name DESIGNATION_NAME,
                             b.REF_DESIGNATION_CODE,a.ADDRESS,
                             d.NAME COMPANY_NAME,d.ADDRESS COMPANY_ADDRESS,
                             ROW_NUMBER() OVER (ORDER BY a.id DESC) AS RN
                        FROM MAS_USERS a
                             INNER JOIN MAS_DESIGNATIONS b ON (b.CODE = a.DESIGNATION_CODE)
                             LEFT JOIN MAS_COMPANIES d ON (d.ID = a.COMPANY_ID)
                       WHERE 1 = 1 ' . $where_clause . '
                       ' . $limit_offset;
      // var_dump($sql);
      $db->Query($sql, $params);
      $rows = $db->FetchAll();
      // var_dump($rows);
      foreach ($rows as &$r) {
        $r['id'] = intval($r['id']);
        $r['company_id'] = isset($r['company_id'])? intval($r['company_id']): null;
        $r['branch_id'] = isset($r['branch_id'])? intval($r['branch_id']): null;
        $r['warehouse_id'] = isset($r['warehouse_id'])? intval($r['warehouse_id']): null;
        $r['is_active'] = ($r['is_active'] == 'T');
        $r['is_del'] = ($r['is_del'] == 'T');
      }
      $retObj['rows'] = $rows;
    } catch (\Exception $e) {
      $retObj['rows'] = [];
      $retObj['tot_rows'] = 0;
      $retObj['message'] = $e->getMessage();
      header("HTTP/1.1 500 Internal Server Error");
    }
    $db->DBClose();

    return $retObj;
  }

  function getOfficialUsers($filter)
  {
    $retObj = [];
    $limit = isset($filter->limit) ? $filter->limit : null;
    $offset = $limit * (isset($filter->offset) ? $filter->offset : 0);

    $where_clause = "";
    $params = [];
    $params[] = $limit;
    $params[] = $offset;

    if (isset($filter->id) && $filter->id > 0) {
      $id = $filter->id;
      $params[] = $id;
      $where_clause .= ' AND a.id = :' . count($params);
    }

    if (isset($filter->search_text) && strlen($filter->search_text) > 0) {
      $search_text = '%' . $filter->search_text . '%';
      $params[] = $search_text;
      $param_cnt = ':' . count($params);
      $where_clause .= ' AND (
                              UPPER(a.mobile_no) like UPPER(' . $param_cnt . ') OR
                              (a.email IS NOT NULL AND UPPER(a.email) like UPPER(' . $param_cnt . '))
                             )';
    }

    if (!(isset($filter->include_inactive) && $filter->include_inactive === true)) {
      $where_clause .= ' AND a.is_active = \'Y\'';
    }

    $db = new \FL\Common\OracleDB();
    try {
      // get total rows
      $sql = 'SELECT COUNT(*) AS cnt, :1 AS limit, :2 AS offset
                FROM mas_users a
               WHERE 1 = 1 AND a.designation_code NOT IN (\'SUP\',\'EMP\')' . $where_clause;
      $db->Query($sql, $params);
      $rows = $db->FetchAll();
      foreach ($rows as &$r) {
        $r['CNT'] = \intval($r['CNT']);
      }
      $retObj['tot_rows'] = (count($rows) > 0) ? $rows[0]['CNT'] : 0;
      // get actual data
      $sql = 'SELECT *
      FROM  (SELECT a.id, a.name, a.email, a.mobile_no, a.is_active, a.last_login,
      (CASE WHEN a.designation_code = \'ADMN\' THEN \'N\' ELSE \'Y\' END) AS is_del,\'official_user\' user_type,
                    b.name AS designation_name,a.designation_code, ROWNUM RN
               FROM mas_users a
                    INNER JOIN mas_designations b ON (b.code = a.designation_code)
              WHERE 1 = 1 AND a.designation_code NOT IN (\'SUP\',\'EMP\') ' . $where_clause . '
                        ORDER BY a.mobile_no)
                        WHERE RN BETWEEN :2 AND :2 + COALESCE(:1, \'1\')';
      // var_dump($sql);
      $db->Query($sql, $params);
      $rows = $db->FetchAll();
      foreach ($rows as &$r) {
        $r['ID'] = intval($r['ID']);
        $r['IS_ACTIVE'] = ($r['IS_ACTIVE'] == 'Y');
        $r['IS_DEL'] = ($r['IS_DEL'] == 'Y');
      }
      $retObj['rows'] = $rows;
    } catch (\Exception $e) {
      $retObj['rows'] = [];
      $retObj['tot_rows'] = 0;
      $retObj['message'] = $e->getMessage();
    }
    $db->DBClose();

    return $retObj;
  }

  function getUserMenus($filter, &$payload)
  {
    $rows = [];
    $id = (isset($payload['id']) && $payload['id'] > 0) ? $payload['id'] : null;
    // $id = isset($filter->id) ? $filter->id : null;
    if (!\is_null($id)) {
      $db = new \FL\Common\OracleDB();
      $sql = 'SELECT * FROM (SELECT r.code, r.name, r.ref_screen_code, r.router_link, r.order_num, r.icon_name, (SELECT COLUMN_VALUE FROM TABLE(r.RELATED_ROUTER_LINKS))AS RELATED_ROUTER_LINKS
                FROM mas_screens r
                    INNER JOIN mas_designation_screens dr ON (r.code = ANY(SELECT v.COLUMN_VALUE as SCREEN_CODES FROM TABLE(dr.SCREEN_CODES) v))
                    LEFT OUTER JOIN mas_users u ON (u.designation_code = dr.designation_code)
              WHERE u.id = :1 AND r.is_active = \'T\' AND r.ref_screen_code IS NULL
              UNION
             SELECT r1.code, r1.name, r1.ref_screen_code, r1.router_link, r1.order_num, r1.icon_name, (SELECT COLUMN_VALUE FROM TABLE(r1.RELATED_ROUTER_LINKS))AS RELATED_ROUTER_LINKS
                    FROM mas_screens r1
                        INNER JOIN mas_designation_screens dr1 ON (r1.code = ANY(SELECT v.COLUMN_VALUE as SCREEN_CODES FROM TABLE(dr1.SCREEN_CODES) v))
                        LEFT OUTER JOIN mas_users u1 ON (u1.designation_code = dr1.designation_code)
                    WHERE u1.id = :1 AND r1.is_active = \'T\' AND r1.ref_screen_code IS NOT NULL)
              ORDER BY order_num';
      // var_dump($sql);
      $db->Query($sql, [$id]);
      $rows = $db->FetchAll();
      if(count($rows) > 0){
        foreach ($rows as &$r) {
          $r['order_num'] = intval($r['order_num']);
          $r['related_router_links'] = isset($r['related_router_links']) ? json_decode($r['related_router_links']) : null;
        }
      }
      $db->DBClose();

    }

    return $rows;
  }

  function mobileLogout($data, &$payload)
  {
    $retObj = [];

    $db = new \FL\Common\OracleDB();
    try {
      // $db->Begin();

      if (!(isset($payload) && isset($payload['secret_key']))) {
        throw new \Exception('Token is not valid / Expired.');
      }
      $secret_key = $payload['secret_key'];

      // Key(encrypted) fields
      $session_id = isset($data->session_id) ? $data->session_id : null;

      // decrypt
      $encryption = new \FL\Common\Encryption();
      $id = (!is_null($session_id)) ? intval($encryption->decrypt($session_id, $secret_key)) : null;
      // $id = isset($data->id)?$data->id:null;

      if (!is_null($id) && $id > 0) {
        $sql = 'UPDATE mas_users
                   SET session_token = NULL,
                       uuid = NULL
                 WHERE id = :1';
        $db->Query($sql, [$id]);

        // Log Registered Customer Action
        // $registeredCustomerAction = new \FL\LOG\UserAction();
        // $registeredCustomerAction->save($db, (object)[
        //   'registered_customer_id' => $id,
        //   'action_code' => 'RC_LOGOUT'
        // ]);

        // Remove secret_key from $payload
        unset($payload['secret_key']);
        if (isset($payload['user_type'])) {
          unset($payload['user_type']);
        }
        if (isset($payload['id'])) {
          unset($payload['id']);
        }

        $retObj['message'] = "User logout successful.";
      }

      // Finished
      $db->Commit();
    } catch (\Throwable $th) {
      $db->RollBack();
      $retObj['message'] = $th->getMessage();
    }
    $db->DBClose();

    return $retObj;
  }

  function logout($data, &$payload)
  {
    $retObj = [];

    $db = new \FL\Common\OracleDB();
    try {
      // $db->Begin();

      if (!(isset($payload) && isset($payload['secret_key']))) {
        throw new \Exception('Token is not valid / Expired.');
      }
      $secret_key = $payload['secret_key'];

      // Key(encrypted) fields
      $session_id = isset($data->session_id) ? $data->session_id : null;

      // decrypt
      $encryption = new \FL\Common\Encryption();
      $id = (!is_null($session_id)) ? intval($encryption->decrypt($session_id, $secret_key)) : null;
      // $id = isset($data->id)?$data->id:null;

      if (!is_null($id) && $id > 0) {
        $sql = 'UPDATE mas_users
                   SET session_token = NULL
                 WHERE id = :1';
        $db->Query($sql, [$id]);

        // Log Registered Customer Action
        // $registeredCustomerAction = new \FL\LOG\UserAction();
        // $registeredCustomerAction->save($db, (object)[
        //   'registered_customer_id' => $id,
        //   'action_code' => 'RC_LOGOUT'
        // ]);

        // Remove secret_key from $payload
        unset($payload['secret_key']);
        if (isset($payload['user_type'])) {
          unset($payload['user_type']);
        }
        if (isset($payload['id'])) {
          unset($payload['id']);
        }

        $retObj['message'] = "User logout successful.";
      }

      // Finished
      $db->Commit();
    } catch (\Throwable $th) {
      $db->RollBack();
      $retObj['message'] = $th->getMessage();
    }
    $db->DBClose();

    return $retObj;
  }

  function getUserDetails($data)
  {

    $user_id = isset($data->id) ? $data->id : NULL;
    $rows = [];
    $where_clause = "";
    $params = [];

    if (!is_null($user_id)) {
      $params[] = $user_id;
      $where_clause = " AND a.id = $" . count($params);
    }

    if (!is_null($user_id)) {
      $db = new \FL\Common\OracleDB();
      $sql = 'SELECT a.id, d.name AS state,
                     e.name AS type,
                     a.name, a.mobile_no, a.email
                FROM mas_users AS a
                     LEFT OUTER JOIN mas.states AS d ON (d.id = a.state_id)
                     LEFT OUTER JOIN mas_designations AS e ON (e.code = a.designation_code)
               WHERE TRUE ' . $where_clause . '';
      $db->query($sql, $params);
      $rows = $db->FetchAll();
      $db->DBClose();

      foreach ($rows as &$r) {
        $r['id'] = intval($r['id']);
      }
    }
    return $rows[0];
  }

  function saveProfile($data)
  {
    $retObj = ['id' => '', 'message' => 'not saved'];

    $email = isset($data->email) ? $data->email : null;
    $mobile_no = isset($data->mobile_no) ? $data->mobile_no : null;
    $name = isset($data->name) ? $data->name : null;
    $user_id = isset($data->id) ? $data->id : null;

    if (!is_null($user_id)) {
      $db = new \FL\Common\OracleDB();
      $sql = 'UPDATE mas_users
                 SET email = $1, mobile_no = $2, name = $3
               WHERE id = $4 RETURNING id;';
      $db->Query($sql, [$email, $mobile_no, $name, $user_id]);

      $rows = $db->FetchAll();
      if (count($rows) > 0) {
        $retObj['id'] = $rows[0]['id'];
        $retObj['message'] = 'Saved Successfully';
      }

      $db->DBClose();
    }

    return $retObj;
  }

  private function getUserOTPStatus($db, $data)
  {
    $retObj = [];
    $mobile_no = isset($data->mobile_no) ? $data->mobile_no : null;
    $email = isset($data->email) ? $data->email : null;
    $emp_no = isset($data->emp_no) ? $data->emp_no : null;

    $where_clause = '';
    $params = [];

    switch (true) {
      case (!is_null($mobile_no)):
        $params[] = $mobile_no;
        $where_clause .= ' AND c.mobile_no = $' . count($params);
        break;
      case (!is_null($email)):
        $params[] = $email;
        $where_clause .= ' AND c.email IS NOT NULL AND email = $' . count($params);
        break;
      case (!is_null($emp_no)):
        $params[] = $emp_no;
        $where_clause .= ' AND c.emp_no = $' . count($params);
        break;
    }

    if (isset($data->id)) {
      $id = $data->id;
      $params[] = $id;
      $where_clause .= ' AND c.id = $' . count($params);
    }

    if (count($params) <= 0 || $where_clause == '') {
      throw new \Exception('Invalid User');
    }

    $sql = 'SELECT c.id, c.mobile_no, COALESCE(c.lockout_on, \'1978-02-28\'::TIMESTAMPTZ) + INTERVAL \'10 minutes\' > CURRENT_TIMESTAMP AS is_lockedout,
                   EXTRACT(\'minutes\' FROM c.lockout_on + INTERVAL \'11 minutes\' - CURRENT_TIMESTAMP) AS lockout_time,
                   COALESCE(c.otp_failure_attempt, 0) AS otp_failure_attempt,
                   (COALESCE(c.otp_generated_on, \'1978-02-28\'::DATE) + interval \'10 MINUTES\' < CURRENT_TIMESTAMP) AS allow_otp_generation,
                   (COALESCE(c.otp_generated_on, \'1978-02-28\'::DATE) + interval \'2 MINUTES\' < CURRENT_TIMESTAMP) AS allow_otp_resend,
                   COALESCE(is_otp_resent, FALSE) AS is_otp_resent,c.otp_no
              FROM mas_users AS c
             WHERE c.is_active = true' . $where_clause;
    $db->Query($sql, $params);
    $rows = $db->FetchAll();
    foreach ($rows as &$r) {
      $r['id'] = intval($r['id']);
      $r['is_lockedout'] = ($r['is_lockedout'] == 't');
      $r['lockout_time'] = intval($r['lockout_time']);
      $r['otp_failure_attempt'] = intval($r['otp_failure_attempt']);
      $r['allow_otp_generation'] = ($r['allow_otp_generation'] == 't');
      $r['allow_otp_resend'] = ($r['allow_otp_resend'] == 't');
      $r['is_otp_resent'] = ($r['is_otp_resent'] == 't');
    }

    if (count($rows) > 0) {
      $retObj = $rows[0];
    } else {
      throw new \Exception('Invalid User');
    }

    return $retObj;
  }

  function generateOTPChangePassword($data, &$payload)
  {
    $retObj = [];
    $otp = isset($payload['otp']) ? $payload['otp'] : null;
    $db = new \FL\Common\OracleDB();
    try {
      $db->Begin();

      if (!(isset($payload) && isset($payload['session_token']))) {
        throw new \Exception('Token is not valid / Expired.');
      }
      $secret_key = $payload['secret_key'];

      // Key(encrypted) fields
      $mobile_no = isset($data->mobile_no) ? $data->mobile_no : null;
      $email = isset($data->email) ? $data->email : null;
      $emp_no = isset($data->emp_no) ? $data->emp_no : null;

      // decrypt
      $encryption = new \FL\Common\Encryption();
      if (!is_null($mobile_no)) $mobile_no = $encryption->decrypt($mobile_no, $secret_key);
      if (!is_null($email)) $email = $encryption->decrypt($email, $secret_key);
      if (!is_null($emp_no)) $emp_no = $encryption->decrypt($emp_no, $secret_key);

      if ((is_null($mobile_no) && is_null($email) && is_null($emp_no))) {
        throw new \Exception('Invalid User');
      }

      $otp_request_obj = [];
      switch (true) {
        case (!is_null($mobile_no)):
          $otp_request_obj = ['mobile_no' => $mobile_no];
          break;
        case (!is_null($email)):
          $otp_request_obj = ['email' => $email];
          break;
        case (!is_null($emp_no)):
          $otp_request_obj = ['emp_no' => $emp_no];
          break;
      }

      $otp_status = $this->getUserOTPStatus($db, (object)$otp_request_obj);
      $payload['id'] = $id = $otp_status['id'];
      $otp = $otp_status['otp_no'];
      $mobile_no = $otp_status['mobile_no'];
      $retObj['masked_mobile_no'] = 'XXXXXX' . substr($mobile_no, 6);

      if ($otp_status['is_lockedout'] == true) {
        $retObj['lockout_time'] = $otp_status['lockout_time'];
        throw new \Exception('Lockout');
      }

      if ($otp_status['allow_otp_generation'] && is_null($otp)) {
        throw new \Exception('New OTP cannot be generated when previous active OTP exist. Please try after 10 mins.');
      }

      $sms = new \FL\Common\SMS();
      $otp = $sms->sendOTPForUserChangePassword($mobile_no, $payload);
      // var_dump($payload);die();

      $sql = 'UPDATE mas_users
                 SET otp_generated_on = CURRENT_TIMESTAMP,
                     otp_failure_attempt = 0,
                     lockout_on = NULL,
                     is_otp_resent = NULL,
                     otp_no = $2
               WHERE id = $1';
      $db->Query($sql, [$id, $otp]);

      // Log User Action
      $userAction = new \FL\LOG\UserAction();
      $userAction->save($db, (object)[
        'user_id' => $id,
        'action_code' => 'U_CNG_PWD'
      ]);

      // Remove secret_key from $payload
      unset($payload['secret_key']);
      $payload['otp'] = $otp;
      // var_dump($payload);die();
      // Finished
      $db->Commit();

      $retObj['message'] = 'OTP Generated.';
    } catch (\Throwable $th) {
      $db->RollBack();
      $retObj['message'] = \FL\Common\ErrorHandler::custom($th);
    }
    $db->DBClose();

    return $retObj;
  }

  function resendOTP($data, &$payload)
  {
    // $id = isset($data->id)?$data->id:null;
    $id = isset($payload['id']) ? $payload['id'] : null;
    $otp = isset($payload['otp']) ? $payload['otp'] : null;

    $db = new \FL\Common\OracleDB();
    try {
      if (is_null($otp) || is_null($id)) {
        throw new \Exception('Token is not valid / Expired.');
      }

      $otp_status = $this->getUserOTPStatus($db, (object)['id' => $id]);
      $mobile_no = $otp_status['mobile_no'];

      if ($otp_status['is_lockedout'] == true) {
        $retObj['lockout_time'] = $otp_status['lockout_time'];
        throw new \Exception('Lockout');
      }

      if ($otp_status['allow_otp_generation']) {
        throw new \Exception('Resend OTP cannot be done since already generated OTP expired. Please generate new OTP.');
      }

      if (!$otp_status['allow_otp_resend']) {
        throw new \Exception('Resend OTP cannot be done. Please try after 2 minutes.');
      }

      if ($otp_status['is_otp_resent']) {
        throw new \Exception('Resend OTP can be exercised only once. Already OTP resent.');
      }

      $sms = new \FL\Common\SMS();
      $sms->resendOTPForUserChangePassword($mobile_no, $otp);

      $sql = 'UPDATE mas_users SET is_otp_resent = true WHERE id = $1';
      $db->Query($sql, [$id]);

      $retObj['message'] = 'OTP resent.';
    } catch (\Throwable $th) {
      $retObj['message'] = \FL\Common\ErrorHandler::custom($th);
    }
    $db->DBClose();

    return $retObj;
  }

  function deleteUserOTPGeneratedOn($filter)
  {
    $mobile_no = isset($filter->mobile_no) ? $filter->mobile_no : null;
    $db = new \FL\Common\OracleDB();
    $sql = 'UPDATE mas_users
                SET otp_generated_on = NULL, otp_failure_attempt = 0, lockout_on = NULL, is_otp_resent = NULL, is_otp_validated = true
              WHERE mobile_no = $1';
    $db->Query($sql, [$mobile_no]);
    $db->DBClose();

    $retObj['message'] = 'OTP Verified.';
    return $retObj;
  }


  function checkOTPFailureAttempts($filter)
  {
    $retObj = [];
    $mobile_no = isset($filter->mobile_no) ? $filter->mobile_no : null;

    $db = new \FL\Common\OracleDB();
    try {
      if (is_null($mobile_no)) {
        throw new \Exception('Invalid Mobile No.');
      }

      $otp_status = $this->getUserOTPStatus($db, $filter);

      // $retObj['is_lockedout'] = $otp_status['is_lockedout'];
      if ($otp_status['is_lockedout'] == true) {
        $retObj['lockout_time'] = $otp_status['lockout_time'];
        throw new \Exception('Lockout');
      }

      if ($otp_status['otp_failure_attempt'] < 4) {
        $sql = 'UPDATE mas_users SET otp_failure_attempt = COALESCE(otp_failure_attempt, 0) + 1 WHERE mobile_no = $1 RETURNING otp_failure_attempt';
        $db->Query($sql, [$mobile_no]);
        $rows = $db->FetchAll();
        foreach ($rows as &$r) {
          $r['otp_failure_attempt'] = intval($r['otp_failure_attempt']);
        }
        $retObj['message'] = 'Invalid OTP. Attempt ' . ($rows[0]['otp_failure_attempt']) . ' of 5.';
      } else {
        $sql = 'UPDATE mas_users SET lockout_on = CURRENT_TIMESTAMP, otp_failure_attempt = COALESCE(otp_failure_attempt, 0) + 1 WHERE mobile_no = $1';
        $db->Query($sql, [$mobile_no]);
        $retObj['lockout_time'] = 10;
        $retObj['message'] = 'Lockout';
      }
    } catch (\Throwable $th) {
      $retObj['message'] = $th->getMessage();
    }
    $db->DBClose();

    return $retObj;
  }

  function updateOTPValidated($data)
  {
    $retObj = [];
    $mobile_no = isset($data->mobile_no) ? $data->mobile_no : null;

    $params = array();
    $params[] = $mobile_no;

    $db = new \FL\Common\OracleDB();
    $sql = 'SELECT otp_no FROM mas_users
            WHERE mobile_no = $1';
    $db->Query($sql, $params);
    $row = $db->FetchAll()[0];

    if (isset($data->otp) && isset($row['otp_no']) && $data->otp == $row['otp_no']) {
      $retObj = $this->deleteUserOTPGeneratedOn($data);
    } else {
      $retObj = $this->checkOTPFailureAttempts($data);
    }
    $db->DBClose();
    return $retObj;
  }

  function changePassword($data, &$payload)
  {
    $retObj = [];
    $mobile_no = isset($data->mobile_no) ? $data->mobile_no : null;
    $psw = isset($data->psw) ? $data->psw : null;

    if (!(isset($payload) && isset($payload['secret_key']))) {
      throw new \Exception('Token is not valid / Expired.');
    }
    $secret_key = $payload['secret_key'];
    // decrypt
    $encryption = new \FL\Common\Encryption();
    if (!is_null($psw)) $psw = $encryption->decrypt($psw, $secret_key);

    $pwd = password_hash($psw, PASSWORD_BCRYPT);
    $params = array();
    $params[] = $mobile_no;
    $params[] = $pwd;

    $db = new \FL\Common\OracleDB();
    $sql = 'UPDATE mas_users SET password = $2, up_dt = now()
            WHERE mobile_no = $1 RETURNING id';

    $db->Query($sql, $params);
    $rows = $db->FetchAll();

    if (count($rows) > 0) {
      $retObj['id'] = intval($rows[0]['id']);
      $retObj['message'] = 'Password Changed Successfully';
    }

    $db->DBClose();
    return $retObj;
  }


  function generateOTPForgotPassword($data, &$payload)
  {
    $retObj = [];

    $db = new \FL\Common\OracleDB();
    try {
      $db->Begin();

      $secret_key = $payload['secret_key'];

      // Key(encrypted) fields
      $mobile_no = isset($data->mobile_no) ? $data->mobile_no : null;
      $email = isset($data->email) ? $data->email : null;
      $emp_no = isset($data->emp_no) ? $data->emp_no : null;

      // decrypt
      $encryption = new \FL\Common\Encryption();
      if (!is_null($mobile_no)) $mobile_no = $encryption->decrypt($mobile_no, $secret_key);
      if (!is_null($email)) $email = $encryption->decrypt($email, $secret_key);
      if (!is_null($emp_no)) $emp_no = $encryption->decrypt($emp_no, $secret_key);

      if ((is_null($mobile_no) && is_null($email) && is_null($emp_no))) {
        throw new \Exception('Invalid User');
      }

      $opt_request_obj = [];
      switch (true) {
        case (!is_null($mobile_no)):
          $opt_request_obj = ['mobile_no' => $mobile_no];
          break;
        case (!is_null($email)):
          $opt_request_obj = ['email' => $email];
          break;
        case (!is_null($emp_no)):
          $opt_request_obj = ['emp_no' => $emp_no];
          break;
      }

      $otp_status = $this->getUserOTPStatus($db, (object)$opt_request_obj);
      $payload['id'] = $id = $otp_status['id'];
      $mobile_no = $otp_status['mobile_no'];
      $retObj['masked_mobile_no'] = 'XXXXXX' . substr($mobile_no, 6);

      if ($otp_status['is_lockedout'] == true) {
        $retObj['lockout_time'] = $otp_status['lockout_time'];
        throw new \Exception('Lockout');
      }

      if (!$otp_status['allow_otp_generation']) {
        throw new \Exception('New OTP cannot be generated when previous active OTP exist. Please try after 10 mins.');
      }

      $sms = new \FL\Common\SMS();
      $otp = $sms->sendOTPForUserForgotPassword($mobile_no, $payload);
      // var_dump($payload);die();

      $sql = 'UPDATE mas_users
                 SET otp_generated_on = CURRENT_TIMESTAMP,
                     otp_failure_attempt = 0,
                     lockout_on = NULL,
                     is_otp_resent = NULL,
                     otp_no = $2
               WHERE id = $1';
      $db->Query($sql, [$id, $otp]);

      // Log User Action
      $userAction = new \FL\LOG\UserAction();
      $userAction->save($db, (object)[
        'user_id' => $id,
        'action_code' => 'U_CNG_PWD'
      ]);

      // Remove secret_key from $payload
      unset($payload['secret_key']);
      $payload['otp'] = $otp;
      // var_dump($payload);die();
      // Finished
      $db->Commit();

      $retObj['message'] = 'OTP Generated.';
    } catch (\Throwable $th) {
      $db->RollBack();
      $retObj['message'] = \FL\Common\ErrorHandler::custom($th);
    }
    $db->DBClose();

    return $retObj;
  }

  function resendOTPForgotPassword($data, &$payload)
  {
    // $id = isset($data->id)?$data->id:null;
    $mobile_no = isset($data->mobile_no) ? $data->mobile_no : null;
    $otp = isset($payload['otp']) ? $payload['otp'] : null;

    $secret_key = $payload['secret_key'];
    // decrypt
    $encryption = new \FL\Common\Encryption();
    if (!is_null($mobile_no)) $mobile_no = $encryption->decrypt($mobile_no, $secret_key);

    $db = new \FL\Common\OracleDB();
    try {
      if (is_null($mobile_no)) {
        throw new \Exception('Invalid Mobile No.');
      }
      // die();
      $otp_status = $this->getUserOTPStatus($db, (Object)['mobile_no' => $mobile_no]);
      $id = $otp_status['id'];
      $otp = $otp_status['otp_no'];

      if ($otp_status['is_lockedout'] == true) {
        $retObj['lockout_time'] = $otp_status['lockout_time'];
        throw new \Exception('Lockout');
      }

      if ($otp_status['allow_otp_generation'] || is_null($otp)) {
        throw new \Exception('Resend OTP cannot be done since already generated OTP expired. Please generate new OTP.');
      }

      if (!$otp_status['allow_otp_resend']) {
        throw new \Exception('Resend OTP cannot be done. Please try after 2 minutes.');
      }

      if ($otp_status['is_otp_resent']) {
        throw new \Exception('Resend OTP can be exercised only once. Already OTP resent.');
      }

      $sms = new \FL\Common\SMS();
      $sms->resendOTPForUserChangePassword($mobile_no, $otp);

      $sql = 'UPDATE mas_users SET is_otp_resent = true WHERE id = $1';
      $db->Query($sql, [$id]);

      $retObj['message'] = 'OTP resent.';
    } catch (\Throwable $th) {
      $retObj['message'] = \FL\Common\ErrorHandler::custom($th);
    }
    $db->DBClose();

    return $retObj;
  }


  function isDeviceActive($data, &$payload)
  {
    $retObj = [];
    $db = new \FL\Common\OracleDB();
    $gn = new \FL\Common\GeneralFunctions();
    $encryption = new \FL\Common\Encryption();
    try {
      // $db->Begin();

      if (!(isset($payload) && isset($payload['secret_key']))) {
        throw new \Exception('Token is not valid / Expired.');
      }
      $secret_key = $payload['secret_key'];

      $uuid = isset($data->uuid)?$data->uuid:null;

      if (!\is_null($uuid)) {
        $uuid = $encryption->decrypt($uuid, $secret_key);

        $users = $this->getUsers((object)['uuid' => $uuid, 'include_system_user' => true]);

        if ((isset($users) && count($users['rows']) > 0)) {
          $retObj = ($users['rows'][0]);
          $user_id = $retObj['ID'];

          // Update session token
          $session_token = $gn->generateSecretKey();
          $sql = 'UPDATE mas_users
                     SET last_login = CURRENT_TIMESTAMP,
                         session_token = :2,
                         failure_attempt = 0,
                         lockout_on = NULL
                   WHERE id = :1';
          $db->Query($sql, [$user_id, $session_token],[], true);

          // send token to client and for future session verifications ($payload already exist)
          $payload['id'] = $user_id;
          $payload['session_token'] = $session_token;

          // Remove secret_key from $payload
          unset($payload['secret_key']);

          $retObj['message'] = "Device authentication enabled.";
        }
      }

      // Finished
      $db->Commit();
    } catch (\Throwable $th) {
      $db->RollBack();
      $retObj['message'] = \FL\Common\ErrorHandler::custom($th);
    }
    $db->DBClose();

    return $retObj;
  }

}
