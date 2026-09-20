"use client";
import type { CSSProperties } from "react";
import type { Look } from "@/lib/renoxis/customization";
export const moods = ["Smile", "Wave", "Sleep", "Snack", "Coffee"] as const;
export type Mood = (typeof moods)[number];
export default function CixyAvatar({ look, mood }: { look: Look; mood: Mood }) {
  if (look.style === "signature")
    return (
      <div
        role="img"
        aria-label={`Cixy ${mood.toLowerCase()}`}
        className={"signature-avatar " + (look.motion ? "animated" : "")}
        style={{ "--frame-x": `${moods.indexOf(mood) * 25}%` } as CSSProperties}
      />
    );
  return (
    <div
      className={
        "illustrated-avatar room-" +
        look.room +
        (look.motion ? " animated" : "")
      }
    >
      <svg
        role="img"
        aria-label={`Customized Cixy ${mood.toLowerCase()}`}
        viewBox="0 0 400 400"
      >
        <defs>
          <linearGradient id="room" x2="1" y2="1">
            <stop stopColor="var(--room-a)" />
            <stop offset="1" stopColor="var(--room-b)" />
          </linearGradient>
          <linearGradient id="shirt" x2="1" y2="1">
            <stop stopColor={look.outfit} />
            <stop offset="1" stopColor="#032e2b" />
          </linearGradient>
        </defs>
        <rect width="400" height="400" fill="url(#room)" />
        <path d="M25 30h350v245H25z" fill="#fff" opacity=".35" />
        <path
          d="M35 260V135h42v125m16 0V95h35v165m120 0V80h40v180m15 0V125h58v135"
          fill="#668f85"
          opacity=".23"
        />
        <path
          d="M200 30v240M25 150h350"
          stroke="#fff"
          strokeWidth="8"
          opacity=".55"
        />
        <g className={"cixy-person mood-" + mood.toLowerCase()}>
          <ellipse
            cx="201"
            cy="173"
            rx="78"
            ry={look.hairstyle === "long" ? 118 : 88}
            fill={look.hair}
          />
          {look.hairstyle === "bun" && (
            <circle cx="207" cy="66" r="38" fill={look.hair} />
          )}
          <path
            d="M99 390l15-97q12-50 62-54h48q50 4 62 54l15 97"
            fill="url(#shirt)"
          />
          <path d="M172 237l28 91 29-91" fill="#fff" />
          <path
            d="M163 246l-12 36 32 12-12 16 29 50m37-114 12 36-32 12 12 16-29 50"
            stroke="#ffffff55"
            fill="none"
            strokeWidth="3"
          />
          <path d="M177 212v36q23 25 46 0v-36" fill={look.skin} />
          <ellipse cx="200" cy="165" rx="58" ry="73" fill={look.skin} />
          <path
            d="M140 155q-9-87 68-69 68 12 47 79l-13-46q-21-4-30-16-18 39-72 52"
            fill={look.hair}
          />
          <path
            d="M154 156q17-11 29-2m35 0q17-9 29 2"
            stroke={look.hair}
            strokeWidth="5"
            strokeLinecap="round"
            fill="none"
          />
          {mood === "Sleep" ? (
            <path
              d="M157 174q15 14 28 0m30 0q15 14 28 0"
              stroke="#34281e"
              fill="none"
              strokeWidth="3"
            />
          ) : (
            <g className="cixy-eyes">
              <ellipse cx="173" cy="175" rx="15" ry="12" fill="white" />
              <ellipse cx="227" cy="175" rx="15" ry="12" fill="white" />
              <circle cx="174" cy="175" r="9" fill={look.eyes} />
              <circle cx="226" cy="175" r="9" fill={look.eyes} />
              <circle cx="174" cy="175" r="5" fill="#211b17" />
              <circle cx="226" cy="175" r="5" fill="#211b17" />
              <circle cx="177" cy="172" r="3" fill="white" />
              <circle cx="229" cy="172" r="3" fill="white" />
            </g>
          )}
          <ellipse
            cx="156"
            cy="199"
            rx="12"
            ry="6"
            fill="#e68e86"
            opacity=".4"
          />
          <ellipse
            cx="244"
            cy="199"
            rx="12"
            ry="6"
            fill="#e68e86"
            opacity=".4"
          />
          <path
            d="M188 211q12 12 25 0"
            stroke="#ab5951"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M146 205q-18 16-14-9m125 9q18 16 14-9"
            stroke="#ddb76a"
            strokeWidth="4"
            fill="none"
          />
          <g className="cixy-hand">
            <path
              d="M272 337q35-14 33-61"
              stroke={look.outfit}
              strokeWidth="27"
              fill="none"
              strokeLinecap="round"
            />
            <ellipse cx="306" cy="262" rx="14" ry="22" fill={look.skin} />
            {mood === "Wave" && (
              <path
                d="M295 255l-6-20m12 18-2-30m8 30 4-29m1 32 11-19"
                stroke={look.skin}
                strokeWidth="7"
                strokeLinecap="round"
              />
            )}
            {mood === "Coffee" && (
              <g>
                <path d="M275 230h42v40q-21 18-42 0z" fill="white" />
                <path
                  d="M317 238q26-3 12 25h-13"
                  stroke="white"
                  fill="none"
                  strokeWidth="6"
                />
              </g>
            )}
            {mood === "Snack" && (
              <ellipse cx="299" cy="237" rx="25" ry="14" fill="#d99b40" />
            )}
          </g>
        </g>
        <rect y="370" width="400" height="30" fill="#e7efe8" />
        {mood === "Sleep" && (
          <text x="290" y="105" fill="#3f6f62" fontSize="28">
            z z z
          </text>
        )}
      </svg>
    </div>
  );
}
