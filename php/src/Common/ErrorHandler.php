<?php
  namespace FL\Common;

  class ErrorHandler {
    static function defineErrorLevel() {
      // for development
      error_reporting(E_ALL);
      ini_set('display_errors', 1);
      // // for production
      // error_reporting(E_ERROR);
      // ini_set('display_errors', 0);
    }

    static function custom(\Throwable $th) {
      $error_message = 'Unknown error occured. Reported it to system administrator. Please Try again later.';
      $display_errors = ini_get('display_errors');

      if ($display_errors == "1" || $display_errors == 'On' || $th->getCode() === 0) {
        $error_message = $th->getMessage();
      } else {
        error_log($th->getMessage());
      }

      return $error_message;
    }
  }
?>