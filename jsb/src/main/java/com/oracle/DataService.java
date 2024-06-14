package com.oracle;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.oracle.Common.Encryption;
import com.oracle.Common.GeneralFunctions;
import com.oracle.Common.JWT;
import com.oracle.Master.Designation;
import com.oracle.Master.User;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import jakarta.servlet.http.HttpServletRequest; // Importing HttpServletRequest

@RestController
@RequestMapping("/")
public class DataService {

  @Autowired
  private JWT jwt;

  @Autowired
  private User user;

  @Autowired
  private Designation designation;

  @Autowired
  private GeneralFunctions gn;

  @PostMapping("/data-service.php")
  public ResponseEntity<Object> process(@RequestParam Map<String, Object> params,
      @RequestBody(required = false) Map<String, Object> requestBody, HttpServletRequest request)
      throws Exception {
    Map<String, Object> payload = null;
    Set<String> keySet = params.keySet();
    // Convert the key set to a list
    List<String> keys = new ArrayList<>(keySet);
    String newToken = null;
    HttpHeaders headers = new HttpHeaders();
    String firstKey = "";
    // Check if the list of keys is not empty
    if (!keys.isEmpty()) {
      // Get the first key
      firstKey = keys.get(0);
      System.out.println(firstKey);
      try {
        // Validate the token and get the payload
        // System.out.println("request :" + request);
        payload = jwt.validateToken(request.getHeader("Authorization"));
        System.out.println("payload :" + payload);

        if (payload.containsKey("id") && (int) payload.get("id") > 0) {
          // Check if the 'logout' query parameter is present and true
          if (request.getParameter("logout") == null && request.getParameter("logout") != "true") {
            // TODO: Check if user is already logged in
            // If necessary, access payload values using payload.get("key")
            // For example: String userType = (String) payload.get("user_type");

            user.checkUserSessionToken(payload);
            Map<String, Object> newPayload = payload != null ? new HashMap<>(payload) : new HashMap<>();
            newPayload.put("secret_key", (String) payload.get("secret_key"));
            newPayload.put("id", (Integer) payload.get("id"));
            newPayload.put("session_token", (String) payload.get("session_token"));
            // Generate a new token with the updated payload
            newToken = jwt.generateToken(newPayload);

            headers.add("X-TOKEN", newToken);
            // Set the new token in the response header
          }
        } else {
          // Throw an exception if 'id' claim is missing or invalid
          throw new RuntimeException("Authentication data tampered.");
        }
        // return ;
      } catch (Exception e) {
        System.out.println(e.getMessage());

        switch (firstKey) {
          case "generateSecretKey":
            String secretKey = gn.generateSecretKey();
            ObjectNode secret = new ObjectMapper().createObjectNode();
            secret.put("secret_key", secretKey);

            // Create a new payload map including the existing claims from the previous
            // token, if any
            Map<String, Object> newPayload = payload != null ? new HashMap<>(payload) : new HashMap<>();
            newPayload.put("secret_key", secretKey);

            // Generate a new token with the updated payload
            newToken = jwt.generateToken(newPayload);

            headers.add("X-TOKEN", newToken);
            return new ResponseEntity<>(secret.get("secret_key"), headers, HttpStatus.OK);

          case "login":
            Map<String, Object> retObj = null;
            // System.out.println("payload: "+payload);

            retObj = (Map<String, Object>) user.login(requestBody, payload);
            if (retObj != null && retObj.containsKey("id")) {
              // String id = (String) retObj.get("id");
              payload.put("id", retObj.get("id"));
              payload.put("session_token", retObj.get("session_token"));
              newToken = jwt.generateToken(payload);
              headers.add("x-token", newToken);
            }

            return new ResponseEntity<>(retObj, headers, HttpStatus.OK);

          default:
            System.out.println(e.getMessage());
            Map<String, Object> res = new HashMap<>();
            res.put("message", "401 Unauthorized");
            return new ResponseEntity<>(res, HttpStatus.UNAUTHORIZED);
        }

      }
    }
    return AfterLoginFunctions(firstKey, requestBody, payload, headers);
  }

  public ResponseEntity<Object> AfterLoginFunctions(String firstKey, @RequestBody Map<String, Object> requestBody,
      Map<String, Object> payload, HttpHeaders headers) throws Exception {
    Map<String, Object> retObj = null;
    List<Map<String, Object>> retObjList = null;
    switch (firstKey) {
      case "generateSecretKey":
        String secretKey = (String) payload.get("secret_key");
        ObjectNode secret = new ObjectMapper().createObjectNode();
        secret.put("secret_key", secretKey);
        return new ResponseEntity<>(secret.get("secret_key"), headers, HttpStatus.OK);
      //#region User
      case "getUserMenus":
        // System.out.println("payload: "+payload);
        if (payload != null) {
          retObjList = user.getUserMenus(requestBody, payload);
        } else {
          throw new RuntimeException("Payload is null please check.");
        }
        return new ResponseEntity<>(retObjList, headers, HttpStatus.OK);

      case "getUsers":
        // System.out.println("payload: "+payload);
        if (payload != null) {
          retObj = user.getUsers(requestBody, payload);
        } else {
          throw new RuntimeException("Payload is null please check.");
        }
        return new ResponseEntity<>(retObj, headers, HttpStatus.OK);

      case "logout":
        retObj = user.logout(requestBody, payload);
        return new ResponseEntity<>(retObj, headers, HttpStatus.OK);

      case "isUserEmailExist":
        boolean isEmailExist = user.isEmailExist(requestBody, payload);
        return new ResponseEntity<>(isEmailExist, headers, HttpStatus.OK);

      case "isUserMobileNoExist":
        boolean isMobileNoExist = user.isMobileNoExist(requestBody, payload);
        return new ResponseEntity<>(isMobileNoExist, headers, HttpStatus.OK);

      case "saveUser":
        retObj = user.saveUser(requestBody, payload);
        return new ResponseEntity<>(retObj, headers, HttpStatus.OK);

      case "deleteUser":
        Object rObject = user.deleteUser(requestBody);
        return new ResponseEntity<>(rObject, headers, HttpStatus.OK);

      //#endregion User

      //#region Designation
      case "getDesignations":
        retObj = designation.getDesignations(requestBody);
        return new ResponseEntity<>(retObj, headers, HttpStatus.OK);

      case "saveDesignation":
        retObj = designation.saveDesignation(requestBody);
        return new ResponseEntity<>(retObj, headers, HttpStatus.OK);

      case "deleteDesignation":
        retObj = designation.deleteDesignation(requestBody);
        return new ResponseEntity<>(retObj, headers, HttpStatus.OK);
      //#endregion Designation

      default:
        return new ResponseEntity<>(retObj, headers, HttpStatus.NOT_FOUND);
    }
  }
}
