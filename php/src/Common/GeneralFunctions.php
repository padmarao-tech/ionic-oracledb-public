<?php

namespace FL\Common;

class GeneralFunctions
{
  function getServerTime()
  {
    // Process and send Server Time
    // $dt = new \DateTime("now", new \DateTimeZone('Asia/Kolkata'));
    // $dt->add(new \DateInterval('PT3H')); // Change server time for testing
    // $dt->format('Y-m-d H:i:sP')

    $dt = new \DateTime("now", new \DateTimeZone('Asia/Kolkata'));
    return $dt->format('Y-m-d H:i:sP');
  }

  /**
   * To get local testing domain names
   *
   * @return string[] domain names eg. http://bnc-ms.cmwssb.in
   */
  function getAllowedDomains()
  {
    return ['http://localhost','http://localhost:4200','http://localhost:8100','http://localhost:8101','http://localhost:8103'];
  }

  /**
   * add COR Headers after testing for ORIGIN (REQUEST)
   *
   * @return bool true on REQUEST METHOD is OPTIONS else false
   */
  function addCORHeaders()
  {
    $origin = $this->getRequestOrigin();
    $allowed_domains = $this->getAllowedDomains();
    
    if (in_array(strtolower($origin), $allowed_domains, true) || true) {
      header('Access-Control-Allow-Origin: *', true);
      header('Access-Control-Allow-Headers: Content-Type, authorization', true);
    } else {
      $message = "Origin: " . $origin;
      $this->log($message);
    }

    return ($_SERVER['REQUEST_METHOD'] == 'OPTIONS');
  }

  /**
   * add General Headers
   */
  function addGeneralHeaders()
  {
    header('Content-Type: application/json');
    header('X-Content-Type-Options: nosniff');

    header('Access-Control-Expose-Headers: Content-Length, Content-Type, X-TOKEN', true);
  }

  function getRequestOrigin()
  {
    $origin = '';
    if (array_key_exists('HTTP_ORIGIN', $_SERVER)) {
      $origin = $_SERVER['HTTP_ORIGIN'];
    } else if (array_key_exists('HTTP_REFERER', $_SERVER)) {
      $origin = $_SERVER['HTTP_REFERER'];
    } else {
      $origin = $_SERVER['REMOTE_ADDR'];
    }
    return $origin;
  }

  function getDomainName()
  {
    // $url = (isset($_SERVER['HTTPS']) ? "https":"http")."://".$_SERVER['SERVER_NAME'].htmlentities($_SERVER['PHP_SELF']);
    // $url = explode("/svr", $url);
    // return $url[0];
    $domain_name = (isset($_SERVER['HTTPS']) ? "https" : "http") . "://" . $_SERVER['SERVER_NAME'];
    return $domain_name;
  }

