import Sidebar from "@/components/Sidebar";

export default function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main
        style={{
          flex: 1,
          marginLeft: "240px",
          minHeight: "100vh",
          background: "radial-gradient(ellipse at 70% 10%, rgba(124, 58, 237, 0.06) 0%, transparent 50%), var(--bg-primary)",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "32px 28px" }}>
          {children}
        </div>
      </main>
    </div>
  );
}
