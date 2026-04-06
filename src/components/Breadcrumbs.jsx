import { Link } from "react-router-dom";

export function Breadcrumbs({ items = [] }) {
  if (!items.length) {
    return null;
  }

  return (
    <nav aria-label="Хлебные крошки" className="flex flex-wrap items-center gap-2 text-sm text-steel">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <span key={`${item.label}-${index}`} className="flex items-center gap-2">
            {item.to && !isLast ? (
              <Link className="transition hover:text-gold" to={item.to}>
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? "text-ink" : ""}>{item.label}</span>
            )}
            {!isLast ? <span className="text-line">/</span> : null}
          </span>
        );
      })}
    </nav>
  );
}
