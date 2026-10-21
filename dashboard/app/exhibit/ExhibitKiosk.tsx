"use client";

import Image from "next/image";
import Link from "next/link";
import {
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import PrototypeModel, { PrototypeFrontView } from "./PrototypeModel";

const SLIDE_DURATIONS = [
  13000, 14000, 14000, 18000, 13000, 13000, 14000, 28000, 15000, 15000, 26000,
  28000, 15000,
];
const TOTAL_SLIDES = SLIDE_DURATIONS.length;
const DEMO_VIDEO_URL = process.env.NEXT_PUBLIC_EXHIBIT_VIDEO_URL;

function splitIntoWords(node: ReactNode, cursor: { value: number }): ReactNode {
  if (typeof node === "string" || typeof node === "number") {
    return String(node)
      .split(/(\s+)/)
      .map((part) => {
        if (!part || /^\s+$/.test(part)) return part;
        const style = {
          "--word-delay": `${cursor.value++ * 140}ms`,
        } as CSSProperties;
        return (
          <span
            className="kiosk-word"
            style={style}
            key={`word-${cursor.value}`}
          >
            {part}
          </span>
        );
      });
  }
  if (Array.isArray(node))
    return node.map((child, index) => {
      const transformed = splitIntoWords(child, cursor);
      return isValidElement(transformed)
        ? cloneElement(transformed, {
            key: transformed.key ?? `animated-node-${index}`,
          })
        : transformed;
    });
  if (
    isValidElement<{ children?: ReactNode }>(node) &&
    node.props.children !== undefined
  ) {
    return cloneElement(
      node,
      undefined,
      splitIntoWords(node.props.children, cursor),
    );
  }
  return node;
}

function AnimatedText({
  children,
  kind = "heading",
}: {
  children: ReactNode;
  kind?: "heading" | "body";
}) {
  return (
    <span className={`kiosk-word-reveal kiosk-word-reveal--${kind}`}>
      {splitIntoWords(children, { value: 0 })}
    </span>
  );
}

function Arrow() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M4 10h11M10 5l5 5-5 5" />
    </svg>
  );
}

function ProjectMark() {
  return (
    <Link
      className="kiosk-brand"
      href="/exhibit"
      aria-label="ReGrade exhibit home"
    >
      <span className="kiosk-brand__mark">
        <Image src="/logo.png" alt="" width={35} height={35} priority />
      </span>
      <span>
        ReGrade<span className="kiosk-brand__sub">CIRCULAR TECH LAB</span>
      </span>
    </Link>
  );
}

function KioskHeader() {
  return (
    <header className="kiosk-header">
      <ProjectMark />
      <div className="kiosk-header__center">
        <i /> A NON-DESTRUCTIVE TRIAGE STUDY
      </div>
      <div className="kiosk-header__right">
        <span className="kiosk-loop-indicator">
          <i /> AUTO PLAY
        </span>
        <span className="kiosk-header__divider" />
        <span>EXHIBIT 01</span>
      </div>
    </header>
  );
}

function StorySlide() {
  return (
    <section
      className="kiosk-slide kiosk-slide--story"
      aria-label="The problem ReGrade explores"
    >
      <div className="kiosk-story-photo" />
      <div className="kiosk-story-shade" />
      <div className="kiosk-story-copy">
        <div className="kiosk-eyebrow">
          <span>01</span>
          <i /> A SMALL QUESTION WITH A BIG IMPACT
        </div>
        <p className="kiosk-story-whisper">It held the everyday.</p>
        <h1>
          <AnimatedText>
            Work. Photos.
            <br />
            Little <em>moments.</em>
          </AnimatedText>
        </h1>
        <p className="kiosk-story-body">
          <AnimatedText kind="body">
            When a device stops working, it can be hard to know what should
            happen next. Useful phones may be set aside. Damaged ones may be
            missed.
          </AnimatedText>
        </p>
        <div className="kiosk-story-signoff">
          <i /> WHAT IF WE TOOK A CLOSER LOOK?
        </div>
      </div>
      <div className="kiosk-image-caption">
        A DEVICE, AND THE POSSIBILITY OF WHAT COMES NEXT
      </div>
    </section>
  );
}

