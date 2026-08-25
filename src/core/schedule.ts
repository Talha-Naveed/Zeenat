import { ZeenatError } from "../shared/errors";

export interface ScheduleWindow {
  readonly from: number | null;
  readonly until: number | null;
}

const EXPLICIT_ZONE = /(?:Z|[+-]\d{2}:\d{2})$/i;

export function parseSchedule(
  activeFrom?: string | Date,
  activeUntil?: string | Date,
): ScheduleWindow {
  const from = parseInstant(activeFrom, "activeFrom");
  const until = parseInstant(activeUntil, "activeUntil");
  if (from !== null && until !== null && from >= until) {
    throw new ZeenatError("activeFrom must be earlier than activeUntil.");
  }
  return { from, until };
}

function parseInstant(
  value: string | Date | undefined,
  label: "activeFrom" | "activeUntil",
): number | null {
  if (value === undefined) return null;
  if (typeof value === "string" && !EXPLICIT_ZONE.test(value)) {
    throw new ZeenatError(
      `${label} must include an explicit UTC offset or Z suffix.`,
    );
  }
  const time = value instanceof Date ? value.getTime() : Date.parse(value);
  if (!Number.isFinite(time)) {
    throw new ZeenatError(`${label} must be a valid date-time.`);
  }
  return time;
}
