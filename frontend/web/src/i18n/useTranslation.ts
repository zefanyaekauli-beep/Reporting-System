// frontend/web/src/i18n/useTranslation.ts

import { translations } from "./translations";

type TranslationPath = {
  [K in keyof typeof translations.id]: {
    [P in keyof typeof translations.id[K]]: string;
  };
};

type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
    ? `${Key}` | `${Key}.${NestedKeyOf<ObjectType[Key]>}`
    : `${Key}`;
}[keyof ObjectType & (string | number)];

type TranslationKeys = NestedKeyOf<typeof translations.id>;

export function useTranslation() {
  const t = (key: TranslationKeys, defaultValue?: string): string => {
    const keys = key.split(".");
    let value: any = translations.id;

    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = value[k];
      } else {
        return defaultValue || key;
      }
    }

    return typeof value === "string" ? value : defaultValue || key;
  };

  return { t };
}

