interface Props {
  type?: 'leaderboard' | 'inline';
}

export default function AdSlotPlaceholder({ type = 'inline' }: Props) {
  const minHeight = type === 'leaderboard' ? 90 : 280;
  return (
    <div
      className={`ad-container-${type} bg-gray-50 border border-dashed border-gray-200 rounded flex items-center justify-center text-xs text-gray-400`}
      style={{ minHeight }}
      aria-hidden="true"
    >
      Ad
    </div>
  );
}
