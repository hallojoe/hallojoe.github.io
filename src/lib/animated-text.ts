export interface SequenceOptions {
  effect?: 'type' | 'spin-horizontal' | 'spin-vertical';
  /** Extra time to show the first word before the sequence starts. */
  startDelayMs?: number;
  holdMs?: number;
  typeMs?: number;
  deleteMs?: number;
  spinMs?: number;
}

export interface AnimatedTextConfig {
  pretext: readonly string[];
  posttext: readonly string[];
  separator?: string;
  left?: SequenceOptions;
  right?: SequenceOptions;
}
