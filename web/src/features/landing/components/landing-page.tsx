"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  Award,
  Briefcase,
  Check,
  ChevronDown,
  Dumbbell,
  Image as ImageIcon,
  LogIn,
  Menu,
  MessageCircle,
  Sparkles,
  Trophy,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Logo } from "@/shared/components/logo";
import {
  COACH_INFO,
  LANDING_FAQ,
  LANDING_PLANS,
  LANDING_STATS,
  type CoachStat,
  type LandingPlan,
} from "@/lib/coach-info";
import { useReveal } from "../hooks/use-reveal";

type RevealVariant = "up" | "start" | "zoom";

function Reveal({
  children,
  delay = 0,
  variant = "up",
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  variant?: RevealVariant;
  className?: string;
}) {
  return (
    <div
      data-reveal={variant}
      className={`reveal ${className}`}
      style={{ "--reveal-delay": `${delay}ms` } as React.CSSProperties}
    >
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Reveal className="mb-2">
      <span className="text-xs font-black uppercase tracking-[0.3em] text-primary/80">
        {children}
      </span>
    </Reveal>
  );
}

function SectionTitle({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Reveal className="flex items-center gap-2">
      <span className="text-primary">{icon}</span>
      <h2 className="text-2xl font-black sm:text-3xl">{children}</h2>
      <span
        aria-hidden
        className="title-line h-px flex-1 bg-gradient-to-l from-primary/50 to-transparent"
      />
    </Reveal>
  );
}

