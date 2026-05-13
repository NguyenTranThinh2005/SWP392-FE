"use client";

import { useState, useEffect } from "react";

export function useAuth() {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // TODO: Fetch user data
    setIsLoading(false);
  }, []);

  return { user, isLoading };
}