function WhySlide() {
  return (
    <section
      className="kiosk-slide kiosk-slide--why"
      aria-label="Why ReGrade exists"
    >
      <div className="kiosk-why-visual" aria-hidden="true">
        <div className="kiosk-why-orbit kiosk-why-orbit--outer" />
        <div className="kiosk-why-orbit kiosk-why-orbit--inner" />
        <div className="kiosk-why-phone">
          <i />
          <span>RE</span>
          <b />
        </div>
        <div className="kiosk-why-glow" />
        <span className="kiosk-why-note kiosk-why-note--one">
          KEEP IT CLOSED
        </span>
        <span className="kiosk-why-note kiosk-why-note--two">LOOK AGAIN</span>
      </div>
      <div className="kiosk-why-copy">
        <div className="kiosk-eyebrow kiosk-eyebrow--light">
          <span>02</span>
          <i /> THE IDEA
        </div>
        <h2>
          <AnimatedText>
            Before it becomes waste,
            <br />
            give it <em>a second look.</em>
          </AnimatedText>
        </h2>
        <p>
          <AnimatedText kind="body">
            ReGrade explores a gentler first step: measure the outside of a
            phone or USB charger, keep the device closed, and give an operator
            clearer information to review.
          </AnimatedText>
        </p>
        <div className="kiosk-three-words">
          <span>NOTICE</span>
          <i />
          <span>UNDERSTAND</span>
          <i />
          <span>CHOOSE WITH CARE</span>
        </div>
      </div>
    </section>
  );
}

function MeasureSlide() {
  return (
    <section
      className="kiosk-slide kiosk-slide--measure"
      aria-label="What the prototype measures"
    >
      <div className="kiosk-measure-copy">
        <div className="kiosk-eyebrow kiosk-eyebrow--light">
          <span>03</span>
          <i /> NON-DESTRUCTIVE BY DESIGN
        </div>
        <h2>
          <AnimatedText>
            Measure the
            <br />
            <em>outside.</em>
          </AnimatedText>
        </h2>
        <p>
          <AnimatedText kind="body">
            The device stays closed. The prototype is designed to collect four
            external readings for an operator to review.
          </AnimatedText>
        </p>
        <div className="kiosk-device-note">
          <b>NO TEARDOWN</b>
          <i /> NO BATTERY REMOVAL
        </div>
      </div>
      <div className="kiosk-measure-stage" aria-hidden="true">
        <div className="kiosk-stage-grid" />
        <div className="kiosk-stage-halo" />
        <div className="kiosk-stage-ring kiosk-stage-ring--one" />
        <div className="kiosk-stage-ring kiosk-stage-ring--two" />
        <div className="kiosk-phone">
          <div className="kiosk-phone__back">
            <span>RG</span>
            <i />
          </div>
        </div>
        <div className="kiosk-scan-line" />
        <div className="kiosk-measure-tag kiosk-measure-tag--mass">
          <span>01</span> MASS <b>g</b>
        </div>
        <div className="kiosk-measure-tag kiosk-measure-tag--surface">
          <span>02</span> SURFACE TEMPERATURE <b>°C</b>
        </div>
        <div className="kiosk-measure-tag kiosk-measure-tag--profile">
          <span>03</span> CASING DISTANCE <b>mm</b>
        </div>
        <div className="kiosk-measure-tag kiosk-measure-tag--current">
          <span>04</span> USB CURRENT <b>mA</b>
        </div>
        <div className="kiosk-stage-caption">
          <i /> EXTERNAL SIGNALS / DEVICE REMAINS CLOSED
        </div>
      </div>
    </section>
  );
}

