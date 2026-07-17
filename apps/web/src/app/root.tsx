import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useAsyncError,
  useLocation,
  useRouteError,
} from 'react-router';

import { useButton } from '@react-aria/button';
import {
  type CSSProperties,
  Component,
  type FC,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import './global.css';

import { LoadFonts } from 'virtual:load-fonts.jsx';
import { useNavigate } from 'react-router';
import { serializeError } from 'serialize-error';
import { Toaster, toast } from 'sonner';
import favicon from '../assets/jostap favicon bg.png';
import FloatingWhatsapp from '../components/FloatingWhatsapp';
import type { Route } from './+types/root';

export const links = () => [];

export const meta = () => [
  { title: 'JOSTAP - NFC Smart Business Cards in Nigeria' },
  {
    name: 'description',
    content:
      'JOSTAP helps professionals and businesses share contact details, WhatsApp, social links, portfolios, bookings, and lead forms with one NFC smart business card tap.',
  },
  { name: 'robots', content: 'index, follow' },
  { property: 'og:title', content: 'JOSTAP - NFC Smart Business Cards' },
  {
    property: 'og:description',
    content:
      'Share your digital profile, contacts, WhatsApp, social links, bookings, and leads with one tap using a JOSTAP NFC smart business card.',
  },
  { property: 'og:url', content: 'https://jostap.com/' },
  { property: 'og:type', content: 'website' },
  { name: 'twitter:card', content: 'summary' },
  { name: 'twitter:title', content: 'JOSTAP - NFC Smart Business Cards' },
  {
    name: 'twitter:description',
    content:
      'Create a smart NFC business card profile that lets people save your contact, connect on social media, book appointments, and exchange details.',
  },
];

export async function loader({ request }: Route.LoaderArgs) {
  return {
    nonce: request.headers.get('x-csp-nonce') || undefined,
  };
}

const LoadFontsSSR = import.meta.env.SSR ? LoadFonts : null;
const CREATE_BRIDGE_ENABLED =
  import.meta.env.DEV || import.meta.env.NEXT_PUBLIC_CREATE_ENV === 'DEVELOPMENT';

function canUseCreateBridge() {
  return (
    CREATE_BRIDGE_ENABLED &&
    typeof window !== 'undefined' &&
    window.parent &&
    window.parent !== window
  );
}

function isCreateBridgeMessage(event: MessageEvent) {
  if (!canUseCreateBridge() || event.source !== window.parent) {
    return false;
  }

  return import.meta.env.DEV || event.origin === window.location.origin;
}

function postCreateBridgeMessage(message: unknown) {
  if (!canUseCreateBridge()) {
    return;
  }

  window.parent.postMessage(message, import.meta.env.DEV ? '*' : window.location.origin);
}

if (import.meta.hot) {
  import.meta.hot.on('update-font-links', (urls: string[]) => {
    // remove old font links
    for (const link of document.querySelectorAll('link[data-auto-font]')) {
      link.remove();
    }

    // add new ones
    for (const url of urls) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = url;
      link.dataset.autoFont = 'true';
      document.head.appendChild(link);
    }
  });
}

