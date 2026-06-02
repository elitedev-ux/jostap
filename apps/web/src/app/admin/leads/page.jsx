import AdminResourcePage from "../AdminResourcePage";

const columns = [
  { label: "Name", key: "name", strong: true },
  { label: "Email", key: "email" },
  { label: "Company", key: "company" },
  { label: "Owner", key: "owner" },
  { label: "Status", key: "status" },
  { label: "Source", key: "source" },
  { label: "Created", key: "created" },
];

export default function AdminLeadsPage() {
  return (
    <AdminResourcePage
      title="Leads"
      description="Review captured leads across public card forms and user workflows."
      dataset="leads"
      columns={columns}
      emptyTitle="No leads yet"
      emptyCopy="Leads captured from public profiles will appear here."
      statCards={[
        ["Total Leads", (data) => data?.leads?.length || 0, "#0d6ffd", "#eaf3ff"],
        ["New", (data) => data?.leads?.filter((item) => item.status === "new").length || 0, "#B45309", "#FEF3C7"],
        ["Qualified", (data) => data?.leads?.filter((item) => item.status === "qualified").length || 0, "#047857", "#ECFDF5"],
      ]}
    />
  );
}
