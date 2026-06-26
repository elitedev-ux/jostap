import { useEffect, useMemo, useState } from "react";
import { BriefcaseBusiness, Building2, CreditCard, Mail, Phone, Search, UsersRound } from "lucide-react";

const LEADS_PAGE_SIZE = 12;
const STATUS_FILTERS = ["all", "new", "contacted", "qualified", "closed"];

function sourceLabel(value) {
  const source = String(value || "").toLowerCase();
  if (source === "exchange_contact") return "Exchange contact";
  if (source === "public_profile") return "Public profile";
  return value ? value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()) : "Profile";
}

function statusLabel(value) {
  return String(value || "new").replace(/^\w/, (letter) => letter.toUpperCase());
}

function dateLabel(value) {
  if (!value) return "";
  return new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function LeadsPage() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [pageInfo, setPageInfo] = useState({ limit: LEADS_PAGE_SIZE, offset: 0, total: 0, hasMore: false });
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  async function loadLeads({ active = true, offset = 0, append = false } = {}) {
    const params = new URLSearchParams({
      limit: String(LEADS_PAGE_SIZE),
      offset: String(offset),
    });

    const response = await fetch(`/api/leads?${params.toString()}`, {
      credentials: "same-origin",
    });
    const data = await response.json().catch(() => ({}));

    if (response.status === 401) {
      window.location.href = "/auth/signin?callbackUrl=/dashboard/leads";
      return;
    }

    if (!response.ok) {
      throw new Error(data.error || "Unable to load leads.");
    }

    if (!active) return;

    setLeads((current) => (append ? [...current, ...(data.leads || [])] : data.leads || []));
    setPageInfo(data.pagination || { limit: LEADS_PAGE_SIZE, offset, total: 0, hasMore: false });
    setLoadError("");
  }

  useEffect(() => {
    let active = true;

    async function run() {
      setLoading(true);
      try {
        await loadLeads({ active, offset: 0 });
      } catch (error) {
        if (active) {
          setLeads([]);
          setLoadError(error.message || "Unable to load leads.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    run();
    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(() => {
    const total = pageInfo.total || leads.length;
    const newCount = leads.filter((lead) => lead.status === "new").length;
    const exchangeCount = leads.filter((lead) => lead.source === "exchange_contact").length;
    const withCompany = leads.filter((lead) => lead.company || lead.jobTitle).length;

    return [
      [total, "Total leads", UsersRound, "#0d6ffd", "#eaf3ff"],
      [newCount, "New", Mail, "#B45309", "#FEF3C7"],
      [exchangeCount, "Exchanged contacts", Phone, "#047857", "#ECFDF5"],
      [withCompany, "With business details", BriefcaseBusiness, "#4F46E5", "#EEF2FF"],
    ];
  }, [leads, pageInfo.total]);

  const filteredLeads = useMemo(() => {
    const term = query.trim().toLowerCase();

    return leads.filter((lead) => {
      const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
      const searchable = [
        lead.name,
        lead.email,
        lead.phone,
        lead.company,
        lead.jobTitle,
        lead.cardName,
        sourceLabel(lead.source),
      ].join(" ").toLowerCase();

      return matchesStatus && (!term || searchable.includes(term));
    });
  }, [leads, query, statusFilter]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      await loadLeads({ offset: leads.length, append: true });
    } catch (error) {
      setLoadError(error.message || "Unable to load more leads.");
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#111827", marginBottom: 3 }}>Leads</h1>
          <p style={{ fontSize: 14, color: "#6B7280" }}>Contacts shared from your public card profiles appear here.</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 14, marginBottom: 20 }}>
        {stats.map(([value, label, Icon, color, background]) => (
          <div key={label} style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: "18px 20px" }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
              <Icon size={15} color={color} />
            </div>
            <p style={{ fontSize: 25, fontWeight: 800, color: "#111827", marginBottom: 3 }}>{value}</p>
            <p style={{ fontSize: 12, color: "#6B7280", fontWeight: 700 }}>{label}</p>
          </div>
        ))}
      </div>

      <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", padding: 16, borderBottom: "1px solid #F3F4F6" }}>
          <div style={{ position: "relative", flex: "1 1 260px", maxWidth: 420 }}>
            <Search size={15} color="#94A3B8" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search leads"
              style={{
                width: "100%",
                minHeight: 40,
                border: "1px solid #E5E7EB",
                borderRadius: 10,
                padding: "0 12px 0 36px",
                fontSize: 13,
                color: "#111827",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {STATUS_FILTERS.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                style={{
                  border: "1px solid #E5E7EB",
                  borderRadius: 999,
                  background: statusFilter === status ? "#0d6ffd" : "#fff",
                  color: statusFilter === status ? "#fff" : "#475569",
                  padding: "7px 11px",
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                {status === "all" ? "All" : statusLabel(status)}
              </button>
            ))}
          </div>
        </div>

        {loadError && (
          <div style={{ background: "#FEF2F2", borderBottom: "1px solid #FECACA", color: "#B91C1C", fontSize: 13, fontWeight: 700, padding: "12px 16px" }}>
            {loadError}
          </div>
        )}

        {loading ? (
          <div style={{ padding: 28, color: "#6B7280", fontSize: 14 }}>Loading leads...</div>
        ) : leads.length === 0 ? (
          <div className="ui-empty-state" style={{ border: "none" }}>
            <div className="ui-empty-state__icon">
              <UsersRound size={18} />
            </div>
            <p className="ui-empty-state__title">No leads yet</p>
            <p className="ui-empty-state__copy">When someone taps Exchange contact on your public profile, their details will show here.</p>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="ui-empty-state" style={{ border: "none" }}>
            <div className="ui-empty-state__icon">
              <Search size={18} />
            </div>
            <p className="ui-empty-state__title">No matching leads</p>
            <p className="ui-empty-state__copy">Try another search term or status filter.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {filteredLeads.map((lead, index) => (
              <div
                key={lead.id}
                className="dashboard-lead-row"
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(220px, 1.2fr) minmax(220px, 1fr) minmax(180px, .9fr) minmax(130px, auto)",
                  gap: 18,
                  padding: "17px 18px",
                  borderBottom: index < filteredLeads.length - 1 ? "1px solid #F3F4F6" : "none",
                  alignItems: "start",
                }}
              >
                <div>
                  <p style={{ fontSize: 14, fontWeight: 850, color: "#111827" }}>{lead.name}</p>
                  <p style={{ fontSize: 12, color: "#6B7280", marginTop: 4 }}>{dateLabel(lead.createdAt)}</p>
                  <span style={{ display: "inline-flex", marginTop: 8, fontSize: 11, fontWeight: 850, color: "#0d6ffd", background: "#eaf3ff", borderRadius: 999, padding: "4px 9px" }}>
                    {statusLabel(lead.status)}
                  </span>
                </div>

                <div style={{ display: "grid", gap: 7, minWidth: 0 }}>
                  {lead.email && (
                    <a href={`mailto:${lead.email}`} style={{ display: "inline-flex", alignItems: "center", gap: 7, color: "#334155", textDecoration: "none", fontSize: 13, overflowWrap: "anywhere" }}>
                      <Mail size={14} color="#0d6ffd" /> {lead.email}
                    </a>
                  )}
                  {lead.phone && (
                    <a href={`tel:${lead.phone}`} style={{ display: "inline-flex", alignItems: "center", gap: 7, color: "#334155", textDecoration: "none", fontSize: 13, overflowWrap: "anywhere" }}>
                      <Phone size={14} color="#059669" /> {lead.phone}
                    </a>
                  )}
                </div>

                <div style={{ display: "grid", gap: 7, minWidth: 0 }}>
                  {lead.company && (
                    <p style={{ display: "inline-flex", alignItems: "center", gap: 7, color: "#334155", fontSize: 13, overflowWrap: "anywhere" }}>
                      <Building2 size={14} color="#4F46E5" /> {lead.company}
                    </p>
                  )}
                  {lead.jobTitle && (
                    <p style={{ display: "inline-flex", alignItems: "center", gap: 7, color: "#334155", fontSize: 13, overflowWrap: "anywhere" }}>
                      <BriefcaseBusiness size={14} color="#B45309" /> {lead.jobTitle}
                    </p>
                  )}
                  {!lead.company && !lead.jobTitle && (
                    <p style={{ color: "#9CA3AF", fontSize: 13 }}>No business details</p>
                  )}
                </div>

                <div className="dashboard-lead-meta" style={{ display: "grid", justifyItems: "end", gap: 7 }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "#475569", fontWeight: 750 }}>
                    <CreditCard size={14} color="#64748b" /> {lead.cardName || "Card profile"}
                  </span>
                  <span style={{ fontSize: 11, color: "#64748b", background: "#F8FAFC", border: "1px solid #E5E7EB", borderRadius: 999, padding: "4px 9px", fontWeight: 800 }}>
                    {sourceLabel(lead.source)}
                  </span>
                </div>
              </div>
            ))}

            {pageInfo.hasMore && (
              <div style={{ display: "flex", justifyContent: "center", padding: 16, borderTop: "1px solid #F3F4F6" }}>
                <button
                  type="button"
                  onClick={loadMore}
                  disabled={loadingMore}
                  style={{ border: "1px solid #E5E7EB", borderRadius: 8, background: "#fff", color: "#0d6ffd", padding: "8px 13px", fontSize: 13, fontWeight: 850, cursor: loadingMore ? "wait" : "pointer" }}
                >
                  {loadingMore ? "Loading..." : `Load more (${leads.length}/${pageInfo.total})`}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        @media (max-width: 980px) {
          .dashboard-lead-row {
            grid-template-columns: 1fr !important;
          }

          .dashboard-lead-meta {
            justify-items: start !important;
          }
        }
      `}</style>
    </>
  );
}
