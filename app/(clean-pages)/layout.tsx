export default function CleanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen overflow-auto">
      {children}
    </div>
  );
} 