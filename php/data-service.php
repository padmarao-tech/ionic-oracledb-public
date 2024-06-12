<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
@ini_set( 'upload_max_size' , '1024M' );
@ini_set( 'post_max_size', '800M');
@ini_set( 'memory_limit', '900M' );

require_once __DIR__ . '/vendor/autoload.php';
\FL\Common\ErrorHandler::defineErrorLevel();

$jwt = new \FL\Common\JWT();

$gn = new \FL\Common\GeneralFunctions();
if ($gn->addCORHeaders()) {
  exit();
}

try {
  $payload = (array)$jwt->validateToken();
  switch (true) {
    case (isset($payload['id']) && $payload['id'] > 0):
      if (!(
        (isset($_GET['logout']) && $_GET['logout']) ||
        (isset($_GET['logout']) && $_GET['logout'])
      )) {
        // TODO:: Check if user is already logged in[ 'id' => ['id'] ]
      
        $user = new \FL\Master\User();
        $user->checkSessionToken((object)$payload);

        $newToken = $jwt->generateToken((object)$payload);
        header("X-TOKEN: {$newToken}", true);
      }
      break;

    default:
      throw new \Exception("authentication data tampered.");
  }
} catch (\Exception $e) {
  switch (true) {
      // Requires no token
    case (isset($_GET['generateSecretKey']) && $_GET['generateSecretKey']):
      // User login related
    case (isset($_GET['login']) && $_GET['login']):
    case (isset($_GET['logout']) && $_GET['logout']):
    case (isset($_GET['checkUserAndGenerateOTP']) && $_GET['checkUserAndGenerateOTP']):
    case (isset($_GET['resendUserOTP']) && $_GET['resendUserOTP']):
    case (isset($_GET['generateOTPForgotPassword']) && $_GET['generateOTPForgotPassword']):
    case (isset($_GET['validateUserOTP']) && $_GET['validateUserOTP']):
    case (isset($_GET['changePassword']) && $_GET['changePassword']):
    case (isset($_GET['saveUserPassword']) && $_GET['saveUserPassword']):
    case (isset($_GET['isDeviceActive']) && $_GET['isDeviceActive']):
        // Customer registration related
    case (isset($_GET['Upload']) && $_GET['Upload']):
    case (isset($_GET['register']) && $_GET['register']):
    case (isset($_GET['isUserMobileNoExist']) && $_GET['isUserMobileNoExist']):
    case (isset($_GET['isUserEmailExist']) && $_GET['isUserEmailExist']):
    case (isset($_GET['isAadharExistUser']) && $_GET['isAadharExistUser']):
    case (isset($_GET['getUploadedPdf']) && $_GET['getUploadedPdf']):
    case (isset($_GET['resendOTPForgotPassword']) && $_GET['resendOTPForgotPassword']):
    break;

      // Default
    default:
      echo \FL\Common\ErrorHandler::custom($e);
      // HTTP/1.1 401 Unauthorized
      header($_SERVER['SERVER_PROTOCOL'] . " 401 Unauthorized", true, 401);
      die();
  }
}

$gn->addGeneralHeaders();

