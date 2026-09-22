import * as SecureStore from "expo-secure-store";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import { adminApi, configureApi } from "./api";

const TOKEN_KEY = "admin_access_token";
type AuthValue = { loading: boolean; token: string | null; signIn: (account: string, password: string) => Promise<void>; signOut: () => Promise<void> };
const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const signOut = useCallback(async () => {
    configureApi(null);
    setToken(null);
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  }, []);

  useEffect(() => {
    void SecureStore.getItemAsync(TOKEN_KEY).then((saved) => {
      configureApi(saved, () => void signOut());
      setToken(saved);
    }).finally(() => setLoading(false));
  }, [signOut]);

  const signIn = useCallback(async (account: string, password: string) => {
    const result = await adminApi.login(account, password);
    await SecureStore.setItemAsync(TOKEN_KEY, result.accessToken);
    configureApi(result.accessToken, () => void signOut());
    setToken(result.accessToken);
  }, [signOut]);

  const value = useMemo(() => ({ loading, token, signIn, signOut }), [loading, token, signIn, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
