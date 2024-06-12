require("dotenv").config();
const express = require("express");
const gn = require("./Common/GeneralFunctions");
const jwt = require("./Common/JWT");
const router = express.Router();
const user = require("./Master/User");
const designation = require("./Master/Designation");

router.use(async (req, res, next) => {
  let payload;
  let newToken;
  console.log(req.query);
  if (req.header("Authorization")) {
    const token = req.header("Authorization").replace("Bearer ", "");
    payload = jwt.verifyToken(token);
    console.log("check : ");
    console.log(payload);
  }
  try {

    switch (true) {
      case payload && payload.id && payload.id > 0:
        if (!req.query.logout) {
          payload = { id: payload.id, secret_key: payload.secret_key };
          console.log("check create : ");
          console.log(payload);
          newToken = jwt.generateToken(payload);
          res.setHeader("X-TOKEN", newToken);
        }
        break;

      default:
        throw new Error("authentication data tampered.");
    }
  } catch (error) {
    switch (true) {
      case req.query.generateSecretKey && req.query.generateSecretKey == "true":
      case req.query.login && req.query.login == "true":
      case req.query.logout && req.query.logout == "true":
      case req.query.isUserEmailExist && req.query.isUserEmailExist == "true":
        break;

      default:
        res.removeHeader("X-TOKEN");
        res.status(401).send("Unauthorized");
        return;
    }
  }
  let result;

  switch (true) {
    case req.query.generateSecretKey && req.query.generateSecretKey == "true":
      const secretKey = gn.generateSecretKey();
      console.log("51: ");
      if (payload) {
        payload.secret_key = secretKey;
      } else {
        payload = { secret_key: secretKey };
      }
      console.log(payload);
      newToken = jwt.generateToken(payload);
      res.setHeader("X-TOKEN", newToken);
      res.json(secretKey);
      break;

    case req.query.login && req.query.login == "true":
      result = await user.login(req, payload);
      if (result && result.id && result.id > 0) {
        const secretKey = gn.generateSecretKey();
        payload = { secret_key: secretKey, id: result.id };
        newToken = jwt.generateToken(payload);
        res.setHeader("X-TOKEN", newToken);
      }
      res.json(result);
      break;

    case req.query.logout && req.query.logout == "true":
      result = await user.logout(req.body, payload);
      res.removeHeader("X-TOKEN");
      res.json(result);
      break;

    case req.query.getUserMenus && req.query.getUserMenus == "true":
      result = await user.getUserMenus(req.body, payload);
      res.json(result);
      break;

    case req.query.getUsers && req.query.getUsers == "true":
      result = await user.getUsers(req.body, payload);
      res.json(result);
      break;

    case req.query.saveUser && req.query.saveUser == "true":
      result = await user.saveUser(req.body, payload);
      res.json(result);
      break;

    case req.query.toggleUserStatus && req.query.toggleUserStatus == "true":
      result = await user.toggleUserStatus(req.body);
      res.json(result);
      break;

    case req.query.isUserEmailExist && req.query.isUserEmailExist == "true":
      result = await user.isEmailExist(req.body, payload);
      res.json(result);
      break;

    case req.query.isUserMobileNoExist &&
      req.query.isUserMobileNoExist == "true":
      result = await user.isEmailExist(req.body, payload);
      res.json(result);
      break;

    case req.query.getDesignations && req.query.getDesignations == "true":
      result = await designation.getDesignations(req.body);
      res.json(result);
      break;

    case req.query.toggleDesignationStatus &&
      req.query.toggleDesignationStatus == "true":
      result = await designation.toggleDesignationStatus(req.body);
      res.json(result);
      break;

    case req.query.saveDesignation && req.query.saveDesignation == "true":
      result = await designation.saveDesignation(req.body);
      res.json(result);
      break;

    case req.query.deleteDesignation && req.query.deleteDesignation == "true":
      result = await designation.deleteDesignation(req.body);
      res.json(result);
      break;

    default:
      res.status(404).send("Not Found");
  }
});

module.exports = router;
