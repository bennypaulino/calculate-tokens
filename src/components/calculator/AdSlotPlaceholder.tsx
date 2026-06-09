interface Props {
  type?: 'leaderboard' | 'inline';
}

export default function AdSlotPlaceholder({ type = 'inline' }: Props) {
  const minHeight = type === 'leaderboard' ? 90 : 280;
  return (
    <div
      className={`ad-container-${type} bg-ct-sunken border border-dashed border-ct-border rounded flex items-center justify-center text-xs text-ct-faint`}
      style={{ minHeight }}
      aria-hidden="true"
    >
      Ad
    </div>
  );
}
