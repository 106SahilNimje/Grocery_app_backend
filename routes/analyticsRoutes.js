const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analyticsController");

router.get("/top-selling", analyticsController.getTopSelling);
router.get("/categories", analyticsController.getCategoryPerformance);
router.get("/daily-sales", analyticsController.getDailySales);
router.get("/stock", analyticsController.getStockReport);

module.exports = router;