  function getIPAddress()
  {
    foreach (array('HTTP_CLIENT_IP', 'HTTP_X_FORWARDED_FOR', 'HTTP_X_FORWARDED', 'HTTP_X_CLUSTER_CLIENT_IP', 'HTTP_FORWARDED_FOR', 'HTTP_FORWARDED', 'REMOTE_ADDR') as $key) {
      if (array_key_exists($key, $_SERVER) === true) {
        foreach (explode(',', $_SERVER[$key]) as $ip) {
          $ip = trim($ip); // just to be safe

          // Removed "FILTER_FLAG_NO_PRIV_RANGE | " from following line, to enable capture of Local IP Addresses too. Orignal: "FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE" (without quote)
          if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_RES_RANGE) !== false) {
            return $ip;
          }
        }
      }
    }
    // If all above fails
    return getHostByName(getHostName());
  }

  function generateSecretKey($strength = 16)
  {
    $permitted_chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (strlen($permitted_chars) < $strength) {
      throw new \Exception('Strength should not be greater than ' . strlen($permitted_chars));
    }
    $randomString = substr(str_shuffle($permitted_chars), 0, $strength);
    return $randomString;
  }

  // function log($message)
  // {
  //   date_default_timezone_set("Asia/Calcutta");
  //   $logFileName = __DIR__."/../../../logs/ge-".date('ymd').".log";
  //   $txt = '['.date("Y-m-d h:i:sa").'] ['.$message.'] '.PHP_EOL;
  //   file_put_contents($logFileName, $txt, FILE_APPEND);
  // }

  /**
   * Check given file for pdf else raise error
   *
   * @param file $file  Uploaded File to be checked
   *
   * @return bool
   */
  function checkPdfDoc($file): bool
  {
    if (!isset($file)) {
      throw new \Exception('Uploaded file not found.');
    }
    if ($file['error'] !== UPLOAD_ERR_OK) {
      throw new \Exception('Upload failed with error ' . $file['error']);
    }
    $finfo = new \finfo(FILEINFO_MIME_TYPE);
    $mime = $finfo->file($file['tmp_name']);
    if ($mime != 'application/pdf') {
      throw new \Exception('Upload a valid pdf file. You are trying to upload: ' . $mime);
    }
    return true;
  }

  /**
   * To generate distination folder and return it's path (not real path)
   *
   * @return string
   */
  function getDestinationDIR(): string
  {
    $destinationDIR = '';
    $d = new \DateTime('now', new \DateTimeZone('Asia/Kolkata'));
    $destinationDIR = '..' . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . $d->format("Y") . DIRECTORY_SEPARATOR . $d->format("m") . DIRECTORY_SEPARATOR . $d->format("d");
    if (!file_exists($destinationDIR)) {
      mkdir($destinationDIR, 0777, true);
    }
    return $destinationDIR;
  }

  /**
   * Generate a random string, using a cryptographically secure
   * pseudorandom number generator (random_int)
   *
   * This function uses type hints now (PHP 7+ only), but it was originally
   * written for PHP 5 as well.
   *
   * For PHP 7, random_int is a PHP core function
   * For PHP 5.x, depends on https://github.com/paragonie/random_compat
   *
   * @param int $length      How many characters do we want?
   * @param string $keyspace A string of all possible characters
   *                         to select from
   * @return string
   */
  function randomStr(int $length = 10, string $keyspace = 'abcdefghijklmnopqrstuvwxyz0123456789'): string
  {
    if ($length < 1) {
      throw new \RangeException("Length must be a positive integer");
    }
    $pieces = [];
    $max = mb_strlen($keyspace, '8bit') - 1;
    for ($i = 0; $i < $length; ++$i) {
      $pieces[] = $keyspace[random_int(0, $max)];
    }
    return implode('', $pieces);
  }

  function checkPasswordPattern($password)
  {
    return (\preg_match("/^(?=.*\\W+)(?![\\n])(?=.*[A-Z])(?=.*[a-z])(?=.*\\d).*$/", $password) === 1);
  }

  function log($message)
  {
    date_default_timezone_set("Asia/Calcutta");
    $logFileName = __DIR__ . "/../../../logs/gf-" . date('ymd') . ".log";
    $txt = '[' . date("Y-m-d h:i:s A") . '] [' . $message . '] ' . PHP_EOL;
    file_put_contents($logFileName, $txt, FILE_APPEND);
  }

  public function convertNumberToWord($number) {
    // $number = 190908100.25;
    $no = round($number);
    // $point = round($number - $no, 2) * 100;
    $hundred = null;
    $digits_1 = strlen($no);
    $i = 0;
    $str = array();
    $words = array(
      '0' => '',
      '1' => 'One',
      '2' => 'Two',
      '3' => 'Three',
      '4' => 'Four',
      '5' => 'Five',
      '6' => 'Six',
      '7' => 'Seven',
      '8' => 'Eight',
      '9' => 'Nine',
      '10' => 'Ten',
      '11' => 'Eleven',
      '12' => 'Twelve',
      '13' => 'Thirteen',
      '14' => 'Fourteen',
      '15' => 'Fifteen',
      '16' => 'Sixteen',
      '17' => 'Seventeen',
      '18' => 'Eighteen',
      '19' =>'Nineteen',
      '20' => 'Twenty',
      '30' => 'Thirty',
      '40' => 'Forty',
      '50' => 'Fifty',
      '60' => 'Sixty',
      '70' => 'Seventy',
      '80' => 'Eighty',
      '90' => 'Ninety'
    );
    $digits = array('', 'Hundred', 'Thousand', 'Lakh', 'Crore');
    while ($i < $digits_1) {
     $divider = ($i == 2) ? 10 : 100;
     $number = floor($no % $divider);
     $no = floor($no / $divider);
     $i += ($divider == 10) ? 1 : 2;
     if ($number) {
        // $plural = (($counter = count($str)) && $number > 9) ? 's' : null;
        $plural = (($counter = count($str)) && $number > 9) ? '' : null;
        $hundred = ($counter == 1 && $str[0]) ? ' and ' : null;
        $str[] = ($number < 21)?($words[$number]." ".$digits[$counter].$plural." ".$hundred):($words[floor($number / 10) * 10]." ".$words[$number % 10]." ".$digits[$counter].$plural." ".$hundred);
     }
     else
       $str[] = null;
    }
    $str = array_reverse($str);
    $result = implode('', $str);
    $result = ($result == '')? 'Zero' : $result;
    // $points = ($point) ? "." . $words[$point / 10] . " " . $words[$point = $point % 10] : '';
    return trim($result); // . "Rupees  " . $points . " Paise";
  }

  function moneyFormatIndia($num) {
    $nums = explode('.', $num);
    $num1 = $nums[0];
    $num2 = isset($nums[1])? $nums[1]: '00';;
    $explrestunits = "" ;
    if(strlen($num1)>3) {
        $lastthree = substr($num1, strlen($num1)-3, strlen($num1));
        $restunits = substr($num1, 0, strlen($num1)-3); // extracts the last three digits
        $restunits = (strlen($restunits)%2 == 1)?"0".$restunits:$restunits; // explodes the remaining digits in 2's formats, adds a zero in the beginning to maintain the 2's grouping.
        $expunit = str_split($restunits, 2);
        for($i=0; $i<sizeof($expunit); $i++) {
            // creates each of the 2's group and adds a comma to the end
            if($i==0) {
                $explrestunits .= (int)$expunit[$i].","; // if is first value , convert into integer
            } else {
                $explrestunits .= $expunit[$i].",";
            }
        }
        $thecash = $explrestunits.$lastthree.'.'.$num2;
    } else {
        $thecash = $num1.'.'.$num2;
    }
    return $thecash; // writes the final format where $currency is the currency symbol.
  }

}
