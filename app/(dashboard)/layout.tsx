export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      {/* Sidebar or navbar can go here */}
      <div>{children}</div>
    </div>
  );
}
