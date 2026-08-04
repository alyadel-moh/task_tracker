const express = require("express");
const {
  create,
  getAll,
  update,
  remove,
  getById,
} = require("../controllers/taskController");
const router = express.Router();
const authenticate = require("../middleware/auth");

router.use(authenticate);

router.post("/create/:projectId", create); // Create a new task
router.get("/:projectId", getAll); // Get all tasks for the authenticated user
router.get("/:projectId/:id", getById); // Get a task by ID
router.put("/update/:projectId/:id", update); // Update a task by ID
router.delete("/delete/:projectId/:id", remove); // Delete a task by ID

module.exports = router;
