export default function Alert({ type = 'info', children, onClose }) {
  const styles = {
    success: 'bg-blue-50 text-blue-800 border-blue-200',
    error: 'bg-red-50 text-red-800 border-red-200',
    info: 'bg-blue-50 text-blue-800 border-blue-200',
    warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
  };
  return (
    <div className={`relative rounded-lg border p-4 text-sm ${styles[type] || styles.info}`}>
      {children}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute right-3 top-3 text-current opacity-60 hover:opacity-100"
        >
          ✕
        </button>
      )}
    </div>
  );
}