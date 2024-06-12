<?php
namespace FL\Common;


class OracleDB
{
    var $conn;
    var $host;
    var $port;
    var $username;
    var $password;
    var $service;
    var $result;

    function __construct()
    {
        $this->host = MyConfig::Host;
        $this->port = MyConfig::Port;
        $this->username = MyConfig::User;
        $this->password = MyConfig::Password;
        $this->service = MyConfig::DbName;
        $this->Connect();
    }

    function Connect() {
        $this->conn = oci_connect($this->username, $this->password, 'localhost:1522/XE');
        if (!$this->conn) {
            $e = oci_error();
            throw new \Exception("Failed to connect to Oracle: " . $e['message']);
        }
        return $this->conn;
    }

    
    function Query($sql, $params = [], $retparams = []) {
        // var_dump($is_cmmit? 'OCI_NO_AUTO_COMMIT': 'OCI_COMMIT_ON_SUCCESS');
        $this->result = oci_parse($this->conn, $sql);
        if (!$this->result) {
            $e = oci_error($this->conn);
            throw new \Exception("Error in SQL: " . $e['message']);
        }

        // Bind the parameters to the prepared statement
        foreach ($params as $paramName => $paramValue) {
            oci_bind_by_name($this->result, ':'.($paramName + 1), $params[$paramName]);
        }

        $return = [];
        foreach ($retparams as $paramName => $paramValue) {
            oci_bind_by_name($this->result, ':'.$retparams[$paramName], $return[$retparams[$paramName]], 50);
        }
        
        $result = oci_execute($this->result, OCI_NO_AUTO_COMMIT);
        // if($is_cmmit){
        //     // var_dump($is_cmmit);
            // $result = oci_execute($this->result, OCI_NO_AUTO_COMMIT);
        // } else {
            // $result = oci_execute($this->result);
        // }
        if (!$result) {
            $e = oci_error($this->result);
            throw new \Exception("Error executing SQL: " . $e['message']);
        }
        // var_dump($return);
        return [ $return];
    }

    function QueryR($sql, $params = [], $ret = null, $is_cmmit = false) {
        // var_dump($is_cmmit? 'OCI_NO_AUTO_COMMIT': 'OCI_COMMIT_ON_SUCCESS');
        $this->result = oci_parse($this->conn, $sql);
        if (!$this->result) {
            $e = oci_error($this->conn);
            throw new \Exception("Error in SQL: " . $e['message']);
        }

        // Bind the parameters to the prepared statement
        // foreach ($params as $paramName => $paramValue) {
        //     oci_bind_by_name($this->result, ':'.($paramName + 1), $params[$paramName]);
        // }
        for($i = 0; $i< count($params); $i++){
            oci_bind_by_name($this->result, ':'.($i + 1), $params[$i]);
        }
        $id = null;
        oci_bind_by_name($this->result, $ret, $id);

        $result = oci_execute($this->result, $is_cmmit? OCI_NO_AUTO_COMMIT: OCI_COMMIT_ON_SUCCESS);
        if (!$result) {
            $e = oci_error($this->result);
            throw new \Exception("Error executing SQL: " . $e['message']);
        }

        return $id;
    }

    function Begin(){
        oci_execute(oci_parse($this->conn, "BEGIN"));
    }

    function FetchAll() {
        $rows = array();
        while ($row = oci_fetch_assoc($this->result)) {
            $row = array_change_key_case($row, CASE_LOWER); // Convert keys to lowercase
            $rows[] = $row;
        }
        return $rows;
    }

    function Commit() {
        oci_commit($this->conn);
    }

    public function RollBack() {
        oci_rollback($this->conn);
    }
    

    function DBClose() {
        if ($this->conn) {
            oci_close($this->conn);
            $this->conn = null;
        }
    }

    function _version()
	{
		return oci_server_version($this->conn);
	}
}
?>