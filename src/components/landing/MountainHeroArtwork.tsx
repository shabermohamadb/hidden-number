// src/components/landing/MountainHeroArtwork.tsx
import React from 'react';

export const MountainHeroArtwork: React.FC = () => {
  return (
    <div className="relative w-full aspect-[4/3] sm:aspect-[16/11] rounded-3xl overflow-hidden border border-[#293130] bg-[#070B0D] shadow-2xl shadow-black/80">
      <svg
        viewBox="0 0 800 550"
        className="w-full h-full object-cover"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Sky Gradient */}
          <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#05080A" />
            <stop offset="45%" stopColor="#0B1317" />
            <stop offset="70%" stopColor="#121D20" />
            <stop offset="100%" stopColor="#152427" />
          </linearGradient>

          {/* Moon Glow */}
          <radialGradient id="moonGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#F1EBDD" stopOpacity="0.9" />
            <stop offset="35%" stopColor="#E2D4B7" stopOpacity="0.45" />
            <stop offset="65%" stopColor="#C6A45A" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#070B0D" stopOpacity="0" />
          </radialGradient>

          {/* Moon Disc */}
          <radialGradient id="moonDisc" cx="40%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#FFFDF7" />
            <stop offset="80%" stopColor="#E5DCBA" />
            <stop offset="100%" stopColor="#C8BA8C" />
          </radialGradient>

          {/* Lake Water Gradient */}
          <linearGradient id="lakeGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0D1719" />
            <stop offset="40%" stopColor="#0A1114" />
            <stop offset="100%" stopColor="#05080A" />
          </linearGradient>

          {/* Water Moon Reflection */}
          <linearGradient id="moonReflection" x1="0.5" y1="0" x2="0.5" y2="1">
            <stop offset="0%" stopColor="#E5DCBA" stopOpacity="0.35" />
            <stop offset="40%" stopColor="#C6A45A" stopOpacity="0.18" />
            <stop offset="80%" stopColor="#A8C66C" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#070B0D" stopOpacity="0" />
          </linearGradient>

          {/* Mountain Gradient Far */}
          <linearGradient id="mountFar" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1B2629" />
            <stop offset="100%" stopColor="#0E1618" />
          </linearGradient>

          {/* Mountain Gradient Mid */}
          <linearGradient id="mountMid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#141E20" />
            <stop offset="100%" stopColor="#091012" />
          </linearGradient>

          {/* Mountain Gradient Near */}
          <linearGradient id="mountNear" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0F1618" />
            <stop offset="100%" stopColor="#06090A" />
          </linearGradient>

          {/* Mist Layer */}
          <linearGradient id="mistGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#A8ADA7" stopOpacity="0" />
            <stop offset="50%" stopColor="#A8ADA7" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#A8ADA7" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Sky Background */}
        <rect width="800" height="550" fill="url(#skyGrad)" />

        {/* Distant Stars */}
        <g fill="#F1EBDD" opacity="0.6">
          <circle cx="95" cy="45" r="0.8" />
          <circle cx="160" cy="85" r="1.1" />
          <circle cx="240" cy="50" r="0.7" />
          <circle cx="310" cy="110" r="1" />
          <circle cx="390" cy="65" r="0.9" />
          <circle cx="460" cy="40" r="1.2" />
          <circle cx="520" cy="95" r="0.8" />
          <circle cx="680" cy="70" r="1.1" />
          <circle cx="740" cy="115" r="0.7" />
          <circle cx="620" cy="45" r="0.9" />
          <circle cx="180" cy="140" r="0.6" />
          <circle cx="280" cy="160" r="0.8" />
        </g>

        {/* Ambient Moon Glow */}
        <circle cx="610" cy="145" r="140" fill="url(#moonGlow)" />

        {/* Moon Disc */}
        <circle cx="610" cy="145" r="38" fill="url(#moonDisc)" filter="drop-shadow(0 0 12px rgba(241, 235, 221, 0.45))" />

        {/* Subtle Moon Craters */}
        <g fill="#A89A74" opacity="0.18">
          <circle cx="602" cy="138" r="7" />
          <circle cx="622" cy="148" r="9" />
          <circle cx="614" cy="160" r="5" />
          <circle cx="628" cy="135" r="4" />
        </g>

        {/* Far Mountain Range (Behind Moon Light) */}
        <path
          d="M 120 340 L 260 210 L 350 270 L 460 190 L 580 280 L 670 180 L 760 260 L 800 290 L 800 370 L 0 370 L 0 320 Z"
          fill="url(#mountFar)"
          opacity="0.85"
        />

        {/* Atmospheric Mist Over Far Mountains */}
        <rect x="0" y="240" width="800" height="110" fill="url(#mistGrad)" />

        {/* Mid-range Peaks */}
        <path
          d="M 0 360 L 80 290 L 190 350 L 320 250 L 430 320 L 520 240 L 630 325 L 720 260 L 800 310 L 800 400 L 0 400 Z"
          fill="url(#mountMid)"
        />

        {/* Near Mountain Ridge & Lake Shoreline */}
        <path
          d="M 0 395 L 140 330 L 250 375 L 380 320 L 480 370 L 590 315 L 710 365 L 800 340 L 800 440 L 0 440 Z"
          fill="url(#mountNear)"
        />

        {/* Serene Lake Body */}
        <rect x="0" y="380" width="800" height="170" fill="url(#lakeGrad)" />

        {/* Moon Reflection in Calm Water */}
        <ellipse cx="610" cy="455" rx="50" ry="60" fill="url(#moonReflection)" />
        <g stroke="#E5DCBA" strokeOpacity="0.25" strokeLinecap="round">
          <line x1="590" y1="410" x2="630" y2="410" strokeWidth="1.2" />
          <line x1="575" y1="422" x2="645" y2="422" strokeWidth="1.5" />
          <line x1="560" y1="435" x2="655" y2="435" strokeWidth="1.8" />
          <line x1="550" y1="450" x2="670" y2="450" strokeWidth="2.2" />
          <line x1="540" y1="468" x2="675" y2="468" strokeWidth="1.8" />
          <line x1="565" y1="488" x2="650" y2="488" strokeWidth="1.4" />
          <line x1="580" y1="510" x2="635" y2="510" strokeWidth="1" />
        </g>

        {/* Silhouetted Evergreen Pines - Foreground Left Bank */}
        <g fill="#050708">
          {/* Tree 1 */}
          <polygon points="50,280 40,320 60,320" />
          <polygon points="50,300 36,350 64,350" />
          <polygon points="50,330 30,390 70,390" />
          <rect x="47" y="390" width="6" height="30" />

          {/* Tree 2 */}
          <polygon points="90,295 82,330 98,330" />
          <polygon points="90,315 78,360 102,360" />
          <polygon points="90,340 72,400 108,400" />
          <rect x="87" y="400" width="6" height="25" />

          {/* Tree 3 */}
          <polygon points="25,320 18,355 32,355" />
          <polygon points="25,340 14,385 36,385" />
          <polygon points="25,365 8,425 42,425" />
          <rect x="22" y="425" width="6" height="20" />

          {/* Tree 4 */}
          <polygon points="135,335 128,365 142,365" />
          <polygon points="135,350 124,395 146,395" />
          <polygon points="135,375 120,430 150,430" />
          <rect x="132" y="430" width="6" height="20" />

          {/* Bank Soil Outline */}
          <path d="M 0 410 Q 70 415 160 440 L 160 550 L 0 550 Z" />
        </g>

        {/* Silhouetted Pines - Foreground Right Shore */}
        <g fill="#050708">
          {/* Tree Right 1 */}
          <polygon points="730,310 722,345 738,345" />
          <polygon points="730,330 718,380 742,380" />
          <polygon points="730,360 712,420 748,420" />
          <rect x="727" y="420" width="6" height="25" />

          {/* Tree Right 2 */}
          <polygon points="770,335 764,365 776,365" />
          <polygon points="770,350 760,395 780,395" />
          <polygon points="770,375 754,435 786,435" />
          <rect x="767" y="435" width="6" height="20" />

          {/* Right Bank */}
          <path d="M 680 470 Q 740 445 800 440 L 800 550 L 680 550 Z" />
        </g>

        {/* Soft Vignette Overlay */}
        <rect
          width="800"
          height="550"
          fill="none"
          stroke="#070B0D"
          strokeWidth="30"
          opacity="0.35"
        />
      </svg>
    </div>
  );
};
