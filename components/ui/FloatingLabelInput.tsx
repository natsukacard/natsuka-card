import { TextInput, type TextInputProps } from '@mantine/core';
import { forwardRef, useState } from 'react';
import classes from './FloatingLabelInput.module.css';

export const FloatingLabelInput = forwardRef<HTMLInputElement, TextInputProps>(
  ({ radius = 'md', ...props }, ref) => {
    const [focused, setFocused] = useState(false);

    const floating =
      !!props.value || !!props.defaultValue || focused || undefined;

    return (
      <TextInput
        {...props}
        ref={ref}
        classNames={classes}
        radius={radius}
        onFocus={(e) => {
          setFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          props.onBlur?.(e);
        }}
        data-floating={floating}
        labelProps={{ 'data-floating': floating }}
      />
    );
  }
);
FloatingLabelInput.displayName = 'FloatingLabelInput';
