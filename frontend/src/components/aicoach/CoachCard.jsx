import { useState, useCallback } from 'react';
import { coachTokens } from './coachTokens';

const { cardStyle, shadow, colors, animation } = coachTokens;

export default function CoachCard({
  children,
  style,
  hoverable = true,
  as: Tag = 'div',
  onClick,
  tabIndex,
  role,
  ariaLabel,
  ...props
}) {
  const [focused, setFocused] = useState(false);

  const handleKeyDown = useCallback((e) => {
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick(e);
    }
  }, [onClick]);

  const interactiveProps = onClick || tabIndex !== undefined ? {
    tabIndex: tabIndex ?? 0,
    role: role ?? 'button',
    'aria-label': ariaLabel,
    onKeyDown: handleKeyDown,
  } : {};

  return (
    <Tag
      {...props}
      {...interactiveProps}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        ...cardStyle,
        outline: focused ? `2px solid ${colors.borderFocus}` : 'none',
        outlineOffset: 2,
        transform: focused ? 'translateY(-1px)' : 'translateY(0)',
        boxShadow: focused ? shadow.hover : cardStyle.boxShadow,
        cursor: onClick || tabIndex !== undefined ? 'pointer' : undefined,
        transition: `border-color ${animation.fast} ease, transform ${animation.fast} ease, box-shadow ${animation.fast} ease`,
        ...style,
      }}
      onMouseEnter={hoverable ? (e) => {
        e.currentTarget.style.borderColor = colors.borderHover;
        e.currentTarget.style.transform = 'translateY(-1px)';
        e.currentTarget.style.boxShadow = shadow.hover;
      } : undefined}
      onMouseLeave={hoverable ? (e) => {
        e.currentTarget.style.borderColor = cardStyle.border;
        e.currentTarget.style.transform = focused ? 'translateY(-1px)' : 'translateY(0)';
        e.currentTarget.style.boxShadow = focused ? shadow.hover : cardStyle.boxShadow;
      } : undefined}
    >
      {children}
    </Tag>
  );
}
