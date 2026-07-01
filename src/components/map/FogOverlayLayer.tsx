import React from 'react';
import Mapbox from '@rnmapbox/maps';
import type { Feature, Polygon, MultiPolygon } from 'geojson';
import { FOG_FILL_LAYER_ID, FOG_THEMES } from '@/utils/constants';
import { useSettingsStore } from '@/store/settingsStore';

interface FogOverlayLayerProps {
  fogPolygon: Feature<Polygon | MultiPolygon>;
}

export function FogOverlayLayer({ fogPolygon }: FogOverlayLayerProps) {
  const themeId = useSettingsStore((s) => s.themeId);
  const currentTheme = FOG_THEMES[themeId] || FOG_THEMES.classic;

  return (
    <Mapbox.ShapeSource id="fog-overlay-source" shape={fogPolygon}>
      <Mapbox.FillLayer
        id={FOG_FILL_LAYER_ID}
        style={{
          fillColor: currentTheme.fogColor,
          fillAntialias: true,
        }}
      />
    </Mapbox.ShapeSource>
  );
}
