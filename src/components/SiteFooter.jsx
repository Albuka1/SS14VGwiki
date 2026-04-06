import { useLocation } from "react-router-dom";
import { getPageByPath } from "@/lib/pages";

export function SiteFooter() {
  const location = useLocation();
  const page = getPageByPath(location.pathname);

  return (
    <footer className="border-t border-white/10 bg-black/20">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-4 py-6 text-sm text-steel sm:px-6 lg:px-8">
        <p>VanGuard Wiki на React, с централизованным контентом и навигацией.</p>
        {page?.footerNote ? <p>{page.footerNote}</p> : null}
      </div>
    </footer>
  );
}