function CoachPhoto({ className }: { className?: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-3 rounded-3xl border border-primary/25 bg-secondary/60 text-muted-foreground ${className ?? ""}`}
      >
        <Dumbbell className="size-10 text-primary/50" />
        <span className="text-sm font-semibold">صورة المدرب — قريباً</span>
      </div>
    );
  }

  return (
    <Image
      src={COACH_INFO.photo}
      alt={COACH_INFO.photoAlt}
      fill
      sizes="(max-width: 768px) 90vw, 420px"
      onError={() => setFailed(true)}
      className={`rounded-3xl object-cover ${className ?? ""}`}
    />
  );
}

function StatItem({ stat, index }: { stat: CoachStat; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [display, setDisplay] = useState(() => {
    const match = stat.value.match(/^([^\d]*)(\d+)(.*)$/);
    return match ? `${match[1]}0${match[3]}` : stat.value;
  });

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const match = stat.value.match(/^([^\d]*)(\d+)(.*)$/);
    if (!match) return;

    const [, prefix, numStr, suffix] = match;
    const target = Number(numStr);
    const zero = `${prefix}0${suffix}`;
    let raf = 0;

    const runCount = () => {
      cancelAnimationFrame(raf);
      const start = performance.now();
      const duration = 1300;
      const step = (now: number) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplay(`${prefix}${Math.round(target * eased)}${suffix}`);
        if (progress < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          cancelAnimationFrame(raf);
          if (!entry.isIntersecting) {
            if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
              setDisplay(zero);
            }
            return;
          }
          if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            setDisplay(stat.value);
            return;
          }
          setDisplay(zero);
          runCount();
        });
      },
      { threshold: 0.5 },
    );

    observer.observe(node);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [stat.value]);

  return (
    <div
      ref={ref}
      data-reveal="zoom"
      className="reveal rounded-2xl border border-border/60 bg-card p-4 text-center transition-colors duration-300 hover:border-primary/40"
      style={{ "--reveal-delay": `${index * 90}ms` } as React.CSSProperties}
    >
      <div className="amber-gradient-text text-3xl font-black tabular-nums">{display}</div>
      <div className="mt-1 text-xs font-semibold text-muted-foreground">{stat.label}</div>
    </div>
  );
}

function MarqueeStrip() {
  const words = ["FOCUS", "DISCIPLINE", "RESULTS", "CONSISTENCY", "STRENGTH", "NUTRITION"];
  const row = [...words, ...words, ...words];
  return (
    <div aria-hidden className="relative overflow-hidden border-y border-primary/15 bg-primary/[0.04] py-3">
      <div dir="ltr" className="marquee-track flex w-max items-center gap-8">
        {[0, 1].map((half) => (
          <div key={half} className="flex items-center gap-8">
            {row.map((w, i) => (
              <span key={`${half}-${i}`} className="flex items-center gap-8 whitespace-nowrap text-sm font-black tracking-[0.35em] text-primary/50">
                {w}
                <Dumbbell className="size-3.5 text-primary/30" />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

const STEPS = [
  {
    num: "01",
    title: "اختر باقتك",
    desc: "قارن الباقات واختر ما يناسب هدفك وميزانيتك — بالدينار، بدون مفاجآت.",
  },
  {
    num: "02",
    title: "تواصل مع المدرب",
    desc: "تواصل مباشر عبر واتساب، تأكيد الاشتراك والدفع نقدًا في الصالة الرياضية.",
  },
  {
    num: "03",
    title: "استلم برنامجك",
    desc: "خطة غذائية محسوبة + جدول تمارين بالصور — بالكامل على حسابك في التطبيق.",
  },
  {
    num: "04",
    title: "تابع تقدمك",
    desc: "وزن، صور، هدف شهري وتحديات — والمدرب يعدّل معك كل أسبوع.",
  },
];

function StepsSection() {
  return (
    <section id="method" className="scroll-mt-20 space-y-6 py-14">
      <SectionLabel>02 / كيف تبدأ</SectionLabel>
      <SectionTitle icon={<Dumbbell className="size-5" />}>
        من أول نقرة حتى أول تمرين — 4 خطوات
      </SectionTitle>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step, index) => (
          <Reveal key={step.num} delay={index * 100} variant="start">
            <Card className="group h-full transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/40 hover:shadow-[0_16px_48px_-16px] hover:shadow-primary/30">
              <CardContent className="space-y-2 p-5">
                <span className="amber-gradient-text text-3xl font-black tabular-nums">{step.num}</span>
                <div className="font-bold">{step.title}</div>
                <p className="text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
              </CardContent>
            </Card>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function MiniPlanTable() {
  const rows = [
    { nom: "Bench press", slug: "bench-press", charge: "15 kg", reps: "6-12 échec", serie: "4 3 2", tempo: "3-1-3-1", rest: "1 min" },
    { nom: "Squat barre", slug: "smith-machine-squat", charge: "40 kg", reps: "8-10", serie: "4 4", tempo: "2-0-2-0", rest: "90s" },
    { nom: "Tractions", slug: "lat-pulldown", charge: "PDC", reps: "MAX", serie: "3", tempo: "1-1-1-1", rest: "2 min" },
  ];
  return (
    <div className="overflow-x-auto rounded-xl border border-primary/20 bg-background/60">
      <table className="w-full min-w-[520px] border-collapse text-xs">
        <thead>
          <tr className="bg-primary/10 text-xs font-bold text-muted-foreground">
            <th className="border-b px-2.5 py-2 text-start">التمرين</th>
            <th className="border-b px-2.5 py-2">الصورة</th>
            <th className="border-b px-2.5 py-2">الحمل</th>
            <th className="border-b px-2.5 py-2">التكرارات</th>
            <th className="border-b px-2.5 py-2">الجولات</th>
            <th className="border-b px-2.5 py-2">الإيقاع</th>
            <th className="border-b px-2.5 py-2">الراحة</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.nom} className="text-foreground/90">
              <td className="border-b px-2.5 py-2 text-start font-semibold">{r.nom}</td>
              <td className="border-b px-2.5 py-2">
                <span className="flex size-8 items-center justify-center overflow-hidden rounded bg-muted">
                  {/* image git locale via copy-guide-assets (public/guide-assets) — créé le dernier fois */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/guide-assets/${r.slug}/frame-1.png`}
                    alt={r.nom}
                    className="h-full w-full object-contain p-0.5 invert dark:invert-0"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </span>
              </td>
              <td className="border-b px-2.5 py-2 tabular-nums">{r.charge}</td>
              <td className="border-b px-2.5 py-2">{r.reps}</td>
              <td className="border-b px-2.5 py-2 tabular-nums">{r.serie}</td>
              <td className="border-b px-2.5 py-2 font-mono">{r.tempo}</td>
              <td className="border-b px-2.5 py-2">{r.rest}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MiniMacrosPreview() {
  const macros = [
    { label: "سعرات", value: "2200" },
    { label: "بروتين", value: "160g" },
    { label: "كربوهيدرات", value: "220g" },
    { label: "دهون", value: "65g" },
  ];
  return (
    <div className="grid grid-cols-2 gap-2 rounded-xl border border-primary/15 bg-background/60 p-4 sm:grid-cols-4">
      {macros.map((m) => (
        <div key={m.label} className="rounded-lg bg-muted/50 px-3 py-3 text-center">
          <div className="amber-gradient-text text-xl font-black tabular-nums">{m.value}</div>
          <div className="mt-0.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {m.label}
          </div>
        </div>
      ))}
    </div>
  );
}

function MiniChatPreview() {
  const messages = [
    { from: "member" as const, text: "أهلاً مدرب، هل يمكن تعديل تمرين اليوم؟" },
    { from: "coach" as const, text: "بالتأكيد — استبدل السكوات بجهاز الضغط للأرجل بـ 60 كغم." },
  ];
  return (
    <div className="space-y-2 rounded-xl border border-primary/15 bg-background/60 p-4">
      {messages.map((m) => (
        <div key={m.text} className={m.from === "coach" ? "flex justify-start" : "flex justify-end"}>
          <span
            className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
              m.from === "coach"
                ? "bg-primary/12 font-medium text-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {m.text}
          </span>
        </div>
      ))}
      <div className="pt-1 text-center text-xs text-muted-foreground">
        ردّ سريع داخل التطبيق — بدون واتساب
      </div>
    </div>
  );
}

const PILLARS = [
  {
    label: "NUTRITION",
    num: "01",
    title: "خطة غذائية مرنة ومحسوبة",
    desc: "سعرات ومغذيات محسوبة بدقة حسب هدفك، مع بدائل كثيرة تناسب طعامك وميزانيتك — دون أن تشعر أنك مقيّد بنظام جامد.",
    visual: "macros" as const,
  },
  {
    label: "TRAINING",
    num: "02",
    title: "جدول تمارين احترافي",
    desc: "كل تمرين بصورة توضيحية، مع عدد المجموعات والتكرارات والإيقاع وفترات الراحة — كما في كبرى الصالات الرياضية.",
    visual: "table" as const,
  },
  {
    label: "SUPPORT",
    num: "03",
    title: "متابعة حقيقية يوماً بيوم",
    desc: "وزنك وصورك وهدفك الشهري في تطبيق واحد، ومحادثة مباشرة مع المدرب — تعديلات حسب استجابة جسمك.",
    visual: "chat" as const,
  },
];

function FeaturesSection() {
  return (
    <section id="features" className="scroll-mt-20 space-y-6 py-14">
      <SectionLabel>03 / ماذا ستحصل عليه</SectionLabel>
      <SectionTitle icon={<Sparkles className="size-5" />}>
        خدمة متكاملة — مصممة خصيصاً لك
      </SectionTitle>
      <div className="space-y-6">
        {PILLARS.map((p, index) => (
          <Reveal key={p.num} delay={index * 80}>
            <Card className="overflow-hidden transition-all duration-300 hover:border-primary/40">
              <CardContent className="grid gap-5 p-6 lg:grid-cols-[1fr_1.2fr] lg:items-center">
                <div className="space-y-2">
                  <span className="text-xs font-black uppercase tracking-[0.3em] text-primary/70">
                    {p.label} {p.num}
                  </span>
                  <h3 className="text-xl font-black">{p.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{p.desc}</p>
                </div>
                {p.visual === "table" ? (
                  <MiniPlanTable />
                ) : p.visual === "macros" ? (
                  <MiniMacrosPreview />
                ) : (
                  <MiniChatPreview />
                )}
              </CardContent>
            </Card>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

const CERTIFICATES = [
  {
    file: "fitness-trainer.jpeg",
    title: "Fitness Trainer",
    desc: "شهادة مدرب لياقة بدنية معتمد — تخصص القوة والتحمل وبناء الأجسام وفق معايير دولية.",
  },
  {
    file: "floor-coach.jpeg",
    title: "Floor Coach",
    desc: "شهادة مدرب أرضي — خبرة ميدانية في توجيه الحصص، تصحيح الحركة وضمان السلامة.",
  },
  {
    file: "personal-trainer.jpeg",
    title: "Personal Trainer",
    desc: "شهادة مدرب شخصي — متابعة فردية، برمجة أحمال وتغذية مخصصة لكل مشترك.",
  },
  {
    file: "ifbb-certificate.jpeg",
    title: "IFBB Certificate",
    desc: "شهادة IFBB الدولية — أعلى اعتماد في كمال الأجسام واللياقة البدنية.",
  },
] as const;

function CertificatesGallery() {
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <section id="certificates" className="scroll-mt-20 space-y-6 py-14">
      <SectionLabel>05 / الشهادات المصورة</SectionLabel>
      <SectionTitle icon={<Award className="size-5" />}>شهادات موثّقة — بالصور</SectionTitle>
      <Reveal>
        <p className="max-w-2xl text-sm text-muted-foreground">
          كل شهادة باسمها الأصلي (اسم الملف) مع شرح — اضغط للتكبير. الصور من <code className="rounded bg-muted px-1 py-0.5 text-xs">public/certifacte</code> (git).
        </p>
      </Reveal>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CERTIFICATES.map((c, index) => (
          <Reveal key={c.file} delay={index * 100} variant="zoom">
            <Card
              className="group cursor-pointer overflow-hidden transition-all duration-500 hover:-translate-y-1.5 hover:scale-[1.02] hover:border-primary/40 hover:shadow-[0_16px_48px_-16px] hover:shadow-primary/30"
              onClick={() => setSelected(`/certifacte/${encodeURIComponent(c.file)}`)}
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/certifacte/${encodeURIComponent(c.file)}`}
                  alt={c.title}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  loading="lazy"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                <span className="pointer-events-none absolute bottom-2 start-2 rounded-full bg-background/90 px-2.5 py-1 text-xs font-bold shadow-sm transition-transform duration-300 group-hover:scale-105">
                  {c.title}
                </span>
              </div>
              <CardContent className="space-y-1 p-4">
                <div className="font-bold leading-tight">{c.title}</div>
                <p className="text-xs leading-relaxed text-muted-foreground">{c.desc}</p>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                  <ImageIcon className="size-3" /> {c.file}
                </span>
              </CardContent>
            </Card>
          </Reveal>
        ))}
      </div>
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setSelected(null)}
          role="dialog"
          aria-modal="true"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={selected}
            alt="شهادة مكبرة"
            className="max-h-[90vh] max-w-[90vw] animate-[zoom-in_0.3s_ease] rounded-xl border border-white/10 object-contain shadow-2xl"
          />
          <button
            aria-label="إغلاق"
            onClick={() => setSelected(null)}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white backdrop-blur transition hover:bg-white/20"
          >
            <X className="size-5" />
          </button>
        </div>
      )}
    </section>
  );
}

const SHOW_RESULTS = false;

function ResultsSection() {
  const placeholders = [0, 1, 2];
  return (
    <section id="results" className="scroll-mt-20 space-y-6 py-14">
      <SectionLabel>04 / نتائج حقيقية</SectionLabel>
      <SectionTitle icon={<Trophy className="size-5" />}>
        النتائج تتحدث عن نفسها.
      </SectionTitle>
      <Reveal delay={100}>
        <p className="max-w-2xl text-sm text-muted-foreground">
          تحولات حقيقية لمشتركي الصالة الرياضية — تُنشر بعد موافقتهم.
        </p>
      </Reveal>
      <div className="grid gap-4 sm:grid-cols-3">
        {placeholders.map((i) => (
          <Reveal key={i} delay={i * 120} variant="zoom">
            <Card className="group h-full overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/40">
              <CardContent className="space-y-3 p-4">
                <div className="grid grid-cols-2 gap-2">
                  {["قبل", "بعد"].map((label) => (
                    <div
                      key={label}
                      className="relative flex aspect-[3/4] items-center justify-center overflow-hidden rounded-lg border border-border/60 bg-muted/40"
                    >
                      <ImageIcon className="size-8 text-muted-foreground/40" />
                      <span className="absolute bottom-1.5 start-1.5 rounded bg-background/80 px-1.5 py-0.5 text-xs font-bold">
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-center text-xs text-muted-foreground">
                  صور حقيقية قريبًا — بعد موافقة المشتركين
                </p>
              </CardContent>
            </Card>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function PricingSection({ whatsappUrl }: { whatsappUrl: string }) {
  const waFor = (plan: LandingPlan) =>
    `${whatsappUrl}?text=${encodeURIComponent(
      `أهلاً مدرب، أرغب في الاستفسار عن باقة ${plan.name}`,
    )}`;

  return (
    <section id="plans" className="scroll-mt-20 space-y-6 py-14">
      <SectionLabel>04 / الباقات</SectionLabel>
      <SectionTitle icon={<Award className="size-5" />}>
        اختر مستوى المتابعة الذي يناسبك
      </SectionTitle>

      <div className="grid gap-4 lg:grid-cols-2 max-w-2xl mx-auto">
        {LANDING_PLANS.map((plan, index) => (
          <Reveal key={plan.id} delay={index * 100} variant="start">
            <Card
              className={`relative h-full transition-all duration-300 hover:-translate-y-1.5 ${
                plan.highlight
                  ? "border-primary/60 shadow-[0_20px_60px_-20px] shadow-primary/40"
                  : "hover:border-primary/40"
              }`}
            >
              {plan.highlight && (
                <span className="absolute -top-3 start-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-black text-primary-foreground">
                  الأكثر طلباً
                </span>
              )}
              <CardContent className="flex h-full flex-col gap-4 p-6">
                <div className="space-y-1">
                  <h3 className="text-xl font-black">{plan.name}</h3>
                  <p className="text-xs text-muted-foreground">{plan.tagline}</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="secondary" className="text-xs">
                    {plan.places}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {plan.delivery}
                  </Badge>
                </div>
                <div className="flex items-end gap-1.5">
                  <span className="amber-gradient-text text-4xl font-black tabular-nums">
                    {plan.price}
                  </span>
                  <span className="pb-1 text-sm font-bold text-muted-foreground">
                    DT / شهرياً
                  </span>
                </div>
                <ul className="flex-1 space-y-2 text-sm">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                      <span className="leading-snug">{f}</span>
                    </li>
                  ))}
                </ul>
                <Button asChild className="w-full" variant={plan.highlight ? "default" : "outline"}>
                  <a href={waFor(plan)} target="_blank" rel="noopener noreferrer">
                    <MessageCircle />
                    اختر الباقة
                  </a>
                </Button>
              </CardContent>
            </Card>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

const COMPARISON_ROWS: { label: string; online: boolean; premiumCoach: boolean }[] = [
  { label: "خطة غذائية محسوبة", online: true, premiumCoach: true },
  { label: "جدول تمارين بالصور", online: true, premiumCoach: true },
  { label: "تتبع وزن وصور وتصدير PDF", online: true, premiumCoach: true },
  { label: "هدف شهري وتحديات", online: true, premiumCoach: true },
  { label: "محادثة مباشرة مع المدرب", online: false, premiumCoach: true },
  { label: "متابعة شخصية يوماً بيوم", online: false, premiumCoach: true },
  { label: "تعديلات أسبوعية", online: false, premiumCoach: true },
];

function ComparisonSection() {
  return (
    <section className="pb-14">
      <Reveal>
        <Accordion type="single" collapsible className="rounded-xl border px-4">
          <AccordionItem value="comparison" className="border-b-0">
            <AccordionTrigger className="text-start text-sm font-bold hover:no-underline">
              مقارنة تفصيلية بين الباقات
            </AccordionTrigger>
            <AccordionContent>
              <div className="overflow-x-auto rounded-xl border">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-muted/60 text-xs font-bold text-muted-foreground">
                      <th className="border-b px-3 py-3 text-start">الميزة</th>
                      <th className="border-b px-3 py-3">أونلاين</th>
                      <th className="border-b px-3 py-3 text-primary">بريميوم كوتش</th>
                    </tr>
                  </thead>
                  <tbody>
                    {COMPARISON_ROWS.map((row) => (
                      <tr key={row.label} className="hover:bg-muted/20">
                        <td className="border-b px-3 py-2.5 font-medium">{row.label}</td>
                        {[row.online, row.premiumCoach].map((on, i) => (
                          <td key={i} className="border-b px-3 py-2.5 text-center">
                            {on ? (
                              <Check className="mx-auto size-4 text-primary" />
                            ) : (
                              <X className="mx-auto size-4 text-muted-foreground/40" />
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </Reveal>
    </section>
  );
}

function FaqSection() {
  return (
    <section id="faq" className="scroll-mt-20 space-y-6 py-14">
      <SectionLabel>06 / FAQ</SectionLabel>
      <SectionTitle icon={<MessageCircle className="size-5" />}>
        عندك سؤال؟ غالباً جوابه هنا.
      </SectionTitle>
      <Reveal>
        <Accordion type="single" collapsible className="rounded-xl border px-4">
          {LANDING_FAQ.map((item, i) => (
            <AccordionItem key={item.q} value={`faq-${i}`}>
              <AccordionTrigger className="text-start text-sm font-bold hover:no-underline">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Reveal>
    </section>
  );
}

function FinalCta({ whatsappUrl }: { whatsappUrl: string }) {
  const { instagram, facebook } = COACH_INFO.contact;
  return (
    <section className="py-16">
      <Reveal variant="zoom">
        <div className="relative overflow-hidden rounded-3xl border border-primary/25 bg-gradient-to-b from-primary/15 to-transparent p-10 text-center">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-16 start-1/2 h-48 w-96 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl"
          />
          <span className="text-xs font-black uppercase tracking-[0.4em] text-primary/80">
            START
          </span>
          <h2 className="mt-3 text-3xl font-black sm:text-4xl">
            أفضل نسخة منك تبدأ بقرار.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
            انضم إلى أكثر من ٢٥٠ مشتركًا غيّروا أجسامهم ببرنامج مصمم خصيصاً لهم ومتابعة حقيقية.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg">
              <a href="#plans">
                اختر باقتك الآن
              </a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                <MessageCircle />
                تحدث مع المدرب
              </a>
            </Button>
          </div>
          <div className="mt-6 flex items-center justify-center gap-4">
            <a
              href={instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="flex size-10 items-center justify-center rounded-full border border-border/60 bg-background/60 text-muted-foreground transition-all duration-300 hover:border-primary/50 hover:text-primary hover:scale-110"
              aria-label="Instagram"
            >
              <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
              </svg>
            </a>
            <a
              href={facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="flex size-10 items-center justify-center rounded-full border border-border/60 bg-background/60 text-muted-foreground transition-all duration-300 hover:border-primary/50 hover:text-primary hover:scale-110"
              aria-label="Facebook"
            >
              <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
              </svg>
            </a>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

export function LandingPage() {
  const { contact, certifications, experience } = COACH_INFO;
  const whatsappUrl = `https://wa.me/${contact.whatsapp.replace(/\D/g, "")}`;
  const mainRef = useReveal<HTMLDivElement>();
  const contentRef = useReveal<HTMLDivElement>();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { href: "#about", label: "من أنا" },
    { href: "#certifications", label: "الشهادات" },
    { href: "#certificates", label: "الشهادات المصورة" },
    { href: "#experience", label: "الخبرة" },
    { href: "#method", label: "الطريقة" },
    { href: "#features", label: "المميزات" },
    { href: "#results", label: "النتائج" },
    { href: "#plans", label: "الباقات" },
    { href: "#faq", label: "FAQ" },
  ].filter((link) => SHOW_RESULTS || link.href !== "#results");

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Logo />
          <nav aria-label="تنقل سريع" className="hidden items-center gap-4 lg:flex">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="nav-link text-sm font-semibold text-muted-foreground transition-colors hover:text-primary"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <a href="/login">
                <LogIn className="size-4" />
                تسجيل الدخول
              </a>
            </Button>
            <Button asChild size="sm" className="hidden sm:inline-flex">
              <a href="#plans">ابدأ الآن</a>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? "إغلاق القائمة" : "فتح القائمة"}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </Button>
          </div>
        </div>
        {mobileOpen && (
          <div className="border-t bg-background px-4 py-4 lg:hidden">
            <nav className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors hover:bg-muted"
                >
                  {link.label}
                </a>
              ))}
              <Button asChild className="mt-3 w-full">
                <a href="#plans" onClick={() => setMobileOpen(false)}>
                  ابدأ الآن
                </a>
              </Button>
              <Button asChild variant="outline" className="mt-2 w-full">
                <a href="/login" onClick={() => setMobileOpen(false)}>
                  <LogIn className="size-4" />
                  تسجيل الدخول
                </a>
              </Button>
            </nav>
          </div>
        )}
      </header>

      <main ref={mainRef} className="mx-auto max-w-6xl px-4">
        {/* HERO */}
        <section className="relative grid min-h-[calc(100svh-4rem)] items-center gap-8 py-12 lg:grid-cols-2 lg:gap-4">
          <div
            aria-hidden
            className="pointer-events-none absolute top-1/4 start-1/3 h-72 w-[30rem] rounded-full bg-primary/12 blur-3xl"
          />
          <div className="relative space-y-5 text-center lg:text-start">
            <div className="hero-rise" style={{ "--d": "80ms" } as React.CSSProperties}>
              <Badge className="mx-auto inline-flex items-center gap-1.5 lg:mx-0">
                <Trophy className="size-3.5" />
                مدرب معتمد IFBB
              </Badge>
            </div>
            <h1
              className="hero-rise text-4xl font-black leading-[1.15] tracking-tight sm:text-5xl xl:text-6xl"
              style={{ "--d": "200ms" } as React.CSSProperties}
            >
              لماذا تتمرن <span className="text-shine amber-gradient-text">بشكل عشوائي؟</span>
            </h1>
            <p
              className="hero-rise text-lg font-bold text-primary"
              style={{ "--d": "320ms" } as React.CSSProperties}
            >
              برنامج مصمم خصيصاً لك — تغذية، تمارين بالصور، ومتابعة يومية.
            </p>
            <p
              className="hero-rise mx-auto max-w-xl text-muted-foreground lg:mx-0"
              style={{ "--d": "440ms" } as React.CSSProperties}
            >
              كل شيء في تطبيق واحد: جدول تمارين كما في أفضل الصالات الرياضية، خطة غذائية
              بالمغذيات، تتبع للوزن والصور، ومحادثة مباشرة مع مدربك.
            </p>
            <div
              className="hero-rise flex flex-wrap items-center justify-center gap-3 lg:justify-start"
              style={{ "--d": "560ms" } as React.CSSProperties}
            >
              <Button asChild size="lg">
                <a href="#plans">اختر باقتك</a>
              </Button>
              <Button asChild variant="outline" size="lg">
                <a href="#method">اكتشف كيف يعمل</a>
              </Button>
            </div>
          </div>
          <div className="relative mx-auto aspect-[4/5] w-full max-w-xs sm:max-w-sm lg:max-w-md">
            <div className="hero-float absolute inset-0">
              <div
                aria-hidden
                className="glow-pulse absolute inset-10 rounded-full bg-primary/25 blur-3xl"
              />
              <div
                className="photo-in absolute inset-0"
                style={{ "--d": "350ms" } as React.CSSProperties}
              >
                <CoachPhoto className="absolute inset-0 h-full w-full border-2 border-primary/40 shadow-[0_0_80px_-20px] shadow-primary/60" />
              </div>
            </div>
          </div>
          <div aria-hidden className="absolute bottom-4 left-1/2 hidden -translate-x-1/2 lg:block">
            <ChevronDown className="scroll-hint-dot size-6 text-primary/70" />
          </div>
        </section>
      </main>

      <MarqueeStrip />

      <main ref={contentRef} className="mx-auto max-w-6xl px-4">
        {/* STATS */}
        <section aria-label="أرقام" className="grid grid-cols-2 gap-3 py-10 sm:grid-cols-4">
          {LANDING_STATS.map((stat, index) => (
            <StatItem key={stat.label} stat={stat} index={index} />
          ))}
        </section>

        {/* 01 ABOUT */}
        <section id="about" className="scroll-mt-20 space-y-6 py-14">
          <SectionLabel>01 / عن المدرب</SectionLabel>
          <SectionTitle icon={<Dumbbell className="size-5" />}>
            نبني الأجسام بدقة
          </SectionTitle>
          <Reveal delay={120}>
            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
              <div className="space-y-4">
                <p className="text-lg leading-relaxed text-muted-foreground">{COACH_INFO.about}</p>
                <blockquote className="border-s-4 border-primary ps-4 text-lg font-bold leading-relaxed">
                  « الجسم يتغير عندما يكون البرنامج مصمماً خصيصاً لك — وليس لجيرانك. »
                </blockquote>
              </div>
              <div className="space-y-2.5 rounded-2xl border border-border/60 bg-card p-5">
                {["تحويل الجسم", "تغذية رياضية", "متابعة يومية", "برامج مفصّلة"].map((chip, index) => (
                  <div
                    key={chip}
                    className="flex items-center gap-2.5 text-sm font-semibold transition-transform duration-300 hover:translate-x-[-2px]"
                    style={{ "--reveal-delay": `${index * 60}ms` } as React.CSSProperties}
                  >
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary">
                      <Check className="size-3.5" />
                    </span>
                    {chip}
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </section>

        {/* CERTIFICATIONS */}
        <section id="certifications" className="scroll-mt-20 space-y-6 py-14">
          <SectionTitle icon={<Award className="size-5" />}>الشهادات</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-3">
            {certifications.map((cert, index) => (
              <Reveal key={cert.label} delay={index * 120} variant="start">
                <Card className="group h-full transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/40 hover:shadow-[0_16px_48px_-16px] hover:shadow-primary/30">
                  <CardContent className="flex h-full flex-col items-center gap-3 p-6 text-center">
                    <span className="text-4xl transition-transform duration-300 group-hover:scale-125 group-hover:-rotate-6">
                      {cert.emoji}
                    </span>
                    <div className="font-bold leading-snug">{cert.label}</div>
                  </CardContent>
                </Card>
              </Reveal>
            ))}
          </div>
        </section>

        {/* CERTIFICATES GALLERY — images git public/certifacte */}
        <CertificatesGallery />

        {/* EXPERIENCE */}
        <section id="experience" className="scroll-mt-20 space-y-6 py-14">
          <SectionTitle icon={<Briefcase className="size-5" />}>الخبرة</SectionTitle>
          <ol
            data-reveal="up"
            className="relative space-y-4 ps-6"
            style={{ "--reveal-delay": "0ms" } as React.CSSProperties}
          >
            <span
              aria-hidden
              className="timeline-draw absolute inset-y-1 start-[7px] w-0.5 rounded-full bg-gradient-to-b from-primary via-primary/40 to-transparent"
            />
            {experience.map((exp, index) => (
              <li key={`${exp.period}-${exp.gym}`} className="relative">
                <Reveal delay={index * 100} variant="start">
                  <span
                    aria-hidden
                    className="absolute -start-[23px] top-6 size-4 rounded-full border-2 border-background bg-primary shadow-[0_0_0_4px] shadow-primary/15"
                  />
                  <Card className="transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_12px_36px_-14px] hover:shadow-primary/25">
                    <CardContent className="flex flex-wrap items-center justify-between gap-2 p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <Dumbbell className="size-5" />
                        </div>
                        <div>
                          <div className="font-bold">{exp.gym}</div>
                          {exp.location ? (
                            <div className="text-xs text-muted-foreground">{exp.location}</div>
                          ) : null}
                        </div>
                      </div>
                      <Badge variant="outline">{exp.period}</Badge>
                    </CardContent>
                  </Card>
                </Reveal>
              </li>
            ))}
          </ol>
        </section>

        <StepsSection />
        <FeaturesSection />
        {SHOW_RESULTS && <ResultsSection />}
        <PricingSection whatsappUrl={whatsappUrl} />
        <ComparisonSection />
        <FaqSection />

        <FinalCta whatsappUrl={whatsappUrl} />
      </main>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        <div className="mx-auto max-w-6xl space-y-2 px-4">
          <Logo className="justify-center" />
          <p>{COACH_INFO.tagline} — Coach Yosri</p>
          <p className="text-xs">© 2026 Coach Yosri · تونس · تدريب أونلاين وحضوري</p>
        </div>
      </footer>
    </div>
  );
}
