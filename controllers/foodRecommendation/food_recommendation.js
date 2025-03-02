const tf = require("@tensorflow/tfjs-node");
const fs = require("fs");

const MODEL_PATH = "controllers/foodRecommendation/model/model.json";
const SCALER_PATH = "controllers/foodRecommendation/model/scaler_params.json";

const loadModel = async () => {
  console.log("Loading model from file...");
  return await tf.loadGraphModel(`file://${MODEL_PATH}`);
};

const loadScalerParams = () => {
  return JSON.parse(fs.readFileSync(SCALER_PATH, "utf-8"));
};

const standardizeInput = (input, mean, std) => {
  return input.map((val, i) => (val - mean[i]) / std[i]);
};

const predictNutrition = async (BMI, age, gender, activityLevel, goal) => {
  const model = await loadModel();
  const scalerParams = loadScalerParams();

  const mean = scalerParams.mean;
  const std = scalerParams.std;

  const input = standardizeInput(
    [BMI, age, gender, activityLevel, goal],
    mean,
    std
  );
  const inputTensor = tf.tensor2d([input]);

  const outputs = model.execute(inputTensor, [
    "calorie_output",
    "fat_output",
    "protein_output",
    "carb_output",
  ]);

  const result = {
    calories: outputs[0].dataSync()[0],
    fat: outputs[1].dataSync()[0],
    protein: outputs[2].dataSync()[0],
    carbs: outputs[3].dataSync()[0],
  };

  return result;
};

const foodRecommendation = async (req, res) => {
  const body = req.body;
  try {
    const result = await predictNutrition(
      body.bmi,
      body.age,
      body.gender,
      body.activityLevel,
      body.goal
    );
    res.json({ result });
  } catch (error) {
    return res.status(400).json({ error: String(error) });
  }
};

module.exports = {
  foodRecommendation,
};
