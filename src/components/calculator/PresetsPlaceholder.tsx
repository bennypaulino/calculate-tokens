export default function PresetsPlaceholder() {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-ct-muted font-medium">Presets:</span>
      <span className="inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full border" style={{ background: 'var(--accent-tint)', borderColor: 'var(--accent-line)', color: 'var(--accent)' }}>
        Coming soon
      </span>
    </div>
  );
}
