import type { SelectOption } from "@/types/transactions";

/** HeroUI Select may emit a string id or a `{ value, label }` object. */
export type SelectValue = SelectOption | string | undefined;

export function resolveSelectOption(
  selected: SelectValue,
  options: SelectOption[],
): SelectOption | undefined {
  if (!selected) {
    return undefined;
  }
  if (typeof selected === "string") {
    return options.find((option) => option.value === selected);
  }
  return options.find((option) => option.value === selected.value) ?? selected;
}

export function getSelectOptionId(
  selected: SelectValue,
  options: SelectOption[],
): string {
  return resolveSelectOption(selected, options)?.value ?? "";
}
