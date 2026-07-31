const express = require("express");
const {
  create,
  getAll,
  update,
  remove,
} = require("../controllers/projectController");
const router = express.Router();
const authenticate = require("../middleware/auth");

router.use(authenticate);

router.post("/create", create); // Create a new project
router.get("/", getAll); // Get all projects for the authenticated user
router.put("/update/:id", update); // Update a project by ID
router.delete("/delete/:id", remove); // Delete a project by ID

module.exports = router;
