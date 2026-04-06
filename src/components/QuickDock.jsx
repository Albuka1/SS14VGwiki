import { Link, useLocation } from "react-router-dom";

function DockItem({ item }) {
  const location = useLocation();
  const isAnchor = item.href.startsWith("#");

  if (isAnchor) {
    return (
      <a className="dock-link" href={item.href} title={item.label}>
        <i className={item.iconClass} aria-hidden="true" />
        <span className="sr-only">{item.label}</span>
      </a>
    );
  }

  return (
    <Link className="dock-link" to={`${location.pathname}${item.href}`} title={item.label}>
      <i className={item.iconClass} aria-hidden="true" />
      <span className="sr-only">{item.label}</span>
    </Link>
  );
}

export function QuickDock({ items = [] }) {
  if (!items.length) {
    return null;
  }

  return (
    <nav className="quick-dock" aria-label="Быстрые переходы">
      {items.map((item) => (
        <DockItem item={item} key={`${item.label}-${item.href}`} />
      ))}
    </nav>
  );
}
