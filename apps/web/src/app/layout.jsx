import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet } from "react-router";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 300000, retry: 1, refetchOnWindowFocus: false },
  },
});

export default function RootLayout({ children }) {
  const content = children ?? <Outlet />;

  return (
    <>
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="true"
        />
        <link
          href="https://api.fontshare.com/v2/css?f[]=clash-display@600&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <title>JOSTAP - NFC Smart Business Cards in Nigeria</title>
        <meta
          name="description"
          content="JOSTAP helps professionals and businesses share contact details, WhatsApp, social links, portfolios, bookings, and lead forms with one NFC smart business card tap."
        />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://jostap.com/" />
        <meta property="og:title" content="JOSTAP - NFC Smart Business Cards" />
        <meta
          property="og:description"
          content="Share your digital profile, contacts, WhatsApp, social links, bookings, and leads with one tap using a JOSTAP NFC smart business card."
        />
        <meta property="og:url" content="https://jostap.com/" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="JOSTAP - NFC Smart Business Cards" />
        <meta
          name="twitter:description"
          content="Create a smart NFC business card profile that lets people save your contact, connect on social media, book appointments, and exchange details."
        />
      </head>
      <QueryClientProvider client={queryClient}>
        {content}
      </QueryClientProvider>
    </>
  );
}
