import { Response, NextFunction } from "express";
import { AuthRequest } from "../types/AuthRequest";
import { TimeEntryService } from "../services/timeEntryService";

async function create(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<Response | void> {
  try {
    const { durationMinutes, entryDate, note } = req.body;
    const { timeEntry, taskHistoryEntry, overrun } =
      await TimeEntryService.create(
        durationMinutes,
        entryDate,
        note,
        req.params.taskId,
        req.user.id,
      );

    return res.status(201).json({
      message: "Time entry created successfully!",
      timeEntry,
      historyEntry: taskHistoryEntry,
      overrun,
    });
  } catch (err: any) {
    if (err.status) {
      return res.status(err.status).json({ message: err.message });
    }
    next(err);
  }
}

async function getAll(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<Response | void> {
  try {
    const { timeEntries, totalMinutes } = await TimeEntryService.getAll(
      req.params.taskId,
      req.user.id,
    );
    return res.status(200).json({ timeEntries, totalMinutes });
  } catch (err: any) {
    if (err.status) {
      return res.status(err.status).json({ message: err.message });
    }
    next(err);
  }
}

async function update(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<Response | void> {
  try {
    const { durationMinutes, entryDate, note } = req.body;
    const { updatedFields, detailedHistoryEntries, changedLabels, overrun } =
      await TimeEntryService.update(
        durationMinutes,
        entryDate,
        note,
        req.params.taskId,
        req.user.id,
        req.params.id,
      );
    return res.status(200).json({
      timeEntry: updatedFields,
      historyEntries: detailedHistoryEntries,
      overrun,
      message: `${changedLabels.join(", ")} updated successfully`,
    });
  } catch (err: any) {
    if (err.status) {
      return res.status(err.status).json({ message: err.message });
    }
    next(err);
  }
}

async function remove(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<Response | void> {
  try {
    const taskHistoryEntry = await TimeEntryService.remove(
      req.params.taskId,
      req.user.id,
      req.params.id,
    );
    return res.status(200).json({
      message: "TimeEntry deleted successfully",
      historyEntry: taskHistoryEntry,
    });
  } catch (err: any) {
    if (err.status) {
      return res.status(err.status).json({ message: err.message });
    }
    next(err);
  }
}

export { create, getAll, update, remove };
