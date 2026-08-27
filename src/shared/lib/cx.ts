export type ClassValue = string | number | null | false | undefined;
export type ClassArray = ClassValue[];
export type ClassDictionary = Record<string, unknown>;
export type ClassName = ClassValue | ClassArray | ClassDictionary;

export function cx(...inputs: ClassValue[]): string {
  return inputs.filter(Boolean).join(" ");
}
