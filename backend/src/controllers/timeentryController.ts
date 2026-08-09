import { Response, NextFunction } from "express";
import { AuthRequest } from "../types/AuthRequest"; // or wherever you define it
import { Task, Project, TimeEntry } from "../models";

interface CreateTimeEntryBody {
  durationMinutes: number;
  entryDate: string;
  note?: string;
}

interface UpdateTimeEntryBody {
  durationMinutes?: number;
  entryDate?: string;
  note?: string;
}

async function findOwnedTask(taskId: string, userId: string) {
  const task = await Task.findOne({
    where: { id: taskId },
    include: [
      {
        model: Project,
        as: "project",
        where: { userId },
      },
    ],
  });
  return task;
}
const isNumberInRange = (
  val: any,
  min: number = 0,
  max: number = 525600, // e.g. 1 year in minutes max
): boolean => {
  if (typeof val !== "number" || !Number.isFinite(val)) return false;
  return val >= min && val <= max;
};

async function create(
  req: AuthRequest<{ taskId: string }, {}, CreateTimeEntryBody>,
  res: Response,
  next: NextFunction,
): Promise<Response | void> {
  try {
    const { durationMinutes, entryDate, note } = req.body;

    if (
      typeof durationMinutes !== "number" ||
      durationMinutes <= 0 ||
      !Number.isInteger(durationMinutes)
    ) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Duration must be a positive integer",
      });
    }
    if (!entryDate) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Entry date is required",
      });
    }

    const task = await findOwnedTask(req.params.taskId, req.user.id);
    if (!task) {
      return res.status(404).json({
        error: "Not Found",
        message: "Task not found or you do not have permission to access it",
      });
    }

    const timeEntry = await TimeEntry.create({
      taskId: req.params.taskId,
      durationMinutes,
      entryDate: new Date(entryDate),
      note: note || null,
    });

    return res.status(201).json({
      message: "Time entry created successfully",
      timeEntry,
    });
  } catch (err) {
    next(err);
  }
}

async function getAll(
  req: AuthRequest<{ taskId: string }>,
  res: Response,
  next: NextFunction,
): Promise<Response | void> {
  try {
    const task = await findOwnedTask(req.params.taskId, req.user.id);
    if (!task) {
      return res.status(404).json({
        error: "Not Found",
        message: "Task not found or you do not have permission to access it",
      });
    }

    const timeEntries = await TimeEntry.findAll({
      where: { taskId: req.params.taskId },
      order: [
        ["entryDate", "DESC"],
        ["createdAt", "DESC"],
      ],
    });

    const totalMinutes = timeEntries.reduce(
      (sum: number, entry: { durationMinutes: number }) =>
        sum + entry.durationMinutes,
      0,
    );

    return res.status(200).json({ timeEntries, totalMinutes });
  } catch (err) {
    next(err);
  }
}

async function update(
  req: AuthRequest<{ id: string; taskId: string }, {}, UpdateTimeEntryBody>,
  res: Response,
  next: NextFunction,
): Promise<Response | void> {
  try {
    const { durationMinutes, entryDate, note } = req.body;

    if (durationMinutes !== undefined) {
      if (!isNumberInRange(durationMinutes, 1, 1440)) {
        // 1440 mins = 24 hours
        return res.status(400).json({
          error: "BadRequest",
          message: "durationMinutes must be between 1 and 1440 minutes",
        });
      }
    }

    if (entryDate !== undefined && !entryDate) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Entry date cannot be empty",
      });
    }

    const task = await findOwnedTask(req.params.taskId, req.user.id);
    if (!task) {
      return res.status(404).json({
        error: "Not Found",
        message: "Task not found or you do not have permission to access it",
      });
    }

    const timeEntry = await TimeEntry.findOne({
      where: { id: req.params.id, taskId: req.params.taskId },
    });

    if (!timeEntry) {
      return res.status(404).json({
        error: "Not Found",
        message: "Time entry not found",
      });
    }

    const updatedField: Partial<UpdateTimeEntryBody> = {};
    const changedLabels: string[] = [];

    if (
      durationMinutes !== undefined &&
      durationMinutes !== timeEntry.durationMinutes
    ) {
      timeEntry.durationMinutes = durationMinutes;
      updatedField.durationMinutes = durationMinutes;
      changedLabels.push("Duration");
    }
    if (
      entryDate !== undefined &&
      new Date(entryDate).getTime() !== timeEntry.entryDate.getTime()
    ) {
      timeEntry.entryDate = new Date(entryDate);
      updatedField.entryDate = entryDate;
      changedLabels.push("Entry date");
    }
    if (note !== undefined && note !== timeEntry.note) {
      timeEntry.note = note;
      updatedField.note = note;
      changedLabels.push("Note");
    }

    await timeEntry.save();

    return res.status(200).json({
      timeEntry: updatedField,
      message: changedLabels.length
        ? `${changedLabels.join(", ")} updated successfully`
        : "Time entry updated successfully",
    });
  } catch (err) {
    next(err);
  }
}

async function remove(
  req: AuthRequest<{ id: string; taskId: string }>,
  res: Response,
  next: NextFunction,
): Promise<Response | void> {
  try {
    const task = await findOwnedTask(req.params.taskId, req.user.id);
    if (!task) {
      return res.status(404).json({
        error: "Not Found",
        message: "Task not found or you do not have permission to access it",
      });
    }

    const timeEntry = await TimeEntry.findOne({
      where: { id: req.params.id, taskId: req.params.taskId },
    });
    if (!timeEntry) {
      return res.status(404).json({
        error: "Not Found",
        message: "Time entry not found",
      });
    }

    await timeEntry.destroy();
    return res.status(200).json({
      message: "Time entry deleted successfully",
    });
  } catch (err) {
    next(err);
  }
}

export { create, getAll, update, remove };