function StationSlide() {
  return (
    <section
      className="kiosk-slide kiosk-slide--station"
      aria-label="Illustrative front, side, and back views of the prototype station"
    >
      <div className="kiosk-station-copy">
        <div className="kiosk-eyebrow kiosk-eyebrow--light">
          <span>04</span>
          <i /> MEET THE PROTOTYPE
        </div>
        <h2>
          <AnimatedText>
            The ReGrade <em>station.</em>
          </AnimatedText>
        </h2>
        <p>
          <AnimatedText kind="body">
            Explore the front, side, and back of the proposed station: sensor
            arch above, weighing surface in the middle, and operator controls
            below.
          </AnimatedText>
        </p>
        <small>
          ILLUSTRATIVE LAYOUT · COMPONENT POSITIONS SUBJECT TO VALIDATION
        </small>
      </div>
      <div className="kiosk-prototype-stage">
        <div className="kiosk-prototype-glow" />
        <PrototypeModel />
      </div>
    </section>
  );
}

function StationVisual({
  mode,
}: {
  mode: "ready" | "place" | "scan" | "report";
}) {
  return (
    <div
      className={`kiosk-demo-visual kiosk-demo-visual--${mode}`}
      aria-hidden="true"
    >
      <div className="kiosk-visual-grid" />
      {(mode === "ready" || mode === "place" || mode === "scan") && (
        <PrototypeFrontView
          phone={mode !== "ready"}
          scanning={mode === "scan"}
        />
      )}
      {mode === "report" && (
        <div className="kiosk-report-card">
          <div className="kiosk-report-head">
            <i /> STATION REPORT <span>RE / 001</span>
          </div>
          <strong>Calibration required</strong>
          <p>Readings need station review</p>
          <div className="kiosk-report-divider" />
          <div className="kiosk-report-rows">
            <span>
              Mass <b>Recorded when available</b>
            </span>
            <span>
              Distance <b>Recorded when available</b>
            </span>
            <span>
              Temperature <b>Recorded when available</b>
            </span>
            <span>
              USB current <b>Fixture needs review</b>
            </span>
          </div>
          <div className="kiosk-report-status">
            NO GRADE / NO AUTOMATIC SORT
          </div>
        </div>
      )}
      <span className="kiosk-visual-index">RE-GRADE / PROTOTYPE STUDY</span>
    </div>
  );
}

function StepSlide({
  step,
  title,
  body,
  note,
  mode,
}: {
  step: string;
  title: string;
  body: string;
  note: string;
  mode: "ready" | "place" | "scan" | "report";
}) {
  return (
    <section
      className="kiosk-slide kiosk-slide--step"
      aria-label={`Prototype walkthrough ${step}`}
    >
      <div className="kiosk-step-copy">
        <div className="kiosk-eyebrow kiosk-eyebrow--light">
          <span>PROTOTYPE WALKTHROUGH</span>
          <i /> STEP {step} / 04
        </div>
        <div className="kiosk-step-big-number">{step}</div>
        <h2>
          <AnimatedText>{title}</AnimatedText>
        </h2>
        <p>
          <AnimatedText kind="body">{body}</AnimatedText>
        </p>
        <div className="kiosk-step-note">
          <i /> {note}
        </div>
      </div>
      <StationVisual mode={mode} />
    </section>
  );
}

function VideoSlide({ onEnded }: { onEnded: () => void }) {
  const [videoFailed, setVideoFailed] = useState(false);

  return (
    <section
      className="kiosk-slide kiosk-slide--video"
      aria-label="Video demonstration"
    >
      <div className="kiosk-video-copy">
        <div className="kiosk-eyebrow kiosk-eyebrow--light">
          <span>08</span>
          <i /> INSIDE THE PROTOTYPE
        </div>
        <h2>
          <AnimatedText>
            See the idea
            <br />
            <em>in motion.</em>
          </AnimatedText>
        </h2>
        <p>
          <AnimatedText kind="body">
            A short film can show the station, its sensor layout, and a guided
            scan in action.
          </AnimatedText>
        </p>
        <div className="kiosk-video-loop">
          <i /> VIDEO INTERLUDE <span>PLAYS BETWEEN THE WALKTHROUGH STEPS</span>
        </div>
      </div>
      <div className="kiosk-video-frame">
        {DEMO_VIDEO_URL && !videoFailed ? (
          <video
            src={DEMO_VIDEO_URL}
            poster="/images/exhibit-phone.jpg"
            autoPlay
            muted
            playsInline
            controls
            onEnded={onEnded}
            onError={() => setVideoFailed(true)}
            aria-label="ReGrade prototype demonstration video"
          />
        ) : (
          <div className="kiosk-video-placeholder">
            <div className="kiosk-video-placeholder__image" />
            <div className="kiosk-video-placeholder__overlay" />
            <div className="kiosk-video-play">
              <svg viewBox="0 0 20 20" aria-hidden="true">
                <path d="m7 4 9 6-9 6V4Z" />
              </svg>
            </div>
            <div className="kiosk-video-placeholder__label">
              <span>RE-GRADE / PROJECT FILM</span>
              <b>VIDEO DEMO COMING SOON</b>
              <small>ADD A CLIP TO AUTOPLAY IN THIS SCENE</small>
            </div>
          </div>
        )}
        <span className="kiosk-video-frame__index">
          00:00 <i /> RE / FILM 01
        </span>
      </div>
    </section>
  );
}

