import Link from "next/link";
import { t } from "../src/lib/i18n";

export default function NotFound() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-24 text-center">
      <p className="text-sm font-semibold text-ct-muted uppercase tracking-widest mb-4">
        404
      </p>
      <h1 className="text-3xl font-bold text-ct-strong mb-4">
        {t("notFound.heading")}
      </h1>
      <p className="text-ct-body mb-8 max-w-sm mx-auto">
        {t("notFound.body")}
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ct-accent hover:text-ct-accent transition-colors"
      >
        <span aria-hidden="true">&larr;</span>
        {t("notFound.home")}
      </Link>
    </div>
  );
}
