import express from "express";
import caloriesDetector from "./routes/calories_detector.js";
import foodRecommendation from "./routes/food_recommendation.js";

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.get("/", (req, res) => {
  res.send("Welcome to my server!");
});

app.use("/api/calories-detector", caloriesDetector);

app.use("/api/food-recommendation", foodRecommendation);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
