export const stats = [
  { value: "48K+", label: "Active Cards" },
  { value: "2.4M", label: "Profile Views" },
  { value: "190+", label: "Countries" },
  { value: "99.9%", label: "Uptime" },
];

export const previewStats = [
  ["847", "Profile views this month"],
  ["124", "NFC taps"],
  ["23", "Leads captured"],
  ["8", "Appointments booked"],
];

export const features = [
  {
    icon: "smartphone",
    title: "NFC-Powered Sharing",
    desc: "One tap transfers your complete profile to any smartphone. No app required on the receiver's end.",
  },
  {
    icon: "barChart",
    title: "Real-Time Analytics",
    desc: "Know exactly who viewed your card, when, and from where. Track taps, scans, and link clicks.",
  },
  {
    icon: "share",
    title: "Dynamic QR Code",
    desc: "Every card ships with a live QR code that syncs with your profile in real time.",
  },
  {
    icon: "globe",
    title: "Custom Public URL",
    desc: "Get a personalized link like jostap.com/yourname and share it anywhere.",
  },
  {
    icon: "users",
    title: "Lead Capture",
    desc: "Collect visitor contact info automatically every time someone views your card.",
  },
  {
    icon: "wifi",
    title: "Appointment Booking",
    desc: "Let visitors book meetings directly from your card with full Cal.com integration.",
  },
];

export const steps = [
  {
    step: "01",
    title: "Order Your Card",
    desc: "Choose a plan and your physical NFC card is dispatched to you within 3 business days.",
  },
  {
    step: "02",
    title: "Build Your Profile",
    desc: "Use our drag-and-drop builder to create a stunning digital profile in minutes.",
  },
  {
    step: "03",
    title: "Tap & Share",
    desc: "Touch your card to any phone and your complete profile appears instantly.",
  },
];

export const plans = [
  {
    name: "Free",
    price: "\u20A60",
    desc: "Best for personal networking",
    features: [
      "1 digital business card",
      "Public profile page",
      "JOSTAP branded QR code",
      "Contact sharing",
      "Save contact (vCard)",
      "Social media links",
      "Basic analytics",
    ],
    cta: "Get Started",
    href: "/auth/signup",
    highlight: false,
  },
  {
    name: "JOSTAP Card",
    price: "\u20A630,000",
    note: "Launch Promo - \u20A640,000 Regular Price",
    desc: "Best for professionals",
    features: [
      "Physical NFC card",
      "Digital business profile",
      "JOSTAP branded QR code",
      "Downloadable QR code",
      "Contact sharing",
      "Save contact (vCard)",
      "Social media links",
      "Lead capture",
      "Appointment booking",
      "Visitor insights",
      "Advanced analytics",
      "Premium features",
      "1 year premium access included",
    ],
    cta: "Order Card",
    href: "/checkout?plan=jostap_nfc&billing=one_time",
    highlight: true,
    badge: "Most Popular",
  },
];

export const testimonials = [
  {
    name: "Marcus Chen",
    role: "Head of Sales · Meridian Group",
    body: "We replaced 400 paper cards with JOSTAP NFC. Our team's networking close rate went up 34% in the first quarter.",
    avatar: "MC",
    rating: 5,
  },
  {
    name: "Aisha Okonkwo",
    role: "Founder · Velio Studio",
    body: "The analytics alone are worth it. I know which conferences drive real pipeline now.",
    avatar: "AO",
    rating: 5,
  },
  {
    name: "Daniel Strauss",
    role: "VP Marketing · Arclite",
    body: "Setup took under 10 minutes and the card looks more premium than anything we've had printed.",
    avatar: "DS",
    rating: 5,
  },
];
