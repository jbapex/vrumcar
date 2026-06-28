/**
 * Inbox ocupa 100% da área útil do AppShell (sem padding) e trava
 * o scroll na página — só listagem e chat rolam internamente.
 */
export default function InboxLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="-m-4 flex h-full min-h-0 flex-col overflow-hidden md:-m-5">
      {children}
    </div>
  );
}
