export interface FieldChange {
  field: string;
  label: string;
  oldValue: string;
  newValue: string;
}

export interface FieldChangesListProps {
  changes: FieldChange[];
  className?: string;
}

export function FieldChangesList({
  changes,
  className,
}: FieldChangesListProps) {
  if (changes.length === 0) return null;

  return (
    <ul className={`mt-1.5 space-y-0.5 ${className ?? ""}`}>
      {changes.map((change) => (
        <li key={change.field} className="text-xs text-text-muted">
          <span className="font-medium">{change.label}:</span>{" "}
          <span className="text-text-light">{change.oldValue}</span>
          <span className="mx-1 text-text-light">→</span>
          <span>{change.newValue}</span>
        </li>
      ))}
    </ul>
  );
}
