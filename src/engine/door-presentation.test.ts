import { describe, expect, it } from 'vitest';
import { interiorDoorStyle, interiorDoorTexture } from './door-presentation';

describe('interior venue door presentation', () => {
  it.each([
    ['otter_hotel_hall', 'otter_hotel_room_201', 'hotel'],
    ['hotel_ps_hall', 'hotel_ps_guest_room', 'hotel'],
    ['hardware_int', 'hardware_stockroom', 'hardware'],
    ['otter_clinic_int', 'otter_clinic_exam', 'hospital'],
    ['clinic_ps_int', 'clinic_ps_ward', 'hospital'],
  ] as const)('selects %s -> %s as %s', (mapId, to, style) => {
    expect(interiorDoorStyle(mapId, to)).toBe(style);
  });

  it('keeps bedroom and unclassified residential doors on the home kit', () => {
    expect(interiorDoorTexture('rex_hall', 'rex_bedroom')).toBe('door_int');
    expect(interiorDoorTexture('rex_hall', 'rex_bedroom', true)).toBe('door_int_open');
  });

  it('provides matching closed and open art for every public venue', () => {
    expect(interiorDoorTexture('otter_hotel_hall', 'otter_hotel_room_202')).toBe('door_hotel');
    expect(interiorDoorTexture('otter_hotel_hall', 'otter_hotel_room_202', true)).toBe('door_hotel_open');
    expect(interiorDoorTexture('hardware_int', 'hardware_stockroom')).toBe('door_hardware');
    expect(interiorDoorTexture('otter_clinic_int', 'otter_clinic_exam', true)).toBe('door_hospital_open');
  });
});
