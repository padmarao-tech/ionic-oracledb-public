package com.oracle.Common;

// import org.json.JSONObject;
import java.security.SecureRandom;

import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import jakarta.servlet.http.HttpServletRequest;

@Service
public class GeneralFunctions {

    public String generateSecretKey() {
        int length = 16;
        String ALLOWED_CHARACTERS = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
        if (ALLOWED_CHARACTERS.length() < length) {
            throw new IllegalArgumentException("Strength should not be greater than " + ALLOWED_CHARACTERS.length());
        }

        SecureRandom random = new SecureRandom();
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            int randomIndex = random.nextInt(ALLOWED_CHARACTERS.length());
            sb.append(ALLOWED_CHARACTERS.charAt(randomIndex));
        }

        // ObjectMapper mapper = new ObjectMapper();
        // ObjectNode jsonObject = mapper.createObjectNode();
        // System.out.println(sb);
        // jsonObject.put("key", sb.toString());
        // String jsonString = jsonObject.toString();
        return sb.toString();
    }

    public static String getIPAddress(HttpServletRequest request) {
        String[] headersToCheck = {
            "X-Forwarded-For",
            "HTTP_CLIENT_IP",
            "HTTP_X_FORWARDED_FOR",
            "HTTP_X_FORWARDED",
            "HTTP_X_CLUSTER_CLIENT_IP",
            "HTTP_FORWARDED_FOR",
            "HTTP_FORWARDED",
            "REMOTE_ADDR"
        };

        for (String header : headersToCheck) {
            String ipList = request.getHeader(header);
            if (ipList != null && ipList.length() != 0 && !"unknown".equalsIgnoreCase(ipList)) {
                String[] ips = ipList.split(",");
                for (String ip : ips) {
                    ip = ip.trim();
                    if (isValidIPAddress(ip)) {
                        return ip;
                    }
                }
            }
        }

        // If no valid IP address found, return the remote address
        return request.getRemoteAddr();
    }

    private static boolean isValidIPAddress(String ipAddress) {
        // Implement IP address validation logic if needed
        // For simplicity, returning true for any non-empty string
        return ipAddress != null && !ipAddress.isEmpty();
    }

    public String getAuthorizationHeader() {
		// Get the current HTTP request attributes using RequestContextHolder
		ServletRequestAttributes requestAttributes = (ServletRequestAttributes) RequestContextHolder
				.getRequestAttributes();
        System.out.println("requestAttributes:"+ requestAttributes);
		if (requestAttributes != null) {
			// Get the HttpServletRequest object from the request attributes
			HttpServletRequest request = requestAttributes.getRequest();
            System.out.println("request:"+ request);
            System.out.println("request Header:"+ request.getHeader("Authorization"));
			// Get the Authorization header from the request
			return request.getHeader("Authorization");
		}
		return null;
	}
}
