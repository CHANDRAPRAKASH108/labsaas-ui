"use client";

import { useEffect, useState } from "react";

function isFullscreenActive() {
  return Boolean(document.fullscreenElement);
}

export function FullscreenToggle() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    function sync() {
      setActive(isFullscreenActive());
    }
    sync();
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  async function toggle() {
    try {
      if (isFullscreenActive()) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      // Browser may deny fullscreen without a user gesture or policy.
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={active}
      title={active ? "Exit full screen (Esc)" : "Enter full screen"}
      className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-emerald-800/20 bg-white px-3 py-2 font-medium text-emerald-950 hover:bg-emerald-50"
    >
      {active ? (
        <>
          <ExitFullscreenIcon />
          <span className="hidden sm:inline">Exit full screen</span>
          <span className="sm:hidden">Exit</span>
        </>
      ) : (
        <>
          <EnterFullscreenIcon />
          <span className="hidden sm:inline">Full screen</span>
          <span className="sm:hidden">Full</span>
        </>
      )}
    </button>
  );
}

function EnterFullscreenIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M2 6V2h4M10 2h4v4M14 10v4h-4M6 14H2v-4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ExitFullscreenIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M6 2v4H2M10 2v4h4M10 14v-4h4M6 14v-4H2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
