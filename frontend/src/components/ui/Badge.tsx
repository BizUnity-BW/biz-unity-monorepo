interface Props {
  label: string;
  color?: 'green' | 'yellow' | 'red' | 'blue' | 'gray';
}

export default function Badge({ label, color = 'gray' }: Props) {
  return <span className={`badge badge-${color}`}>{label}</span>;
}
