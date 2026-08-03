const { Project } = require("../models");
const { Task } = require("../models");
async function create(req, res, next) {
  try {
    const task = req.body;
    if (!task || !task.name || !task.name.trim()) {
      return res
        .status(400)
        .json({ error: "BadRequest", message: "Task name is required" });
    }
    const taskInstance = await Task.create({
      projectId: req.params.projectId,
      name: task.name.trim(),
      description: task.description || null,
      status: task.status || "todo",
      priority: task.priority || "medium",
      estimatedTime: task.estimatedTime || null,
      dueDate: task.dueDate || null,
    });
    return res.status(201).json({ message: "Task created successfully" });
  } catch (err) {
    next(err);
  }
}
async function getAll(req, res, next) {
  try {
    const tasks = await Task.findAll({
      where: { projectId: req.params.projectId },
      order: [["createdAt", "DESC"]],
    });
    return res.status(200).json(tasks);
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const task = await Task.findOne({
      where: { id: req.params.id, projectId: req.params.projectId },
    });
    if (!task) {
      return res
        .status(404)
        .json({ error: "Not Found", message: "Task not found" });
    }
    return res.status(200).json(task);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const { name, description, status, priority, estimatedTime, dueDate } =
      req.body;

    const task = await Task.findOne({
      where: { id: req.params.id, projectId: req.params.projectId },
    });

    if (!task) {
      return res
        .status(404)
        .json({ error: "Not Found", message: "Task not found" });
    }

    // Validate name if it is passed in the request body
    if (name !== undefined && typeof name === "string" && !name.trim()) {
      return res
        .status(400)
        .json({ error: "BadRequest", message: "Task name cannot be empty" });
    }

    let updatedField = null;
    if (name !== undefined && name.trim() !== task.name) {
      task.name = name.trim();
      updatedField = "name";
    }

    if (description !== undefined && description !== task.description) {
      task.description = description;
      updatedField = "description";
    }

    if (status !== undefined && status !== task.status) {
      task.status = status;
      updatedField = "status";
    }

    if (priority !== undefined && priority !== task.priority) {
      task.priority = priority;
      updatedField = "priority";
    }

    if (estimatedTime !== undefined && estimatedTime !== task.estimatedTime) {
      task.estimatedTime = estimatedTime;
      updatedField = "estimatedTime";
    }

    if (dueDate !== undefined && dueDate !== task.dueDate) {
      task.dueDate = dueDate;
      updatedField = "dueDate";
    }

    if (updatedField) {
      await task.save();
    }
    const fieldsText = updatedField ? updatedField : "no fields changed";
    updateField = null;
    return res.status(200).json({
      message: `${fieldsText} updated successfully`,
    });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const task = await Task.findOne({
      where: { id: req.params.id, projectId: req.params.projectId },
    });
    if (!task) {
      return res
        .status(404)
        .json({ error: "Not Found", message: "Task not found" });
    }
    await task.destroy();
    return res.status(200).json({ message: "Task deleted successfully" });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  create,
  getAll,
  update,
  remove,
  getById,
};
