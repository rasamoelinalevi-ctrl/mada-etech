import { ShopShell, Breadcrumb } from "./shop-shell";
export function InfoPage({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <ShopShell>
      <div className="container page-content">
        <Breadcrumb label={title} />
        <div className="page-heading">
          <h1>{title}</h1>
        </div>
        <div className="prose">{children}</div>
      </div>
    </ShopShell>
  );
}
