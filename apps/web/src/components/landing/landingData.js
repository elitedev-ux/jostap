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
    note: "",
    desc: "Best for professionals",
    features: [
      "Physical NFC card",
      "Digital business profile",
      "Downloadable QR code",
      "Contact sharing",
      "Save contact (vCard)",
      "Social media links",
      "Contact save tracking",
      "Appointment booking",
      "Advanced analytics",
      "Premium features",
      "1 year premium access included",
    ],
    cta: "Order Card",
    href: "/checkout?plan=jostap_nfc&billing=one_time",
    highlight: true,
    badge: "Most Popular",
  },
  {
    name: "Custom Card",
    price: "\u20A640,000",
    note: "",
    desc: "Best for custom card designs",
    features: [
      "Physical NFC card",
      "Digital business profile",
      "Downloadable QR code",
      "Contact sharing",
      "Save contact (vCard)",
      "Social media links",
      "Contact save tracking",
      "Appointment booking",
      "Advanced analytics",
      "Premium features",
      "1 year premium access included",
    ],
    cta: "Order Custom Card",
    href: "/checkout?plan=custom_nfc&billing=one_time",
    highlight: false,
  },
  {
    name: "Premium Features Renewal",
    price: "\u20A627,375",
    note: "/year",
    desc: "Renew premium access after the included first year",
    features: [
      "Advanced analytics",
      "Lead capture",
      "Appointment booking",
      "Visitor insights",
      "Downloadable QR code",
      "Catalog section",
      "Testimonials",
      "Premium features for 1 year",
    ],
    cta: "Renew Premium",
    href: "/checkout?plan=premium_renewal&billing=yearly",
    highlight: false,
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

export const faqs = [
  {
    question: "How does the JOSTAP Smart Business Card work?",
    answer:
      "The JOSTAP Smart Business Card is designed with NFC technology, which allows your information to be shared wirelessly. When the card is tapped on an NFC-enabled smartphone, a link containing your contact details will appear on the phone and can be saved instantly. For phones that do not support NFC, a QR code is printed on the back of the card so users can still access your information easily.",
  },
  {
    question: "How do I add my details to the JOSTAP Smart Business Card?",
    answer:
      "After purchasing your JOSTAP Smart Business Card, you will receive access to a personal login account where you can create your profile. From your profile dashboard, you can add your contact information, social media links, business details, portfolio links, and any other important information you want to share.",
  },
  {
    question: "How do I change or update my details?",
    answer:
      "You can update your details anytime through your online profile. Once you log in to the JOSTAP web app, you can edit your information in real time, and the changes will reflect immediately on your JOSTAP Smart Business Card.",
  },
  {
    question: "Is the JOSTAP Smart Business Card secure?",
    answer:
      "Yes, the JOSTAP Smart Business Card is safe and secure. It only shares the information you choose to provide, such as your name, phone number, email, social media handles, and business details. The card does not collect or remove information from another person’s phone. It works only when it is held very close to a compatible device, making it a safe and modern way to share professional contact details.",
  },
  {
    question: "Is there a subscription plan?",
    answer:
      "Yes. JOSTAP premium features renew annually at \u20A627,375 after the first included year. This renewal keeps your full JOSTAP Smart Business Card experience active, including seamless sharing of your contact details, portfolio, social media links, and other important business information.",
  },
  {
    question: "Which phones are compatible?",
    answer:
      "Most Android phones released from 2018 upward support NFC. iPhone models from iPhone 7 to iPhone 14 also have NFC capability. For iPhone 7 to iPhone X, NFC may need to be activated manually, while iPhone XS and newer models usually have NFC enabled automatically. For older iPhones and Android devices that do not support NFC, the QR code feature can be used instead.",
  },
  {
    question: "How do I turn on NFC?",
    answer:
      "On an Android phone, go to your phone settings, select “More” or “Connected Devices,” then look for the NFC option and switch it on. The exact steps may differ depending on the phone model.\n\nFor iPhones, NFC usually works automatically on supported models and does not need to be turned on manually.",
  },
  {
    question: "What happens if I misplace the card?",
    answer:
      "If your JOSTAP Smart Business Card is misplaced, a replacement card can be issued. A replacement within the first three months will cost 50% of the original purchase price, while replacement after three months will cost 70% of the initial purchase price.",
  },
  {
    question: "What happens if the card is stolen or damaged?",
    answer:
      "If your card is stolen, you can deactivate it from your user dashboard. Once deactivated, your details will no longer be active on that card. If the card is damaged, you can request a replacement according to the replacement policy.",
  },
  {
    question: "How do I receive someone else’s contact information?",
    answer:
      "After your JOSTAP Smart Business Card is tapped on someone’s phone, the person can share their own details with you by clicking the “Exchange Contact” button and filling out the lead generation form. Their contact information will be saved automatically on your user dashboard and can also be saved on your phone.",
  },
];
