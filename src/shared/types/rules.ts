/** The active Firestore Security Rules for a project. */
export interface SecurityRules {
  /** Concatenated rules source (`firestore.rules`). */
  source: string;
  /** The ruleset resource name backing the active release, if known. */
  rulesetName?: string;
}
