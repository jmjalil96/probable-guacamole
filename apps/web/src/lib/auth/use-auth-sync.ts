import { useEffect } from "react";
import { useMe } from "./hooks";
import { router } from "@/router";

export function useAuthSync() {
  const auth = useMe();

  useEffect(() => {
    if (auth.isLoading || auth.error) return;
    void router.invalidate();
  }, [auth.data, auth.error, auth.isLoading]);

  return auth;
}
