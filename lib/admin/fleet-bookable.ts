/** Vehicle is available for new customer reservations (matches Fleet Studio "Bookable"). */
export function isVehicleBookable(row: { available?: boolean | null }): boolean {
  return row.available !== false
}

export function countBookableVehicles<T extends { available?: boolean | null }>(rows: T[]): number {
  return rows.filter(isVehicleBookable).length
}
