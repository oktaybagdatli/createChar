"use client";

import { useEffect, useMemo, useState } from "react";

type Ability = "str" | "dex" | "con" | "int" | "wis" | "cha";
type Character = {
  name: string; player: string; level: number; className: string; subclass: string;
  background: string; species: string; abilities: Record<Ability, number>;
  skills: string[]; training: string[]; equipment: string[]; spells: string[];
};

const steps = ["Identity", "Class", "Background", "Species", "Abilities", "Skills", "Equipment", "Spells", "Review"];
const classes = ["Barbarian", "Bard", "Cleric", "Druid", "Fighter", "Monk", "Paladin", "Ranger", "Rogue", "Sorcerer", "Warlock", "Wizard"];
const backgrounds = ["Acolyte", "Artisan", "Charlatan", "Criminal", "Entertainer", "Farmer", "Guard", "Guide", "Hermit", "Merchant", "Noble", "Sage", "Sailor", "Scribe", "Soldier", "Wayfarer"];
const species = ["Aasimar", "Dragonborn", "Dwarf", "Elf", "Gnome", "Goliath", "Halfling", "Human", "Orc", "Tiefling"];
const skillNames = ["Acrobatics", "Animal Handling", "Arcana", "Athletics", "Deception", "History", "Insight", "Intimidation", "Investigation", "Medicine", "Nature", "Perception", "Performance", "Persuasion", "Religion", "Sleight of Hand", "Stealth", "Survival"];
const gear = ["Explorer's Pack", "Dungeoneer's Pack", "Priest's Pack", "Scholar's Pack", "Light Armor", "Medium Armor", "Shield", "Simple Weapon", "Martial Weapon", "Thieves' Tools"];
const spellNames = ["Aid", "Burning Hands", "Charm Person", "Cure Wounds", "Detect Magic", "Feather Fall", "Guidance", "Healing Word", "Light", "Mage Hand", "Magic Missile", "Minor Illusion", "Sacred Flame", "Shield", "Speak with Animals", "Thaumaturgy"];
const abilityLabels: Record<Ability, string> = { str: "Strength", dex: "Dexterity", con: "Constitution", int: "Intelligence", wis: "Wisdom", cha: "Charisma" };
const initial: Character = { name: "", player: "", level: 1, className: "", subclass: "", background: "", species: "", abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 }, skills: [], training: [], equipment: [], spells: [] };

const modifier = (score: number) => Math.floor((score - 10) / 2);
const signed = (n: number) => `${n >= 0 ? "+" : ""}${n}`;

