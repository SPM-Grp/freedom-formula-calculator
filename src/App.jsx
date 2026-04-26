import { useAuth } from "./hooks/useAuth";
import { useEnrollment } from "./hooks/useEnrollment";
import { PersistenceProvider } from "./hooks/usePersistence";
import { AppShell } from "./components/AppShell";
import { gradients, colors, alpha, fonts } from "./lib/theme";

export default function App() {
  const auth = useAuth();
  const enrollment = useEnrollment(auth.userRow);

  if (auth.loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: gradients.appBackground,
          display: "grid",
          placeItems: "center",
          fontFamily: fonts.sans,
          color: alpha.whiteA60,
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontFamily: fonts.serif,
              fontSize: 22,
              color: colors.goldLight,
              marginBottom: 8,
            }}
          >
            CLEAR Command Center
          </div>
          <div style={{ fontSize: 13 }}>Loading your numbers…</div>
        </div>
      </div>
    );
  }

  return (
    <PersistenceProvider user={auth.user}>
      <AppShell auth={auth} enrollment={enrollment} />
    </PersistenceProvider>
  );
}
