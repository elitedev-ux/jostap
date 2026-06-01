import * as React from 'react';

const useUser = () => {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  const refetchUser = React.useCallback(() => {
    setLoading(true);
    fetch("/api/auth/me")
      .then((response) => (response.ok ? response.json() : { user: null }))
      .then((data) => setUser(data.user || null))
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(refetchUser, [refetchUser]);

  return { user, data: user, loading, refetch: refetchUser };
};

export { useUser }

export default useUser;