export default function Home() {
  const [step, setStep] = useState(0);
  const [character, setCharacter] = useState<Character>(initial);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("createchar-draft");
    if (raw) { try { setCharacter({ ...initial, ...JSON.parse(raw) }); } catch { /* ignore invalid drafts */ } }
  }, []);

  const proficiency = Math.ceil(character.level / 4) + 1;
  const totalScore = Object.values(character.abilities).reduce((sum, score) => sum + score, 0);
  const canContinue = step !== 0 || character.name.trim().length > 0;

  const save = () => {
    localStorage.setItem("createchar-draft", JSON.stringify(character));
    setSaved(true); window.setTimeout(() => setSaved(false), 1800);
  };

  const update = <K extends keyof Character>(key: K, value: Character[K]) => setCharacter(prev => ({ ...prev, [key]: value }));
  const toggle = (key: "skills" | "training" | "equipment" | "spells", value: string) => setCharacter(prev => ({ ...prev, [key]: prev[key].includes(value) ? prev[key].filter(item => item !== value) : [...prev[key], value] }));
  const next = () => { if (canContinue) { save(); setStep(s => Math.min(s + 1, steps.length - 1)); window.scrollTo({ top: 0, behavior: "smooth" }); } };

  const content = useMemo(() => {
    switch (step) {
      case 0: return <>
        <Intro eyebrow="Step 1" title="Who is your adventurer?" text="Start with the basics. Every choice can be changed before export." />
        <Field label="Character name" required><input value={character.name} onChange={e => update("name", e.target.value)} placeholder="e.g. Mira Voss" autoFocus /></Field>
        <div className="two-col"><Field label="Player name" hint="Optional"><input value={character.player} onChange={e => update("player", e.target.value)} placeholder="Your name" /></Field>
        <Field label="Starting level"><Stepper value={character.level} setValue={v => update("level", v)} /></Field></div>
      </>;
      case 1: return <><Intro eyebrow="Step 2" title="Choose a class" text="Your class defines your primary abilities and progression." /><ChoiceGrid items={classes} selected={[character.className]} onSelect={v => update("className", v)} /><Field label="Subclass" hint="You can leave this blank until the appropriate level"><input value={character.subclass} onChange={e => update("subclass", e.target.value)} placeholder="Optional subclass" /></Field></>;
      case 2: return <><Intro eyebrow="Step 3" title="Choose a background" text="Your background represents the life your adventurer lived before the campaign." /><ChoiceGrid items={backgrounds} selected={[character.background]} onSelect={v => update("background", v)} /></>;
      case 3: return <><Intro eyebrow="Step 4" title="Choose a species" text="Select your adventurer's lineage. Detailed traits will be added to the rules engine next." /><ChoiceGrid items={species} selected={[character.species]} onSelect={v => update("species", v)} /></>;
      case 4: return <><Intro eyebrow="Step 5" title="Set ability scores" text="Enter final scores for now. Point buy and standard array guidance will follow." /><div className="ability-grid">{(Object.keys(abilityLabels) as Ability[]).map(key => <div className="ability" key={key}><span>{abilityLabels[key]}</span><strong>{signed(modifier(character.abilities[key]))}</strong><input aria-label={`${abilityLabels[key]} score`} type="number" min="3" max="30" value={character.abilities[key]} onChange={e => update("abilities", { ...character.abilities, [key]: Math.max(3, Math.min(30, Number(e.target.value))) })} /></div>)}</div><div className="score-note"><span>Total score</span><strong>{totalScore}</strong></div></>;
      case 5: return <><Intro eyebrow="Step 6" title="Skills and training" text={`Choose proficiencies. Your current proficiency bonus is +${proficiency}.`} /><SectionTitle>Skill proficiencies</SectionTitle><ChoiceGrid items={skillNames} selected={character.skills} onSelect={v => toggle("skills", v)} multi /><SectionTitle>Other training</SectionTitle><ChoiceGrid items={["Light Armor", "Medium Armor", "Heavy Armor", "Shields", "Simple Weapons", "Martial Weapons", "Tools"]} selected={character.training} onSelect={v => toggle("training", v)} multi /></>;
      case 6: return <><Intro eyebrow="Step 7" title="Choose equipment" text="Select broad starting items. Specific weapons and inventory quantities come next." /><ChoiceGrid items={gear} selected={character.equipment} onSelect={v => toggle("equipment", v)} multi /></>;
      case 7: return <><Intro eyebrow="Step 8" title="Choose spells" text="Skip this step if your character does not cast spells." /><ChoiceGrid items={spellNames} selected={character.spells} onSelect={v => toggle("spells", v)} multi /></>;
      default: return <Review character={character} proficiency={proficiency} />;
    }
  }, [step, character, proficiency, totalScore]);

  return <main>
    <header className="topbar"><button className="brand" onClick={() => setStep(0)}><span className="crest">C</span><span>CreateChar</span></button><nav><span>Builder</span><span>2024 rules</span></nav><button className="save" onClick={save}>{saved ? "✓ Draft saved" : "▣ Save draft"}</button></header>
    <div className="shell">
      <div className="stepper" aria-label="Character creation progress">{steps.map((name, index) => <button key={name} className={`${index === step ? "active" : ""} ${index < step ? "done" : ""}`} onClick={() => setStep(index)}><span>{index < step ? "✓" : index + 1}</span><small>{name}</small></button>)}</div>
      <div className="workspace">
        <section className="panel form-panel">{content}<div className="mobile-actions"><Actions step={step} setStep={setStep} next={next} canContinue={canContinue} /></div></section>
        <aside className="panel summary"><p className="kicker">Character summary</p><div className="avatar">{character.name ? character.name.charAt(0).toUpperCase() : "C"}</div><h2>{character.name || "Unnamed Adventurer"}</h2><p>Level {character.level} {character.className || "Adventurer"}</p><dl><SummaryRow label="Class" value={[character.className, character.subclass].filter(Boolean).join(" · ") || "Not selected"} /><SummaryRow label="Background" value={character.background || "Not selected"} /><SummaryRow label="Species" value={character.species || "Not selected"} /><SummaryRow label="Proficiency" value={`+${proficiency}`} /></dl><Actions step={step} setStep={setStep} next={next} canContinue={canContinue} /><button className="quiet" onClick={save}>▣ Save draft</button></aside>
      </div>
    </div>
  </main>;
}