function SystemSlide() {
  return (
    <section
      className="kiosk-slide kiosk-slide--system"
      aria-label="System flow"
    >
      <div className="kiosk-system-head">
        <div>
          <div className="kiosk-eyebrow kiosk-eyebrow--light">
            <span>10</span>
            <i /> FROM SENSORS TO A CLEARER PICTURE
          </div>
          <h2>
            <AnimatedText>
              One small station.
              <br />
              <em>A connected story.</em>
            </AnimatedText>
          </h2>
        </div>
        <p>
          <AnimatedText kind="body">
            An ESP32 report can travel over MQTT to the listener and Supabase,
            then appear on the station dashboard.
          </AnimatedText>
        </p>
      </div>
      <div
        className="kiosk-flow"
        aria-label="ESP32 station to MQTT, Supabase, and dashboard"
      >
        <div className="kiosk-flow-node kiosk-flow-node--sensor">
          <span className="kiosk-flow-index">01 / SENSE</span>
          <div className="kiosk-chip">
            <i />
            <i />
            <i />
            <i />
          </div>
          <b>ESP32 STATION</b>
          <small>EXTERNAL READINGS</small>
        </div>
        <div className="kiosk-flow-link">
          <span />
          <i />
        </div>
        <div className="kiosk-flow-node">
          <span className="kiosk-flow-index">02 / SEND</span>
          <div className="kiosk-mqtt">
            <span>MQ</span>
            <i />
          </div>
          <b>MQTT BROKER</b>
          <small>DIAGNOSTIC REPORT</small>
        </div>
        <div className="kiosk-flow-link">
          <span />
          <i />
        </div>
        <div className="kiosk-flow-node">
          <span className="kiosk-flow-index">03 / STORE</span>
          <div className="kiosk-db">
            <i />
            <i />
            <i />
          </div>
          <b>SUPABASE</b>
          <small>STATION TELEMETRY</small>
        </div>
        <div className="kiosk-flow-link">
          <span />
          <i />
        </div>
        <div className="kiosk-flow-node kiosk-flow-node--dashboard">
          <span className="kiosk-flow-index">04 / REVIEW</span>
          <div className="kiosk-screen">
            <i />
            <i />
            <i />
            <b />
          </div>
          <b>DASHBOARD</b>
          <small>OPERATOR VIEW</small>
        </div>
      </div>
      <div className="kiosk-system-footer">
        <span>
          <i /> CURRENTLY IMPLEMENTED PIPELINE
        </span>
        <span>REPORTS APPEAR WHEN A STATION AND DATABASE ARE CONFIGURED</span>
      </div>
    </section>
  );
}

const TEAM_MEMBERS = [
  {
    name: "Franchezca Natividad Z. Banayad",
    role: "Project Lead & Full-Stack / Systems Engineer",
    initials: "FZB",
    photo: "/images/team/Banayad.jpg",
  },
  {
    name: "Carl Andrew S. Dela Cruz",
    role: "Hardware Procurement & Assembly Lead",
    initials: "CAD",
    photo: "/images/team/DelaCruz.jpg",
  },
  {
    name: "Niña Ysabelle C. Frigillana",
    role: "Frontend Developer & Exhibit Design Lead",
    initials: "NYF",
    photo: "/images/team/Frigillana.png",
  },
  {
    name: "Elena Vale F. Lanuza",
    role: "UI/UX & Brand Identity Lead",
    initials: "EVL",
    photo: "/images/team/Lanuza.jpg",
  },
  {
    name: "Princess Mae V. Sanchez",
    role: "Hardware Fabrication & Frontend Developer",
    initials: "PMS",
    photo: "/images/team/Sanchez.jpg",
  },
];

