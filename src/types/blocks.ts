export type BlockType =
  | 'text'
  | 'heading'
  | 'short_answer'
  | 'multiple_choice'
  | 'multiselect';

export interface Option {
  readonly id: number;
  readonly text: string;
}

export interface TextBlockProperties {
  title: string;
}

export interface HeadingBlockProperties {
  title: string;
}

export interface ShortAnswerBlockProperties {
  label: string;
  required: boolean;
}

export interface MultipleChoiceBlockProperties {
  label: string;
  options: readonly Option[];
  required: boolean;
}

export interface MultiselectBlockProperties {
  label: string;
  options: readonly Option[];
  required: boolean;
}

export type BlockProperties =
  | TextBlockProperties
  | ShortAnswerBlockProperties
  | MultipleChoiceBlockProperties
  | MultiselectBlockProperties;

export interface TextBlock {
  readonly id: number;
  readonly type: 'text';
  readonly properties: TextBlockProperties;
}

export interface HeadingBlock {
  readonly id: number;
  readonly type: 'heading';
  readonly properties: HeadingBlockProperties;
}

export interface ShortAnswerBlock {
  readonly id: number;
  readonly type: 'short_answer';
  readonly properties: ShortAnswerBlockProperties;
}

export interface MultipleChoiceBlock {
  readonly id: number;
  readonly type: 'multiple_choice';
  readonly properties: MultipleChoiceBlockProperties;
}

export interface MultiselectBlock {
  readonly id: number;
  readonly type: 'multiselect';
  readonly properties: MultiselectBlockProperties;
}

export type Block =
  | TextBlock
  | HeadingBlock
  | ShortAnswerBlock
  | MultipleChoiceBlock
  | MultiselectBlock;

export interface BlockComponentProps {
  children?: React.ReactNode;
  className?: string;
}
