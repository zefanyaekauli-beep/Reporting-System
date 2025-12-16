import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../../stores/authStore";
import { useTranslation } from "../../../i18n/useTranslation";
import { login } from "../../../api/authApi";

export function LoginPage() {
  const { t } = useTranslation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    e.stopPropagation();
    
    console.log("=== LOGIN FORM SUBMITTED ===");
    console.log("Username:", username);
    console.log("Password provided:", !!password);
    
    setError(null);
    
    if (!username.trim()) {
      setError("Username tidak boleh kosong");
      return;
    }
    
    try {
      console.log("Calling login API...");
      const res = await login({ username, password });
      console.log("✅ Login successful! Response:", res);
      console.log("Response fields:", {
        access_token: res?.access_token,
        division: res?.user?.division,
        role: res?.role,
      });
      
      if (!res || !res.access_token || !res?.user?.division) {
        console.error("❌ Invalid response structure:", res);
        setError("Invalid response from server");
        return;
      }
      
      // Use user info from response if available
      // Ensure division matches Division type
      const divisionMap: Record<string, "security" | "cleaning" | "parking" | "driver"> = {
        security: "security",
        cleaning: "cleaning",
        parking: "parking",
        driver: "driver",
      };
      const division = divisionMap[res.division?.toLowerCase()] || 
                       divisionMap[res.user?.division?.toLowerCase()] || 
                       "security";
      
      const userInfo = {
        id: res.user?.id || 1,
        username: res.user?.username || username,
        division: division,
        role: res.role || res.user?.role || "field",
      };
      
      setAuth({
        token: res.access_token,
        user: userInfo,
      });
      
      // Navigate based on role
      if (res.role === "supervisor" || res.role === "admin") {
        navigate("/supervisor/dashboard");
      } else {
        // Guard/user: navigate to division dashboard first
        let targetPath = "";
        if (res.division === "security") {
          targetPath = "/security/dashboard";
        } else if (res.division === "cleaning") {
          targetPath = "/cleaning/dashboard";
        } else if (res.division === "parking") {
          targetPath = "/parking/dashboard";
        } else if (res.division === "driver") {
          targetPath = "/driver/trips";
        } else {
          // Fallback to division dashboard
          targetPath = `/${res.division}/dashboard`;
        }
        navigate(targetPath);
      }
    } catch (err: any) {
      console.error("❌ Login failed:", err);
      console.error("Error details:", {
        message: err?.message,
        response: err?.response?.data,
        status: err?.response?.status,
        config: err?.config,
      });
      const errorMessage = err?.response?.data?.detail || err?.message || "Login failed";
      setError(errorMessage);
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Verolux</h1>
        <p style={styles.subtitle}>Sistem Manajemen</p>
      </div>
      <form 
        onSubmit={handleSubmit} 
        style={styles.form}
      >
        <div style={styles.inputGroup}>
          <label style={styles.label}>{t("auth.username")}</label>
          <input
            style={styles.input}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder={t("auth.enterUsername")}
            autoComplete="username"
            required
          />
        </div>
        <div style={styles.inputGroup}>
          <label style={styles.label}>{t("auth.password")}</label>
          <input
            style={styles.input}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("auth.enterPassword")}
            autoComplete="current-password"
          />
        </div>
        {error && <p style={styles.error}>{error}</p>}
        <button 
          type="submit" 
          style={styles.button}
        >
          {t("auth.login")}
        </button>
        <p style={styles.demoNote}>
          {t("auth.demoNote")}
        </p>
      </form>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    backgroundColor: "#f5f5f5",
  },
  header: {
    textAlign: "center" as const,
    marginBottom: "40px",
  },
  title: {
    fontSize: "32px",
    fontWeight: "bold" as const,
    color: "#1a237e",
    margin: 0,
    marginBottom: "8px",
  },
  subtitle: {
    fontSize: "14px",
    color: "#666666",
    margin: 0,
  },
  form: {
    width: "100%",
    maxWidth: "360px",
    backgroundColor: "#ffffff",
    padding: "24px",
    borderRadius: "8px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  },
  inputGroup: {
    marginBottom: "20px",
  },
  label: {
    display: "block",
    fontSize: "13px",
    fontWeight: "500" as const,
    color: "#333333",
    marginBottom: "8px",
  },
  input: {
    width: "100%",
    padding: "12px",
    fontSize: "14px",
    border: "1px solid #e0e0e0",
    borderRadius: "6px",
    boxSizing: "border-box" as const,
    outline: "none",
  },
  error: {
    color: "#d32f2f",
    fontSize: "13px",
    marginBottom: "16px",
    marginTop: "-8px",
  },
  button: {
    width: "100%",
    padding: "14px",
    fontSize: "16px",
    fontWeight: "600" as const,
    color: "#ffffff",
    backgroundColor: "#1a237e",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    marginBottom: "12px",
    transition: "background-color 0.2s",
  },
  demoNote: {
    fontSize: "12px",
    color: "#999999",
    textAlign: "center" as const,
    margin: 0,
  },
}
