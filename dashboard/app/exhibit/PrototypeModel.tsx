export function PrototypeFrontView({ phone = false, scanning = false }: { phone?: boolean; scanning?: boolean }) {
  return <svg className="kiosk-walkthrough-model" viewBox="0 0 760 540" role="img" aria-label={phone ? "Phone positioned on the ReGrade station bed beneath the TOF and infrared sensors" : "Front view of the ReGrade station with sensor arch, load cell, LCD, and controls"}>
    <defs>
      <linearGradient id="walk-frame" x2="0" y2="1"><stop stopColor="#b4c7b4"/><stop offset=".55" stopColor="#728b79"/><stop offset="1" stopColor="#435a4b"/></linearGradient>
      <linearGradient id="walk-front" x2="0" y2="1"><stop stopColor="#536b59"/><stop offset="1" stopColor="#293e30"/></linearGradient>
      <linearGradient id="walk-side" x2="0" y2="1"><stop stopColor="#354b3c"/><stop offset="1" stopColor="#182a20"/></linearGradient>
      <linearGradient id="walk-bed" x2="0" y2="1"><stop stopColor="#f0f0df"/><stop offset="1" stopColor="#a8b8a8"/></linearGradient>
      <linearGradient id="walk-screen" x2="0" y2="1"><stop stopColor="#c9f4a2"/><stop offset="1" stopColor="#719e64"/></linearGradient>
      <filter id="walk-shadow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="14"/></filter>
    </defs>
    <ellipse cx="380" cy="476" rx="240" ry="28" fill="#000" opacity=".32" filter="url(#walk-shadow)" />
    {/* Uprights and crossbar form the rectangular sensor arch shown in the reference. */}
    <path d="M205 112 247 88H535L493 112Z" fill="#c0cebd" opacity=".6" />
    <path d="M493 112 535 88V321L493 345Z" fill="url(#walk-side)" />
    <path d="M205 112 247 88V322L205 346Z" fill="url(#walk-frame)" />
    <path d="M205 112H493V158H205Z" fill="url(#walk-frame)" />
    <path d="M493 112 535 88V133L493 158Z" fill="url(#walk-side)" />
    <path d="M205 112 247 88H535L493 112Z" fill="#dce6d6" />
    <path d="M220 126H478V328H220Z" fill="#10251a" opacity=".64" />
    <path d="M232 137H466V323H232Z" fill="none" stroke="#b6c6b4" strokeOpacity=".35" strokeWidth="2" />
    {/* TOF + IR heads and their animated measurement beams. */}
    <path d="M285 165 302 155H365L348 165Z" fill="#adbdab"/><path d="M285 165H348V197H285Z" fill="#263b2d"/><path d="M348 165 365 155V187L348 197Z" fill="#17291f" />
    <circle cx="316" cy="181" r="8" fill="#b7ef88"/><circle cx="316" cy="181" r="3" fill="#f4ffd9"/>
    <path d="M376 165 393 155H456L439 165Z" fill="#e0e6d8"/><path d="M376 165H439V197H376Z" fill="#b3c1b0"/><path d="M439 165 456 155V187L439 197Z" fill="#718475" />
    <circle cx="407" cy="181" r="8" fill="#263b2d"/><circle cx="407" cy="181" r="3" fill="#e9d298"/>
    <text x="314" y="151" className="walk-label">TOF</text><text x="407" y="151" className="walk-label">IR</text>
    <path d="M316 199 337 287M407 199 385 287" className={scanning ? "walk-ray walk-ray--active" : "walk-ray"} />
    {/* Load-cell platform and a closed phone resting on it during the placement step. */}
    <path d="M188 320 492 320 535 284 232 284Z" fill="url(#walk-bed)" stroke="#e7eddf" strokeWidth="2" />
    <path d="M188 320 492 320V345L188 345Z" fill="#809282" />
    <path d="M492 320 535 284V309L492 345Z" fill="#4b6152" />
    <rect x="333" y="329" width="67" height="13" rx="2" fill="#d9c48a"/><text x="366" y="339" className="walk-load">LOAD CELL</text>
    {phone && <g className="walk-phone">
      <path d="M270 275 375 275 432 310 327 310 327 318 270 283Z" fill="#101b14" stroke="#d1ded0" strokeWidth="2" />
      <path d="M375 275 432 310 432 318 375 283Z" fill="#34483a" stroke="#91a492" strokeWidth="1" />
      <path d="M270 275 327 310 327 318 270 283Z" fill="#435848" stroke="#91a492" strokeWidth="1" />
      <path d="M278 278 373 278 422 308 327 308Z" fill="#263b2d" stroke="#788d79" strokeWidth="1.5" />
      <path d="M287 280 369 280 414 307 332 307Z" fill="#1b2e22" />
      <path d="M298 282 363 282 405 306" fill="none" stroke="#a9c3a4" strokeOpacity=".42" strokeWidth="1.5" />
      {scanning && <path d="M286 293 415 293" className="walk-scanline" />}
    </g>}
    {/* Front control housing, LCD and operator buttons align beneath the shelf. */}
    <path d="M188 345 492 345 535 321V454L492 480V372L188 372Z" fill="url(#walk-side)" />
    <path d="M188 372H492V480H188Z" fill="url(#walk-front)" />
    <path d="M203 380H478V394H203Z" fill="#9ead98" opacity=".42" />
    <rect x="266" y="407" width="147" height="43" rx="2" fill="#14271b" stroke="#a6b7a2" strokeWidth="4" />
    <rect x="275" y="415" width="129" height="27" rx="1" fill="url(#walk-screen)" />
    <text x="339" y="432" className="walk-screen-text">{scanning ? "SCANNING" : "REGRADE READY"}</text>
    <text x="339" y="463" className="walk-small-text">LCD / OPERATOR DISPLAY</text>
    <circle cx="445" cy="417" r="15" fill="#17251b" stroke="#98aa96" strokeWidth="3"/><text x="445" y="419" className="walk-button-text">START</text>
    <circle cx="445" cy="456" r="13" fill="#a54942" stroke="#d49183" strokeWidth="3"/><text x="445" y="458" className="walk-button-text">STOP</text>
    <text x="205" y="497" className="walk-caption">FRONT VIEW / ILLUSTRATIVE PROTOTYPE</text>
  </svg>;
}

