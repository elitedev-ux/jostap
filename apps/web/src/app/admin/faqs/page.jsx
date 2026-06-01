import AdminResourcePage from "../AdminResourcePage";

async function updateFaq(row) {
  const response = await fetch(`/api/admin/platform/faqs/${row.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ is_published: !row.is_published }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Unable to update FAQ.");
}

const columns = [
  { label: "Question", key: "question", strong: true, wrap: true, maxWidth: 340 },
  { label: "Category", key: "category" },
  { label: "Published", key: "is_published" },
  { label: "Sort", key: "sort_order" },
  { label: "Answer", key: "answer", wrap: true, maxWidth: 420 },
];

export default function AdminFaqsPage() {
  return (
    <AdminResourcePage
      title="FAQs"
      description="Manage FAQ content and visibility for customers."
      dataset="faqs"
      columns={columns}
      emptyTitle="No FAQs yet"
      emptyCopy="FAQ content will appear here."
      statCards={[
        ["FAQs", (data) => data?.faqs?.length || 0, "#2563EB", "#EFF6FF"],
        ["Published", (data) => data?.faqs?.filter((item) => item.is_published).length || 0, "#047857", "#ECFDF5"],
      ]}
      rowAction={{
        label: (row) => (row.is_published ? "Unpublish" : "Publish"),
        color: (row) => (row.is_published ? "#DC2626" : "#047857"),
        run: updateFaq,
      }}
    />
  );
}
