'use client';

import { useState } from "react";
import Link from "next/link";
import { t } from "../src/lib/i18n";

export default function NavMobile() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="sm:hidden flex items-center justify-center w-9 h-9 text-ct-muted hover:text-ct-strong transition-colors"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          {open ? (
            <>
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </>
          ) : (
            <>
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="18" x2="20" y2="18" />
            </>
          )}
        </svg>
      </button>

      {open && (
        <div
          className="sm:hidden absolute top-14 left-0 right-0 bg-ct-card border-b border-ct-border z-50"
        >
          <nav aria-label="Mobile navigation">
            <Link
              href="/learn/what-is-a-token"
              className="block px-6 py-3 text-sm text-ct-body hover:text-ct-strong hover:bg-ct-canvas transition-colors"
              onClick={() => setOpen(false)}
            >
              {t("nav.whatIsToken")}
            </Link>
            <Link
              href="/privacy"
              className="block px-6 py-3 text-sm text-ct-body hover:text-ct-strong hover:bg-ct-canvas transition-colors"
              onClick={() => setOpen(false)}
            >
              {t("nav.privacy")}
            </Link>
          </nav>
        </div>
      )}
    </>
  );
}
