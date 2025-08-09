import { useState, useEffect } from "react";

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return {
    user,
    loading,
    error,
    isAuthenticated,
    signOut: () => console.log("Sign out"),
  };
};
