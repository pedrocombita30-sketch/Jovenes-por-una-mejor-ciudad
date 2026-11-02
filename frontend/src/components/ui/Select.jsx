export default function Select({ label, id, options = [], className = '', ...props }) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="label-field">
          {label}
        </label>
      )}
      <select id={id} className="input-field" {...props}>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}