export interface EditableField {
  readonly id: string;
  readonly type: 'text' | 'contenteditable';
  readonly placeholder?: string;
  readonly required?: boolean;
}

export interface BlockEditableConfig {
  readonly primary: EditableField;
  readonly secondary?: EditableField[];
}

export type BlockEditableConfigs = {
  readonly text: BlockEditableConfig;
  readonly heading: BlockEditableConfig;
  readonly short_answer: BlockEditableConfig;
  readonly multiple_choice: BlockEditableConfig;
  readonly multiselect: BlockEditableConfig;
};

export const BLOCK_EDITABLE_CONFIGS: BlockEditableConfigs = {
  text: {
    primary: {
      id: 'title',
      type: 'contenteditable',
      placeholder: "Write, enter '/' for commands…",
    },
  },
  heading: {
    primary: { id: 'title', type: 'contenteditable', placeholder: 'Heading' },
  },
  short_answer: {
    primary: {
      id: 'label',
      type: 'contenteditable',
      placeholder: 'Question label',
    },
  },
  multiple_choice: {
    primary: {
      id: 'label',
      type: 'contenteditable',
      placeholder: 'Question label',
    },
  },
  multiselect: {
    primary: {
      id: 'label',
      type: 'contenteditable',
      placeholder: 'Question label',
    },
  },
} as const;

export interface FieldChangeHandler {
  (fieldId: string, value: string): void;
}