function InternalErrorBoundary({ error: errorArg }: Route.ErrorBoundaryProps) {
  const routeError = useRouteError();
  const asyncError = useAsyncError();
  const error = errorArg ?? asyncError ?? routeError;
  const [isOpen, setIsOpen] = useState(false);
  const shouldScale = typeof window !== 'undefined' ? window.innerWidth < 768 : false;
  const scaleFactor = shouldScale ? 1.02 : 1;
  const copyButtonTextClass = shouldScale ? 'text-sm' : 'text-xs';
  const copyButtonPaddingClass = shouldScale ? 'px-[10px] py-[5px]' : 'px-[6px] py-[3px]';
  const postCountRef = useRef(0);
  const lastPostTimeRef = useRef(0);
  const lastErrorKeyRef = useRef<string | null>(null);
  const MAX_ERROR_POSTS_PER_ERROR = 5;
  const THROTTLE_MS = 1000;

  useEffect(() => {
    const serialized = serializeError(error);
    const errorKey = JSON.stringify(serialized);

    // Reset the counter when a genuinely different error arrives
    if (errorKey !== lastErrorKeyRef.current) {
      lastErrorKeyRef.current = errorKey;
      postCountRef.current = 0;
    }

    if (postCountRef.current >= MAX_ERROR_POSTS_PER_ERROR) {
      return;
    }

    const now = Date.now();
    const timeSinceLastPost = now - lastPostTimeRef.current;

    const post = () => {
      if (postCountRef.current >= MAX_ERROR_POSTS_PER_ERROR) {
        return;
      }
      postCountRef.current += 1;
      lastPostTimeRef.current = Date.now();
      postCreateBridgeMessage({ type: 'sandbox:error:detected', error: serialized });
    };

    if (timeSinceLastPost < THROTTLE_MS) {
      const timer = setTimeout(post, THROTTLE_MS - timeSinceLastPost);
      return () => clearTimeout(timer);
    }

    post();
  }, [error]);

  useEffect(() => {
    const animateTimer = setTimeout(() => setIsOpen(true), 100);
    return () => clearTimeout(animateTimer);
  }, []);
  const { buttonProps: copyButtonProps } = useButton(
    {
      onPress: useCallback(() => {
        const toastScale = shouldScale ? 1.2 : 1;
        const toastStyle = {
          padding: `${16 * toastScale}px`,
          background: '#18191B',
          border: '1px solid #2C2D2F',
          color: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          width: `${280 * toastScale}px`,
          fontSize: `${13 * toastScale}px`,
          display: 'flex',
          alignItems: 'center',
          gap: `${6 * toastScale}px`,
          justifyContent: 'flex-start',
          margin: '0 auto',
        };
        navigator.clipboard.writeText(JSON.stringify(serializeError(error)));
        toast.custom(
          () => (
            <div style={toastStyle}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                height="20"
                width="20"
              >
                <title>Success</title>
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Copied successfully!</span>
            </div>
          ),
          {
            id: 'copy-error-success',
            duration: 3000,
          }
        );
      }, [error, shouldScale]),
    },
    useRef<HTMLButtonElement>(null)
  );

  function isInIframe() {
    try {
      return window.parent !== window;
    } catch {
      return true;
    }
  }
  return (
    <>
      {!isInIframe() && (
        <div
          className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 max-w-md z-50 transition-all duration-500 ease-out ${
            isOpen ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
          }`}
          style={{ width: '75vw' }}
        >
          <div
            className="bg-[#18191B] text-[#F2F2F2] rounded-lg p-4 shadow-lg w-full"
            style={
              scaleFactor !== 1
                ? ({
                    transform: `scale(${scaleFactor})`,
                    transformOrigin: 'bottom center',
                  } as CSSProperties)
                : undefined
            }
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-[#F2F2F2] rounded-full flex items-center justify-center">
                  <span className="text-black text-[1.125rem] leading-none">!</span>
                </div>
              </div>

              <div className="flex flex-col gap-2 flex-1">
                <div className="flex flex-col gap-1">
                  <p className="font-light text-[#F2F2F2] text-sm">App Error Detected</p>
                  <p className="text-[#959697] text-sm font-light">
                    It looks like an error occurred while trying to use your app.
                  </p>
                </div>

                <button
                  className={`flex flex-row items-center justify-center gap-[4px] outline-none transition-colors rounded-[8px] border-[1px] bg-[#2C2D2F] hover:bg-[#414243] active:bg-[#555658] border-[#414243] text-white ${copyButtonTextClass} ${copyButtonPaddingClass} w-fit`}
                  type="button"
                  {...copyButtonProps}
                >
                  Copy error
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

type ErrorBoundaryProps = {
  children: React.ReactNode;
};

type ErrorBoundaryState = { hasError: boolean; error: unknown | null };

class ErrorBoundaryWrapper extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: unknown, info: unknown) {
    console.error(error, info);
  }

  render() {
    if (this.state.hasError) {
      return <InternalErrorBoundary error={this.state.error} params={{}} />;
    }
    return this.props.children;
  }
}

function LoaderWrapper({ loader }: { loader: () => React.ReactNode }) {
  return <>{loader()}</>;
}

type ClientOnlyProps = {
  loader: () => React.ReactNode;
};

export const ClientOnly: React.FC<ClientOnlyProps> = ({ loader }) => {
  return (
    <ErrorBoundaryWrapper>
      <LoaderWrapper loader={loader} />
    </ErrorBoundaryWrapper>
  );
};

/**
 * useHmrConnection()
 * ------------------
 * • `true`  → HMR socket is healthy
 * • `false` → socket lost (Vite is polling / may auto‑reload soon)
 *
 * Works only in dev; in prod it always returns `true`.
 */
export function useHmrConnection(): boolean {
  const [connected, setConnected] = useState(() => !!import.meta.hot);

  useEffect(() => {
    // No HMR object outside dev builds
    if (!import.meta.hot) return;

    /** Fired the moment the WS closes unexpectedly */
    const onDisconnect = () => setConnected(false);
    /** Fired every time the WS (re‑)opens */
    const onConnect = () => setConnected(true);

    import.meta.hot.on('vite:ws:disconnect', onDisconnect);
    import.meta.hot.on('vite:ws:connect', onConnect);

    // Optional: catch the “about to full‑reload” event as a last resort
    const onFullReload = () => setConnected(false);
    import.meta.hot.on('vite:beforeFullReload', onFullReload);

    return () => {
      import.meta.hot?.off('vite:ws:disconnect', onDisconnect);
      import.meta.hot?.off('vite:ws:connect', onConnect);
      import.meta.hot?.off('vite:beforeFullReload', onFullReload);
    };
  }, []);

  return connected;
}

const useCreateBridgeRuntime = () => {
  useEffect(() => {
    if (!CREATE_BRIDGE_ENABLED || typeof window === 'undefined') {
      return undefined;
    }

    let disposed = false;
    let activityTimer: number | undefined;
    let lastHeartbeat = 0;

    void import('@/__create/fetch').then(({ default: bridgeFetch }) => {
      if (!disposed) {
        window.fetch = bridgeFetch;
      }
    });

    void import('../__create/design-mode');

    const sendHeartbeat = () => {
      const now = Date.now();
      if (now - lastHeartbeat < 180_000) return;
      lastHeartbeat = now;
      fetch('/', { method: 'GET' }).catch(() => {});
    };

    const scheduleHeartbeat = () => {
      window.clearTimeout(activityTimer);
      activityTimer = window.setTimeout(sendHeartbeat, 60_000);
    };

    window.addEventListener('pointerdown', scheduleHeartbeat, { passive: true });
    window.addEventListener('keydown', scheduleHeartbeat);
    window.addEventListener('scroll', scheduleHeartbeat, { passive: true });

    return () => {
      disposed = true;
      window.clearTimeout(activityTimer);
      window.removeEventListener('pointerdown', scheduleHeartbeat);
      window.removeEventListener('keydown', scheduleHeartbeat);
      window.removeEventListener('scroll', scheduleHeartbeat);
    };
  }, []);
};

const healthyResponseType = 'sandbox:web:healthcheck:response';
const useHandshakeParent = () => {
  const isHmrConnected = useHmrConnection();
  useEffect(() => {
    const healthyResponse = {
      type: healthyResponseType,
      healthy: isHmrConnected,
      supportsErrorDetected: true,
    };
    const handleMessage = (event: MessageEvent) => {
      if (isCreateBridgeMessage(event) && event.data?.type === 'sandbox:web:healthcheck') {
        postCreateBridgeMessage(healthyResponse);
      }
    };
    window.addEventListener('message', handleMessage);
    // Immediately respond to the parent window with a healthy response in
    // case we missed the healthcheck message
    postCreateBridgeMessage(healthyResponse);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [isHmrConnected]);
};

const waitForScreenshotReady = async () => {
  const images = Array.from(document.images);

  await Promise.all([
    // make sure custom fonts are loaded
    'fonts' in document ? document.fonts.ready : Promise.resolve(),
    ...images.map(
      (img) =>
        new Promise((resolve) => {
          img.crossOrigin = 'anonymous';
          if (img.complete) {
            resolve(true);
            return;
          }
          img.onload = () => resolve(true);
          img.onerror = () => resolve(true);
        })
    ),
  ]);

  // small buffer to ensure rendering is stable
  await new Promise((resolve) => setTimeout(resolve, 250));
};

export const useHandleScreenshotRequest = () => {
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (isCreateBridgeMessage(event) && event.data?.type === 'sandbox:web:screenshot:request') {
        try {
          await waitForScreenshotReady();

          const width = window.innerWidth;
          const aspectRatio = 16 / 9;
          const height = Math.floor(width / aspectRatio);
          const { toPng } = await import('html-to-image');

          // html-to-image already handles CORS, fonts, and CSS inlining
          const dataUrl = await toPng(document.body, {
            cacheBust: true,
            skipFonts: false,
            width,
            height,
            style: {
              // force snapshot sizing
              width: `${width}px`,
              height: `${height}px`,
              margin: '0',
            },
          });

          postCreateBridgeMessage({ type: 'sandbox:web:screenshot:response', dataUrl });
        } catch (error) {
          postCreateBridgeMessage(
            {
              type: 'sandbox:web:screenshot:error',
              error: error instanceof Error ? error.message : String(error),
            }
          );
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);
};
export function Layout({ children }: { children: ReactNode }) {
  const { nonce } = useLoaderData<typeof loader>();
  useCreateBridgeRuntime();
  useHandshakeParent();
  useHandleScreenshotRequest();
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location?.pathname;
  const showFloatingWhatsapp = pathname === '/' || pathname?.startsWith('/dashboard');
  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (isCreateBridgeMessage(event) && event.data?.type === 'sandbox:navigation') {
        const nextPath = String(event.data.pathname || '');
        if (nextPath.startsWith('/') && !nextPath.startsWith('//')) {
          navigate(nextPath);
        }
      }
    };
    window.addEventListener('message', handleMessage);
    postCreateBridgeMessage({ type: 'sandbox:web:ready' });
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [navigate]);

  useEffect(() => {
    if (pathname) {
      postCreateBridgeMessage({
        type: 'sandbox:web:navigation',
        pathname,
      });
    }
  }, [pathname]);
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style nonce={nonce} dangerouslySetInnerHTML={{ __html: `html { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; scroll-behavior: smooth; } body { transition: background-color 0.2s ease, color 0.2s ease; }` }} />
        <Meta />
        <Links />
        {import.meta.env.DEV ? (
          <script nonce={nonce} type="module" src="/src/__create/dev-error-overlay.js"></script>
        ) : null}
        <link rel="icon" type="image/png" href={favicon} />
        {LoadFontsSSR ? <LoadFontsSSR /> : null}
      </head>
      <body>
        <ClientOnly loader={() => children} />
        {showFloatingWhatsapp ? <FloatingWhatsapp /> : null}
        <Toaster position={isMobile ? 'top-center' : 'bottom-right'} />
        <ScrollRestoration nonce={nonce} />
        <Scripts nonce={nonce} />
      </body>
    </html>
  );
}

export const ErrorBoundary = InternalErrorBoundary;

export default function App() {
  return <Outlet />;
}
