import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen pb-24">
      <Header />
      <main className="flex-grow">{children}</main>
      <BottomNav />
    </div>
  );
}
