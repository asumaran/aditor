export type BlockType = 'text' | 'short_answer';

export interface TextBlockProperties {
  title: string;
}

export interface ShortAnswerBlockProperties {
  label: string;
}

export type BlockProperties = TextBlockProperties | ShortAnswerBlockProperties;

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

export type Block = TextBlock | ShortAnswerBlock;

export interface BlockComponentProps {
  children?: React.ReactNode;
  className?: string;
}
