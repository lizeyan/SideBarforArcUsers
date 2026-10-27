import { Ellipsis, FolderClosed, FolderOpen } from 'lucide-react';
import { getIconUrl } from '../utils/iconify';
import { isEmoji } from '../utils/emoji';
import { GROUP_COLORS, getHexColorStyle } from '../utils/groupColors';
import { Space } from '../contexts/SpacesContext';
import clsx from 'clsx';
import { ArcFolderIconState } from '../utils/folderIconState';

// Renders the space icon overlay badge (emoji or Lucide icon on colored circle)
const SpaceIconOverlay = ({
  iconName,
  colorStyle,
  hexStyle,
}: {
  iconName: string;
  colorStyle: typeof GROUP_COLORS[string] | undefined;
  hexStyle: ReturnType<typeof getHexColorStyle> | undefined;
}) =>
{
  if (isEmoji(iconName))
  {
    return <span className="text-[10px] leading-none">{iconName}</span>;
  }
  // Lucide icon on colored badge
  if (colorStyle)
  {
    return (
      <span className={`flex items-center justify-center w-[14px] h-[14px] rounded-full ${colorStyle.badge}`}>
        <img
          src={getIconUrl(iconName)}
          alt=""
          className="w-[10px] h-[10px] invert dark:invert-0"
        />
      </span>
    );
  }
  // Hex color fallback
  return (
    <span
      className="flex items-center justify-center w-[14px] h-[14px] rounded-full"
      style={{ backgroundColor: hexStyle?.badge }}
    >
      <img
        src={getIconUrl(iconName)}
        alt=""
        className="w-[10px] h-[10px] invert dark:invert-0"
      />
    </span>
  );
};

/**
 * 渲染 Arc 文件夹三态图标。活跃透出态复用现有图标库的闭合文件夹和省略号，避免自绘 SVG。
 */
const FolderStateGlyph = ({
  state,
  size,
  className,
  style,
}: {
  state: ArcFolderIconState;
  size: number;
  className?: string;
  style?: React.CSSProperties;
}) =>
{
  if (state === 'active-peek')
  {
    return (
      <span
        className={clsx('relative inline-flex shrink-0', className)}
        style={{ width: size, height: size, ...style }}
      >
        <FolderClosed size={size} className="arc-folder-icon" />
        <Ellipsis
          size={Math.max(10, Math.round(size * 0.55))}
          strokeWidth={2.6}
          className="arc-folder-active-dots absolute"
        />
      </span>
    );
  }

  const FolderIcon = state === 'expanded' ? FolderOpen : FolderClosed;
  return (
    <FolderIcon
      size={size}
      className={clsx('arc-folder-icon', className)}
      style={style}
    />
  );
};

/**
 * 渲染书签文件夹图标；Space 根文件夹会保留原有颜色和角标。
 */
export const SpaceFolderIcon = ({
  space,
  size = 16,
  state = 'collapsed',
}: {
  space: Space | undefined;
  size?: number;
  state?: ArcFolderIconState;
}) =>
{
  if (!space)
  {
    return <FolderStateGlyph state={state} size={size} className="text-gray-500" />;
  }

  const colorStyle = GROUP_COLORS[space.color];
  const hexStyle = !colorStyle ? getHexColorStyle(space.color) : undefined;
  const colorClass = colorStyle?.text;

  return (
    <div className="relative">
      <FolderStateGlyph
        state={state}
        size={size}
        className={colorClass}
        style={hexStyle ? { color: hexStyle.text } : undefined}
      />
      <span className="absolute -bottom-[5px] -right-[5px] flex items-center justify-center">
        <SpaceIconOverlay
          iconName={space.icon}
          colorStyle={colorStyle}
          hexStyle={hexStyle}
        />
      </span>
    </div>
  );
};
