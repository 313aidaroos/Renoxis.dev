"use client";

import Image from "next/image";
import { useRef } from "react";

/** Small Cixy button that opens step-by-step help for the page you are on. */
export function CixyPageHelp({
  title,
  steps,
}: {
  title: string;
  steps: string[];
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button
        type="button"
        className="cixy-page-help"
        aria-haspopup="dialog"
        onClick={() => dialog.current?.showModal()}
      >
        <Image src="/cixy/cixy-combo-a-avatar.webp" alt="" width={28} height={28} />
        Help
      </button>
      <dialog ref={dialog} className="cixy-page-help-dialog" aria-labelledby="cixy-page-help-title">
        <span className="eyebrow">CIXY</span>
        <h2 id="cixy-page-help-title">{title}</h2>
        <ol>
          {steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <div className="actions">
          <button type="button" className="primary" onClick={() => dialog.current?.close()}>
            Close
          </button>
        </div>
      </dialog>
    </>
  );
}
