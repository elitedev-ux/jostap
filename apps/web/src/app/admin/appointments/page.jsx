import AdminResourcePage from "../AdminResourcePage";

const columns = [
  { label: "Guest", key: "guest_name", strong: true },
  { label: "Email", key: "guest_email" },
  { label: "Owner", key: "owner" },
  { label: "Status", key: "status" },
  { label: "Starts", key: "starts" },
  { label: "Notes", key: "notes", wrap: true, maxWidth: 320 },
];

export default function AdminAppointmentsPage() {
  return (
    <AdminResourcePage
      title="Appointments"
      description="Monitor appointment activity across all user cards and public booking flows."
      dataset="appointments"
      columns={columns}
      emptyTitle="No appointments yet"
      emptyCopy="Booked appointment requests will appear here."
      statCards={[
        ["Total", (data) => data?.appointments?.length || 0, "#0d6ffd", "#eaf3ff"],
        ["Scheduled", (data) => data?.appointments?.filter((item) => item.status === "scheduled").length || 0, "#047857", "#ECFDF5"],
        ["Completed", (data) => data?.appointments?.filter((item) => item.status === "completed").length || 0, "#ff9f0d", "#F5F3FF"],
      ]}
    />
  );
}
