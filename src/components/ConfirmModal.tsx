interface Props {
  open: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({ open, message, onConfirm, onCancel }: Props) {
  if (!open) return null;

  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(42,37,32,0.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 340,
          background: '#FFFDF8',
          border: '1px solid #E6DDD0',
          borderRadius: 10,
          padding: 20,
          boxShadow: '0 20px 40px -12px rgba(61,46,31,0.35)',
          display: 'flex',
          flexDirection: 'column',
          gap: 16
        }}
      >
        <p style={{ margin: 0, fontFamily: "'Newsreader',Georgia,serif", fontSize: 15.5, lineHeight: 1.5, color: '#3D2E1F' }}>{message}</p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button
            onClick={onCancel}
            style={{ border: '1px solid #E6DDD0', background: '#FBF8F2', borderRadius: 6, padding: '8px 14px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', color: '#3D2E1F' }}
          >
            No
          </button>
          <button
            onClick={onConfirm}
            style={{ border: 'none', background: '#B8552E', color: '#FFFDF8', borderRadius: 6, padding: '8px 14px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}
          >
            Yes
          </button>
        </div>
      </div>
    </div>
  );
}
