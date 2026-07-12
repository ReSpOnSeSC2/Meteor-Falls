import { describe, expect, it } from 'vitest';
import { MAPS } from './maps';
import {
  MINIMUS_SCALE_DEVICE_DIALOGUE,
  MINIMUS_SCALE_DEVICE_PROP,
  formalCityFacadeRatio,
  formalCityFacadeRequiredRatio,
  formalCityFacadeRuntimeHeight,
  formalCityFacadeSource,
} from './formal_city_scale';
import {
  FORMAL_CITY_FACADE_SOURCE_WIDTHS,
  FORMAL_CITY_HERO_HEIGHT,
  FORMAL_CITY_SCALE_IDS,
  cityScaleVariantMeta,
} from '../spritegen/buildings';
import { characterNativeScale } from '../engine/actor-collision';
import { cityBuildingHeight, drawCityBuilding } from '../spritegen/tiles';

const facades = (cityId: string) => MAPS[cityId].props.filter((prop) => prop.sprite.startsWith('bldg_'));

describe('formal-city runtime facade scale', () => {
  it.each(FORMAL_CITY_SCALE_IDS)('%s promotes every exterior facade to a real tall variant', (cityId) => {
    const cityFacades = facades(cityId);
    expect(cityFacades.length).toBeGreaterThan(0);
    for (const prop of cityFacades) {
      const meta = cityScaleVariantMeta(prop.sprite);
      expect(meta, `${cityId}:${prop.sprite} has city-scale metadata`).toBeDefined();
      expect(meta!.cityId).toBe(cityId);
      expect(formalCityFacadeSource(prop.sprite)).toBe(meta!.source);
      expect(meta!.opts.wallTiles).toBe(FORMAL_CITY_FACADE_SOURCE_WIDTHS[cityId][meta!.source]);
    }
  });

  it.each(FORMAL_CITY_SCALE_IDS)('%s meets 6.7× ordinary / 9× landmark height at actual map-native scale', (cityId) => {
    for (const prop of facades(cityId)) {
      const ratio = formalCityFacadeRatio(cityId, prop)!;
      const required = formalCityFacadeRequiredRatio(prop)!;
      const height = formalCityFacadeRuntimeHeight(cityId, prop)!;
      const meta = cityScaleVariantMeta(prop.sprite)!;
      const generatedTexture = drawCityBuilding(meta.opts);
      const instanceY = typeof prop.scale === 'number' ? prop.scale : prop.scale?.y ?? 1;
      // Measure the actual Pixmap shipped to generateAllTextures, then apply the
      // same native-map/instance factors as buildProps. This catches a future
      // generator canvas change that metadata-only arithmetic would miss.
      expect(height).toBe(generatedTexture.h * characterNativeScale(cityId) * instanceY);
      expect(height / FORMAL_CITY_HERO_HEIGHT).toBeCloseTo(ratio, 8);
      expect(ratio, `${cityId}:${formalCityFacadeSource(prop.sprite)} ${ratio.toFixed(3)}× < ${required}×`).toBeGreaterThanOrEqual(required);
    }
  });

  it.each(FORMAL_CITY_SCALE_IDS)('%s uses authored storeys, never anisotropic y stretching', (cityId) => {
    for (const prop of facades(cityId)) {
      const scale = prop.scale;
      if (scale && typeof scale !== 'number') expect(scale.y).toBe(scale.x);
      const meta = cityScaleVariantMeta(prop.sprite)!;
      expect(cityBuildingHeight(meta.opts.upperRows)).toBeGreaterThan(200);
    }
  });

  it.each(FORMAL_CITY_SCALE_IDS)('%s keeps every facade door target live after foot re-layout', (cityId) => {
    for (const prop of facades(cityId)) {
      const meta = cityScaleVariantMeta(prop.sprite)!;
      if (!prop.door) continue;
      expect(MAPS[prop.door.to], `${cityId}:${prop.sprite} -> ${prop.door.to}`).toBeDefined();
      expect(prop.door.oy).toBe(cityBuildingHeight(meta.opts.upperRows) - 14);
    }
  });
});

describe('Minimus Royal Long-View device', () => {
  it('keeps Gulliver citizens miniature while explicitly explaining tall architecture', () => {
    const map = MAPS.minimus_major;
    expect(characterNativeScale('minimus_major')).toBe(0.5);
    expect(map.props.some((prop) => prop.sprite === MINIMUS_SCALE_DEVICE_PROP)).toBe(true);
    expect(map.signs.some((sign) => sign.dialogue === MINIMUS_SCALE_DEVICE_DIALOGUE)).toBe(true);
    for (const prop of facades('minimus_major')) {
      expect(formalCityFacadeRatio('minimus_major', prop)).toBeGreaterThanOrEqual(formalCityFacadeRequiredRatio(prop)!);
    }
  });
});