function TeamSlide() {
  const [spotlight, setSpotlight] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(
      () => setSpotlight((member) => (member + 1) % TEAM_MEMBERS.length),
      5200,
    );
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section
      className="kiosk-slide kiosk-slide--team"
      aria-label="Meet the ReGrade project team"
    >
      <div className="kiosk-team-heading">
        <div className="kiosk-eyebrow kiosk-eyebrow--light">
          <span>11</span>
          <i /> THE PEOPLE BEHIND REGRADE
        </div>
        <h2>
          <AnimatedText>
            Meet the <em>team.</em>
          </AnimatedText>
        </h2>
        <p>
          <AnimatedText kind="body">
            Five roles, one shared goal: give devices a more thoughtful next
            step.
          </AnimatedText>
        </p>
      </div>
      <div className="kiosk-team-grid" aria-live="off">
        {TEAM_MEMBERS.map((member, index) => (
          <article
            key={member.name}
            className={`kiosk-team-card${spotlight === index ? " is-spotlight" : ""}`}
            aria-label={`${member.name}, ${member.role}${spotlight === index ? ", in the spotlight" : ""}`}
          >
            <div className="kiosk-team-portrait" aria-hidden="true">
              <span>{member.initials}</span>
              {"photo" in member && member.photo && (
                <Image src={member.photo} alt="" fill sizes="(max-width: 650px) 64px, 142px" className={`kiosk-team-photo${member.initials === "FZB" ? " kiosk-team-photo--banayad" : ""}`} />
              )}
              <i />
            </div>
            <span className="kiosk-team-index">0{index + 1} / 05</span>
            <h3>{member.name}</h3>
            <p>{member.role}</p>
            <span className="kiosk-team-beam" aria-hidden="true" />
          </article>
        ))}
      </div>
      <div className="kiosk-team-note">
        <i /> THE PEOPLE BEHIND REGRADE{" "}
        <span>THE SPOTLIGHT MOVES THROUGH EACH TEAM MEMBER</span>
      </div>
    </section>
  );
}

function ActivitySlide() {
  const [spotlight, setSpotlight] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(
      () => setSpotlight((option) => (option + 1) % 2),
      5200,
    );
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section
      className="kiosk-slide kiosk-slide--activity"
      aria-label="Choose an activity at the ReGrade exhibit"
    >
      <div className="kiosk-activity-heading">
        <div className="kiosk-eyebrow kiosk-eyebrow--light">
          <span>12</span>
          <i /> TAKE PART IN THE EXHIBIT
        </div>
        <h2>
          <AnimatedText>
            A phone deserves
            <br />a thoughtful <em>next step.</em>
          </AnimatedText>
        </h2>
        <p>
          <AnimatedText kind="body">
            Discover two ways to take part. Our team can help you get started at
            the exhibit.
          </AnimatedText>
        </p>
      </div>
      <div className="kiosk-activity-options">
        <article
          className={`kiosk-activity-option${spotlight === 0 ? " is-spotlight" : ""}`}
          aria-label="Donate e-waste activity"
        >
          <span
            className="kiosk-activity-icon kiosk-activity-icon--donate"
            aria-hidden="true"
          >
            <svg viewBox="0 0 48 48">
              <path d="M12 18h24l-2 22H14l-2-22Zm5 0a7 7 0 0 1 14 0M24 24v10m-5-5 5 5 5-5" />
            </svg>
          </span>
          <span className="kiosk-activity-kicker">
            GIVE A DEVICE A NEXT CHAPTER
          </span>
          <strong>Donate e-waste</strong>
          <span className="kiosk-activity-detail">
            Talk with our team about donating an unused phone and the available
            next steps.
          </span>
          <span className="kiosk-activity-select">
            VISIT THE EXHIBIT TEAM
            <Arrow />
          </span>
        </article>
        <article
          className={`kiosk-activity-option${spotlight === 1 ? " is-spotlight" : ""}`}
          aria-label="Phone consultation activity"
        >
          <span
            className="kiosk-activity-icon kiosk-activity-icon--consult"
            aria-hidden="true"
          >
            <svg viewBox="0 0 48 48">
              <path d="M8 11h32v23H22l-9 7v-7H8V11Zm8 11h16m-16 6h11" />
            </svg>
          </span>
          <span className="kiosk-activity-kicker">
            WONDERING WHAT TO DO NEXT?
          </span>
          <strong>Request a phone consultation</strong>
          <span className="kiosk-activity-detail">
            Share what is happening with your phone. We can show you the current
            non-destructive triage demo.
          </span>
          <span className="kiosk-activity-select">
            VISIT THE EXHIBIT TEAM
            <Arrow />
          </span>
        </article>
      </div>
      <div className="kiosk-activity-next">
        <i />
        BOTH ACTIVITIES ARE AVAILABLE AT THE EXHIBIT TABLE.
        <span>
          CONSULTATION IS AN EDUCATIONAL DEMO, NOT A REPAIR OR SAFETY DIAGNOSIS.
        </span>
      </div>
    </section>
  );
}

