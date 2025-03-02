const tf = require("@tensorflow/tfjs-node");
const fs = require("fs");

const MODEL_PATH = "controllers/caloriesDetector/model/model.json";
const ENCODED_CATEGORIES_PATH = "controllers/caloriesDetector/label/categories.json";
const ENCODED_INGREDIENTS_PATH = "controllers/caloriesDetector/label/ingredients.json";

const loadModel = async () => {
  console.log("Loading model from file...");
  return await tf.loadGraphModel(`file://${MODEL_PATH}`);
}

const preprocessImage = (imagePath) => {
  const imageBuffer = fs.readFileSync(imagePath);
  let imageTensor = tf.node.decodeImage(imageBuffer, 3);
  imageTensor = tf.image.resizeBilinear(imageTensor, [224, 224]);
  imageTensor = tf.expandDims(imageTensor, 0);
  return imageTensor;
}

const decodeCategoryPrediction = (resultTensor) => {
  const encodedCategories = JSON.parse(
    fs.readFileSync(ENCODED_CATEGORIES_PATH, "utf-8")
  );
  resultTensor = resultTensor.reshape([-1]);
  let index = tf.argMax(resultTensor).arraySync();
  const categories = Object.keys(encodedCategories);
  return categories[index].replace(/[_]/g, " ");
}

const decodeIngredientsPrediction = (resultTensor) => {
  const encodedIngredients = JSON.parse(
    fs.readFileSync(ENCODED_INGREDIENTS_PATH, "utf-8")
  );
  resultTensor = resultTensor.reshape([-1]);
  let { values, indices } = tf.topk(resultTensor, 10, true);
  indices = indices.arraySync();
  values = values.arraySync();
  const ingredients = Object.keys(encodedIngredients);
  const result = [];
  for (let i = 0; i < values.length; i++) {
    if (values[i] >= 0.5) {
      result.push(ingredients[indices[i]]);
    } else break;
  }
  return result;
}

const decodeNutrientsPrediction = (resultTensor) => {
  resultTensor = resultTensor.reshape([-1]);
  return Math.abs(resultTensor.arraySync()[0]);
}

const infer = async (imagePath) => {
  const model = await loadModel();
  const imageTensor = preprocessImage(imagePath);

  const outputs = model.execute(imageTensor, [
    "category_output",
    "ingredients_output",
    "calorie_output",
    "carbs_output",
    "protein_output",
    "fat_output",
  ]);

  const result = {
    category: decodeCategoryPrediction(outputs[0]),
    ingredients: decodeIngredientsPrediction(outputs[1]),
    calories: decodeNutrientsPrediction(outputs[2]),
    carbs: decodeNutrientsPrediction(outputs[3]),
    protein: decodeNutrientsPrediction(outputs[4]),
    fat: decodeNutrientsPrediction(outputs[5]),
  };

  return result;
}

const caloriesDetector = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  try {
    const result = await infer(`${req.file.destination}${req.file.filename}`);
    res.json({ result });
  } catch (error) {
    return res.status(400).json({ error: String(error) });
  }
};

module.exports = {
  caloriesDetector,
};
