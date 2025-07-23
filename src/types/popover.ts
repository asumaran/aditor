export type PopoverView = 'menu' | 'options';

export interface PopoverState {
  view: PopoverView;
  isOpen: boolean;
}
