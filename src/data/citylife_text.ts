/**
 * THE LIVING-CITY VOICE (S18 — the occupyCity pass). EarthBound-weird flavor
 * pools for the buildings the city generator fills: knock-knock refusals for the
 * locked ~10%, and resident / keeper / civic chatter for the enterable rest.
 *
 * Pure data (Record<string, DialogueScript>). dialogue.ts spreads CITYLIFE_DIALOGUE
 * into DIALOGUE so every id here resolves; citylife.ts reads the *_IDS arrays to
 * pick a line per building, deterministically (seeded). '@' prefixes spoken lines.
 */
import type { DialogueScript } from '../schemas';

export const CITYLIFE_DIALOGUE: Record<string, DialogueScript> = {
  /* ---- locked doors: you knock, the town declines, charmingly ---- */
  cl_knock_0: ['You knock politely.', 'A voice inside: "We\'re not home!" ...They are very clearly home.'],
  cl_knock_1: ['You knock. A long pause.', 'A note slides under the door. It reads: "TRY LATER." It is already later.'],
  cl_knock_2: ['The door is locked.', 'From within: the unmistakable sound of someone pretending to vacuum.'],
  cl_knock_3: ['You knock. "Who is it?"', 'You explain who you are. "...Never heard of you," they decide, and that is that.'],
  cl_knock_4: ['Locked. A small sign reads: BACK IN 5 MINUTES.', 'The ink faded years ago. So, you suspect, did the "5 minutes."'],
  cl_knock_5: ['You knock.', 'Something enormous shifts inside, sighs, and settles back to sleep. ...Best not.'],
  cl_knock_6: ['The doorknob refuses you.', 'You sense it has refused better people than you, and enjoyed every minute.'],
  cl_knock_7: ['You knock. "Password?"', 'You don\'t have one. "Correct!! ...no, wait, that\'s not it." The lock holds.'],
  cl_knock_8: ['Locked tight.', 'A cat watches you from the window with the calm expression of upper management.'],
  cl_knock_9: ['You knock. A kid\'s voice pipes up:', '"My dad says I\'m not allowed to open the door for HEROES." ...Hard to argue.'],
  cl_knock_10: ['No answer.', 'Just a welcome mat that says GO AWAY in cheerful, looping cursive.'],
  cl_knock_11: ['You knock. The peephole darkens,', 'considers you for a long moment, and brightens again. The door stays shut.'],
  cl_knock_12: ['Locked. Taped to the glass: "GONE FISHING."', 'There is no water for forty miles. You respect the commitment.'],

  /* ---- residents: apartments + homes you can wander into ---- */
  cl_resident_0: ['@I just moved in! Still finding the light switches by trial and electrocution.'],
  cl_resident_1: ['@The walls here are thin. I know my neighbor\'s ENTIRE opinion of jazz. I did not ask.'],
  cl_resident_2: ['@Make yourself at home! ...Not THIS home. A different one. Yours, ideally.'],
  cl_resident_3: ['@I water this plant every single day.', '@It is plastic. We have an understanding and I\'d thank you not to bring it up.'],
  cl_resident_4: ['@Rent went up again. Soon I\'ll just be renting the IDEA of an apartment.'],
  cl_resident_5: ['@Have you seen my cat? Gray, enormous, morally complicated.'],
  cl_resident_6: ['@I work from home. My commute is four steps and a small moral crisis.'],
  cl_resident_7: ['@At night the building hums. I\'ve decided it\'s the building being happy.'],
  cl_resident_8: ['@Oh! A visitor! Quick — pretend the pile of dishes is a sculpture.'],
  cl_resident_9: ['@I collect novelty mugs. It\'s my whole personality and I\'ve made peace with that.'],
  cl_resident_10: ['@The elevator\'s been "fixed" three times. I take the stairs and I trust no one.'],
  cl_resident_11: ['@Welcome! Sorry about the boxes. I\'ve lived here six years; I\'ll unpack any decade now.'],
  cl_resident_12: ['@Shh — the baby just went down. By baby I mean me. I\'m about to nap. Lovely place though.'],
  cl_resident_13: ['@Every appliance in here beeps at 3 AM. I think they\'re unionizing.'],

  /* ---- keepers: shops + services ---- */
  cl_keeper_0: ['@Welcome in! Everything\'s for sale except the cat, the stool, and my patience.'],
  cl_keeper_1: ['@You should\'ve been here yesterday. We had a SALE. It was beautiful. People wept.'],
  cl_keeper_2: ['@Browse all you like. The mannequin is named Gerald. He browses too.'],
  cl_keeper_3: ['@Fresh stock this morning! Of what, I couldn\'t tell you. The truck just leaves boxes.'],
  cl_keeper_4: ['@You break it, you buy it.', '@You buy it, it\'s yours. You stare at it too long, we negotiate.'],
  cl_keeper_5: ['@Half off everything ending in a vowel. Don\'t ask. The owner is an "artist."'],
  cl_keeper_6: ['@We take card, cash, or a really compelling story. All three have worked this week.'],
  cl_keeper_7: ['@Closing soon. Also opening soon. We never did figure out which.'],
  cl_keeper_8: ['@Loyalty card: buy ten, get a heartfelt nod. Far more meaningful than a free one.'],
  cl_keeper_9: ['@Careful by the back shelf. That\'s where we keep the items that hum.'],

  /* ---- civic / offices ---- */
  cl_civic_0: ['@Please take a number.', '@...The machine is out of numbers. Please take a feeling instead.'],
  cl_civic_1: ['@Form 27-B goes in tray C. Unless it\'s Tuesday, in which case: panic, then tray C.'],
  cl_civic_2: ['@We process everything in the order it was lost.'],
  cl_civic_3: ['@The official stamp is very official.', '@I can\'t let you hear it. *whispers* ...it goes THUNK.'],
  cl_civic_4: ['@Productivity is up! We measured it with a stick. Don\'t look at the stick.'],
  cl_civic_5: ['@Eleven years here, never once seen the boss.', '@...I\'m starting to suspect it\'s me.'],
  cl_civic_6: ['@Quiet, please. The fax machine is dreaming.'],

  /* ---- single-purpose flavor (realty / fuel attendants) ---- */
  cl_realtor_pitch: ['@Looking to BUY? You\'ve got the eyes of a future homeowner.', '@Or allergies. Either way — shall we talk square footage?'],
  cl_gas_greet: ['@Fill \'er up? The pump\'s feeling generous today. Don\'t tell the other pumps.'],
};

