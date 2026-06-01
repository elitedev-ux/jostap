import { useCallback } from 'react';

function isDevIframe() {
  try {
    return typeof window !== 'undefined' && window.self !== window.top;
  } catch { return true; }
}

function devSocialShim(provider, callbackUrl) {
  const params = new URLSearchParams({ provider });
  if (callbackUrl) params.set('callbackUrl', callbackUrl);
  window.location.href = '/__create/social-dev-shim?' + params;
}

function useAuth() {
  const callbackUrl = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('callbackUrl')
    : null;

  const signInWithCredentials = useCallback((options) => {
    return fetch("/api/auth/signin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(options),
    }).then((response) => {
      if (!response.ok) throw response;
      window.location.href = callbackUrl ?? options.callbackUrl ?? "/dashboard";
    });
  }, [callbackUrl])

  const signUpWithCredentials = useCallback((options) => {
    return fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(options),
    }).then((response) => {
      if (!response.ok) throw response;
      window.location.href = callbackUrl ?? options.callbackUrl ?? "/dashboard";
    });
  }, [callbackUrl])

  const signInWithGoogle = useCallback((options) => {
    const cb = callbackUrl ?? options?.callbackUrl;
    if (isDevIframe()) return devSocialShim("google", cb);
    window.location.href = `/api/auth/google?callbackUrl=${encodeURIComponent(cb || "/dashboard")}`;
  }, [callbackUrl]);
  const signInWithFacebook = useCallback((options) => {
    const cb = options?.callbackUrl;
    return devSocialShim("facebook", cb);
  }, []);
  const signInWithTwitter = useCallback((options) => {
    const cb = options?.callbackUrl;
    return devSocialShim("twitter", cb);
  }, []);
  const signInWithApple = useCallback((options) => {
    const cb = callbackUrl ?? options?.callbackUrl;
    return devSocialShim("apple", cb);
  }, [callbackUrl]);

  const signOut = useCallback(() => {
    return fetch("/api/auth/logout", { method: "POST" }).finally(() => {
      window.location.href = "/auth/signin";
    });
  }, []);

  return {
    signInWithCredentials,
    signUpWithCredentials,
    signInWithGoogle,
    signInWithFacebook,
    signInWithTwitter,
    signInWithApple,
    signOut,
  }
}

export default useAuth;