function LimitsSlide() {
  return (
    <section
      className="kiosk-slide kiosk-slide--limits"
      aria-label="Prototype status and safety limits"
    >
      <div className="kiosk-limits-copy">
        <div className="kiosk-eyebrow">
          <span>13</span>
          <i /> PROTOTYPE STATUS
        </div>
        <h2>
          <AnimatedText>
            Hope for another chapter.
            <br />
            <em>Honest about today.</em>
          </AnimatedText>
        </h2>
        <p>
          <AnimatedText kind="body">
            Every device deserves thoughtful handling. ReGrade is an early-stage
            prototype: readings can support a closer review, but they cannot
            diagnose battery cells or prove a device is safe.
          </AnimatedText>
        </p>
        <div className="kiosk-status-pill">
          <i /> IN DEVELOPMENT{" "}
        </div>
      </div>
      <div className="kiosk-limits-visual">
        <div className="kiosk-limits-photo" />
        <div className="kiosk-focus-ring">
          <i />
          <b />
        </div>
        <div className="kiosk-limits-overlay">
          <span>KEEP THE DEVICE CLOSED</span>
          <i />
          <b>
            INSPECT
            <br />
            WITH CARE
          </b>
        </div>
        <span className="kiosk-limits-mark">RE / 13</span>
      </div>
    </section>
  );
}

type SceneProps = { onEnded: () => void };
type ExhibitScene = (props: SceneProps) => ReactNode;

const SCENES: ExhibitScene[] = [
  () => <StorySlide />,
  () => <WhySlide />,
  () => <MeasureSlide />,
  () => <StationSlide />,
  () => (
    <StepSlide
      step="01"
      title="Wake the station."
      body="Power up the exhibit station using its reviewed setup. Wait for the LCD to show ‘ReGrade ready’ before continuing."
      note="START WITH THE STATION READY"
      mode="ready"
    />
  ),
  () => (
    <StepSlide
      step="02"
      title="Place one closed device."
      body="Set a non-powered demonstration phone on the marked station bed. Keep its case closed and align it beneath the sensor arch."
      note="DO NOT CONNECT THE PHONE TO USB"
      mode="place"
    />
  ),
  () => (
    <StepSlide
      step="03"
      title="Begin a scan."
      body="Press the station start button once. The LCD shows ‘Scanning’. Leave the phone still while the station attempts its external readings."
      note="KEEP THE DEVICE IN PLACE"
      mode="scan"
    />
  ),
  ({ onEnded }) => <VideoSlide onEnded={onEnded} />,
  () => (
    <StepSlide
      step="04"
      title="Review the report."
      body="Open the dashboard to review any report received from the station. This prototype currently ends at ‘calibration required’; it does not produce a trusted grade."
      note="NO AUTOMATIC SORTING OR SAFETY DECISION"
      mode="report"
    />
  ),
  () => <SystemSlide />,
  () => <TeamSlide />,
  () => <ActivitySlide />,
  () => <LimitsSlide />,
];

