const { Task } = require("../models");

async function create(req, res, next) {
  try {
    const { name, description, status, estimatedTime, dueDate, priority } =
      req.body;
    if (!name || !name.trim()) {
      return res
        .status(400)
        .json({ error: "BadRequest", message: "Task name is required" });
    }
    if (!priority) {
      return res
        .status(400)
        .json({ error: "BadRequest", message: "Task priority is required" });
    }
    const task = await Task.create({
      name: name.trim(),
      description: description || null,
      status: status || "TODO",
      estimatedTime: estimatedTime,
      dueDate: dueDate,
      priority: priority,
      projectId: req.params.projectId,
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
    const { name, description, status, estimatedTime, dueDate, priority } =
      req.body;

    const task = await Task.findOne({
      where: { id: req.params.id, projectId: req.params.projectId },
    });

    if (!task) {
      return res
        .status(404)
        .json({ error: "Not Found", message: "Task not found" });
    }

    if (name !== undefined && (!name || !name.trim())) {
      return res
        .status(400)
        .json({ error: "BadRequest", message: "Task name cannot be empty" });
    }

    // Safely compare dates regardless of Date object vs ISO string formats
    const parseTimestamp = (val) => {
      if (!val) return null;
      const t = new Date(val).getTime();
      return isNaN(t) ? null : t;
    };

    let updatedField = null;

    if (name !== undefined && name.trim() !== task.name) {
      updatedField = "Task name";
    } else if (
      description !== undefined &&
      (description ?? "") !== (task.description ?? "")
    ) {
      updatedField = "Description";
    } else if (status !== undefined && status !== task.status) {
      updatedField = "Status";
    } else if (
      estimatedTime !== undefined &&
      Number(estimatedTime) !== Number(task.estimatedTime)
    ) {
      updatedField = "Estimated time";
    } else if (
      dueDate !== undefined &&
      parseTimestamp(dueDate) !== parseTimestamp(task.dueDate)
    ) {
      updatedField = "Due date";
    } else if (priority !== undefined && priority !== task.priority) {
      updatedField = "Priority";
    }

    // Apply updates
    if (name !== undefined) task.name = name.trim();
    if (description !== undefined) task.description = description;
    if (status !== undefined) task.status = status;
    if (estimatedTime !== undefined) task.estimatedTime = estimatedTime;
    if (dueDate !== undefined) task.dueDate = dueDate;
    if (priority !== undefined) task.priority = priority;

    await task.save();

    return res.status(200).json({
      message: updatedField
        ? `${updatedField} updated successfully!`
        : "Task updated successfully",
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
