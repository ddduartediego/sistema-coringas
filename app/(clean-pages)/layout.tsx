export default function CleanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-full overflow-auto">
      {children}
    </div>
  );
} 