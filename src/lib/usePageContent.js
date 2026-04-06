import { useEffect, useState } from "react";
import { getPageByPath, loadPageContent } from "@/lib/pages";

export function usePageContent(pathname) {
  const page = getPageByPath(pathname);
  const [content, setContent] = useState(null);

  useEffect(() => {
    let isMounted = true;

    if (!page) {
      setContent(null);
      return () => {
        isMounted = false;
      };
    }

    setContent(null);

    loadPageContent(page).then((payload) => {
      if (isMounted) {
        setContent(payload);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [page?.path]);

  return {
    page,
    content,
    isLoading: Boolean(page) && content === null,
  };
}