export default function ExhibitKiosk() {
  const [active, setActive] = useState(0);
  const [outgoing, setOutgoing] = useState<number | null>(null);
  const [playing, setPlaying] = useState(true);

  const showSlide = useCallback(
    (index: number) => {
      const next = (index + TOTAL_SLIDES) % TOTAL_SLIDES;
      if (next === active) return;
      setOutgoing(active);
      setActive(next);
    },
    [active],
  );

  useEffect(() => {
    if (outgoing === null) return;
    const timer = window.setTimeout(() => setOutgoing(null), 900);
    return () => window.clearTimeout(timer);
  }, [outgoing]);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(
      () => showSlide(active + 1),
      SLIDE_DURATIONS[active],
    );
    return () => window.clearTimeout(timer);
  }, [active, playing, showSlide]);

  const nextSlide = () => showSlide(active + 1);
  const Scene = SCENES[active];
  const OutgoingScene = outgoing === null ? null : SCENES[outgoing];

  return (
    <main className="kiosk" aria-label="ReGrade exhibit screen saver">
      <KioskHeader />
      <div className="kiosk-scene-wrap" aria-live="off">
        {OutgoingScene && (
          <div
            className="kiosk-scene kiosk-scene--outgoing"
            key={`out-${outgoing}`}
          >
            <OutgoingScene onEnded={nextSlide} />
          </div>
        )}
        <div className="kiosk-scene kiosk-scene--incoming" key={`in-${active}`}>
          <Scene onEnded={nextSlide} />
        </div>
      </div>
      <footer className="kiosk-footer">
        <div className="kiosk-footer__actions">
          <Link className="kiosk-cta kiosk-cta--primary" href="/overview">
            EXPLORE THE DASHBOARD <Arrow />
          </Link>
          <a
            className="kiosk-cta kiosk-cta--outline"
            href="https://github.com/chezca-v/regrade#live-demo"
            target="_blank"
            rel="noreferrer"
          >
            VIDEO DEMO <span>COMING SOON</span>
          </a>
          <a
            className="kiosk-cta kiosk-cta--docs"
            href="https://github.com/chezca-v/regrade/blob/main/docs/ARCHITECTURE.md"
            target="_blank"
            rel="noreferrer"
          >
            PROJECT DOCUMENTATION <Arrow />
          </a>
        </div>
        <div className="kiosk-controls" aria-label="Exhibit controls">
          <button
            className="kiosk-control kiosk-control--play"
            onClick={() => setPlaying((value) => !value)}
            aria-label={
              playing ? "Pause slide rotation" : "Resume slide rotation"
            }
            title={playing ? "Pause" : "Play"}
          >
            {playing ? (
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <path d="M5 4v8M11 4v8" />
              </svg>
            ) : (
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <path d="m5 3 8 5-8 5V3Z" />
              </svg>
            )}
          </button>
          <div className="kiosk-slide-count">
            <b>{String(active + 1).padStart(2, "0")}</b>
            <span>/</span>
            {String(TOTAL_SLIDES).padStart(2, "0")}
          </div>
          <div
            className="kiosk-dots"
            role="group"
            aria-label="Choose exhibit scene"
          >
            {SCENES.map((_, index) => (
              <button
                key={index}
                aria-label={`Show scene ${index + 1}`}
                aria-current={index === active ? "step" : undefined}
                onClick={() => showSlide(index)}
              >
                <i />
              </button>
            ))}
          </div>
          <button
            className="kiosk-control"
            onClick={nextSlide}
            aria-label="Next scene"
          >
            <Arrow />
          </button>
        </div>
      </footer>
      <div className="kiosk-progress" key={`progress-${active}-${playing}`}>
        <span
          className={playing ? "is-running" : ""}
          style={{ animationDuration: `${SLIDE_DURATIONS[active]}ms` }}
        />
      </div>
    </main>
  );
}
