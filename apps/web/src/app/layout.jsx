import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 300000, retry: 1, refetchOnWindowFocus: false },
  },
});

export default function RootLayout({ children }) {
  return (
    <>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="true"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <title>JOSTAP NFC — Digital Business Cards</title>
        <meta
          name="description"
          content="Create stunning digital NFC business cards. Share your profile with a tap."
        />
      </head>
      <QueryClientProvider client={queryClient}>
        <div style={{ fontFamily: "'Inter',-apple-system,sans-serif" }}>
          {children}
        </div>
      </QueryClientProvider>
    </>
  );
}
