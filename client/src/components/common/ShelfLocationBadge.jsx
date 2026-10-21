import React from 'react';
import { MapPin } from 'lucide-react';

export function ShelfLocationBadge({ location, size = 'sm', showIcon = true }) {
  if (!location) return null;

  let displayLocation = '';
  if (typeof location === 'string') {
    displayLocation = location.replace(/\|/g, ' > ').replace(/,/g, ' > ');
  } else if (location.rack) {
    displayLocation = `${location.building ? `${location.building} > ` : ''}${location.floor ? `${location.floor} > ` : ''}${location.rack}${location.shelf ? ` > ${location.shelf}` : ''}`;
  }

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-mono ${size === 'xs' ? 'text-[11px]' : 'text-xs font-semibold'}`}>
      {showIcon && <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
      <span className="truncate">{displayLocation || 'Block A > Floor 2 > Rack A12 > Shelf 4'}</span>
    </div>
  );
}