export default function PrototypeModel() {
  return <svg className="kiosk-prototype-model" viewBox="0 0 1150 580" role="img" aria-labelledby="prototype-title prototype-description">
    <title id="prototype-title">ReGrade station, front, side, and back views</title>
    <desc id="prototype-description">A dark technical illustration of the proposed station showing its sensor arch, TOF and IR sensors, USB ports, load cell, LCD, operator buttons, and electronics bay.</desc>
    <defs>
      <linearGradient id="proto-panel" x2="0" y2="1"><stop stopColor="#173426"/><stop offset="1" stopColor="#0e2118"/></linearGradient>
      <linearGradient id="proto-frame" x2="0" y2="1"><stop stopColor="#91a697"/><stop offset=".45" stopColor="#657c6c"/><stop offset="1" stopColor="#384d40"/></linearGradient>
      <linearGradient id="proto-sensor" x2="0" y2="1"><stop stopColor="#b5c6b4"/><stop offset="1" stopColor="#738778"/></linearGradient>
      <linearGradient id="proto-screen" x2="0" y2="1"><stop stopColor="#c7ed9e"/><stop offset="1" stopColor="#719d63"/></linearGradient>
      <pattern id="proto-grid" width="28" height="28" patternUnits="userSpaceOnUse"><path d="M28 0H0V28" fill="none" stroke="#9eb59f" strokeOpacity=".075" strokeWidth="1"/></pattern>
    </defs>
    <rect x="8" y="8" width="1134" height="564" rx="3" fill="url(#proto-panel)" stroke="#6f8976" strokeOpacity=".6" />
    <rect x="8" y="8" width="1134" height="564" rx="3" fill="url(#proto-grid)" />
    <g className="proto-view proto-view--front" transform="translate(35 28)">
      <text x="160" y="30" className="proto-title">FRONT VIEW</text>
      <path d="M20 60H300V120H280V80H40V330H120V350H20Z" className="proto-frame"/><rect x="20" y="370" width="280" height="130" rx="4" className="proto-frame"/>
      <rect x="60" y="85" width="60" height="25" rx="3" className="proto-sensor"/><text x="90" y="98" className="proto-label">TOF</text>
      <rect x="140" y="85" width="60" height="25" rx="3" className="proto-sensor"/><text x="170" y="98" className="proto-label">IR</text>
      <path d="M90 112v100m80-100v100" className="proto-ray"/>
      <rect x="45" y="180" width="50" height="22" rx="3" className="proto-sensor"/><text x="70" y="191" className="proto-label">USB 2</text>
      <rect x="45" y="215" width="50" height="22" rx="3" className="proto-sensor"/><text x="70" y="226" className="proto-label">USB 1</text>
      <rect x="40" y="330" width="240" height="20" className="proto-deck"/><rect x="110" y="330" width="100" height="20" rx="2" className="proto-sensor"/><text x="160" y="341" className="proto-label">LOAD CELL</text>
      <rect x="90" y="390" width="160" height="45" rx="3" className="proto-screen"/><text x="170" y="417" className="proto-screen-label">LCD · READY</text>
      <circle cx="280" cy="405" r="15" className="proto-start"/><text x="280" y="408" className="proto-button-label">START</text>
      <circle cx="280" cy="450" r="15" className="proto-stop"/><text x="280" y="453" className="proto-button-label">STOP</text>
    </g>
    <g className="proto-view proto-view--side" transform="translate(415 28)">
      <text x="160" y="30" className="proto-title">SIDE VIEW</text>
      <rect x="20" y="60" width="280" height="440" rx="4" className="proto-frame"/><rect x="40" y="80" width="240" height="230" className="proto-interior"/>
      <rect x="70" y="95" width="60" height="25" rx="3" className="proto-sensor"/><text x="100" y="108" className="proto-label">TOF</text>
      <rect x="170" y="95" width="60" height="25" rx="3" className="proto-sensor"/><text x="200" y="108" className="proto-label">IR</text>
      <path d="M100 122v94m100-94v94" className="proto-ray"/>
      <rect x="90" y="180" width="50" height="22" rx="3" className="proto-sensor"/><text x="115" y="191" className="proto-label">USB 2</text>
      <rect x="170" y="180" width="50" height="22" rx="3" className="proto-sensor"/><text x="195" y="191" className="proto-label">USB 1</text>
      <rect x="40" y="330" width="240" height="35" className="proto-deck"/><rect x="90" y="337" width="120" height="20" rx="2" className="proto-sensor"/><text x="150" y="351" className="proto-label">LOAD CELL</text>
      <circle cx="230" cy="405" r="15" className="proto-start"/><text x="230" y="408" className="proto-button-label">START</text>
      <circle cx="230" cy="450" r="15" className="proto-stop"/><text x="230" y="453" className="proto-button-label">STOP</text>
    </g>
    <g className="proto-view proto-view--back" transform="translate(790 28)">
      <text x="160" y="30" className="proto-title">BACK VIEW</text>
      <path d="M300 60H20v60h20V80h240v250h-80v20h100Z" className="proto-frame"/><rect x="20" y="370" width="280" height="130" rx="4" className="proto-frame"/>
      <rect x="80" y="85" width="60" height="25" rx="3" className="proto-sensor"/><text x="110" y="98" className="proto-label">IR</text>
      <rect x="160" y="85" width="60" height="25" rx="3" className="proto-sensor"/><text x="190" y="98" className="proto-label">TOF</text>
      <rect x="225" y="180" width="50" height="22" rx="3" className="proto-sensor"/><text x="250" y="191" className="proto-label">USB 2</text>
      <rect x="225" y="215" width="50" height="22" rx="3" className="proto-sensor"/><text x="250" y="226" className="proto-label">USB 1</text>
      <rect x="20" y="330" width="240" height="20" className="proto-deck"/><rect x="20" y="330" width="100" height="20" rx="2" className="proto-sensor"/><text x="70" y="341" className="proto-label">LOAD CELL</text>
      <rect x="50" y="390" width="220" height="85" rx="3" className="proto-interior"/><path d="M68 410h180m-180 15h120m-120 15h155m-155 15h95" className="proto-circuit"/><text x="160" y="469" className="proto-board-label">PCB + MICROCONTROLLER</text>
    </g>
    <text x="34" y="548" className="proto-footer">RE-GRADE / ILLUSTRATIVE PROTOTYPE LAYOUT · NOT TO SCALE</text>
  </svg>;
}
