export const stats = [
  { value: "48K+", label: "Active Cards" },
  { value: "2.4M", label: "Profile Views" },
  { value: "190+", label: "Countries" },
  { value: "99.9%", label: "Uptime" },
];

export const previewStats = [
  ["847", "Profile views this month"],
  ["124", "NFC taps"],
  ["23", "Contacts saved"],
  ["8", "Appointments booked"],
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
      "Contact save tracking",
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
    name: "Chinedu Okafor",
    role: "CEO, PrimeTech Solutions",
    body: "I switched from traditional business cards to this NFC card, and it has completely changed how I network. Clients simply tap their phones and instantly access my contact details, website, WhatsApp, and social media. It looks professional and saves me from reprinting cards every time my information changes. Highly recommended for entrepreneurs and business owners.",
    avatar: "CO",
    rating: 5,
    score: "5/5",
  },
  {
    name: "Tolulope Adeyemi",
    role: "Property Consultant",
    body: "As a real estate consultant, first impressions matter. This NFC card makes me stand out at property inspections and networking events. Prospects can save my contact information instantly and book appointments directly from my profile. I've received more inquiries since I started using it.",
    avatar: "TA",
    rating: 5,
    score: "4.5/5",
  },
  {
    name: "Amaka Nwosu",
    role: "Founder, Amaka Styles",
    body: "I love how sleek and modern this NFC card is. Instead of sharing multiple social media handles and phone numbers, everything is available in one place. Customers can view my portfolio, contact me, and follow my brand within seconds. It's one of the best investments I've made for my business branding.",
    avatar: "AN",
    rating: 5,
    score: "4.5/5",
  },
];
