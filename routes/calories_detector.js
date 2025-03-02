const multer = require("multer");
const express = require("express");
const router = express.Router();

const {
  caloriesDetector,
} = require("../controllers/caloriesDetector/calories_detector.js");

// Multer Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

router.post("/", upload.single("file"), caloriesDetector);

module.exports = router;
