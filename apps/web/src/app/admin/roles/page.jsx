import AdminResourcePage from "../AdminResourcePage";

const columns = [
  { label: "Role", key: "role", strong: true },
  { label: "Description", key: "description", wrap: true, maxWidth: 360 },
  { label: "Permissions", key: (row) => (row.permissions || []).join(", "), wrap: true, maxWidth: 520 },
];

export default function AdminRolesPage() {
  return (
    <AdminResourcePage
      title="Roles & Permissions"
      description="Review platform roles and their permission scopes."
      dataset="roles"
      columns={columns}
      emptyTitle="No roles yet"
      emptyCopy="Role permission records will appear here."
      statCards={[
        ["Roles", (data) => data?.roles?.length || 0, "#2563EB", "#EFF6FF"],
        ["Admin Roles", (data) => data?.roles?.filter((item) => item.role === "admin").length || 0, "#7C3AED", "#F5F3FF"],
      ]}
    />
  );
}
