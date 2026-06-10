/**
 * THE ROLLING HP ODOMETER — GAME_BIBLE §A4.1 / Prompt 13 (the soul).
 *
 * Pure model, no rendering: damage sets a TARGET and the displayed value
 * rolls toward it at a constant rate; healing and battle victory FREEZE the
 * meter at its displayed value and resolve from there; a hero only falls when
 * the DISPLAYED value reaches 0. All queued actions resolve against displayed
 * values.
 */

export const ROLL_DOWN_RATE = 20; // HP per second (~"2 digits/sec" on the tens drum)
export const ROLL_UP_RATE = 80; // healing winds up fast

export class Odometer {
  displayed: number;
  target: number;
  max: number;
  downRate: number;
  upRate: number;

  constructor(value: number, max: number, downRate = ROLL_DOWN_RATE, upRate = ROLL_UP_RATE) {
    this.displayed = value;
    this.target = value;
    this.max = max;
    this.downRate = downRate;
    this.upRate = upRate;
  }

  /** integer the player sees / the rules use */
  get value(): number {
    return Math.ceil(this.displayed);
  }

  get rolling(): boolean {
    return Math.ceil(this.displayed) !== this.target || this.displayed !== this.target;
  }

  /** target is 0 but the drum hasn't hit it yet — outrace it! */
  get mortal(): boolean {
    return this.target <= 0 && this.displayed > 0;
  }

  get dead(): boolean {
    return this.displayed <= 0;
  }

  /** lock the drum where it stands (victory, or the basis for a heal) */
  freeze(): void {
    this.displayed = this.value;
    this.target = this.value;
  }

  damage(amount: number): void {
    this.target = Math.max(0, this.target - amount);
  }

  /** §A4.1: heals resolve from the DISPLAYED value, killing the mortal roll */
  heal(amount: number): void {
    const basis = this.value;
    this.target = Math.min(this.max, basis + amount);
    this.displayed = Math.min(this.displayed, this.target);
  }

  setMax(max: number): void {
    this.max = max;
    this.target = Math.min(this.target, max);
    this.displayed = Math.min(this.displayed, max);
  }

  /** instant set (out-of-battle, load, revive) */
  set(value: number): void {
    this.displayed = value;
    this.target = value;
  }

  /**
   * Advance the drum. Returns how many whole HP ticked past (for SFX), or 0.
   */
  tick(dtSec: number): number {
    if (this.displayed === this.target) return 0;
    const before = this.value;
    if (this.displayed > this.target) {
      this.displayed = Math.max(this.target, this.displayed - this.downRate * dtSec);
    } else {
      this.displayed = Math.min(this.target, this.displayed + this.upRate * dtSec);
    }
    return Math.abs(this.value - before);
  }
}
