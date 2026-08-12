import { STATUS_LABEL, STATUS_COLOR, type SeriesStatus } from "@/lib/constants";

export default function StatusBadge({ status }: { status: SeriesStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLOR[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}