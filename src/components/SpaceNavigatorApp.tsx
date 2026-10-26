import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { Space } from '../utils/spaceMessages';
import { SpaceList, useSpaceListKeyboard, useSpaceListHighlight } from './SpaceList';
import { spaceWindowStateProxy } from '../managers/proxies/spaceWindowStateProxy';
import { spaceManagerProxy } from '../managers/proxies/spaceManagerProxy';
import { resolveActiveSpaceId } from '../utils/spaceSelection';

export const SpaceNavigatorApp = () =>
{
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [activeSpaceId, setActiveSpaceId] = useState<string>('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // windowId is passed by background.ts as a URL query param
  const windowId = useMemo(() =>
  {
    const params = new URLSearchParams(window.location.search);
    return parseInt(params.get('windowId') || '0', 10);
  }, []);

  // Load spaces and current active space from background on mount
  useEffect(() =>
  {
    Promise.all([
      spaceManagerProxy.getSpaces(),
      spaceWindowStateProxy.getState(windowId),
    ]).then(([loadedSpaces, state]) =>
    {
      const resolvedSpaceId = resolveActiveSpaceId(loadedSpaces, state.activeSpaceId);
      setSpaces(loadedSpaces);
      setActiveSpaceId(resolvedSpaceId ?? '');

      // 快捷导航打开时顺便迁移旧的 all 状态，后续入口只处理真实 Space。
      if (resolvedSpaceId && resolvedSpaceId !== state.activeSpaceId)
      {
        void spaceWindowStateProxy.setActiveSpace(windowId, resolvedSpaceId);
      }
    }).catch((error) =>
    {
      console.error('Failed to load spaces/window state:', error);
    });
  }, [windowId]);

  // Highlight the active space once spaces are loaded
  useSpaceListHighlight({
    spaces,
    activeSpaceId,
    setHighlightedIndex,
    itemRefs,
    enabled: spaces.length > 0,
  });

  const handleSelect = useCallback((spaceId: string) =>
  {
    spaceWindowStateProxy.setActiveSpace(windowId, spaceId).then(() => window.close());
  }, [windowId]);

  // displaySpaces is the search-filtered subset of spaces
  const { filteredSpaces: displaySpaces, searchQuery, onSearchChange, searchInputRef } = useSpaceListKeyboard({
    spaces,
    highlightedIndex,
    setHighlightedIndex,
    onSelect: handleSelect,
    itemRefs,
    onEscape: window.close,
  });

  return (
    <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 h-screen flex flex-col overflow-hidden select-none">
      {/* Header */}
      <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Navigate to Space</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        <SpaceList
          spaces={displaySpaces}
          highlightedIndex={highlightedIndex}
          activeSpaceId={activeSpaceId}
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          searchInputRef={searchInputRef}
          onSelect={handleSelect}
          onHighlight={setHighlightedIndex}
          itemRefs={itemRefs}
        />
      </div>
    </div>
  );
};
