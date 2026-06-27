import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { getToken } from "@/lib/auth";

export default function Index() {
  const [target, setTarget] = useState<"login" | "main" | null>(null);

  useEffect(() => {
    let active = true;
    getToken()
      .then((token) => {
        if (active) {
          setTarget(token ? "main" : "login");
        }
      })
      .catch(() => {
        if (active) {
          setTarget("login");
        }
      });
    return () => {
      active = false;
    };
  }, []);

  if (target === null) {
    return null;
  }

  return <Redirect href={`/receipt/${target}`} />;
}