/** seeded-selection pools (ids, not text) — citylife.ts picks one per building */
export const KNOCK_IDS: readonly string[] = [
  'cl_knock_0', 'cl_knock_1', 'cl_knock_2', 'cl_knock_3', 'cl_knock_4', 'cl_knock_5',
  'cl_knock_6', 'cl_knock_7', 'cl_knock_8', 'cl_knock_9', 'cl_knock_10', 'cl_knock_11', 'cl_knock_12',
];
export const RESIDENT_IDS: readonly string[] = [
  'cl_resident_0', 'cl_resident_1', 'cl_resident_2', 'cl_resident_3', 'cl_resident_4', 'cl_resident_5',
  'cl_resident_6', 'cl_resident_7', 'cl_resident_8', 'cl_resident_9', 'cl_resident_10', 'cl_resident_11',
  'cl_resident_12', 'cl_resident_13',
];
export const KEEPER_IDS: readonly string[] = [
  'cl_keeper_0', 'cl_keeper_1', 'cl_keeper_2', 'cl_keeper_3', 'cl_keeper_4',
  'cl_keeper_5', 'cl_keeper_6', 'cl_keeper_7', 'cl_keeper_8', 'cl_keeper_9',
];
export const CIVIC_IDS: readonly string[] = [
  'cl_civic_0', 'cl_civic_1', 'cl_civic_2', 'cl_civic_3', 'cl_civic_4', 'cl_civic_5', 'cl_civic_6',
];
