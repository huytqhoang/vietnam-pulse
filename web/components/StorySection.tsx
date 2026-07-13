"use client";
import type { Lang } from "@/lib/i18n";
import { tr } from "@/lib/i18n";

export default function StorySection({ lang }: { lang: Lang }) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-white">{tr("storyTitle", lang)}</h2>
        <p className="text-zinc-500 text-sm mt-1">{tr("storySqueezeTitle", lang)}</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-xl border border-red-900 bg-red-950/30 p-5">
          <div className="text-2xl mb-2">🌐</div>
          <h3 className="font-semibold text-red-300 mb-2">
            {tr("storyExternalTitle", lang)}
          </h3>
          <p className="text-zinc-400 text-sm leading-relaxed">
            {tr("storyExternalText", lang)}
          </p>
        </div>

        <div className="rounded-xl border border-orange-900 bg-orange-950/30 p-5">
          <div className="text-2xl mb-2">🏘️</div>
          <h3 className="font-semibold text-orange-300 mb-2">
            {tr("storyInternalTitle", lang)}
          </h3>
          <p className="text-zinc-400 text-sm leading-relaxed">
            {tr("storyInternalText", lang)}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-5 text-center">
        <p className="text-zinc-300 text-base leading-relaxed italic">
          &ldquo;{tr("storyImplication", lang)}&rdquo;
        </p>
      </div>
    </section>
  );
}
