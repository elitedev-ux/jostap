import AdminResourcePage from "../AdminResourcePage";

const columns = [
  { label: "Action", key: "action", strong: true },
  { label: "Admin", key: "admin" },
  { label: "Target Type", key: "targetType" },
  { label: "Target ID", key: "targetId" },
  { label: "Created", key: "created" },
  { label: "Metadata", key: (row) => JSON.stringify(row.metadata || {}), wrap: true, maxWidth: 420 },
];

export default function AdminAuditPage() {
  return (
    <AdminResourcePage
      title="Audit Logs"
      description="Track admin changes to users, cards, plans, content, roles, and platform settings."
      dataset="auditLogs"
      columns={columns}
      emptyTitle="No audit logs yet"
      emptyCopy="Admin actions will appear here after changes are made."
      statCards={[
        ["Logged Actions", (data) => data?.auditLogs?.length || 0, "#0d6ffd", "#eaf3ff"],
        ["User Changes", (data) => data?.auditLogs?.filter((item) => item.targetType === "user").length || 0, "#ff9f0d", "#F5F3FF"],
        ["Card Changes", (data) => data?.auditLogs?.filter((item) => item.targetType === "card").length || 0, "#047857", "#ECFDF5"],
      ]}
    />
  );
}
