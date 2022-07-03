export type FormActionData<Fields> = {
  formError?: string;
  fieldErrors?: { [Key in keyof Fields]?: string };
  fields: Fields;
};
