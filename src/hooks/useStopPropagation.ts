import { useCallback } from 'react';

export const useStopPropagation = <
  T extends React.SyntheticEvent = React.MouseEvent,
>(
  handler?: (e: T) => void,
) => {
  return useCallback(
    (e: T) => {
      e.stopPropagation();
      handler?.(e);
    },
    [handler],
  );
};
