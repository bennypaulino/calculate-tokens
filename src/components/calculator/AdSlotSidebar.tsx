export default function AdSlotSidebar() {
  const provider = process.env.NEXT_PUBLIC_AD_PROVIDER;
  if (!provider) return null;

  return (
    <div
      className="ad-container-sidebar bg-ct-sunken border border-dashed border-ct-border rounded flex items-center justify-center text-xs text-ct-faint"
      style={{ minHeight: 600 }}
      aria-hidden="true"
    >
      Ad
    </div>
  );
}
