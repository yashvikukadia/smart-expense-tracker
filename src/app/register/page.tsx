"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { TrendingUp, User, Mail, Lock, Eye, EyeOff, Loader2, Check } from "lucide-react";
import { signIn } from "next-auth/react";

const schema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    setServerError("");

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: data.name,
        email: data.email,
        password: data.password,
      }),
    });

    const json = await res.json();

    if (!res.ok) {
      setServerError(json.error || "Registration failed. Please try again.");
      setIsLoading(false);
      return;
    }

    setSuccess(true);
    // Auto sign-in after registration
    await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="auth-container">
      <div className="auth-card fade-in">
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "56px",
              height: "56px",
              background: success
                ? "linear-gradient(135deg, #10b981, #059669)"
                : "linear-gradient(135deg, #7c3aed, #4f46e5)",
              borderRadius: "16px",
              marginBottom: "16px",
              boxShadow: success
                ? "0 8px 24px rgba(16, 185, 129, 0.4)"
                : "0 8px 24px rgba(124, 58, 237, 0.4)",
              transition: "all 0.3s ease",
            }}
          >
            {success ? (
              <Check size={28} color="white" />
            ) : (
              <TrendingUp size={28} color="white" />
            )}
          </div>
          <h1 style={{ fontSize: "24px", fontWeight: "700", marginBottom: "6px" }}>
            {success ? "Account created!" : "Create your account"}
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
            {success
              ? "Redirecting to your dashboard..."
              : "Start tracking your expenses intelligently"}
          </p>
        </div>

        {!success && (
          <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Name */}
            <div>
              <label className="form-label">Full name</label>
              <div style={{ position: "relative" }}>
                <User size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input {...register("name")} id="name" placeholder="John Doe" className="form-input" style={{ paddingLeft: "38px" }} />
              </div>
              {errors.name && <p className="form-error">{errors.name.message}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="form-label">Email address</label>
              <div style={{ position: "relative" }}>
                <Mail size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input {...register("email")} id="email" type="email" placeholder="you@example.com" className="form-input" style={{ paddingLeft: "38px" }} />
              </div>
              {errors.email && <p className="form-error">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="form-label">Password</label>
              <div style={{ position: "relative" }}>
                <Lock size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input {...register("password")} id="password" type={showPassword ? "text" : "password"} placeholder="Min. 6 characters" className="form-input" style={{ paddingLeft: "38px", paddingRight: "38px" }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex" }}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="form-error">{errors.password.message}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="form-label">Confirm password</label>
              <div style={{ position: "relative" }}>
                <Lock size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input {...register("confirmPassword")} id="confirm-password" type={showPassword ? "text" : "password"} placeholder="Repeat password" className="form-input" style={{ paddingLeft: "38px" }} />
              </div>
              {errors.confirmPassword && <p className="form-error">{errors.confirmPassword.message}</p>}
            </div>

            {serverError && (
              <div style={{ padding: "10px 14px", background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "8px", color: "#f87171", fontSize: "13px" }}>
                {serverError}
              </div>
            )}

            <button type="submit" id="register-btn" className="btn-primary" disabled={isLoading} style={{ width: "100%", padding: "12px", fontSize: "15px", marginTop: "4px" }}>
              {isLoading ? (
                <>
                  <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                  Creating account...
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </form>
        )}

        <p style={{ textAlign: "center", marginTop: "24px", fontSize: "14px", color: "var(--text-secondary)" }}>
          Already have an account?{" "}
          <Link href="/login" style={{ color: "#a78bfa", fontWeight: "600", textDecoration: "none" }}>
            Sign in
          </Link>
        </p>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
