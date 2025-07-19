export type BlockType = 'text';

export interface BlockProperties {
  title: string;
}

export interface Block {
  readonly id: number;
  readonly type: BlockType;
  readonly properties: BlockProperties;
}

export interface BlockComponentProps {
  children?: React.ReactNode;
}
