import express from "express"
import RecipesModel  from "../models/RecipesSchema.js"
import multer from "multer"; //https://github.com/expressjs/multer

// store images in memory (RAM)
const storage = multer.memoryStorage()
const upload = multer({ storage: storage });

import {
    S3Client,
    PutObjectCommand,
    DeleteObjectCommand,
    GetObjectCommand,
    paginateListObjectsV2,
} from "@aws-sdk/client-s3";

const router = express.Router();
const s3Client = new S3Client({});
const bucketName = 'authentic-recipes'

// create a new recipe
router.post("/create", 
            upload.single('image'), // string has to match name of file field
            async (req, res) => {

    const recipe = RecipesModel(req.body)
    console.log(recipe)

    try {
        // store image file in S3
        const params = {
            Bucket: bucketName,
            Key: req.body.id,
            Body: req.file.buffer,
            ContentType: req.file.mimetype,
        }
        const command = new PutObjectCommand(params);
        await s3Client.send(command);

        // .save will save a record of the data in the database
        await recipe.save();
        // .send is used to send an HTTP response. In this case, it's just the recipe object that was saved.
        res.send(recipe);
    //     console.log("im over here")
    } catch (error) {
        res.status(500).send(error);
    }
});

// get all recipes
router.get("/browse", async (req, res) => {
  const allRecipes = await RecipesModel.find({});

  try {
    res.send(allRecipes);
  } catch (error) {
    res.status(500).send(error);
  }
});

// get recipe by id
router.get("/browse/recipes/:id", async (req, res) => {
  const getRecipeById = await RecipesModel.findById(req.params.id);
  try {
    res.send(getRecipeById);
  } catch (err) {
    res.status(500).send(err);
  }
});

// get the top 5 tastest recipes
router.get("/", async (req, res) => {
  const tastiestFive = await RecipesModel.find({}).sort({ taste: -1 }).limit(5);
  try {
    res.send(tastiestFive);
  } catch (err) {
    res.status(500).send(err);
  }
});

// delete a specific recipe
router.delete("/browse/recipes/:id", async (req, res) => {
  console.log(req.params.id);
  const deleteRecipe = await RecipesModel.findByIdAndDelete(req.params.id);
  try {
    res.send(deleteRecipe);
  } catch (err) {
    res.status(500).send(err);
  }
});

// add multiple recipes: for dev purposes only to insert demo data using Postman
router.post("/admin-create", async (req, res) => {
  try {
    await RecipesModel.create(req.body);
    res.send("success");
    // res.send(recipe);
  } catch (error) {
    res.status(500).send(error);
  }
});

// delete all recipes: for dev purposes only to reset demo data using Postman
router.delete("/admin-delete", async (req, res) => {
  const deleteRecipe = await RecipesModel.deleteMany({});
  try {
    res.send(deleteRecipe);
  } catch (err) {
    res.status(500).send(err);
  }
});

// module.exports = router;
export default router