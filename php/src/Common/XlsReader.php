<?php
  namespace FL\Common;

  define('SHEET_NAME', 'new sheet');

  class XlsReader {
    function read($file_name) {
      // Need to check whether existing memory limit is managable and to be increased?
      // $memory_limit = ini_get('memory_limit')
      ini_set('memory_limit', '1024M');
      $reader = new \PhpOffice\PhpSpreadsheet\Reader\Xls();
      $reader->setReadDataOnly(true);
      $reader->setLoadSheetsOnly(SHEET_NAME);
      $spreadsheet = $reader->load($file_name);
      $dataArray = $spreadsheet->getActiveSheet()->toArray(null, false, false, false);
      unset($reader);

      return $dataArray;
    }
  }
?>