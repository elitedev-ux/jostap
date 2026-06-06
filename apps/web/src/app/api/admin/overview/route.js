import { json } from "../../utils/http.js";
import { requireAdmin, fullName, money } from "../../utils/admin.js";
import { getSupabaseAdmin } from "../../utils/supabase.js";
import { toCdnStorageUrl } from "../../utils/storageUrls.js";
import { cardNfcUrl, publicCardUrl, cardQrUrl } from "../../../../utils/publicUrl.js";

function dateLabel(value) {
  return value ? new Date(value).toLocaleDateString() : "";
}

function dateTimeLabel(value) {
  if (!value) return "";

  return new Date(value).toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function sum(rows, key) {
  return (rows || []).reduce((total, row) => total + Number(row[key] || 0), 0);
}

const DEFAULT_PLAN_PRICE_KOBO = {
  free: { free: 0 },
  jostap_nfc: { one_time: 4000000 },
  custom_nfc: { one_time: 5000000 },
  basic_renewal: { yearly: 120000 },
  premium_renewal: { yearly: 200000 },
};

function currentPlanPrice(plan, cycle, value) {
  const fallback = DEFAULT_PLAN_PRICE_KOBO[plan]?.[cycle] || 0;
  const amount = Number(value || 0);

  return fallback ? Math.max(amount, fallback) : amount;
}

function priceForSubscription(subscription, pricingBySlug) {
  if (!subscription || subscription.status !== "active") return 0;

  const pricing = pricingBySlug.get(subscription.plan);

  if (subscription.billing_cycle === "yearly") {
    return currentPlanPrice(subscription.plan, "yearly", pricing?.yearly_cents);
  }

  if (subscription.billing_cycle === "one_time") {
    return currentPlanPrice(subscription.plan, "one_time", pricing?.monthly_cents);
  }

  return 0;
}

function ticketContact(ticket) {
  return (
    fullName(ticket.users) ||
    ticket.guest_name ||
    ticket.users?.email ||
    ticket.guest_email ||
    "Guest"
  );
}

function notificationTypeForTicket(ticket) {
  return ticket.priority === "urgent" || ticket.priority === "high" ? "warning" : "info";
}

export async function GET(request) {
  const { response } = await requireAdmin(request, "reports:export");

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
  const rawNotifications = notificationsResult.data || [];
  const announcements = announcementsResult.data || [];
  const supportTickets = supportTicketsResult.data || [];
  const supportTicketById = new Map(supportTickets.map((ticket) => [ticket.id, ticket]));
  const notifications = rawNotifications.map((item) => {
    if (item.source !== "support_ticket" || !item.source_id) return item;

    const ticket = supportTicketById.get(item.source_id);
    const ticketIsActive = ticket && ticket.status !== "closed";

    return {
      ...item,
      is_read: ticketIsActive ? false : item.is_read,
      source: "support_ticket",
      ticketId: item.source_id,
      locked: ticketIsActive,
    };
  });
  const linkedSupportTicketNotificationIds = new Set(
    notifications
      .filter((item) => item.source === "support_ticket" && item.source_id)
      .map((item) => item.source_id),
  );
  const unreadNewTicketSubjects = new Set(
    notifications
      .filter((item) =>
        !item.is_read &&
        ["New support ticket", "New help center ticket"].includes(item.title),
      )
      .map((item) => String(item.message || "").split(" submitted: ").pop())
      .filter(Boolean),
  );
  const activeSupportTicketNotifications = supportTickets
    .filter((ticket) =>
      ticket.status !== "closed" &&
      !linkedSupportTicketNotificationIds.has(ticket.id) &&
      !unreadNewTicketSubjects.has(ticket.subject),
    )
    .map((ticket) => ({
      id: `support-ticket-${ticket.id}`,
      title: "Support ticket requires attention",
      message: `${ticketContact(ticket)}: ${ticket.subject}`,
      type: notificationTypeForTicket(ticket),
      is_read: false,
      created_at: ticket.created_at,
      source: "support_ticket",
      ticketId: ticket.id,
      locked: true,
    }));
  const adminNotifications = [
    ...activeSupportTicketNotifications,
    ...notifications,
  ].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  const roles = rolesResult.data || [];
  const auditLogs = auditLogsResult.data || [];
  const userById = new Map(users.map((user) => [user.id, user]));
  const profileByUser = new Map(profiles.map((profile) => [profile.user_id, profile]));
  const subscriptionsByUser = new Map(subscriptions.map((item) => [item.user_id, item]));
  const pricingBySlug = new Map(pricingPlans.map((plan) => [plan.slug, plan]));
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
    if (!card.user_id) return map;
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
      assignedCards: cards.filter((card) => Boolean(card.user_id)).length,
      unassignedCards: cards.filter((card) => !card.user_id).length,
      activeCards: cards.filter((card) => card.active).length,
      leads: leads.length,
      appointments: appointments.length,
      pendingAppointments: appointments.filter((appointment) => appointment.status === "pending").length,
      approvedAppointments: appointments.filter((appointment) => appointment.status === "approved").length,
      completedAppointments: appointments.filter((appointment) => appointment.status === "completed").length,
      subscriptions: activeSubscriptions.length,
      premiumSubscriptions: premiumSubscriptions.length,
      revenueCents: sum(payments.filter((payment) => payment.status === "succeeded"), "amount_cents"),
      estimatedMrrCents: sum(activeSubscriptions.map((subscription) => ({
        value: priceForSubscription(subscription, pricingBySlug),
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
      unreadNotifications: adminNotifications.filter((item) => !item.is_read).length,
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
        joined: dateTimeLabel(user.created_at),
        createdAt: user.created_at || "",
        avatarUrl: toCdnStorageUrl(profile?.avatar_url || ""),
      };
    }),
    cards: cards.map((card) => {
      const owner = userById.get(card.user_id);
      const assigned = Boolean(card.user_id);

      return {
        id: card.id,
        name: card.name,
        userId: card.user_id || null,
        owner: assigned ? fullName(owner) || owner?.email || "Unknown user" : "Unassigned",
        ownerEmail: owner?.email || "",
        assignmentStatus: assigned ? "assigned" : "unassigned",
        slug: card.slug,
        publicUrl: card.id ? publicCardUrl(card, { request }) : "",
        qrUrl: card.id ? cardQrUrl(card, { request }) : "",
        nfcUrl: card.id ? cardNfcUrl(card, { request }) : "",
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
      const owner = userById.get(subscription.user_id);

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
      const owner = userById.get(invoice.user_id);

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
      account: fullName(userById.get(payment.user_id)) || userById.get(payment.user_id)?.email || "Unknown",
      amount: money(payment.amount_cents, payment.currency),
      status: payment.status,
      created: dateLabel(payment.created_at),
    })),
    leads: leads.map((lead) => {
      const owner = userById.get(lead.user_id);
      return {
        ...lead,
        owner: fullName(owner) || owner?.email || "Unknown",
        created: dateLabel(lead.created_at),
      };
    }),
    appointments: appointments.map((appointment) => {
      const owner = userById.get(appointment.assigned_user_id);
      return {
        ...appointment,
        owner: fullName(owner) || owner?.email || "Unknown",
        starts: dateLabel(appointment.starts_at),
        visitorName: appointment.visitor_name || appointment.guest_name || "",
        visitorEmail: appointment.visitor_email || appointment.guest_email || "",
        visitorPhone: appointment.visitor_phone || "",
        appointmentDate: appointment.appointment_date || "",
        appointmentTime: appointment.appointment_time || "",
        appointmentMessage: appointment.appointment_message || appointment.notes || "",
      };
    }),
    templates,
    features,
    emailTemplates,
    staticPages,
    faqs,
    pricingPlans,
    notifications: adminNotifications,
    announcements,
    supportTickets: supportTickets.map((ticket) => {
      const contactName = ticketContact(ticket);
      const contactEmail = ticket.users?.email || ticket.guest_email || "";

      return {
        id: ticket.id,
        subject: ticket.subject,
        message: ticket.message,
        category: ticket.category,
        priority: ticket.priority,
        status: ticket.status,
        adminNotes: ticket.admin_notes || "",
        account: contactEmail ? `${contactName} (${contactEmail})` : contactName,
        contactName,
        contactEmail,
        created: dateLabel(ticket.created_at),
        created_at: ticket.created_at,
      };
    }),
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
