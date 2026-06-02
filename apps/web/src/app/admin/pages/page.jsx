import AdminResourcePage from "../AdminResourcePage";

async function updatePage(row) {
  const response = await fetch(`/api/admin/platform/pages/${row.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ is_published: !row.is_published }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Unable to update page.");
}

const columns = [
  { label: "Slug", key: "slug", strong: true },
  { label: "Title", key: "title" },
  { label: "Published", key: "is_published" },
  { label: "Content", key: "content", wrap: true, maxWidth: 480 },
];

export default function AdminStaticPagesPage() {
  return (
    <AdminResourcePage
      title="Static Pages"
      description="Manage legal, marketing, and support pages shown around the app."
      dataset="staticPages"
      columns={columns}
      emptyTitle="No pages yet"
      emptyCopy="Static page records will appear here."
      statCards={[
        ["Pages", (data) => data?.staticPages?.length || 0, "#0d6ffd", "#eaf3ff"],
        ["Published", (data) => data?.staticPages?.filter((item) => item.is_published).length || 0, "#047857", "#ECFDF5"],
      ]}
      rowAction={{
        label: (row) => (row.is_published ? "Unpublish" : "Publish"),
        color: (row) => (row.is_published ? "#DC2626" : "#047857"),
        run: updatePage,
      }}
    />
  );
}
