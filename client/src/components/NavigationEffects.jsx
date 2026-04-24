import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function NavigationEffects() {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const targetId = location.hash.slice(1);
      const targetElement = document.getElementById(targetId);

      if (targetElement) {
        window.requestAnimationFrame(() => {
          targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        });

        return;
      }
    }

    window.scrollTo({
      top: 0,
      behavior: 'auto'
    });
  }, [location.hash, location.pathname]);

  return null;
}

