"use client";

import { useEffect } from "react";

export function SetDocumentTitle({ title }: { title: string }) {
  useEffect(() => {
    const previous = document.title;
    document.title = title;
    return () => {
      document.title = previous;
    };
  }, [title]);

  return null;
}
