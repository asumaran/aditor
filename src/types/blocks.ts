export type BlockType = 'text' | 'short_answer' | 'multiple_choice';

export interface Option {
  readonly id: number;
  readonly text: string;
}

export interface TextBlockProperties {
  title: string;
}

export interface ShortAnswerBlockProperties {
  label: string;
}

export interface MultipleChoiceBlockProperties {
  label: string;
  options: readonly Option[];
}

export type BlockProperties =
  | TextBlockProperties
  | ShortAnswerBlockProperties
  | MultipleChoiceBlockProperties;

export interface TextBlock {
  readonly id: number;
  readonly type: 'text';
  readonly properties: TextBlockProperties;
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

export type Block = TextBlock | ShortAnswerBlock | MultipleChoiceBlock;

export interface BlockComponentProps {
  children?: React.ReactNode;
  className?: string;
}
