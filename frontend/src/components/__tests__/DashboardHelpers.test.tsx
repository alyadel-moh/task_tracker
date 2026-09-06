import { describe, expect, it } from "vitest";
import { formatStatusName } from "../Dashboard";
import { getStatusColorKey as getBoardStatusColorKey } from "../DashboardBoard";
import { getStatusColorKey as getTaskStatusColorKey } from "../TaskDetailsPage";

describe("dashboard component helpers", () => {
  it("formats status names consistently", () => {
    expect(formatStatusName("IN_PROGRESS")).toBe("In Progress");
    expect(formatStatusName("TODO")).toBe("To Do");
    expect(formatStatusName("custom_status")).toBe("custom_status");
    expect(formatStatusName()).toBe("Untitled Column");
  });

  it("maps status names to color keys", () => {
    expect(getBoardStatusColorKey("TODO")).toBe("todo");
    expect(getBoardStatusColorKey("IN_PROGRESS")).toBe("in-progress");
    expect(getBoardStatusColorKey("DONE")).toBe("done");
    expect(getBoardStatusColorKey("Review")).toBe("custom");
    expect(getTaskStatusColorKey("DONE")).toBe("done");
    expect(getTaskStatusColorKey()).toBe("todo");
  });
});
