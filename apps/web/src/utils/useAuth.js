import { useCallback } from 'react';

function redirectToOAuth(provider, callbackUrl) {
  const params = new URLSearchParams();
  if (callbackUrl) params.set('callbackUrl', callbackUrl);
  const query = params.toString();
  window.location.href = `/api/auth/${provider}${query ? `?${query}` : ""}`;
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
    return redirectToOAuth("google", cb || "/dashboard");
  }, [callbackUrl]);
  const signInWithFacebook = useCallback((options) => {
    const cb = options?.callbackUrl;
    return redirectToOAuth("facebook", cb);
  }, []);
  const signInWithTwitter = useCallback((options) => {
    const cb = options?.callbackUrl;
    return redirectToOAuth("twitter", cb);
  }, []);
  const signInWithApple = useCallback((options) => {
    const cb = callbackUrl ?? options?.callbackUrl;
    return redirectToOAuth("apple", cb);
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
