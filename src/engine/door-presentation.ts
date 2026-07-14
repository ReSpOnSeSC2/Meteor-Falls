/** Interior passage art should describe the building the player is exploring,
 * not pretend every back room is a bedroom.  Keep this inference centralized so
 * authored maps from every chapter automatically receive the correct door kit. */
export type InteriorDoorStyle = 'home' | 'hotel' | 'hardware' | 'hospital';

export function interiorDoorStyle(mapId: string, destinationId: string): InteriorDoorStyle {
  const context = `${mapId} ${destinationId}`.toLowerCase();
  if (/clinic|hospital|infirmary|ward|exam/.test(context)) return 'hospital';
  if (/hardware|stockroom/.test(context)) return 'hardware';
  if (/hotel|inn|guest_room/.test(context)) return 'hotel';
  return 'home';
}

export function interiorDoorTexture(
  mapId: string,
  destinationId: string,
  open = false,
): string {
  const style = interiorDoorStyle(mapId, destinationId);
  if (style === 'home') return open ? 'door_int_open' : 'door_int';
  return `door_${style}${open ? '_open' : ''}`;
}