function Intro({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) { return <div className="intro"><span>{eyebrow}</span><h1>{title}</h1><p>{text}</p></div>; }
function SectionTitle({ children }: { children: React.ReactNode }) { return <h3 className="section-title">{children}</h3>; }
function Field({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: React.ReactNode }) { return <label className="field"><span>{label}{required && <b> *</b>} {hint && <em>{hint}</em>}</span>{children}</label>; }
function Stepper({ value, setValue }: { value: number; setValue: (n: number) => void }) { return <div className="number-stepper"><button onClick={() => setValue(Math.max(1, value - 1))}>−</button><output>{value}</output><button onClick={() => setValue(Math.min(20, value + 1))}>+</button></div>; }
function ChoiceGrid({ items, selected, onSelect, multi = false }: { items: string[]; selected: string[]; onSelect: (v: string) => void; multi?: boolean }) { return <div className="choices">{items.map(item => <button key={item} className={selected.includes(item) ? "selected" : ""} onClick={() => onSelect(item)}><span>{item.charAt(0)}</span>{item}<i>{selected.includes(item) ? "✓" : multi ? "+" : "›"}</i></button>)}</div>; }
function SummaryRow({ label, value }: { label: string; value: string }) { return <div><dt>{label}</dt><dd>{value}</dd></div>; }
function Actions({ step, setStep, next, canContinue }: { step: number; setStep: React.Dispatch<React.SetStateAction<number>>; next: () => void; canContinue: boolean }) { return <div className="actions">{step > 0 && <button className="back" onClick={() => setStep(s => s - 1)}>← Back</button>}{step < steps.length - 1 ? <button className="primary" disabled={!canContinue} onClick={next}>Continue to {steps[step + 1]} →</button> : <button className="primary" onClick={() => window.print()}>Print / save as PDF</button>}</div>; }
function Review({ character, proficiency }: { character: Character; proficiency: number }) { return <><Intro eyebrow="Final step" title="Review your character" text="Check the core choices below. This structured data will feed the official-format PDF exporter." /><div className="review-grid"><ReviewCard title="Identity" lines={[character.name || "Unnamed", `Level ${character.level}`, character.player && `Player: ${character.player}`]} /><ReviewCard title="Origins" lines={[character.species || "No species", character.background || "No background"]} /><ReviewCard title="Class" lines={[character.className || "No class", character.subclass, `Proficiency +${proficiency}`]} /><ReviewCard title="Proficiencies" lines={[`${character.skills.length} skills`, `${character.training.length} training choices`]} /><ReviewCard title="Equipment" lines={character.equipment.length ? character.equipment : ["None selected"]} /><ReviewCard title="Spells" lines={character.spells.length ? character.spells : ["None selected"]} /></div></>; }
function ReviewCard({ title, lines }: { title: string; lines: (string | false)[] }) { return <article className="review-card"><h3>{title}</h3>{lines.filter(Boolean).map(line => <p key={String(line)}>{line}</p>)}</article>; }
