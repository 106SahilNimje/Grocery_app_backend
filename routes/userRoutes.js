const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

router.post("/address", userController.saveAddress);
router.get("/address/:uid", userController.getAddress);

module.exports = router;
