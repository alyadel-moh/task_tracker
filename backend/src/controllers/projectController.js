const { Project } = require("../models");

async function create(req, res, next) {
  try {
    const { name, description } = req.body;
    if (!name || !name.trim()) {
      return res
        .status(400)
        .json({ error: "BadRequest", message: "Project name is required" });
    }
    const project = await Project.create({
      userId: req.user.id,
      name: name.trim(),
      description: description || null,
    });
    return res.status(201).json({ message: "Project created successfully" });
  } catch (err) {
    next(err);
  }
}
async function getAll(req, res, next) {
  try {
    const projects = await Project.findAll({
      where: { userId: req.user.id },
      order: [["createdAt", "DESC"]],
    });
    return res.status(200).json(projects);
  } catch (err) {
    next(err);
  }
}

// async function getById(req, res, next) {
//   try {
//     const project = await Project.findOne({
//       where: { id: req.params.id, userId: req.user.id },
//     });
//     if (!project) {
//       return res
//         .status(404)
//         .json({ error: "Not Found", message: "Project not found" });
//     }
//     return res.status(200).json(project);
//   } catch (err) {
//     next(err);
//   }
// }

async function update(req, res, next) {
  try {
    const { name, description } = req.body;
    const project = await Project.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!project) {
      return res
        .status(404)
        .json({ error: "Not Found", message: "Project not found" });
    }
    if (!name.trim()) {
      return res
        .status(400)
        .json({ error: "BadRequest", message: "Project name cannot be empty" });
    }
    project.name = name ? name.trim() : project.name;
    project.description =
      description !== undefined ? description : project.description;
    await project.save();
    return res.status(200).json({
      message: `${name ? "name" : "description"} updated successfully`,
    });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const project = await Project.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!project) {
      return res
        .status(404)
        .json({ error: "Not Found", message: "Project not found" });
    }
    await project.destroy();
    return res.status(200).json({ message: "Project deleted successfully" });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  create,
  getAll,
  update,
  remove,
};
