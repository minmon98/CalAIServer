const express = require("express");
const router = express.Router();

const {
  foodRecommendation,
} = require("../controllers/foodRecommendation/food_recommendation.js");

router.post("/", foodRecommendation);

module.exports = router;
