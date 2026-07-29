"use client";

import { useEffect } from "react";
import { useComponentLog } from "@/hooks/use-component-log";

export function SetDocumentTitle({ title }: { title: string }) {
  useComponentLog("SetDocumentTitle");
  useEffect(() => {
    const previous = document.title;
    document.title = title;
    return () => {
      document.title = previous;
    };
  }, [title]);

  return null;
}
