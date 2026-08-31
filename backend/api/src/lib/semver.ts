// Minimal semantic version comparison (major.minor.patch). Uses numeric
// comparison on the numeric parts, falling back to string comparison otherwise.
export function compareVersions(a: string, b: string): number {
  const parse = (v: string): number[] => {
    const parts = v.trim().replace(/^v/i, '').split('.');
    return [
      parseInt(parts[0] || '0', 10) || 0,
      parseInt(parts[1] || '0', 10) || 0,
      parseInt(parts[2] || '0', 10) || 0,
    ];
  };
  const A = parse(a);
  const B = parse(b);
  for (let i = 0; i < 3; i++) {
    if (A[i] !== B[i]) return A[i] - B[i];
  }
  return 0;
}

export function isVersionValid(v: string): boolean {
  return /^\d+(\.\d+){0,2}$/.test(v.trim().replace(/^v/i, ''));
}
