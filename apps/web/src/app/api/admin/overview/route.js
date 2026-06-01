import { json } from "../../utils/http.js";
import { requireAdmin, fullName, money } from "../../utils/admin.js";
import { getSupabaseAdmin } from "../../utils/supabase.js";

function dateLabel(value) {
  return value ? new Date(value).toLocaleDateString() : "";
}

function sum(rows, key) {
  return (rows || []).reduce((total, row) => total + Number(row[key] || 0), 0);
}

const PLAN_PRICES = {
  free: { free: 0 },
  jostap_nfc: { one_time: 3000 },
  custom_nfc: { one_time: 5000 },
  basic_renewal: { yearly: 1200 },
  premium_renewal: { yearly: 2000 },
};

function estimatedMonthlyValue(subscription) {
  if (!subscription || subscription.status !== "active") return 0;

  return PLAN_PRICES[subscription.plan]?.[subscription.billing_cycle] || 0;
}

export async function GET(request) {
  const { response } = await requireAdmin(request);

  if (response) {
    return response;
  }

  const supabase = getSupabaseAdmin();
  const [
    usersResult,
    profilesResult,
    cardsResult,
    leadsResult,
    appointmentsResult,
    subscriptionsResult,
    paymentsResult,
    invoicesResult,
    templatesResult,
    featuresResult,
    emailTemplatesResult,
    staticPagesResult,
    faqsResult,
    pricingPlansResult,
    notificationsResult,
    announcementsResult,
    supportTicketsResult,
    rolesResult,
    auditLogsResult,
  ] = await Promise.all([
    supabase.from("users").select("id, first_name, last_name, company, email, role, status, created_at").order("created_at", { ascending: false }),
    supabase.from("kyc_profiles").select("*"),
    supabase.from("cards").select("*").order("created_at", { ascending: false }),
    supabase.from("leads").select("*").order("created_at", { ascending: false }),
    supabase.from("appointments").select("*").order("starts_at", { ascending: true }),
    supabase.from("subscriptions").select("*").order("created_at", { ascending: false }),
    supabase.from("payments").select("*").order("created_at", { ascending: false }),
    supabase.from("invoices").select("*").order("issued_at", { ascending: false }),
    supabase.from("card_templates").select("*").order("created_at", { ascending: false }),
    supabase.from("premium_features").select("*").order("created_at", { ascending: false }),
    supabase.from("email_templates").select("*").order("created_at", { ascending: false }),
    supabase.from("static_pages").select("*").order("created_at", { ascending: false }),
    supabase.from("faqs").select("*").order("sort_order", { ascending: true }),
    supabase.from("pricing_plans").select("*").order("monthly_cents", { ascending: true }),
    supabase.from("admin_notifications").select("*").order("created_at", { ascending: false }),
    supabase.from("announcements").select("*").order("published_at", { ascending: false }),
    supabase.from("support_tickets").select("*, users(email, first_name, last_name)").order("created_at", { ascending: false }),
    supabase.from("role_permissions").select("*").order("role", { ascending: true }),
    supabase.from("admin_audit_logs").select("*, users(email, first_name, last_name)").order("created_at", { ascending: false }).limit(100),
  ]);

  const error =
    usersResult.error ||
    profilesResult.error ||
    cardsResult.error ||
    leadsResult.error ||
    appointmentsResult.error ||
    subscriptionsResult.error ||
    paymentsResult.error ||
    invoicesResult.error ||
    templatesResult.error ||
    featuresResult.error ||
    emailTemplatesResult.error ||
    staticPagesResult.error ||
    faqsResult.error ||
    pricingPlansResult.error ||
    notificationsResult.error ||
    announcementsResult.error ||
    supportTicketsResult.error ||
    rolesResult.error ||
    auditLogsResult.error;

  if (error) {
    throw error;
  }

  const users = usersResult.data || [];
  const profiles = profilesResult.data || [];
  const cards = cardsResult.data || [];
  const leads = leadsResult.data || [];
  const appointments = appointmentsResult.data || [];
  const subscriptions = subscriptionsResult.data || [];
  const payments = paymentsResult.data || [];
  const invoices = invoicesResult.data || [];
  const templates = templatesResult.data || [];
  const features = featuresResult.data || [];
  const emailTemplates = emailTemplatesResult.data || [];
  const staticPages = staticPagesResult.data || [];
  const faqs = faqsResult.data || [];
  const pricingPlans = pricingPlansResult.data || [];
  const notifications = notificationsResult.data || [];
  const announcements = announcementsResult.data || [];
  const supportTickets = supportTicketsResult.data || [];
  const roles = rolesResult.data || [];
  const auditLogs = auditLogsResult.data || [];
  const profileByUser = new Map(profiles.map((profile) => [profile.user_id, profile]));
  const subscriptionsByUser = new Map(subscriptions.map((item) => [item.user_id, item]));
  const activeSubscriptions = subscriptions.filter((item) => item.status === "active");
  const premiumSubscriptions = activeSubscriptions.filter((item) =>
    ["custom_nfc", "premium_renewal"].includes(item.plan),
  );
  const subscribedUserIds = new Set(activeSubscriptions.map((item) => item.user_id));
  const premiumUserIds = new Set(premiumSubscriptions.map((item) => item.user_id));
  const planCounts = activeSubscriptions.reduce(
    (counts, subscription) => ({
      ...counts,
      [subscription.plan]: (counts[subscription.plan] || 0) + 1,
    }),
    { free: 0, jostap_nfc: 0, custom_nfc: 0, basic_renewal: 0, premium_renewal: 0 },
  );
  const cardsByUser = cards.reduce((map, card) => {
    map.set(card.user_id, (map.get(card.user_id) || 0) + 1);
    return map;
  }, new Map());
  const revenueByUser = payments
    .filter((payment) => payment.status === "succeeded")
    .reduce((map, payment) => {
      map.set(payment.user_id, (map.get(payment.user_id) || 0) + Number(payment.amount_cents || 0));
      return map;
    }, new Map());

  return json({
    stats: {
      users: users.length,
      admins: users.filter((user) => user.role === "admin").length,
      standardUsers: users.filter((user) => user.role !== "admin").length,
      suspendedUsers: users.filter((user) => user.status === "suspended").length,
      premiumUsers: users.filter((user) => premiumUserIds.has(user.id)).length,
      freeUsers: users.filter((user) => !subscribedUserIds.has(user.id)).length,
      starterUsers: planCounts.free || 0,
      professionalUsers: planCounts.jostap_nfc || 0,
      businessUsers: planCounts.custom_nfc || 0,
      freePlanUsers: planCounts.free || 0,
      jostapNfcUsers: planCounts.jostap_nfc || 0,
      customNfcUsers: planCounts.custom_nfc || 0,
      basicRenewalUsers: planCounts.basic_renewal || 0,
      premiumRenewalUsers: planCounts.premium_renewal || 0,
      kycComplete: profiles.length,
      kycPending: Math.max(users.length - profiles.length, 0),
      cards: cards.length,
      activeCards: cards.filter((card) => card.active).length,
      leads: leads.length,
      appointments: appointments.length,
      subscriptions: activeSubscriptions.length,
      premiumSubscriptions: premiumSubscriptions.length,
      revenueCents: sum(payments.filter((payment) => payment.status === "succeeded"), "amount_cents"),
      estimatedMrrCents: sum(activeSubscriptions.map((subscription) => ({
        value: estimatedMonthlyValue(subscription),
      })), "value"),
      openInvoices: invoices.filter((invoice) => invoice.status === "open").length,
      paidInvoices: invoices.filter((invoice) => invoice.status === "paid").length,
      qrScans: sum(cards, "qr_scans"),
      views: sum(cards, "views"),
      taps: sum(cards, "taps"),
      contactDownloads: sum(cards, "contact_downloads"),
      templates: templates.length,
      premiumFeatures: features.length,
      emailTemplates: emailTemplates.length,
      staticPages: staticPages.length,
      faqs: faqs.length,
      pricingPlans: pricingPlans.length,
      unreadNotifications: notifications.filter((item) => !item.is_read).length,
      announcements: announcements.length,
      supportTickets: supportTickets.length,
      openSupportTickets: supportTickets.filter((ticket) => ["open", "pending"].includes(ticket.status)).length,
      auditLogs: auditLogs.length,
      planCounts,
    },
    users: users.map((user) => {
      const subscription = subscriptionsByUser.get(user.id);
      const profile = profileByUser.get(user.id);

      return {
        id: user.id,
        name: fullName(user) || user.email,
        email: user.email,
        company: profile?.business_name || user.company || "",
        role: user.role,
        status: user.status || "active",
        plan: subscription?.plan || "none",
        subscriptionStatus: subscription?.status || "no plan",
        cards: cardsByUser.get(user.id) || 0,
        revenue: money(revenueByUser.get(user.id) || 0),
        joined: dateLabel(user.created_at),
        avatarUrl: profile?.avatar_url || "",
      };
    }),
    cards: cards.map((card) => {
      const owner = users.find((user) => user.id === card.user_id);

      return {
        id: card.id,
        name: card.name,
        owner: fullName(owner) || owner?.email || "Unknown",
        slug: card.slug,
        publicUrl: card.slug ? `/${card.slug}` : "",
        status: card.active ? "Published" : "Paused",
        active: Boolean(card.active),
        views: card.views || 0,
        taps: card.taps || 0,
        qrScans: card.qr_scans || 0,
        contactDownloads: card.contact_downloads || 0,
        created: dateLabel(card.created_at),
      };
    }),
    subscriptions: subscriptions.map((subscription) => {
      const owner = users.find((user) => user.id === subscription.user_id);

      return {
        id: subscription.id,
        account: fullName(owner) || owner?.email || "Unknown",
        plan: subscription.plan,
        billingCycle: subscription.billing_cycle,
        status: subscription.status,
        renews: dateLabel(subscription.current_period_end),
      };
    }),
    invoices: invoices.map((invoice) => {
      const owner = users.find((user) => user.id === invoice.user_id);

      return {
        id: invoice.id,
        invoiceNumber: invoice.invoice_number || invoice.id.slice(0, 8),
        account: fullName(owner) || owner?.email || "Unknown",
        amount: money(invoice.amount_cents, invoice.currency),
        status: invoice.status,
        issued: dateLabel(invoice.issued_at),
      };
    }),
    payments: payments.map((payment) => ({
      id: payment.id,
      userId: payment.user_id,
      account: fullName(users.find((user) => user.id === payment.user_id)) || users.find((user) => user.id === payment.user_id)?.email || "Unknown",
      amount: money(payment.amount_cents, payment.currency),
      status: payment.status,
      created: dateLabel(payment.created_at),
    })),
    leads: leads.map((lead) => {
      const owner = users.find((user) => user.id === lead.user_id);
      return {
        ...lead,
        owner: fullName(owner) || owner?.email || "Unknown",
        created: dateLabel(lead.created_at),
      };
    }),
    appointments: appointments.map((appointment) => {
      const owner = users.find((user) => user.id === appointment.user_id);
      return {
        ...appointment,
        owner: fullName(owner) || owner?.email || "Unknown",
        starts: dateLabel(appointment.starts_at),
      };
    }),
    templates,
    features,
    emailTemplates,
    staticPages,
    faqs,
    pricingPlans,
    notifications,
    announcements,
    supportTickets: supportTickets.map((ticket) => ({
      id: ticket.id,
      subject: ticket.subject,
      message: ticket.message,
      category: ticket.category,
      priority: ticket.priority,
      status: ticket.status,
      adminNotes: ticket.admin_notes || "",
      account: fullName(ticket.users) || ticket.users?.email || "Unknown",
      created: dateLabel(ticket.created_at),
      created_at: ticket.created_at,
    })),
    roles,
    auditLogs: auditLogs.map((log) => ({
      id: log.id,
      action: log.action,
      targetType: log.target_type || "",
      targetId: log.target_id || "",
      metadata: log.metadata || {},
      admin: fullName(log.users) || log.users?.email || "System",
      created: dateLabel(log.created_at),
    })),
  });
}
