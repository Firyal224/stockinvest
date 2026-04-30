export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Force light-mode variables inside auth pages regardless of global dark theme.
          .dark .auth-light has specificity 0,0,2,0 which beats html.dark (0,0,1,1). */}
      <style>{`
        .auth-light,
        .dark .auth-light {
          --background: 0 0% 100%;
          --foreground: 222.2 84% 4.9%;
          --card: 0 0% 100%;
          --card-foreground: 222.2 84% 4.9%;
          --popover: 0 0% 100%;
          --popover-foreground: 222.2 84% 4.9%;
          --muted: 210 40% 96.1%;
          --muted-foreground: 215.4 16.3% 46.9%;
          --input: 214.3 31.8% 91.4%;
          --border: 214.3 31.8% 91.4%;
          --primary: 175 76% 31%;
          --primary-foreground: 0 0% 100%;
          --secondary: 210 40% 96.1%;
          --secondary-foreground: 222.2 47.4% 11.2%;
          --accent: 262 83% 58%;
          --accent-foreground: 0 0% 100%;
          --destructive: 0 84.2% 60.2%;
          --destructive-foreground: 210 40% 98%;
          --ring: 175 76% 31%;
          color-scheme: light;
        }
      `}</style>
      <div className="auth-light">
        {children}
      </div>
    </>
  );
}