switch (true) {
  case (isset($_GET['generateSecretKey']) && $_GET['generateSecretKey']):
    $secret_key = $gn->generateSecretKey();

    if (isset($payload)) {
      $payload['secret_key'] = $secret_key;
    } else {
      $payload = ['secret_key' => $secret_key];
    }

    $newToken = $jwt->generateToken((object)$payload);
    header("X-TOKEN: {$newToken}", true);

    echo json_encode($secret_key); //[ 'secretKey' =>  ]
    break;

  case (isset($_GET['getServerTime']) && $_GET['getServerTime']):
    $gf = new \FL\Common\GeneralFunctions();
    echo json_encode([ 'a' => $gf->getServerTime() ]);
    break;

  case (isset($_GET['login']) && $_GET['login']):
    $postdata = file_get_contents("php://input");
    $request = json_decode($postdata);

    $user = new \FL\Master\User();
    $response = $user->login($request, $payload);

    $newToken = $jwt->generateToken((object)$payload);
    header("X-TOKEN: {$newToken}", true);

    echo json_encode($response);
    break;

  case (isset($_GET['logout']) && $_GET['logout']):
    $postdata = file_get_contents("php://input");
    $request = json_decode($postdata);

    $user = new \FL\Master\User();
    $response = $user->logout($request, $payload);

    $newToken = $jwt->generateToken((object)$payload);
    header("X-TOKEN: {$newToken}");

    echo json_encode($response);
    break;

  case (isset($_GET['mobileLogout']) && $_GET['mobileLogout']):
    $postdata = file_get_contents("php://input");
    $request = json_decode($postdata);

    $user = new \FL\Master\User();
    $response = $user->mobileLogout($request, $payload);

    $newToken = $jwt->generateToken((object)$payload);
    header("X-TOKEN: {$newToken}");

    echo json_encode($response);
    break;

  case (isset($_GET['isDeviceActive']) && $_GET['isDeviceActive']):
    $postdata = file_get_contents("php://input");
    $request = json_decode($postdata);

    $user = new \FL\Master\User();
    $response = $user->isDeviceActive($request, $payload);

    $newToken = $jwt->generateToken((object)$payload);
    header("X-TOKEN: {$newToken}", true);

    echo json_encode($response);
    break;
  #region Register
  case (isset($_GET['register']) && $_GET['register']):
    $postdata = file_get_contents("php://input");
    $request = json_decode($postdata);

    $user = new \FL\Master\User();
    $response = $user->register($request, $payload);

    $newToken = $jwt->generateToken((object)$payload);
    header("X-TOKEN: {$newToken}", true);

    echo json_encode($response);
    break;

  case (isset($_GET['isAadharExistUser']) && $_GET['isAadharExistUser']):
    $postdata = file_get_contents("php://input");
    $request = json_decode($postdata);

    $user = new \FL\Master\User();
    $response = $user->isAadharExistUser($request);

    echo json_encode($response);
    break;

  case (isset($_GET['isUserMobileNoExist']) && $_GET['isUserMobileNoExist']):
    $postdata = file_get_contents("php://input");
    $request = json_decode($postdata);

    $user = new \FL\Master\User();
    echo json_encode($user->isMobileNoExist($request, $payload));
    break;

  case (isset($_GET['isUserEmailExist']) && $_GET['isUserEmailExist']):
    $postdata = file_get_contents("php://input");
    $request = json_decode($postdata);

    $user = new \FL\Master\User();
    echo json_encode($user->isEmailExist($request, $payload));
    break;
  #endregion register

  case (isset($_GET['getUserMenus']) && $_GET['getUserMenus']):
    $postdata = file_get_contents("php://input");
    $request = json_decode($postdata);

    $user = new \FL\Master\User();
    echo json_encode($user->getUserMenus($request, $payload));
    break;
  
  #region Designations
  case (isset($_GET['getDesignations']) && $_GET['getDesignations']):
    $postdata = file_get_contents("php://input");
    $request = json_decode($postdata);

    $designation = new \FL\Master\Designation();
    echo json_encode($designation->getDesignations($request));
    break;

  case (isset($_GET['getDesignationsRootWise']) && $_GET['getDesignationsRootWise']):
    $postdata = file_get_contents("php://input");
    $request = json_decode($postdata);

    $designation = new \FL\Master\Designation();
    echo json_encode($designation->getDesignationsRootWise($request));
    break;

  case (isset($_GET['saveDesignation']) && $_GET['saveDesignation']):
    $postdata = file_get_contents("php://input");
    $request = json_decode($postdata);

    $designation = new \FL\Master\Designation();
    echo json_encode($designation->saveDesignation($request));
    break;

  case (isset($_GET['deleteDesignation']) && $_GET['deleteDesignation']):
    $postdata = file_get_contents("php://input");
    $request = json_decode($postdata);

    $designation = new \FL\Master\Designation();
    echo json_encode($designation->deleteDesignation($request));
    break;

  case (isset($_GET['toggleDesignationStatus']) && $_GET['toggleDesignationStatus']):
    $postdata = file_get_contents("php://input");
    $request = json_decode($postdata);

    $designation = new \FL\Master\Designation();
    echo json_encode($designation->toggleDesignationStatus($request));
    break;

  case (isset($_GET['toggleIsShowPayment']) && $_GET['toggleIsShowPayment']):
    $postdata = file_get_contents("php://input");
    $request = json_decode($postdata);

    $designation = new \FL\Master\Designation();
    echo json_encode($designation->toggleIsShowPayment($request));
    break;

  case (isset($_GET['toggleIsShowOccupancy']) && $_GET['toggleIsShowOccupancy']):
    $postdata = file_get_contents("php://input");
    $request = json_decode($postdata);

    $designation = new \FL\Master\Designation();
    echo json_encode($designation->toggleIsShowOccupancy($request));
    break;

  case (isset($_GET['toggleIsShowLicence']) && $_GET['toggleIsShowLicence']):
    $postdata = file_get_contents("php://input");
    $request = json_decode($postdata);

    $designation = new \FL\Master\Designation();
    echo json_encode($designation->toggleIsShowLicence($request));
    break;
  
  case (isset($_GET['isDesignationCodeExist']) && $_GET['isDesignationCodeExist']):
    $postdata = file_get_contents("php://input");
    $request = json_decode($postdata);

    $designation = new \FL\Master\Designation();
    echo json_encode($designation->isDesignationCodeExist($request));
    break;

  case (isset($_GET['isDesignationNameExist']) && $_GET['isDesignationNameExist']):
    $postdata = file_get_contents("php://input");
    $request = json_decode($postdata);

    $designation = new \FL\Master\Designation();
    echo json_encode($designation->isDesignationNameExist($request));
    break;
  #endregion Designations

  case (isset($_GET['getUserDetails']) && $_GET['getUserDetails']):
    $postdata = file_get_contents("php://input");
    $request = json_decode($postdata);

    $user = new \FL\Master\User();
    echo json_encode($user->getUserDetails($request));
    break;

  case (isset($_GET['getUploadedPdf']) && $_GET['getUploadedPdf']):
    $postdata = file_get_contents("php://input");
    $request = json_decode($postdata);

    if (isset($request->storage_name)) {
      $storage_name = $request->storage_name;
      // var_dump($storage_name);
      // die();
      if (file_exists($storage_name)) {
        $filelength = filesize($storage_name);
        header('Content-Type: application/pdf', true);
        header('Content-Disposition: inline; filename="file.pdf"');
        if (!isset($_SERVER['HTTP_ACCEPT_ENCODING']) or empty($_SERVER['HTTP_ACCEPT_ENCODING'])) {
          // the content length may vary if the server is using compression
          header('Content-Length: ' . $filelength);
        }
        readfile($storage_name);
        exit;
      }
    }
    // For unsuccess cases
    header($_SERVER['SERVER_PROTOCOL'] . " 404 Not Found");
    break;

  case (isset($_GET['getUploadedVideo']) && $_GET['getUploadedVideo']):
    $postdata = file_get_contents("php://input");
    $request = json_decode($postdata);

    if (isset($request->storage_name)) {
      $storage_name = $request->storage_name;
      // var_dump($storage_name);
      // die();
      if (file_exists($storage_name)) {
        $filelength = filesize($storage_name);
        header('Content-Type: video/mp4', true);
        header('Content-Disposition: inline; filename="file.mp4"');
        if (!isset($_SERVER['HTTP_ACCEPT_ENCODING']) or empty($_SERVER['HTTP_ACCEPT_ENCODING'])) {
          // the content length may vary if the server is using compression
          header('Content-Length: ' . $filelength);
        }
        readfile($storage_name);
        exit;
      }
    }
    // For unsuccess cases
    header($_SERVER['SERVER_PROTOCOL'] . " 404 Not Found");
    break;

  
  case (isset($_GET['getUsers']) && $_GET['getUsers']):
    $postdata = file_get_contents("php://input");
    $request = json_decode($postdata);

    $user = new \FL\Master\User();
    echo json_encode($user->getUsers($request));
    break;
  
  #region Users
  case (isset($_GET['saveUser']) && $_GET['saveUser']):
    $postdata = file_get_contents("php://input");
    $request = json_decode($postdata);

    $user = new \FL\Master\User();
    echo json_encode($user->saveUser($request, $payload));
    break;

  case (isset($_GET['toggleUserStatus']) && $_GET['toggleUserStatus']):
    $postdata = file_get_contents("php://input");
    $request = json_decode($postdata);

    $user = new \FL\Master\User();
    echo json_encode($user->toggleUserStatus($request, $payload));
    break;

  case (isset($_GET['deleteUser']) && $_GET['deleteUser']):
    $postdata = file_get_contents("php://input");
    $request = json_decode($postdata);

    $user = new \FL\Master\User();
    echo json_encode($user->deleteUser($request, $payload));
    break;

  case (isset($_GET['getOfficialUsers']) && $_GET['getOfficialUsers']):
    $postdata = file_get_contents("php://input");
    $request = json_decode($postdata);

    $user = new \FL\Master\User();
    echo json_encode($user->getOfficialUsers($request));
    break;

  #endregion Users

  case (isset($_GET['getScreens']) && $_GET['getScreens']):
    $postdata = file_get_contents("php://input");
    $request = json_decode($postdata);

    $client_licence = new \FL\Master\Screen();
    echo json_encode($client_licence->getScreens($request));
    break;

  case (isset($_GET['SaveDesignationScreens']) && $_GET['SaveDesignationScreens']):
    $postdata = file_get_contents("php://input");
    $request = json_decode($postdata);

    $client_licence = new \FL\Master\DesignationScreen();
    echo json_encode($client_licence->SaveDesignationScreens($request));
    break;

  case (isset($_GET['saveProfile']) && $_GET['saveProfile']):
    $postdata = file_get_contents("php://input");
    $request = json_decode($postdata);

    $client_licence = new \FL\Master\User();
    echo json_encode($client_licence->saveProfile($request));
    break;

  case (isset($_GET['generateOTPChangePassword']) && $_GET['generateOTPChangePassword']):
    $postdata = file_get_contents("php://input");
    $request = json_decode($postdata);

    $client_licence = new \FL\Master\User();
    echo json_encode($client_licence->generateOTPChangePassword($request, $payload));
    break;

  case (isset($_GET['generateOTPForgotPassword']) && $_GET['generateOTPForgotPassword']):
    $postdata = file_get_contents("php://input");
    $request = json_decode($postdata);

    $client_licence = new \FL\Master\User();
    echo json_encode($client_licence->generateOTPForgotPassword($request, $payload));
    break;

  case (isset($_GET['validateUserOTP']) && $_GET['validateUserOTP']):
    $postdata = file_get_contents("php://input");
    $request = json_decode($postdata);
    
    $User = new \FL\Master\User();
    echo json_encode($User->updateOTPValidated($request));
    break;

  case (isset($_GET['changePassword']) && $_GET['changePassword']):
    $postdata = file_get_contents("php://input");
    $request = json_decode($postdata);
    
    $User = new \FL\Master\User();
    echo json_encode($User->changePassword($request ,$payload));
    break;

  case (isset($_GET['resendOTPForgotPassword']) && $_GET['resendOTPForgotPassword']):
    $postdata = file_get_contents("php://input");
    $request = json_decode($postdata);
    
    $User = new \FL\Master\User();
    echo json_encode($User->resendOTPForgotPassword($request, $payload));
    break;

  case (isset($_GET['numberToStringGF']) && $_GET['numberToStringGF']):
    $postdata = file_get_contents("php://input");
    $request = json_decode($postdata);
    
    $User = new \FL\Common\GeneralFunctions();
    echo json_encode($User->convertNumberToWord($request));
    break;

  #region Make PDFs
  
  case (isset($_GET['makeInboundPdf']) && $_GET['makeInboundPdf']):
    $postdata = file_get_contents("php://input");
    $request = json_decode($postdata);

    $makeInboundPdf = new \FL\GenPDF\GEN_Inbound($request, $payload);
    $makeInboundPdf->Generate($payload);
    break;

  #endregion Make PDFs
  default:
    header("Not Found", false, 404); // HTTP/1.1 404 Not Found
    die();
}
