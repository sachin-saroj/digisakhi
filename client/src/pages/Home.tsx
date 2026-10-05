import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  BookOpen,
  Check,
  ChevronRight,
  CircleHelp,
  Clock3,
  ExternalLink,
  FileText,
  Flag,
  HeartHandshake,
  Home as HomeIcon,
  Languages,
  LockKeyhole,
  Menu,
  MessageCircle,
  Phone,
  PlayCircle,
  Plus,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  UserRound,
  Users,
  X,
  LogOut,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { analyzeSuspiciousMessage } from "@shared/safety";
import { getReportSubmissionOutcome } from "@shared/interaction";
import { scoreQuizAnswers } from "@shared/quiz";
import { trpc } from "@/lib/trpc";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";

const moduleDecorations: Record<
  string,
  { icon: typeof LockKeyhole; tint: string; duration: string }
> = {
  privacy: { icon: LockKeyhole, tint: "lavender", duration: "8 min" },
  scams: { icon: AlertTriangle, tint: "coral", duration: "10 min" },
  upi: { icon: ShieldCheck, tint: "teal", duration: "7 min" },
  photos: { icon: HeartHandshake, tint: "sand", duration: "9 min" },
};
const moduleCategoryHindi: Record<string, string> = {
  privacy: "सोशल मीडिया गोपनीयता",
  scams: "धोखाधड़ी और फ़िशिंग",
  upi: "UPI सुरक्षा",
  photos: "निजी जानकारी",
};

type QuizQuestion = {
  q: string;
  qHi: string;
  a: readonly string[];
  aHi: readonly string[];
  correct: number;
  explanation: string;
  explanationHi: string;
};
type ModuleView = {
  id: string;
  title: string;
  titleHi: string;
  category: string;
  categoryHi: string;
  desc: string;
  descHi: string;
  imageUrl?: string | null;
  videoUrl?: string | null;
  quizQuestions: readonly QuizQuestion[];
  icon: typeof LockKeyhole;
  tint: string;
  duration: string;
};

const moduleQuizzes: Record<string, readonly QuizQuestion[]> = {
  privacy: [
    {
      q: "Who should be able to see your personal photos?",
      qHi: "आपकी निजी तस्वीरें किसे दिखनी चाहिए?",
      a: ["Anyone online", "Only people you trust", "Every app on your phone"],
      aHi: [
        "ऑनलाइन हर व्यक्ति को",
        "सिर्फ़ भरोसेमंद लोगों को",
        "फ़ोन के हर ऐप को",
      ],
      correct: 1,
      explanation:
        "Privacy settings help you choose who can see your photos and updates.",
      explanationHi:
        "गोपनीयता सेटिंग्स से आप चुन सकते हैं कि आपकी तस्वीरें और अपडेट कौन देखे।",
    },
    {
      q: "What is safest before accepting a new friend request?",
      qHi: "नई मित्रता का अनुरोध स्वीकार करने से पहले सबसे सुरक्षित कदम क्या है?",
      a: [
        "Check the profile and shared connections",
        "Accept immediately",
        "Send your phone number first",
      ],
      aHi: [
        "प्रोफ़ाइल और साझा संपर्क जाँचें",
        "तुरंत स्वीकार करें",
        "पहले अपना फ़ोन नंबर भेजें",
      ],
      correct: 0,
      explanation:
        "A quick profile check can reveal fake or unfamiliar accounts.",
      explanationHi:
        "प्रोफ़ाइल की छोटी-सी जाँच नकली या अनजान खाते पहचानने में मदद कर सकती है।",
    },
    {
      q: "What should you do with a suspicious profile?",
      qHi: "संदिग्ध प्रोफ़ाइल के साथ आपको क्या करना चाहिए?",
      a: ["Share more details", "Report or block it", "Give it your OTP"],
      aHi: ["और जानकारी साझा करें", "रिपोर्ट या ब्लॉक करें", "अपना OTP दें"],
      correct: 1,
      explanation:
        "Reporting and blocking limits contact with accounts that feel unsafe.",
      explanationHi:
        "रिपोर्ट और ब्लॉक करने से असुरक्षित लगने वाले खातों का संपर्क सीमित होता है।",
    },
    {
      q: "When is it safer to share your live location?",
      qHi: "अपना लाइव स्थान साझा करना कब सुरक्षित है?",
      a: [
        "With every new follower",
        "Only with a trusted person when needed",
        "In a public post",
      ],
      aHi: [
        "हर नए फ़ॉलोअर के साथ",
        "ज़रूरत होने पर सिर्फ़ भरोसेमंद व्यक्ति के साथ",
        "सार्वजनिक पोस्ट में",
      ],
      correct: 1,
      explanation:
        "Limit live-location sharing to a trusted person and only for as long as needed.",
      explanationHi:
        "लाइव स्थान सिर्फ़ भरोसेमंद व्यक्ति के साथ और ज़रूरत की अवधि तक साझा करें।",
    },
    {
      q: "What is a good privacy habit for social apps?",
      qHi: "सोशल ऐप्स के लिए अच्छी गोपनीयता आदत कौन-सी है?",
      a: [
        "Review permissions regularly",
        "Use the same password everywhere",
        "Post identity documents publicly",
      ],
      aHi: [
        "अनुमतियों की नियमित समीक्षा करें",
        "हर जगह एक ही पासवर्ड रखें",
        "पहचान दस्तावेज़ सार्वजनिक करें",
      ],
      correct: 0,
      explanation:
        "Regular permission and privacy reviews help keep personal information within your control.",
      explanationHi:
        "अनुमतियों और गोपनीयता की नियमित समीक्षा निजी जानकारी पर आपका नियंत्रण बनाए रखती है।",
    },
  ],
  scams: [
    {
      q: "Someone asks for your UPI PIN to receive money. What should you do?",
      qHi: "कोई पैसे प्राप्त करने के लिए आपका UPI PIN माँगता है। आपको क्या करना चाहिए?",
      a: [
        "Share it if they sound genuine",
        "Never share it; a PIN is only for sending money",
        "Send a screenshot instead",
      ],
      aHi: [
        "अगर वे सच्चे लगें तो साझा करें",
        "कभी साझा न करें; PIN सिर्फ़ पैसे भेजने के लिए होता है",
        "इसके बजाय स्क्रीनशॉट भेजें",
      ],
      correct: 1,
      explanation:
        "A UPI PIN authorises payments out of your account. It is never needed to receive money.",
      explanationHi:
        "UPI PIN आपके खाते से पैसे भेजने की अनुमति देता है। पैसे प्राप्त करने के लिए इसकी ज़रूरत नहीं होती।",
    },
    {
      q: "Which link is safest to open?",
      qHi: "कौन-सा लिंक खोलना सबसे सुरक्षित है?",
      a: [
        "A link from a known official app or website you typed yourself",
        "A link with a prize and a deadline",
        "A link forwarded by an unknown number",
      ],
      aHi: [
        "जिस आधिकारिक ऐप या वेबसाइट का पता आपने खुद टाइप किया हो",
        "इनाम और समय-सीमा वाला लिंक",
        "अनजान नंबर से आया फ़ॉरवर्ड लिंक",
      ],
      correct: 0,
      explanation:
        "Type the official address yourself instead of trusting an unexpected link.",
      explanationHi:
        "अचानक आए लिंक पर भरोसा करने के बजाय आधिकारिक पता खुद टाइप करें।",
    },
    {
      q: "What is a good first step if a message feels urgent and scary?",
      qHi: "अगर संदेश बहुत ज़रूरी और डरावना लगे तो पहला कदम क्या होना चाहिए?",
      a: [
        "Forward it quickly",
        "Pause, verify independently and ask someone you trust",
        "Reply with your details",
      ],
      aHi: [
        "जल्दी से फ़ॉरवर्ड करें",
        "रुकें, स्वतंत्र रूप से जाँचें और भरोसेमंद व्यक्ति से पूछें",
        "अपनी जानकारी के साथ जवाब दें",
      ],
      correct: 1,
      explanation:
        "Urgency is often used to stop you from checking. A calm pause protects you.",
      explanationHi:
        "जल्दबाज़ी आपको जाँचने से रोकने के लिए इस्तेमाल की जाती है। शांत होकर रुकना आपकी रक्षा करता है।",
    },
    {
      q: "What should you do if a caller promises a refund after asking for screen sharing?",
      qHi: "अगर कोई कॉल करने वाला स्क्रीन शेयर करने के बदले रिफंड का वादा करे तो क्या करें?",
      a: [
        "Allow screen sharing",
        "End the call and contact the organisation through its official app",
        "Share your OTP to speed it up",
      ],
      aHi: [
        "स्क्रीन शेयर करने दें",
        "कॉल काटें और संस्था के आधिकारिक ऐप से संपर्क करें",
        "जल्दी के लिए OTP साझा करें",
      ],
      correct: 1,
      explanation:
        "Screen sharing can expose private information and payment activity.",
      explanationHi:
        "स्क्रीन शेयर करने से निजी जानकारी और भुगतान गतिविधि दिखाई दे सकती है।",
    },
    {
      q: "How should you check a message claiming your account is blocked?",
      qHi: "खाता बंद होने का दावा करने वाले संदेश की जाँच कैसे करें?",
      a: [
        "Use the number or link in the message",
        "Open the official app or website yourself",
        "Reply with your PIN",
      ],
      aHi: [
        "संदेश में दिए नंबर या लिंक का उपयोग करें",
        "आधिकारिक ऐप या वेबसाइट खुद खोलें",
        "अपने PIN के साथ जवाब दें",
      ],
      correct: 1,
      explanation:
        "Independent verification avoids links and phone numbers controlled by scammers.",
      explanationHi:
        "स्वतंत्र जाँच से उन लिंक और नंबरों से बचा जा सकता है जिन्हें ठग नियंत्रित करते हैं।",
    },
  ],
  upi: [
    {
      q: "When should you enter your UPI PIN?",
      qHi: "आपको UPI PIN कब दर्ज करना चाहिए?",
      a: [
        "Only when you are sending money",
        "Whenever someone asks",
        "To receive a refund",
      ],
      aHi: ["सिर्फ़ पैसे भेजते समय", "जब कोई माँगे तब", "रिफंड पाने के लिए"],
      correct: 0,
      explanation:
        "Your UPI PIN is for authorising money leaving your account, not for receiving money.",
      explanationHi:
        "UPI PIN खाते से पैसे जाने की अनुमति के लिए है, पैसे प्राप्त करने के लिए नहीं।",
    },
    {
      q: "What is the safest way to handle a collect request?",
      qHi: "कलेक्ट अनुरोध को संभालने का सबसे सुरक्षित तरीका क्या है?",
      a: [
        "Approve it without checking",
        "Check the name and amount before approving",
        "Share your PIN in chat",
      ],
      aHi: [
        "बिना जाँच स्वीकार करें",
        "स्वीकार करने से पहले नाम और राशि जाँचें",
        "चैट में अपना PIN साझा करें",
      ],
      correct: 1,
      explanation:
        "A collect request can take money from you, so review the payee and amount first.",
      explanationHi:
        "कलेक्ट अनुरोध से आपके पैसे जा सकते हैं, इसलिए पहले प्राप्तकर्ता और राशि जाँचें।",
    },
    {
      q: "Where should you find a bank’s customer-care number?",
      qHi: "बैंक का ग्राहक सेवा नंबर कहाँ ढूँढना चाहिए?",
      a: [
        "In the suspicious SMS",
        "On the bank’s official website or app",
        "From a random search result",
      ],
      aHi: [
        "संदिग्ध SMS में",
        "बैंक की आधिकारिक वेबसाइट या ऐप पर",
        "किसी अनजान खोज परिणाम से",
      ],
      correct: 1,
      explanation:
        "Use a trusted official source so a scammer cannot redirect your call.",
      explanationHi:
        "भरोसेमंद आधिकारिक स्रोत का उपयोग करें ताकि ठग आपकी कॉल को गलत जगह न भेज सकें।",
    },
    {
      q: "What should you do before scanning a QR code?",
      qHi: "QR कोड स्कैन करने से पहले क्या करना चाहिए?",
      a: [
        "Check the recipient and amount shown",
        "Scan any code promising a prize",
        "Enter your PIN in a chat",
      ],
      aHi: [
        "दिख रहे प्राप्तकर्ता और राशि जाँचें",
        "इनाम देने वाले किसी भी कोड को स्कैन करें",
        "चैट में अपना PIN डालें",
      ],
      correct: 0,
      explanation:
        "A QR scan can start a payment, so check who will receive the money before approving.",
      explanationHi:
        "QR स्कैन से भुगतान शुरू हो सकता है, इसलिए मंज़ूरी से पहले प्राप्तकर्ता जाँचें।",
    },
    {
      q: "What should you do if someone asks to install a remote-support app for a payment?",
      qHi: "भुगतान के लिए कोई रिमोट-सपोर्ट ऐप इंस्टॉल करने को कहे तो क्या करें?",
      a: [
        "Install it immediately",
        "Refuse and contact the official support channel",
        "Share your screen and OTP",
      ],
      aHi: [
        "तुरंत इंस्टॉल करें",
        "मना करें और आधिकारिक सहायता चैनल से संपर्क करें",
        "स्क्रीन और OTP साझा करें",
      ],
      correct: 1,
      explanation: "Remote access can expose your phone and payment details.",
      explanationHi:
        "रिमोट एक्सेस से आपका फ़ोन और भुगतान संबंधी जानकारी उजागर हो सकती है।",
    },
  ],
  photos: [
    {
      q: "Before sending an identity document, what should you ask?",
      qHi: "पहचान दस्तावेज़ भेजने से पहले क्या पूछना चाहिए?",
      a: [
        "Why it is needed and who will keep it",
        "Nothing; send it quickly",
        "Whether they also want your PIN",
      ],
      aHi: [
        "यह क्यों चाहिए और इसे कौन रखेगा",
        "कुछ नहीं; जल्दी भेज दें",
        "क्या उन्हें आपका PIN भी चाहिए",
      ],
      correct: 0,
      explanation:
        "Knowing the purpose and recipient helps you share less personal information.",
      explanationHi:
        "उद्देश्य और प्राप्तकर्ता जानने से आप कम निजी जानकारी साझा कर पाएँगे।",
    },
    {
      q: "What should you do with an unknown app requesting many permissions?",
      qHi: "बहुत सारी अनुमतियाँ माँगने वाले अनजान ऐप के साथ क्या करें?",
      a: [
        "Install it anyway",
        "Review permissions and avoid installing if they do not make sense",
        "Share your OTP with it",
      ],
      aHi: [
        "फिर भी इंस्टॉल करें",
        "अनुमतियाँ जाँचें और अनुचित लगें तो इंस्टॉल न करें",
        "इसके साथ OTP साझा करें",
      ],
      correct: 1,
      explanation:
        "Permissions should match what an app needs. Unnecessary access can expose your data.",
      explanationHi:
        "अनुमतियाँ ऐप की ज़रूरत के अनुरूप होनी चाहिए। अनावश्यक पहुँच आपका डेटा उजागर कर सकती है।",
    },
    {
      q: "Which is a safer habit for phone photos?",
      qHi: "फ़ोन की तस्वीरों के लिए सुरक्षित आदत कौन-सी है?",
      a: [
        "Keep every app’s access turned on",
        "Review app permissions regularly",
        "Post documents publicly",
      ],
      aHi: [
        "हर ऐप की पहुँच चालू रखें",
        "ऐप अनुमतियों की नियमित समीक्षा करें",
        "दस्तावेज़ सार्वजनिक रूप से पोस्ट करें",
      ],
      correct: 1,
      explanation:
        "Regular permission reviews keep apps from accessing more than they need.",
      explanationHi:
        "नियमित समीक्षा ऐप्स को ज़रूरत से अधिक पहुँच लेने से रोकती है।",
    },
    {
      q: "What is helpful before sharing a document photo?",
      qHi: "दस्तावेज़ की तस्वीर साझा करने से पहले क्या मददगार है?",
      a: [
        "Add a purpose watermark when appropriate",
        "Share the original with everyone",
        "Include your PIN in the image",
      ],
      aHi: [
        "ज़रूरत के अनुसार उद्देश्य वाला वॉटरमार्क जोड़ें",
        "मूल प्रति सभी के साथ साझा करें",
        "तस्वीर में अपना PIN शामिल करें",
      ],
      correct: 0,
      explanation:
        "A purpose watermark can make unauthorized reuse more difficult.",
      explanationHi:
        "उद्देश्य वाला वॉटरमार्क अनधिकृत दोबारा उपयोग को कठिन बना सकता है।",
    },
    {
      q: "What should you do when an app asks for camera access?",
      qHi: "जब कोई ऐप कैमरा एक्सेस माँगे तो क्या करें?",
      a: [
        "Allow it without checking",
        "Consider whether the feature needs a camera and choose accordingly",
        "Give it your password too",
      ],
      aHi: [
        "बिना जाँच अनुमति दें",
        "सोचें कि सुविधा को कैमरा चाहिए या नहीं और उसी अनुसार चुनें",
        "उसे अपना पासवर्ड भी दें",
      ],
      correct: 1,
      explanation: "Only grant permissions that match the app’s real purpose.",
      explanationHi:
        "सिर्फ़ वही अनुमति दें जो ऐप के वास्तविक उद्देश्य से मेल खाती हो।",
    },
  ],
};

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <svg
        width={compact ? 36 : 42}
        height={compact ? 36 : 42}
        viewBox="0 0 48 48"
        aria-label="DigiSakhi logo"
        role="img"
      >
        <defs>
          <linearGradient id="dg" x1="4" y1="4" x2="44" y2="44">
            <stop stopColor="#0F766E" />
            <stop offset="1" stopColor="#7C3AED" />
          </linearGradient>
        </defs>
        <path
          d="M24 4 40 10v12c0 10.5-6.8 18.8-16 22C14.8 40.8 8 32.5 8 22V10l16-6Z"
          fill="url(#dg)"
        />
        <rect
          x="17"
          y="14"
          width="14"
          height="22"
          rx="3"
          fill="none"
          stroke="white"
          strokeWidth="2"
        />
        <path
          d="M21 18h6M22 32h4"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="32.5" cy="11" r="3" fill="#F97316" />
      </svg>
      {!compact && (
        <div>
          <div className="font-display text-[1.35rem] leading-none tracking-[-.04em]">
            DigiSakhi
          </div>
          <div className="mt-1 text-[9px] uppercase tracking-[.22em] text-muted-foreground">
            digital safety companion
          </div>
        </div>
      )}
    </div>
  );
}

function Topbar({
  lang,
  setLang,
  user,
  onLogin,
  onLogout,
  onMenu,
  onAdminOpen,
}: {
  lang: "en" | "hi";
  setLang: (l: "en" | "hi") => void;
  user: { name?: string | null; role: "user" | "admin"; email?: string | null } | null;
  onLogin: () => void;
  onLogout: () => void;
  onMenu: () => void;
  onAdminOpen?: () => void;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-[#ded8cc] bg-[#faf9f4]/90 backdrop-blur-md">
      <div className="mx-auto flex h-[76px] max-w-[1320px] items-center justify-between px-5 lg:px-10">
        <Link href="/" aria-label="DigiSakhi home">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-8 text-[11px] font-semibold uppercase tracking-[.18em] text-[#5e625d] lg:flex">
          <a href="#learn" className="transition hover:text-[#0F766E]">
            {lang === "en" ? "Learn" : "सीखें"}
          </a>
          <a href="#toolkit" className="transition hover:text-[#0F766E]">
            {lang === "en" ? "Safety toolkit" : "सुरक्षा टूलकिट"}
          </a>
          <a href="#forum" className="transition hover:text-[#0F766E]">
            {lang === "en" ? "Community" : "समुदाय"}
          </a>
          {user?.role === "admin" && onAdminOpen ? (
            <button
              onClick={onAdminOpen}
              className="text-[#7C3AED] font-bold transition hover:opacity-80"
            >
              {lang === "en" ? "Admin Workspace" : "एडमिन कार्यक्षेत्र"}
            </button>
          ) : null}
        </nav>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLang(lang === "en" ? "hi" : "en")}
            className="hidden h-10 items-center gap-2 rounded-full border border-[#d6d0c5] px-3 text-xs font-semibold text-[#3c4542] transition hover:border-[#0F766E] sm:flex"
            aria-label="Switch language"
          >
            <Languages size={15} />
            {lang === "en" ? "हिंदी" : "English"}
          </button>
          {user ? (
            <div className="flex items-center gap-2.5">
              <div className="hidden flex-col items-end sm:flex leading-tight text-right">
                <span className="max-w-[140px] truncate text-xs font-bold text-[#18201e]">
                  {user.name || "Sakhi Member"}
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#0F766E]">
                  {user.role === "admin"
                    ? lang === "en"
                      ? "Coordinator (Admin)"
                      : "समन्वयक (एडमिन)"
                    : lang === "en"
                      ? "Member"
                      : "सखी सदस्य"}
                </span>
              </div>
              <div
                className="grid h-9 w-9 place-items-center rounded-full bg-[#0F766E] text-xs font-bold text-white shadow-sm"
                title={user.name || "User"}
              >
                {(user.name || "DS").slice(0, 2).toUpperCase()}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onLogout}
                className="rounded-full text-xs text-[#8b4024] hover:bg-[#fff0e8]"
                title={lang === "en" ? "Sign out" : "लॉगआउट"}
              >
                <LogOut size={15} />
                <span className="hidden md:inline ml-1">
                  {lang === "en" ? "Sign out" : "लॉगआउट"}
                </span>
              </Button>
            </div>
          ) : (
            <>
              <Button
                onClick={onLogin}
                className="hidden rounded-full bg-[#0F766E] px-5 text-sm hover:bg-[#0b625c] sm:flex"
              >
                {lang === "en" ? "Member sign in" : "सदस्य लॉगिन"}
              </Button>
              <Button
                onClick={onLogin}
                size="sm"
                className="rounded-full bg-[#0F766E] px-3 text-xs hover:bg-[#0b625c] sm:hidden"
              >
                {lang === "en" ? "Sign in" : "लॉगिन"}
              </Button>
            </>
          )}
          <button
            onClick={onMenu}
            className="rounded-full p-2.5 text-[#37423f] transition hover:bg-[#eeeae1] lg:hidden"
            aria-label="Open menu"
          >
            <Menu size={21} />
          </button>
        </div>
      </div>
    </header>
  );
}

function QuickExit({ lang }: { lang: "en" | "hi" }) {
  return (
    <button
      onClick={() => {
        window.location.href = "https://weather.com";
      }}
      className="fixed bottom-3 right-3 z-50 flex items-center gap-2 rounded-full bg-[#f97316] px-4 py-3 text-xs font-bold uppercase tracking-[.12em] text-white shadow-lg shadow-orange-900/20 transition hover:scale-[1.02] sm:bottom-4 sm:right-4"
      aria-label={
        lang === "en"
          ? "Quick exit to a neutral website"
          : "तुरंत सुरक्षित वेबसाइट पर जाएँ"
      }
      title={
        lang === "en"
          ? "Leave DigiSakhi quickly"
          : "DigiSakhi से जल्दी बाहर निकलें"
      }
    >
      <Zap size={14} fill="currentColor" />{" "}
      {lang === "en" ? "Quick exit" : "जल्दी बाहर निकलें"}
    </button>
  );
}

function LoginModal({ close, lang }: { close: () => void; lang: "en" | "hi" }) {
  const [tab, setTab] = useState<"demo" | "phone" | "register">("demo");
  const utils = trpc.useUtils();

  // State for Phone/Direct Login
  const [identifier, setIdentifier] = useState("");
  const [loginRole, setLoginRole] = useState<"user" | "admin">("user");

  // State for Registration
  const [regName, setRegName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regGroup, setRegGroup] = useState("");
  const [regRole, setRegRole] = useState<"user" | "admin">("user");

  const demoLoginMutation = trpc.auth.demoLogin.useMutation({
    onSuccess: (data) => {
      toast.success(
        lang === "en"
          ? `Welcome back, ${data.user.name}!`
          : `स्वागत है, ${data.user.name}!`
      );
      void utils.auth.me.invalidate();
      void utils.digisakhi.progress.invalidate();
      void utils.digisakhi.profile.invalidate();
      close();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to sign in");
    },
  });

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      toast.success(
        lang === "en"
          ? `Welcome back, ${data.user.name}!`
          : `स्वागत है, ${data.user.name}!`
      );
      void utils.auth.me.invalidate();
      void utils.digisakhi.progress.invalidate();
      void utils.digisakhi.profile.invalidate();
      close();
    },
    onError: (err) => {
      toast.error(err.message || "Login failed");
    },
  });

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: (data) => {
      toast.success(
        lang === "en"
          ? `Registration complete! Welcome, ${data.user.name}!`
          : `पंजीकरण पूरा हुआ! स्वागत है, ${data.user.name}!`
      );
      void utils.auth.me.invalidate();
      void utils.digisakhi.progress.invalidate();
      void utils.digisakhi.profile.invalidate();
      close();
    },
    onError: (err) => {
      toast.error(err.message || "Registration failed");
    },
  });

  const isPending =
    demoLoginMutation.isPending ||
    loginMutation.isPending ||
    registerMutation.isPending;

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      toast.error(
        lang === "en"
          ? "Please enter your phone number or name"
          : "कृपया मोबाइल नंबर या नाम दर्ज करें"
      );
      return;
    }
    loginMutation.mutate({
      identifier: identifier.trim(),
      role: loginRole,
    });
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || regName.trim().length < 2) {
      toast.error(
        lang === "en"
          ? "Please enter your full name"
          : "कृपया अपना पूरा नाम दर्ज करें"
      );
      return;
    }
    if (!regPhone.trim() || regPhone.trim().length < 10) {
      toast.error(
        lang === "en"
          ? "Please enter a valid 10-digit mobile number"
          : "कृपया वैध 10 अंकों का मोबाइल नंबर दर्ज करें"
      );
      return;
    }
    registerMutation.mutate({
      name: regName.trim(),
      phone: regPhone.trim(),
      shgGroup: regGroup.trim() || "Mahila Bachat Gat",
      role: regRole,
      preferredLanguage: lang,
    });
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-[#15201d]/50 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-title"
        className="relative max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-[28px] border border-[#e5dfd2] bg-[#fffdf8] p-6 sm:p-8 shadow-2xl"
      >
        <button
          onClick={close}
          className="absolute right-5 top-5 rounded-full p-2 hover:bg-[#f3efe7]"
          aria-label="Close"
        >
          <X size={18} />
        </button>
        <Logo compact />

        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-[.2em] text-[#0F766E]">
            {lang === "en"
              ? "Self-Hosted & Secure Access"
              : "सुरक्षित एवं सीधा प्रवेश"}
          </p>
          <h2
            id="login-title"
            className="font-display mt-1 text-3xl sm:text-4xl leading-tight"
          >
            {lang === "en" ? "Sign in to DigiSakhi" : "डिजीसखी में प्रवेश करें"}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {lang === "en"
              ? "Access modules, test results, certificates, and community forum."
              : "पाठ, परीक्षा परिणाम, प्रमाणपत्र और समुदाय तक पहुँचें।"}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="mt-5 grid grid-cols-3 gap-1 rounded-2xl bg-[#efebe2] p-1.5 text-xs font-bold">
          <button
            type="button"
            onClick={() => setTab("demo")}
            className={cn(
              "rounded-xl py-2 transition",
              tab === "demo"
                ? "bg-white text-[#0F766E] shadow-sm"
                : "text-[#626965] hover:text-[#18201e]"
            )}
          >
            ⚡ {lang === "en" ? "1-Click Demo" : "त्वरित प्रवेश"}
          </button>
          <button
            type="button"
            onClick={() => setTab("phone")}
            className={cn(
              "rounded-xl py-2 transition",
              tab === "phone"
                ? "bg-white text-[#0F766E] shadow-sm"
                : "text-[#626965] hover:text-[#18201e]"
            )}
          >
            📱 {lang === "en" ? "Phone Login" : "मोबाइल लॉगिन"}
          </button>
          <button
            type="button"
            onClick={() => setTab("register")}
            className={cn(
              "rounded-xl py-2 transition",
              tab === "register"
                ? "bg-white text-[#0F766E] shadow-sm"
                : "text-[#626965] hover:text-[#18201e]"
            )}
          >
            ✍️ {lang === "en" ? "Register" : "पंजीकरण"}
          </button>
        </div>

        {/* Tab 1: 1-Click Demo Access (Viva & Instant Test) */}
        {tab === "demo" && (
          <div className="mt-5 space-y-3.5">
            <div className="rounded-xl bg-[#e1eee8]/60 p-3 text-xs text-[#285749] leading-relaxed">
              💡{" "}
              {lang === "en"
                ? "One-click login for evaluation and instant access without passwords."
                : "मूल्यांकन और त्वरित जाँच के लिए एक-क्लिक लॉगिन।"}
            </div>

            {/* Member Card */}
            <div className="rounded-2xl border-2 border-[#0F766E]/20 bg-[#f4faf8] p-4 text-left transition hover:border-[#0F766E] hover:shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-[#0F766E] text-white">
                    <UserRound size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#164e63]">
                      Radha Devi (राधा देवी)
                    </h4>
                    <p className="text-xs text-[#0F766E]">
                      Gulab Mahila Bachat Gat
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-[#ccfbf1] px-2.5 py-1 text-[11px] font-bold text-[#0F766E]">
                  {lang === "en" ? "Member" : "सदस्य"}
                </span>
              </div>
              <p className="mt-2.5 text-xs text-[#475569] leading-relaxed">
                {lang === "en"
                  ? "Standard Sakhi profile: take safety quizzes, track synced learning, and earn completion certificates."
                  : "सखी सदस्य प्रोफाइल: क्विज़ हल करें, प्रगति सिंक करें और प्रमाणपत्र पाएँ।"}
              </p>
              <Button
                disabled={isPending}
                onClick={() => demoLoginMutation.mutate({ role: "user" })}
                className="mt-3.5 h-11 w-full rounded-xl bg-[#0F766E] text-xs font-bold hover:bg-[#0b625c]"
              >
                {demoLoginMutation.isPending &&
                demoLoginMutation.variables?.role === "user"
                  ? lang === "en"
                    ? "Signing in…"
                    : "प्रवेश हो रहा है…"
                  : lang === "en"
                    ? "Sign in as Sakhi Member (Radha Devi)"
                    : "सखी सदस्य के रूप में प्रवेश करें (राधा देवी)"}
                <ArrowRight size={15} className="ml-1.5" />
              </Button>
            </div>

            {/* Coordinator / Admin Card */}
            <div className="rounded-2xl border-2 border-[#7C3AED]/20 bg-[#faf5ff] p-4 text-left transition hover:border-[#7C3AED] hover:shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-[#7C3AED] text-white">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#581c87]">
                      Pooja Sharma (पूजा शर्मा)
                    </h4>
                    <p className="text-xs text-[#7C3AED]">
                      District Federation Coordinator
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-[#f3e8ff] px-2.5 py-1 text-[11px] font-bold text-[#7C3AED]">
                  {lang === "en" ? "Admin" : "एडमिन"}
                </span>
              </div>
              <p className="mt-2.5 text-xs text-[#475569] leading-relaxed">
                {lang === "en"
                  ? "Coordinator access: broadcast urgent safety notices, manage learning modules, and review incident reports."
                  : "समन्वयक अधिकार: तत्काल अलर्ट जारी करें, मॉड्यूल प्रबंधित करें और रिपोर्ट की समीक्षा करें।"}
              </p>
              <Button
                disabled={isPending}
                onClick={() => demoLoginMutation.mutate({ role: "admin" })}
                className="mt-3.5 h-11 w-full rounded-xl bg-[#7C3AED] text-xs font-bold hover:bg-[#6d28d9]"
              >
                {demoLoginMutation.isPending &&
                demoLoginMutation.variables?.role === "admin"
                  ? lang === "en"
                    ? "Signing in…"
                    : "प्रवेश हो रहा है…"
                  : lang === "en"
                    ? "Sign in as Coordinator / Admin (Pooja Sharma)"
                    : "समन्वयक / एडमिन के रूप में प्रवेश करें (पूजा शर्मा)"}
                <ArrowRight size={15} className="ml-1.5" />
              </Button>
            </div>
          </div>
        )}

        {/* Tab 2: Mobile / Direct Login */}
        {tab === "phone" && (
          <form onSubmit={handlePhoneSubmit} className="mt-5 space-y-4">
            <div>
              <label className="text-xs font-bold text-[#343e3a]">
                {lang === "en"
                  ? "Mobile Number or Username"
                  : "मोबाइल नंबर या नाम"}
              </label>
              <Input
                type="text"
                placeholder={
                  lang === "en"
                    ? "e.g. 9876543210 or your name"
                    : "उदा. 9876543210 या आपका नाम"
                }
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="mt-1.5 h-11 rounded-xl border-[#dcd5c9] bg-white text-sm"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#343e3a]">
                {lang === "en" ? "Select Role" : "अपनी भूमिका चुनें"}
              </label>
              <div className="mt-1.5 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setLoginRole("user")}
                  className={cn(
                    "rounded-xl border p-2.5 text-xs font-bold text-center transition",
                    loginRole === "user"
                      ? "border-[#0F766E] bg-[#f0f9f6] text-[#0F766E]"
                      : "border-[#e0dad0] bg-white text-[#525d58] hover:bg-[#fbf9f4]"
                  )}
                >
                  {lang === "en" ? "Sakhi Member" : "सखी सदस्य"}
                </button>
                <button
                  type="button"
                  onClick={() => setLoginRole("admin")}
                  className={cn(
                    "rounded-xl border p-2.5 text-xs font-bold text-center transition",
                    loginRole === "admin"
                      ? "border-[#7C3AED] bg-[#faf5ff] text-[#7C3AED]"
                      : "border-[#e0dad0] bg-white text-[#525d58] hover:bg-[#fbf9f4]"
                  )}
                >
                  {lang === "en" ? "Coordinator / Admin" : "समन्वयक / एडमिन"}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isPending}
              className="mt-2 h-11 w-full rounded-xl bg-[#0F766E] text-sm font-bold hover:bg-[#0b625c]"
            >
              {loginMutation.isPending
                ? lang === "en"
                  ? "Signing in…"
                  : "साइन इन हो रहा है…"
                : lang === "en"
                  ? "Continue to DigiSakhi"
                  : "डिजीसखी में प्रवेश करें"}
              <ArrowRight size={16} className="ml-1.5" />
            </Button>
          </form>
        )}

        {/* Tab 3: New Sakhi Registration */}
        {tab === "register" && (
          <form onSubmit={handleRegisterSubmit} className="mt-5 space-y-3.5">
            <div>
              <label className="text-xs font-bold text-[#343e3a]">
                {lang === "en" ? "Full Name" : "पूरा नाम"}
              </label>
              <Input
                type="text"
                placeholder={
                  lang === "en" ? "e.g. Sunita Patil" : "उदा. सुनीता पाटिल"
                }
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                className="mt-1 h-10 rounded-xl border-[#dcd5c9] bg-white text-sm"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#343e3a]">
                {lang === "en" ? "Mobile Number" : "मोबाइल नंबर"}
              </label>
              <Input
                type="tel"
                placeholder="10 digit phone number"
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value)}
                className="mt-1 h-10 rounded-xl border-[#dcd5c9] bg-white text-sm"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#343e3a]">
                {lang === "en"
                  ? "Self Help Group (SHG) Name"
                  : "स्वयं सहायता समूह का नाम"}
              </label>
              <Input
                type="text"
                placeholder={
                  lang === "en"
                    ? "e.g. Pragati Mahila Bachat Gat"
                    : "उदा. प्रगति महिला बचत गट"
                }
                value={regGroup}
                onChange={(e) => setRegGroup(e.target.value)}
                className="mt-1 h-10 rounded-xl border-[#dcd5c9] bg-white text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#343e3a]">
                {lang === "en" ? "Role" : "भूमिका"}
              </label>
              <div className="mt-1 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRegRole("user")}
                  className={cn(
                    "rounded-xl border p-2 text-xs font-bold text-center transition",
                    regRole === "user"
                      ? "border-[#0F766E] bg-[#f0f9f6] text-[#0F766E]"
                      : "border-[#e0dad0] bg-white text-[#525d58]"
                  )}
                >
                  {lang === "en" ? "Sakhi Member" : "सखी सदस्य"}
                </button>
                <button
                  type="button"
                  onClick={() => setRegRole("admin")}
                  className={cn(
                    "rounded-xl border p-2 text-xs font-bold text-center transition",
                    regRole === "admin"
                      ? "border-[#7C3AED] bg-[#faf5ff] text-[#7C3AED]"
                      : "border-[#e0dad0] bg-white text-[#525d58]"
                  )}
                >
                  {lang === "en" ? "SHG Coordinator" : "समन्वयक / एडमिन"}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isPending}
              className="mt-3 h-11 w-full rounded-xl bg-[#0F766E] text-sm font-bold hover:bg-[#0b625c]"
            >
              {registerMutation.isPending
                ? lang === "en"
                  ? "Registering…"
                  : "पंजीकरण हो रहा है…"
                : lang === "en"
                  ? "Register & Sign In"
                  : "पंजीकरण करें और प्रवेश करें"}
              <ArrowRight size={16} className="ml-1.5" />
            </Button>
          </form>
        )}

        <div className="mt-6 border-t border-[#ede7dd] pt-4 text-center">
          <p className="text-[11px] text-muted-foreground flex items-center justify-center gap-1.5">
            <ShieldCheck size={14} className="text-[#0F766E]" />
            {lang === "en"
              ? "Self-hosted secure login · TiDB Cloud database"
              : "सुरक्षित सीधा लॉगिन · TiDB क्लाउड डेटाबेस"}
          </p>
        </div>
      </div>
    </div>
  );
}

function ModuleModal({
  module,
  close,
  lang,
  isAuthenticated,
  onCompleted,
}: {
  module: ModuleView;
  close: () => void;
  lang: "en" | "hi";
  isAuthenticated: boolean;
  onCompleted: () => void;
}) {
  const questions = module.quizQuestions;
  const [step, setStep] = useState<"lesson" | "quiz" | "review">("lesson");
  const [answer, setAnswer] = useState<number | null>(null);
  const [submittedAnswer, setSubmittedAnswer] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [completionAttempted, setCompletionAttempted] = useState(false);
  const [answers, setAnswers] = useState<
    Array<{ selected: number; correct: number }>
  >([]);
  const completeModule = trpc.digisakhi.completeModule.useMutation({
    onSuccess: () => {
      onCompleted();
      setStep("review");
    },
    onError: () => {
      setCompletionAttempted(false);
      toast.error(
        lang === "en"
          ? "We could not save your progress. Please try again."
          : "आपकी प्रगति सुरक्षित नहीं हो सकी। फिर से कोशिश करें।"
      );
    },
  });
  const question = questions[questionIndex];
  const finishQuestion = () => {
    if (answer === null) return;
    if (questionIndex === questions.length - 1 && completionAttempted) return;
    const current = { selected: answer, correct: question.correct };
    const nextAnswers = [...answers, current];
    const nextScore = scoreQuizAnswers(
      [...nextAnswers].map(item => item.selected),
      questions.slice(0, nextAnswers.length).map(item => item.correct)
    ).score;
    setAnswers(nextAnswers);
    setScore(nextScore);
    if (questionIndex < questions.length - 1) {
      setQuestionIndex(questionIndex + 1);
      setAnswer(null);
      setSubmittedAnswer(false);
      return;
    }
    if (isAuthenticated) {
      setCompletionAttempted(true);
      completeModule.mutate({
        moduleId: module.id,
        quizScore: nextScore,
        questionCount: 5,
        answers: nextAnswers,
      });
    } else {
      setStep("review");
      toast.info(
        lang === "en"
          ? "Sign in to save this quiz attempt and your progress."
          : "इस क्विज़ प्रयास और प्रगति को सुरक्षित करने के लिए साइन इन करें।"
      );
    }
  };
  const reset = () => {
    setStep("lesson");
    setQuestionIndex(0);
    setAnswer(null);
    setSubmittedAnswer(false);
    setScore(0);
    setCompletionAttempted(false);
    setAnswers([]);
  };
  const displayQuestion = (item: QuizQuestion) =>
    lang === "en" ? item.q : item.qHi;
  const displayOptions = (item: QuizQuestion) =>
    lang === "en" ? item.a : item.aHi;
  const displayExplanation = (item: QuizQuestion) =>
    lang === "en" ? item.explanation : item.explanationHi;
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#15201d]/40 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="module-title"
        className="mx-auto mt-4 max-h-[calc(100dvh-2rem)] max-w-2xl overflow-y-auto rounded-[28px] border border-[#e5dfd2] bg-[#fffdf8] p-5 shadow-2xl sm:mt-10 sm:p-10"
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="eyebrow text-[#0F766E]">
              {lang === "en" ? module.category : module.categoryHi}
            </div>
            <h2
              id="module-title"
              className="font-display mt-3 text-4xl leading-none tracking-[-.05em] sm:text-5xl"
            >
              {lang === "en" ? module.title : module.titleHi}
            </h2>
          </div>
          <button
            onClick={close}
            className="rounded-full p-2 hover:bg-[#f3efe7]"
            aria-label={lang === "en" ? "Close lesson" : "पाठ बंद करें"}
          >
            <X size={18} />
          </button>
        </div>
        {step === "lesson" && (
          <>
            {module.imageUrl ? (
              <img
                src={module.imageUrl}
                alt={lang === "en" ? module.title : module.titleHi}
                className="mt-7 max-h-72 w-full rounded-2xl object-cover"
              />
            ) : null}
            {module.videoUrl ? (
              <video
                className="mt-7 w-full rounded-2xl"
                controls
                preload="metadata"
                src={module.videoUrl}
              />
            ) : null}
            <div className="mt-8 rounded-2xl bg-[#e1eee8] p-6">
              <div className="flex gap-4">
                <ShieldCheck className="mt-1 text-[#0F766E]" />
                <div>
                  <h3 className="font-display text-3xl">
                    {lang === "en"
                      ? "A pause is a superpower."
                      : "रुकना आपकी ताकत है।"}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-[#47635a]">
                    {lang === "en" ? module.desc : module.descHi}
                  </p>
                </div>
              </div>
            </div>
            {!module.imageUrl && !module.videoUrl ? (
              <p className="mt-4 text-xs text-muted-foreground">
                {lang === "en"
                  ? "This lesson has no media attached yet. Read the guidance below and continue to the knowledge check."
                  : "इस पाठ में अभी मीडिया नहीं जुड़ा है। नीचे दिया मार्गदर्शन पढ़ें और ज्ञान जाँच शुरू करें।"}
              </p>
            ) : null}
            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              {(lang === "en"
                ? [
                    "Pause before you act",
                    "Verify from the source",
                    "Ask someone you trust",
                  ]
                : [
                    "काम से पहले रुकें",
                    "स्रोत से जाँचें",
                    "भरोसेमंद व्यक्ति से पूछें",
                  ]
              ).map((item, i) => (
                <div
                  className="rounded-xl border border-[#e5dfd2] p-4"
                  key={item}
                >
                  <div className="font-display text-2xl text-[#7c3aed]">
                    0{i + 1}
                  </div>
                  <p className="mt-3 text-sm font-semibold">{item}</p>
                </div>
              ))}
            </div>
            <Button
              onClick={() => setStep("quiz")}
              className="mt-8 h-12 w-full rounded-xl bg-[#0F766E]"
            >
              {lang === "en"
                ? "Take the 5-question check"
                : "5 सवालों की जाँच शुरू करें"}{" "}
              <ArrowRight size={16} />
            </Button>
          </>
        )}
        {step === "quiz" && question && (
          <>
            <div className="mt-8">
              <div className="eyebrow">
                {lang === "en" ? "knowledge check" : "ज्ञान जाँच"} /{" "}
                {String(questionIndex + 1).padStart(2, "0")} of 05
              </div>
              <h3 className="font-display mt-3 text-3xl">
                {displayQuestion(question)}
              </h3>
              <div className="mt-6 space-y-3">
                {displayOptions(question).map((option, i) => (
                  <button
                    key={option}
                    disabled={submittedAnswer}
                    onClick={() => setAnswer(i)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl border p-4 text-left text-sm transition",
                      submittedAnswer && i === question.correct
                        ? "border-[#2d8a65] bg-[#e1eee8]"
                        : submittedAnswer && answer === i
                          ? "border-[#c85e3c] bg-[#fff0e8]"
                          : answer === i
                            ? "border-[#0F766E] bg-[#e1eee8]"
                            : "border-[#e5dfd2] hover:border-[#0F766E]"
                    )}
                  >
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-current text-xs">
                      {String.fromCharCode(65 + i)}
                    </span>
                    {option}
                  </button>
                ))}
              </div>
              {submittedAnswer ? (
                <div
                  role="status"
                  aria-live="polite"
                  className={cn(
                    "mt-5 rounded-xl p-4 text-sm leading-relaxed",
                    answer === question.correct
                      ? "bg-[#e1eee8] text-[#216348]"
                      : "bg-[#fff0e8] text-[#8b4024]"
                  )}
                >
                  <strong>
                    {answer === question.correct
                      ? lang === "en"
                        ? "Correct!"
                        : "सही जवाब!"
                      : lang === "en"
                        ? "Not quite."
                        : "पूरी तरह सही नहीं।"}
                  </strong>{" "}
                  {answer !== question.correct ? (
                    <>
                      {lang === "en" ? "Correct answer: " : "सही जवाब: "}
                      {displayOptions(question)[question.correct]}.{" "}
                    </>
                  ) : null}
                  {displayExplanation(question)}
                </div>
              ) : null}
            </div>
            <Button
              disabled={
                answer === null ||
                completeModule.isPending ||
                (questionIndex === questions.length - 1 && completionAttempted)
              }
              onClick={() =>
                submittedAnswer ? finishQuestion() : setSubmittedAnswer(true)
              }
              className="mt-8 h-12 w-full rounded-xl bg-[#7c3aed]"
            >
              {completeModule.isPending
                ? lang === "en"
                  ? "Saving attempt…"
                  : "प्रयास सुरक्षित हो रहा है…"
                : submittedAnswer
                  ? questionIndex < 4
                    ? lang === "en"
                      ? "Next question"
                      : "अगला सवाल"
                    : lang === "en"
                      ? "See my review"
                      : "अपनी समीक्षा देखें"
                  : lang === "en"
                    ? "Check answer"
                    : "जवाब जाँचें"}{" "}
              <ArrowRight size={16} />
            </Button>
          </>
        )}
        {step === "review" && (
          <div className="py-7">
            <div className="text-center">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#dcebe6] text-[#0F766E]">
                <Check size={30} />
              </div>
              <div className="eyebrow mt-6 text-[#0F766E]">
                {lang === "en"
                  ? "quiz review / शाबाश"
                  : "क्विज़ समीक्षा / शाबाश"}
              </div>
              <h3 className="font-display mt-3 text-5xl">
                {lang === "en"
                  ? `You scored ${score} of 5`
                  : `आपका स्कोर 5 में से ${score}`}
              </h3>
              <div className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm font-semibold text-[#47635a]">
                <span>
                  {lang === "en" ? "Percentage" : "प्रतिशत"}:{" "}
                  {
                    scoreQuizAnswers(
                      answers.map(item => item.selected),
                      questions.map(item => item.correct)
                    ).percentage
                  }
                  %
                </span>
                <span>
                  {lang === "en" ? "Correct" : "सही"}:{" "}
                  {
                    scoreQuizAnswers(
                      answers.map(item => item.selected),
                      questions.map(item => item.correct)
                    ).correct
                  }
                </span>
                <span>
                  {lang === "en" ? "Wrong" : "गलत"}:{" "}
                  {
                    scoreQuizAnswers(
                      answers.map(item => item.selected),
                      questions.map(item => item.correct)
                    ).wrong
                  }
                </span>
              </div>
              <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
                {isAuthenticated
                  ? lang === "en"
                    ? "This attempt and your progress are saved to your account."
                    : "यह प्रयास और आपकी प्रगति आपके खाते में सुरक्षित हैं।"
                  : lang === "en"
                    ? "Sign in to save this attempt and your progress."
                    : "इस प्रयास और प्रगति को सुरक्षित करने के लिए साइन इन करें।"}
              </p>
            </div>
            <div className="mt-7 space-y-3">
              {questions.map((item, index) => {
                const response = answers[index];
                const options = displayOptions(item);
                return (
                  <div
                    key={item.q}
                    className="rounded-xl border border-[#e5dfd2] p-4 text-sm"
                  >
                    <div className="font-semibold">
                      {index + 1}. {displayQuestion(item)}
                    </div>
                    <div className="mt-2 grid gap-1 text-xs">
                      <span
                        className={
                          response?.selected === item.correct
                            ? "text-[#216348]"
                            : "text-[#8b4024]"
                        }
                      >
                        {lang === "en" ? "Your answer:" : "आपका जवाब:"}{" "}
                        {response
                          ? options[response.selected]
                          : lang === "en"
                            ? "Not answered"
                            : "जवाब नहीं दिया"}
                      </span>
                      <span className="text-[#216348]">
                        {lang === "en" ? "Correct answer:" : "सही जवाब:"}{" "}
                        {options[item.correct]}
                      </span>
                      <span className="text-muted-foreground">
                        {displayExplanation(item)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button
                onClick={reset}
                variant="outline"
                className="rounded-full"
              >
                {lang === "en" ? "Retry quiz" : "क्विज़ फिर से दें"}
              </Button>
              <Button onClick={close} className="rounded-full bg-[#0F766E]">
                {lang === "en" ? "Back to learning" : "सीखने पर वापस जाएँ"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Hero({
  lang,
  isAuthenticated,
  onLogin,
  topicCount,
}: {
  lang: "en" | "hi";
  isAuthenticated?: boolean;
  onLogin: () => void;
  topicCount: number;
}) {
  const handleStartLearning = () => {
    if (isAuthenticated) {
      const el = document.getElementById("learn");
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      } else {
        window.location.hash = "learn";
      }
    } else {
      onLogin();
    }
  };

  return (
    <section className="overflow-hidden border-b border-[#ded8cc]">
      <div className="mx-auto grid max-w-[1320px] gap-12 px-5 pb-20 pt-14 lg:grid-cols-[1.1fr_.9fr] lg:px-10 lg:pb-28 lg:pt-24">
        <div className="relative z-10">
          <div className="mb-7 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[.25em] text-[#0F766E]">
            <span className="h-px w-10 bg-[#0F766E]" /> made for every sakhi
          </div>
          <h1 className="font-display max-w-[760px] text-[clamp(4rem,9vw,8.7rem)] leading-[.82] tracking-[-.07em] text-[#18201e]">
            Feel safer.
            <br />
            <em className="text-[#7C3AED]">Every day.</em>
          </h1>
          <p className="mt-10 max-w-[540px] font-serif text-[1.25rem] leading-relaxed text-[#66706b]">
            {lang === "en"
              ? "Simple, friendly guidance for smarter phones, safer payments and a stronger community."
              : "स्मार्टफोन, सुरक्षित भुगतान और मजबूत समुदाय के लिए सरल और भरोसेमंद मार्गदर्शन।"}
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Button
              onClick={handleStartLearning}
              className="h-13 rounded-full bg-[#0F766E] px-7 text-sm font-bold hover:bg-[#0b625c]"
            >
              {lang === "en" ? "Start learning" : "सीखना शुरू करें"}{" "}
              <ArrowRight size={17} />
            </Button>
            <a
              href="#learn"
              className="flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold text-[#3f4a46] transition hover:bg-[#eeeae1]"
            >
              {lang === "en" ? "Explore modules" : "मॉड्यूल देखें"}{" "}
              <ChevronRight size={16} />
            </a>
          </div>
          <div className="mt-14 flex items-center gap-7 border-t border-[#ded8cc] pt-5 text-xs text-[#727873]">
            <div>
              <strong className="font-display text-3xl text-[#18201e]">
                {topicCount}
              </strong>
              <span className="ml-2">safety topics</span>
            </div>
            <div className="h-7 w-px bg-[#ded8cc]" />
            <div>
              <strong className="font-display text-3xl text-[#18201e]">
                181
              </strong>
              <span className="ml-2">women’s helpline</span>
            </div>
          </div>
        </div>
        <div className="relative min-h-[380px] lg:min-h-0">
          <div className="absolute right-0 top-0 h-[390px] w-[88%] rounded-[48%_48%_12%_12%] bg-[#ded8f6] lg:h-[500px]" />
          <div className="absolute bottom-0 right-[8%] h-[90%] w-[70%] rounded-t-[45%] bg-gradient-to-br from-[#0f766e] to-[#7c3aed] opacity-95" />
          <div className="absolute right-[20%] top-[17%] flex h-56 w-40 rotate-6 items-center justify-center rounded-[28px] border-[8px] border-[#faf9f4] bg-[#1d3632] shadow-2xl lg:h-72 lg:w-52">
            <div className="h-[88%] w-[88%] rounded-[20px] bg-[#f8f2e7] p-4">
              <div className="flex items-center justify-between text-[#0F766E]">
                <ShieldCheck size={24} />
                <span className="h-2 w-2 rounded-full bg-[#F97316]" />
              </div>
              <div className="mt-7 text-left font-display text-3xl leading-[.9] text-[#1b2724]">
                You’re
                <br />
                <em className="text-[#7C3AED]">in control.</em>
              </div>
              <div className="mt-7 h-2 rounded bg-[#d9e6dd]" />
              <div className="mt-2 h-2 w-2/3 rounded bg-[#d9e6dd]" />
            </div>
          </div>
          <div className="absolute bottom-7 left-3 rounded-2xl border border-white/50 bg-[#fffdf8]/90 p-4 shadow-xl backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-[#e4f0e8] text-[#0F766E]">
                <Check size={18} />
              </div>
              <div>
                <div className="text-sm font-bold">Lesson complete</div>
                <div className="text-xs text-muted-foreground">
                  Privacy basics
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Dashboard({
  lang,
  setView,
  modules,
  progress,
  isAuthenticated,
  isLoading,
  isError,
}: {
  lang: "en" | "hi";
  setView: (v: string) => void;
  modules: ModuleView[];
  progress?: Array<{
    moduleId: string;
    quizScore: number;
    questionCount: number;
  }>;
  isAuthenticated: boolean;
  isLoading: boolean;
  isError: boolean;
}) {
  const completedModules = new Set((progress ?? []).map(item => item.moduleId));
  const completedCount = modules.filter(module =>
    completedModules.has(module.id)
  ).length;
  const percent = modules.length
    ? Math.round((completedCount / modules.length) * 100)
    : 0;
  return (
    <section className="bg-[#f0ece3] py-16" id="learn">
      <div className="mx-auto max-w-[1320px] px-5 lg:px-10">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <div className="eyebrow">your learning space / 01</div>
            <h2 className="font-display mt-3 text-5xl leading-none tracking-[-.05em] text-[#18201e]">
              {lang === "en" ? (
                <>
                  A little safer,
                  <br />
                  <em className="text-[#0F766E]">one lesson at a time.</em>
                </>
              ) : (
                <>
                  हर दिन थोड़ा सुरक्षित,
                  <br />
                  <em className="text-[#0F766E]">एक पाठ के साथ।</em>
                </>
              )}
            </h2>
          </div>
          <div className="flex items-center gap-3 rounded-full border border-[#d2cbc0] bg-[#faf9f4] px-4 py-3 text-left">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-[#d6e9de] text-sm font-bold text-[#0F766E]">
              {isAuthenticated ? "DS" : "—"}
            </div>
            <div>
              <div className="text-sm font-bold">
                {isAuthenticated
                  ? lang === "en"
                    ? "My learning space"
                    : "मेरी सीखने की जगह"
                  : lang === "en"
                    ? "Guest learning space"
                    : "अतिथि सीखने की जगह"}
              </div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                {isAuthenticated
                  ? lang === "en"
                    ? "Synced progress"
                    : "प्रगति सिंक है"
                  : lang === "en"
                    ? "Sign in to sync"
                    : "सिंक करने के लिए साइन इन करें"}
              </div>
            </div>
          </div>
        </div>
        {isError ? (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-[#f0b8a2] bg-[#fff0e8] p-4 text-sm text-[#8b4024]"
          >
            {lang === "en"
              ? "Progress could not be loaded. Your saved results are still safe; refresh to try again."
              : "प्रगति लोड नहीं हो सकी। आपके सुरक्षित परिणाम सुरक्षित हैं; फिर से कोशिश करें।"}
          </div>
        ) : null}
        <div className="mt-10 grid gap-4 lg:grid-cols-[.75fr_1.25fr]">
          <Card className="rounded-[26px] border-0 bg-[#182d29] text-white shadow-none">
            <CardContent className="p-7">
              <div className="flex items-start justify-between">
                <div>
                  <div className="eyebrow text-[#a7d6c0]">
                    {lang === "en" ? "your progress" : "आपकी प्रगति"}
                  </div>
                  <div className="mt-4 font-display text-6xl leading-none">
                    {isLoading ? "—" : percent}
                    <sup className="text-2xl">%</sup>
                  </div>
                </div>
                <div className="grid h-11 w-11 place-items-center rounded-full bg-white/10">
                  <Sparkles size={20} className="text-[#f97316]" />
                </div>
              </div>
              <p className="mt-5 max-w-xs text-sm leading-relaxed text-[#c8ddd3]">
                {!isAuthenticated
                  ? lang === "en"
                    ? "Sign in to save your quiz results and continue across devices."
                    : "अपने क्विज़ परिणाम सुरक्षित रखने और अलग-अलग डिवाइस पर जारी रखने के लिए साइन इन करें।"
                  : isLoading
                    ? lang === "en"
                      ? "Loading your saved learning progress…"
                      : "आपकी सुरक्षित सीखने की प्रगति लोड हो रही है…"
                    : completedCount
                      ? lang === "en"
                        ? `You have completed ${completedCount} of ${modules.length} safety modules.`
                        : `आपने ${modules.length} में से ${completedCount} सुरक्षा मॉड्यूल पूरे किए हैं।`
                      : lang === "en"
                        ? "Start a module to build your first safety habit."
                        : "अपनी पहली सुरक्षा आदत बनाने के लिए मॉड्यूल शुरू करें।"}
              </p>
              <div className="mt-8 h-2 rounded-full bg-white/15">
                <div
                  className="h-2 rounded-full bg-[#f97316] transition-all"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <div className="mt-3 flex justify-between text-[10px] uppercase tracking-widest text-[#a9c6ba]">
                <span>
                  {completedCount} {lang === "en" ? "of" : "में से"}{" "}
                  {modules.length} {lang === "en" ? "complete" : "पूरे"}
                </span>
                <span>
                  {percent === 100 && modules.length
                    ? lang === "en"
                      ? "all done"
                      : "सब पूरे"
                    : lang === "en"
                      ? "keep going"
                      : "जारी रखें"}
                </span>
              </div>
            </CardContent>
          </Card>
          <div className="grid gap-4 sm:grid-cols-2">
            {modules.map(m => {
              const done = completedModules.has(m.id);
              const DecorIcon = m.icon;
              return (
                <button
                  key={m.id}
                  onClick={() => setView(m.id)}
                  className="group rounded-[26px] border border-[#ddd6ca] bg-[#faf9f4] p-6 text-left transition hover:-translate-y-1 hover:border-[#0F766E] hover:shadow-lg"
                >
                  <div className="flex items-start justify-between">
                    <div
                      className={cn(
                        "grid h-11 w-11 place-items-center rounded-full",
                        m.tint === "coral"
                          ? "bg-[#fde1d5] text-[#f97316]"
                          : m.tint === "lavender"
                            ? "bg-[#e8e0fb] text-[#7c3aed]"
                            : m.tint === "teal"
                              ? "bg-[#d7ece4] text-[#0f766e]"
                              : "bg-[#f2e4c9] text-[#92733c]"
                      )}
                    >
                      <DecorIcon size={20} />
                    </div>
                    {done ? (
                      <span className="grid h-6 w-6 place-items-center rounded-full bg-[#0F766E] text-white">
                        <Check size={13} />
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {m.duration}
                      </span>
                    )}
                  </div>
                  <div className="mt-7 text-[10px] font-bold uppercase tracking-[.18em] text-muted-foreground">
                    {lang === "en" ? m.category : m.categoryHi}
                  </div>
                  <h3 className="mt-2 font-display text-[1.65rem] leading-[.95] tracking-[-.04em] text-[#1b2925]">
                    {lang === "en" ? m.title : m.titleHi}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-[#727873]">
                    {lang === "en" ? m.desc : m.descHi}
                  </p>
                  <div className="mt-5 flex items-center gap-2 text-xs font-bold text-[#0F766E]">
                    {done
                      ? lang === "en"
                        ? "Review lesson"
                        : "पाठ दोहराएँ"
                      : lang === "en"
                        ? "Start lesson"
                        : "पाठ शुरू करें"}
                    <ArrowRight
                      size={14}
                      className="transition group-hover:translate-x-1"
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function Toolkit({ lang }: { lang: "en" | "hi" }) {
  const [message, setMessage] = useState("");
  const [checked, setChecked] = useState(false);
  const [report, setReport] = useState(false);
  const [reportText, setReportText] = useState("");
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [anonymousReport, setAnonymousReport] = useState(true);
  const [explanation, setExplanation] = useState<{
    explanation: string;
    nextSteps: string[];
    reminder: string;
  } | null>(null);
  const analysis = useMemo(() => analyzeSuspiciousMessage(message), [message]);
  const flags = analysis.flags;
  const reportIncident = trpc.digisakhi.reportIncident.useMutation({
    onSuccess: () => {
      setReportSubmitted(true);
      toast.success(
        lang === "en"
          ? "Report saved privately for review."
          : "रिपोर्ट निजी रूप से समीक्षा के लिए सुरक्षित है।"
      );
    },
    onError: () =>
      toast.error(
        lang === "en"
          ? "We could not save the report. Please try again."
          : "रिपोर्ट सुरक्षित नहीं हो सकी। फिर से कोशिश करें।"
      ),
  });
  const explainScam = trpc.digisakhi.explainScam.useMutation({
    onSuccess: setExplanation,
    onError: () =>
      toast.error(
        lang === "en"
          ? "The explanation is unavailable right now. Your private local check is still complete."
          : "अभी AI समझाइश उपलब्ध नहीं है। आपकी निजी स्थानीय जाँच पूरी हो गई है।"
      ),
  });
  return (
    <section
      id="toolkit"
      className="border-b border-[#ded8cc] bg-[#faf9f4] py-20"
    >
      <div className="mx-auto max-w-[1320px] px-5 lg:px-10">
        <div className="grid gap-12 lg:grid-cols-[.7fr_1.3fr]">
          <div>
            <div className="eyebrow">small tools / big confidence</div>
            <h2 className="font-display mt-4 text-6xl leading-[.86] tracking-[-.06em]">
              Your safety
              <br />
              <em className="text-[#f97316]">toolkit.</em>
            </h2>
            <p className="mt-6 max-w-sm font-serif text-lg leading-relaxed text-[#6d746e]">
              When something feels wrong, you don’t have to figure it out alone.
              Start here.
            </p>
            <div className="mt-8 rounded-2xl bg-[#f7e1d8] p-5">
              <div className="flex gap-3">
                <AlertTriangle className="mt-1 text-[#d95d16]" size={20} />
                <div>
                  <div className="font-bold text-[#743516]">
                    Need help right now?
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-[#8a4b2d]">
                    Call the women’s helpline on <strong>181</strong> or cyber
                    fraud helpline on <strong>1930</strong>.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[26px] border border-[#ddd6ca] bg-[#f0ece3] p-6 md:col-span-2">
              <div className="flex items-start justify-between">
                <div>
                  <div className="eyebrow text-[#f97316]">scam checker</div>
                  <h3 className="mt-3 font-display text-3xl tracking-[-.04em]">
                    Does this message feel suspicious?
                  </h3>
                </div>
                <Search className="text-[#f97316]" />
              </div>
              <Textarea
                value={message}
                onChange={e => {
                  setMessage(e.target.value);
                  setChecked(false);
                  setExplanation(null);
                }}
                className="mt-5 min-h-24 rounded-xl border-[#d7d0c4] bg-[#faf9f4]"
                placeholder="Paste a message or link here — we do not send it anywhere."
              />
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs text-muted-foreground">
                  <LockKeyhole size={13} className="mr-1 inline" />
                  Offline-friendly and private
                </span>
                <Button
                  onClick={() => {
                    if (!message.trim()) {
                      toast.info(
                        lang === "en"
                          ? "Paste a message or link first."
                          : "पहले कोई संदेश या लिंक पेस्ट करें।"
                      );
                      return;
                    }
                    setChecked(true);
                    setExplanation(null);
                  }}
                  className="rounded-full bg-[#f97316] hover:bg-[#df6412]"
                >
                  Check message <ArrowRight size={15} />
                </Button>
              </div>
              {checked && (
                <div
                  role="status"
                  aria-live="polite"
                  className={cn(
                    "mt-5 rounded-xl border p-4",
                    flags.length
                      ? "border-[#e8b69f] bg-[#fff6f1]"
                      : "border-[#b8d9c8] bg-[#f1faf4]"
                  )}
                >
                  <div
                    className={cn(
                      "font-bold",
                      flags.length ? "text-[#9a431a]" : "text-[#216348]"
                    )}
                  >
                    {flags.length
                      ? `We found ${flags.length} red flag${flags.length > 1 ? "s" : ""}. Pause and verify.`
                      : analysis.guidance}
                  </div>
                  <p
                    className={cn(
                      "mt-1 text-sm",
                      flags.length ? "text-[#855a44]" : "text-[#47705d]"
                    )}
                  >
                    {flags.length
                      ? lang === "en"
                        ? "Never share OTPs, PINs or passwords. Call the official number from the organisation’s website."
                        : "OTP, PIN या पासवर्ड कभी साझा न करें। संस्था की आधिकारिक वेबसाइट से नंबर लेकर जाँच करें।"
                      : lang === "en"
                        ? "No message leaves this page. When in doubt, verify with a trusted person or official source."
                        : "यह संदेश इस पेज से बाहर नहीं जाता। संदेह होने पर किसी भरोसेमंद व्यक्ति या आधिकारिक स्रोत से जाँच करें।"}
                  </p>
                  <p className="mt-3 border-t border-current/10 pt-3 text-xs font-semibold opacity-80">
                    {lang === "en"
                      ? "This is private guidance, not proof that a message is safe or fraudulent."
                      : "यह निजी मार्गदर्शन है; यह संदेश के सुरक्षित या धोखाधड़ी होने का प्रमाण नहीं है।"}
                  </p>
                  {flags.length > 0 && (
                    <Button
                      variant="outline"
                      disabled={explainScam.isPending}
                      onClick={() =>
                        explainScam.mutate({
                          flags: [...flags],
                          risk:
                            analysis.risk === "low" ? "check" : analysis.risk,
                          language: lang,
                        })
                      }
                      className="mt-4 rounded-full border-[#d99575] bg-transparent text-[#9a431a] hover:bg-[#fff0e8]"
                    >
                      {explainScam.isPending ? (
                        lang === "en" ? (
                          "Preparing a clear explanation…"
                        ) : (
                          "सरल समझाइश तैयार हो रही है…"
                        )
                      ) : (
                        <>
                          <Sparkles size={15} />{" "}
                          {lang === "en" ? "Explain why" : "कारण समझाएँ"}
                        </>
                      )}
                    </Button>
                  )}
                  {explanation && (
                    <div className="mt-4 rounded-xl bg-white/70 p-4 text-left">
                      <div className="flex items-center gap-2 text-sm font-bold text-[#6f3f25]">
                        <Sparkles size={15} />{" "}
                        {lang === "en" ? "A clearer explanation" : "सरल समझाइश"}
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-[#5e4a40]">
                        {explanation.explanation}
                      </p>
                      <div className="mt-3 text-xs font-bold uppercase tracking-widest text-[#9a431a]">
                        {lang === "en" ? "What to do next" : "अब क्या करें"}
                      </div>
                      <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-[#5e4a40]">
                        {explanation.nextSteps.map(step => (
                          <li key={step}>{step}</li>
                        ))}
                      </ol>
                      <p className="mt-3 border-t border-[#eed4c6] pt-3 text-xs italic text-[#7d665a]">
                        {explanation.reminder}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
            <button
              onClick={() => setReport(true)}
              className="rounded-[26px] bg-[#7c3aed] p-6 text-left text-white transition hover:-translate-y-1"
            >
              <Flag size={24} />
              <h3 className="mt-8 font-display text-3xl leading-none">
                {lang === "en" ? "Report an" : "घटना"}
                <br />
                <em>{lang === "en" ? "incident." : "रिपोर्ट करें।"}</em>
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-white/75">
                {lang === "en"
                  ? "Anonymous reporting is always available."
                  : "गुमनाम रिपोर्ट हमेशा उपलब्ध है।"}
              </p>
              <div className="mt-6 flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
                {lang === "en" ? "Open report" : "रिपोर्ट खोलें"}{" "}
                <ArrowRight size={14} />
              </div>
            </button>
            <div className="rounded-[26px] border border-[#ddd6ca] bg-[#fffdf8] p-6">
              <Phone className="text-[#0F766E]" size={24} />
              <h3 className="mt-8 font-display text-3xl leading-none">
                {lang === "en" ? "Emergency" : "आपातकालीन"}
                <br />
                <em>{lang === "en" ? "contacts." : "संपर्क।"}</em>
              </h3>
              <div className="mt-5 space-y-3 text-sm">
                <div className="rounded-xl bg-[#e8f1ed] p-3 text-xs leading-relaxed text-[#3f6256]">
                  <strong>
                    {lang === "en"
                      ? "Find the right cyber cell"
                      : "सही साइबर सेल खोजें"}
                  </strong>
                  <br />
                  {lang === "en"
                    ? "Use the official cybercrime portal or ask your Sakhi coordinator to help identify the correct local office."
                    : "आधिकारिक साइबरक्राइम पोर्टल का उपयोग करें या सही स्थानीय कार्यालय की पहचान के लिए अपनी सखी समन्वयक से मदद लें।"}
                  <br />
                  <a
                    className="mt-1 inline-block font-semibold underline"
                    href="https://cybercrime.gov.in"
                    target="_blank"
                    rel="noreferrer"
                  >
                    cybercrime.gov.in
                  </a>
                </div>
                <div className="flex justify-between border-b border-[#e9e3d8] pb-3">
                  <span>
                    {lang === "en" ? "Women’s helpline" : "महिला हेल्पलाइन"}
                  </span>
                  <strong>181</strong>
                </div>
                <div className="flex justify-between border-b border-[#e9e3d8] pb-3">
                  <span>
                    {lang === "en" ? "Police helpline" : "पुलिस हेल्पलाइन"}
                  </span>
                  <strong>1091</strong>
                </div>
                <div className="flex justify-between">
                  <span>
                    {lang === "en" ? "Cyber fraud" : "साइबर धोखाधड़ी"}
                  </span>
                  <strong>1930</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {report && (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-[#15201d]/40 p-4 backdrop-blur-sm">
          <div className="relative max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-[28px] bg-[#fffdf8] p-7">
            <button
              onClick={() => setReport(false)}
              className="absolute right-5 top-5"
              aria-label="Close"
            >
              <X size={18} />
            </button>
            <div className="grid h-12 w-12 place-items-center rounded-full bg-[#f2e5fb] text-[#7c3aed]">
              <Flag size={22} />
            </div>
            <h2 className="font-display mt-5 text-4xl">
              {lang === "en"
                ? "Tell us what happened."
                : "क्या हुआ, हमें बताएँ।"}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {lang === "en"
                ? "You can stay anonymous. Your safety comes first."
                : "आप गुमनाम रह सकते हैं। आपकी सुरक्षा सबसे पहले है।"}
            </p>
            <Textarea
              value={reportText}
              onChange={e => {
                setReportText(e.target.value);
                setReportSubmitted(false);
              }}
              className="mt-6 min-h-32"
              placeholder={
                lang === "en"
                  ? "Describe the message, call or incident..."
                  : "संदेश, कॉल या घटना का विवरण दें..."
              }
            />
            <label className="mt-4 flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={anonymousReport}
                onChange={e => setAnonymousReport(e.target.checked)}
                className="h-4 w-4 accent-[#7c3aed]"
              />{" "}
              {lang === "en" ? "Submit anonymously" : "गुमनाम भेजें"}
            </label>
            <Button
              onClick={() => {
                if (
                  getReportSubmissionOutcome(reportText) === "prompt-details"
                ) {
                  toast.info(
                    lang === "en"
                      ? "Add a few details so your report can help."
                      : "रिपोर्ट में कुछ विवरण जोड़ें।"
                  );
                  return;
                }
                reportIncident.mutate({
                  description: reportText.trim(),
                  category: "Suspicious message",
                  anonymous: anonymousReport,
                });
              }}
              disabled={reportIncident.isPending}
              className="mt-6 w-full rounded-xl bg-[#7c3aed]"
            >
              {reportIncident.isPending
                ? lang === "en"
                  ? "Saving report…"
                  : "रिपोर्ट सुरक्षित हो रही है…"
                : lang === "en"
                  ? "Submit report"
                  : "रिपोर्ट भेजें"}{" "}
              <Send size={15} />
            </Button>
            {reportSubmitted && (
              <p
                role="status"
                className="mt-3 text-center text-xs font-semibold text-[#5b3a9b]"
              >
                {lang === "en"
                  ? anonymousReport
                    ? "Thank you. Your report has been recorded without your name."
                    : "Thank you. Your report has been recorded for review."
                  : anonymousReport
                    ? "धन्यवाद। आपकी रिपोर्ट बिना नाम के दर्ज कर ली गई है।"
                    : "धन्यवाद। आपकी रिपोर्ट समीक्षा के लिए दर्ज कर ली गई है।"}
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function Forum({
  lang,
  isAuthenticated,
  isAdmin,
  onLogin,
}: {
  lang: "en" | "hi";
  isAuthenticated: boolean;
  isAdmin: boolean;
  onLogin: () => void;
}) {
  const utils = trpc.useUtils();
  const postsQuery = trpc.digisakhi.forumPosts.useQuery();
  const [openPostId, setOpenPostId] = useState<number | null>(null);
  const repliesQuery = trpc.digisakhi.forumReplies.useQuery(
    { postId: openPostId ?? 0 },
    { enabled: openPostId !== null }
  );
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [replyBody, setReplyBody] = useState("");
  const [anonymous, setAnonymous] = useState(true);
  const [anonymousReply, setAnonymousReply] = useState(true);
  const createPost = trpc.digisakhi.createForumPost.useMutation({
    onSuccess: async () => {
      setNewTitle("");
      setNewBody("");
      await utils.digisakhi.forumPosts.invalidate();
      toast.success(
        lang === "en"
          ? "Your post is now visible to the community."
          : "आपकी पोस्ट अब समुदाय को दिखाई दे रही है।"
      );
    },
    onError: error => toast.error(error.message),
  });
  const createReply = trpc.digisakhi.createForumReply.useMutation({
    onSuccess: async () => {
      setReplyBody("");
      await Promise.all([
        utils.digisakhi.forumReplies.invalidate(),
        utils.digisakhi.forumPosts.invalidate(),
      ]);
      toast.success(lang === "en" ? "Reply posted." : "जवाब पोस्ट हो गया।");
    },
    onError: error => toast.error(error.message),
  });
  const pinPost = trpc.digisakhi.pinForumPost.useMutation({
    onSuccess: async () => {
      await utils.digisakhi.forumPosts.invalidate();
      toast.success(
        lang === "en" ? "Pin status updated." : "पिन की स्थिति अपडेट हो गई।"
      );
    },
    onError: error => toast.error(error.message),
  });
  const posts = postsQuery.data ?? [];
  return (
    <section id="forum" className="bg-[#e6edf0] py-20">
      <div className="mx-auto max-w-[1320px] px-5 lg:px-10">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <div className="eyebrow text-[#0F766E]">community / 03</div>
            <h2 className="font-display mt-4 text-6xl leading-[.86] tracking-[-.06em]">
              No question
              <br />
              <em className="text-[#0F766E]">is too small.</em>
            </h2>
          </div>
          <div className="max-w-xs text-sm leading-relaxed text-[#596764]">
            {lang === "en"
              ? "Ask, learn and look out for one another. Share by name or anonymously."
              : "पूछें, सीखें और एक-दूसरे का ध्यान रखें। नाम से या गुमनाम साझा करें।"}
          </div>
        </div>
        <div className="mt-10 grid gap-4 lg:grid-cols-[1fr_.75fr]">
          <div className="space-y-3">
            {postsQuery.isLoading ? (
              <div className="rounded-[22px] bg-[#f7fbfa] p-6 text-sm text-muted-foreground">
                {lang === "en"
                  ? "Loading community posts…"
                  : "समुदाय की पोस्ट लोड हो रही हैं…"}
              </div>
            ) : postsQuery.isError ? (
              <div
                role="alert"
                className="rounded-[22px] bg-[#fff0e8] p-6 text-sm text-[#8b4024]"
              >
                {lang === "en"
                  ? "Community posts could not be loaded. Please refresh."
                  : "समुदाय की पोस्ट लोड नहीं हो सकीं। कृपया फिर से लोड करें।"}
              </div>
            ) : posts.length === 0 ? (
              <div className="rounded-[22px] bg-[#f7fbfa] p-6 text-sm text-muted-foreground">
                {lang === "en"
                  ? "No posts yet. Start the first conversation."
                  : "अभी कोई पोस्ट नहीं है। पहली बातचीत शुरू करें।"}
              </div>
            ) : (
              posts.map(post => (
                <article
                  key={post.id}
                  className="rounded-[22px] border border-[#d1dfe1] bg-[#f7fbfa] p-6"
                >
                  <div className="flex items-center justify-between gap-3">
                    <Badge
                      className={cn(
                        "rounded-full border-0 bg-[#dcebe6] text-[#0F766E]",
                        post.pinned && "bg-[#f7dfd3] text-[#b64e1b]"
                      )}
                    >
                      {post.pinned
                        ? lang === "en"
                          ? "Pinned"
                          : "पिन की गई"
                        : lang === "en"
                          ? "Community"
                          : "समुदाय"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      <MessageCircle size={13} className="mr-1 inline" />
                      {post.replyCount} {lang === "en" ? "replies" : "जवाब"}
                    </span>
                  </div>
                  <h3 className="mt-4 text-xl font-semibold tracking-tight">
                    {post.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#687570]">
                    {post.body}
                  </p>
                  <div className="mt-5 flex flex-wrap items-center gap-4">
                    <button
                      onClick={() =>
                        setOpenPostId(openPostId === post.id ? null : post.id)
                      }
                      className="flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-[#0F766E]"
                    >
                      {openPostId === post.id
                        ? lang === "en"
                          ? "Hide conversation"
                          : "बातचीत छिपाएँ"
                        : lang === "en"
                          ? "Read conversation"
                          : "बातचीत पढ़ें"}{" "}
                      <ArrowRight size={14} />
                    </button>
                    {isAdmin ? (
                      <button
                        disabled={pinPost.isPending}
                        onClick={() =>
                          pinPost.mutate({
                            postId: post.id,
                            pinned: !Boolean(post.pinned),
                          })
                        }
                        className="text-xs font-semibold text-[#7c3aed]"
                      >
                        {post.pinned
                          ? lang === "en"
                            ? "Unpin"
                            : "अनपिन करें"
                          : lang === "en"
                            ? "Pin"
                            : "पिन करें"}
                      </button>
                    ) : null}
                  </div>
                  {openPostId === post.id ? (
                    <div className="mt-5 border-t border-[#d1dfe1] pt-4">
                      <div className="space-y-2">
                        {repliesQuery.isLoading ? (
                          <p className="text-xs text-muted-foreground">
                            {lang === "en"
                              ? "Loading replies…"
                              : "जवाब लोड हो रहे हैं…"}
                          </p>
                        ) : repliesQuery.isError ? (
                          <p role="alert" className="text-xs text-[#8b4024]">
                            {lang === "en"
                              ? "Replies could not be loaded. Please try again."
                              : "जवाब लोड नहीं हो सके। फिर से कोशिश करें।"}
                          </p>
                        ) : (
                          (repliesQuery.data ?? []).map(reply => (
                            <div
                              key={reply.id}
                              className="rounded-lg bg-white p-3 text-sm"
                            >
                              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                                {reply.anonymous
                                  ? lang === "en"
                                    ? "Anonymous member"
                                    : "गुमनाम सदस्य"
                                  : lang === "en"
                                    ? "Community member"
                                    : "समुदाय सदस्य"}
                              </div>
                              {reply.body}
                            </div>
                          ))
                        )}
                      </div>
                      <Textarea
                        value={replyBody}
                        onChange={e => setReplyBody(e.target.value)}
                        className="mt-3 bg-white"
                        placeholder={
                          lang === "en"
                            ? "Write a helpful reply…"
                            : "सहायक जवाब लिखें…"
                        }
                      />
                      <div className="mt-2 flex items-center justify-between gap-3">
                        <label className="flex items-center gap-2 text-xs text-muted-foreground">
                          <input
                            type="checkbox"
                            checked={anonymousReply}
                            onChange={e => setAnonymousReply(e.target.checked)}
                            className="accent-[#0F766E]"
                          />
                          {lang === "en" ? "Reply anonymously" : "गुमनाम जवाब"}
                        </label>
                        <Button
                          disabled={createReply.isPending || !replyBody.trim()}
                          onClick={() =>
                            isAuthenticated
                              ? createReply.mutate({
                                  postId: post.id,
                                  body: replyBody.trim(),
                                  anonymous: anonymousReply,
                                })
                              : onLogin()
                          }
                          className="rounded-full bg-[#0F766E]"
                        >
                          {createReply.isPending
                            ? lang === "en"
                              ? "Posting…"
                              : "पोस्ट हो रहा है…"
                            : lang === "en"
                              ? "Reply"
                              : "जवाब दें"}{" "}
                          <Send size={14} />
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </article>
              ))
            )}
          </div>
          <div className="rounded-[22px] bg-[#182d29] p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="eyebrow text-[#a7d6c0]">start a conversation</div>
              <Plus size={19} className="text-[#f97316]" />
            </div>
            <h3 className="mt-8 font-display text-4xl leading-none">
              What’s on
              <br />
              <em>{lang === "en" ? "your mind?" : "आपके मन में क्या है?"}</em>
            </h3>
            <Input
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              className="mt-7 h-12 border-white/15 bg-white/10 text-white placeholder:text-white/45"
              placeholder={lang === "en" ? "A short title" : "छोटा शीर्षक"}
            />
            <Textarea
              value={newBody}
              onChange={e => setNewBody(e.target.value)}
              className="mt-3 border-white/15 bg-white/10 text-white placeholder:text-white/45"
              placeholder={
                lang === "en"
                  ? "Write a question or experience…"
                  : "सवाल या अनुभव लिखें…"
              }
            />
            <div className="mt-4 flex items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-xs text-white/70">
                <input
                  type="checkbox"
                  checked={anonymous}
                  onChange={e => setAnonymous(e.target.checked)}
                  className="accent-[#f97316]"
                />
                {lang === "en" ? "Post anonymously" : "गुमनाम पोस्ट"}
              </label>
              <Button
                disabled={
                  createPost.isPending || !newTitle.trim() || !newBody.trim()
                }
                onClick={() =>
                  isAuthenticated
                    ? createPost.mutate({
                        title: newTitle.trim(),
                        body: newBody.trim(),
                        anonymous,
                      })
                    : onLogin()
                }
                className="rounded-full bg-[#f97316] hover:bg-[#df6412]"
              >
                {createPost.isPending
                  ? lang === "en"
                    ? "Posting…"
                    : "पोस्ट हो रही है…"
                  : lang === "en"
                    ? "Post"
                    : "पोस्ट करें"}{" "}
                <Send size={14} />
              </Button>
            </div>
            {!isAuthenticated ? (
              <p className="mt-4 text-xs text-white/60">
                {lang === "en"
                  ? "Sign in to join the conversation; you can still post anonymously."
                  : "बातचीत में शामिल होने के लिए साइन इन करें; आप गुमनाम पोस्ट कर सकते हैं।"}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function AdminPanel({
  close,
  onModulesChanged,
}: {
  close: () => void;
  onModulesChanged: () => void;
}) {
  type QuestionDraft = {
    q: string;
    qHi: string;
    a: string[];
    aHi: string[];
    correct: number;
    explanation: string;
    explanationHi: string;
  };
  type ModuleDraft = {
    slug: string;
    title: string;
    titleHi: string;
    category: string;
    description: string;
    descriptionHi: string;
    imageUrl: string;
    videoUrl: string;
    quizQuestions: QuestionDraft[];
  };
  const emptyQuestion = (): QuestionDraft => ({
    q: "",
    qHi: "",
    a: ["", "", ""],
    aHi: ["", "", ""],
    correct: 0,
    explanation: "",
    explanationHi: "",
  });
  const emptyDraft = (): ModuleDraft => ({
    slug: "",
    title: "",
    titleHi: "",
    category: "",
    description: "",
    descriptionHi: "",
    imageUrl: "",
    videoUrl: "",
    quizQuestions: Array.from({ length: 5 }, emptyQuestion),
  });
  const utils = trpc.useUtils();
  const statsQuery = trpc.digisakhi.adminStats.useQuery();
  const reportsQuery = trpc.digisakhi.incidentReports.useQuery();
  const adminModulesQuery = trpc.digisakhi.adminModules.useQuery();
  const [alert, setAlert] = useState("");
  const [draft, setDraft] = useState<ModuleDraft>(emptyDraft);
  const [editingId, setEditingId] = useState<number | null>(null);
  const publish = trpc.digisakhi.publishAnnouncement.useMutation({
    onSuccess: async () => {
      setAlert("");
      await utils.digisakhi.announcements.invalidate();
      toast.success("Urgent alert saved to the database.");
    },
    onError: error => toast.error(error.message),
  });
  const refreshModules = async () => {
    await Promise.all([
      utils.digisakhi.modules.invalidate(),
      utils.digisakhi.adminModules.invalidate(),
    ]);
    onModulesChanged();
  };
  const createModule = trpc.digisakhi.createModule.useMutation({
    onSuccess: async () => {
      resetDraft();
      await refreshModules();
      toast.success("Module created and published.");
    },
    onError: error => toast.error(error.message),
  });
  const updateModule = trpc.digisakhi.updateModule.useMutation({
    onSuccess: async () => {
      resetDraft();
      await refreshModules();
      toast.success("Module changes saved.");
    },
    onError: error => toast.error(error.message),
  });
  const lifecycle = trpc.digisakhi.setModuleLifecycle.useMutation({
    onSuccess: async () => {
      await refreshModules();
      toast.success("Module status updated.");
    },
    onError: error => toast.error(error.message),
  });
  const updateReport = trpc.digisakhi.updateIncidentStatus.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.digisakhi.incidentReports.invalidate(),
        utils.digisakhi.adminStats.invalidate(),
      ]);
      toast.success("Incident status updated.");
    },
    onError: error => toast.error(error.message),
  });
  function resetDraft() {
    setEditingId(null);
    setDraft(emptyDraft());
  }
  function startEdit(
    module: NonNullable<typeof adminModulesQuery.data>[number]
  ) {
    let quizQuestions = Array.from({ length: 5 }, emptyQuestion);
    if (module.quizData) {
      try {
        const parsed = JSON.parse(module.quizData) as Partial<QuestionDraft>[];
        if (parsed.length === 5) {
          quizQuestions = parsed.map(question => ({
            q: question.q ?? "",
            qHi: question.qHi ?? "",
            a: Array.from({ length: 3 }, (_, i) => question.a?.[i] ?? ""),
            aHi: Array.from({ length: 3 }, (_, i) => question.aHi?.[i] ?? ""),
            correct: question.correct ?? 0,
            explanation: question.explanation ?? "",
            explanationHi: question.explanationHi ?? "",
          }));
        }
      } catch {
        toast.error(
          "This module has invalid quiz data and cannot be edited yet."
        );
        return;
      }
    } else if (moduleQuizzes[module.slug]?.length === 5) {
      quizQuestions = moduleQuizzes[module.slug].map(question => ({
        q: question.q,
        qHi: question.qHi,
        a: [...question.a],
        aHi: [...question.aHi],
        correct: question.correct,
        explanation: question.explanation,
        explanationHi: question.explanationHi,
      }));
    }
    setEditingId(module.id);
    setDraft({
      slug: module.slug,
      title: module.title,
      titleHi: module.titleHi ?? "",
      category: module.category,
      description: module.description,
      descriptionHi: module.descriptionHi ?? "",
      imageUrl: module.imageUrl ?? "",
      videoUrl: module.videoUrl ?? "",
      quizQuestions,
    });
  }
  function updateDraft(
    field: keyof Omit<ModuleDraft, "quizQuestions">,
    value: string
  ) {
    setDraft(current => ({ ...current, [field]: value }));
  }
  function updateQuestion(
    index: number,
    field: keyof QuestionDraft,
    value: string | number
  ) {
    setDraft(current => ({
      ...current,
      quizQuestions: current.quizQuestions.map((question, questionIndex) =>
        questionIndex === index ? { ...question, [field]: value } : question
      ),
    }));
  }
  function updateOption(
    index: number,
    field: "a" | "aHi",
    optionIndex: number,
    value: string
  ) {
    setDraft(current => ({
      ...current,
      quizQuestions: current.quizQuestions.map((question, questionIndex) =>
        questionIndex === index
          ? {
              ...question,
              [field]: question[field].map((option, currentIndex) =>
                currentIndex === optionIndex ? value : option
              ),
            }
          : question
      ),
    }));
  }
  function submitModule() {
    const requiredFields = [
      draft.slug,
      draft.title,
      draft.titleHi,
      draft.category,
      draft.description,
      draft.descriptionHi,
    ];
    if (requiredFields.some(value => !value.trim())) {
      toast.error(
        "Complete the module title, category, and descriptions first."
      );
      return;
    }
    if (
      draft.quizQuestions.some(
        question =>
          !question.q.trim() ||
          !question.qHi.trim() ||
          question.a.some(option => !option.trim()) ||
          question.aHi.some(option => !option.trim()) ||
          !question.explanation.trim() ||
          !question.explanationHi.trim()
      )
    ) {
      toast.error(
        "Complete all five bilingual questions, options, and explanations."
      );
      return;
    }
    const payload = {
      slug: draft.slug
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, "-"),
      title: draft.title.trim(),
      titleHi: draft.titleHi.trim(),
      category: draft.category.trim(),
      description: draft.description.trim(),
      descriptionHi: draft.descriptionHi.trim(),
      imageUrl: draft.imageUrl.trim() || undefined,
      videoUrl: draft.videoUrl.trim() || undefined,
      quizQuestions: draft.quizQuestions as never,
    };
    if (editingId) updateModule.mutate({ id: editingId, ...payload });
    else createModule.mutate(payload);
  }
  const isSaving = createModule.isPending || updateModule.isPending;
  const stats = statsQuery.data;
  const adminModules = adminModulesQuery.data ?? [];
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#15201d]/50 p-4 backdrop-blur-sm">
      <div className="mx-auto my-4 max-h-[calc(100dvh-2rem)] max-w-6xl overflow-y-auto rounded-[28px] bg-[#f7f4ec] p-5 shadow-2xl sm:my-8 sm:p-9">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="eyebrow text-[#7c3aed]">
              admin console / coordinator view
            </div>
            <h2 className="font-display mt-3 text-4xl leading-none sm:text-5xl">
              Admin
              <br />
              <em className="text-[#0F766E]">workspace.</em>
            </h2>
          </div>
          <button
            onClick={close}
            className="rounded-full p-3 hover:bg-white"
            aria-label="Close dashboard"
          >
            <X size={18} />
          </button>
        </div>
        {statsQuery.isError ||
        reportsQuery.isError ||
        adminModulesQuery.isError ? (
          <div
            role="alert"
            className="mt-6 rounded-xl bg-[#fff0e8] p-4 text-sm text-[#8b4024]"
          >
            Some admin data could not be loaded. Refresh and try again.
          </div>
        ) : null}
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            [stats?.members ?? "—", "registered members"],
            [stats?.completedModules ?? "—", "module completions"],
            [stats ? `${stats.averageScore}%` : "—", "average quiz score"],
            [stats?.attempts ?? "—", "quiz attempts"],
            [stats?.newReports ?? "—", "new incident reports"],
          ].map(([value, label]) => (
            <div
              key={label}
              className="rounded-2xl border border-[#ddd6ca] bg-[#fffdf8] p-5"
            >
              <div className="font-display text-3xl text-[#0F766E]">
                {statsQuery.isLoading ? "…" : value}
              </div>
              <div className="mt-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {label}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-2xl border border-[#ddd6ca] bg-[#fffdf8] p-6">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-display text-3xl">Learning analytics</h3>
            <span className="text-xs text-muted-foreground">
              Attempts and unique learners
            </span>
          </div>
          {statsQuery.isLoading ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Loading analytics…
            </p>
          ) : stats?.moduleAnalytics?.length ? (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {stats.moduleAnalytics.map(item => {
                const module = adminModules.find(
                  candidate => candidate.slug === item.moduleId
                );
                return (
                  <div
                    key={item.moduleId}
                    className="rounded-xl border border-[#ece5d9] p-4"
                  >
                    <div className="font-semibold">
                      {module?.title ?? item.moduleId}
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                      <span>
                        <strong className="block text-lg text-[#182d29]">
                          {item.completions}
                        </strong>
                        learners
                      </span>
                      <span>
                        <strong className="block text-lg text-[#182d29]">
                          {item.attempts}
                        </strong>
                        attempts
                      </span>
                      <span>
                        <strong className="block text-lg text-[#182d29]">
                          {item.averageScore}%
                        </strong>
                        average
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              No quiz attempts have been recorded yet.
            </p>
          )}
        </div>
        <div className="mt-4 rounded-2xl border border-[#ddd6ca] bg-[#fffdf8] p-6">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-display text-3xl">Incident reports</h3>
            <span className="text-xs text-muted-foreground">
              Review and update status
            </span>
          </div>
          {reportsQuery.isLoading ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Loading reports…
            </p>
          ) : reportsQuery.data?.length ? (
            <div className="mt-4 space-y-3">
              {reportsQuery.data.map(report => (
                <div
                  key={report.id}
                  className="rounded-xl border border-[#ece5d9] p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="text-xs text-muted-foreground">
                        {report.category} ·{" "}
                        {report.anonymous ? "Anonymous" : "Named report"} ·{" "}
                        {new Date(report.createdAt).toLocaleDateString()}
                      </div>
                      <p className="mt-2 text-sm leading-relaxed">
                        {report.description}
                      </p>
                      <div className="mt-2 text-[11px] text-muted-foreground">
                        Last updated{" "}
                        {new Date(report.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <select
                      value={report.status}
                      disabled={updateReport.isPending}
                      onChange={event =>
                        updateReport.mutate({
                          reportId: report.id,
                          status: event.target.value as
                            | "New"
                            | "In Review"
                            | "Resolved",
                        })
                      }
                      className="h-10 rounded-lg border border-[#d8d0c2] bg-white px-3 text-sm"
                      aria-label={`Update status for report ${report.id}`}
                    >
                      <option value="New">New</option>
                      <option value="In Review">In Review</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              No incident reports yet.
            </p>
          )}
        </div>
        <div className="mt-4 rounded-2xl border border-[#ddd6ca] bg-[#fffdf8] p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-display text-3xl">Learning modules</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Edit five-question lessons, publish, unpublish, or archive.
              </p>
            </div>
            <span className="text-xs text-muted-foreground">
              {adminModules.length} total records
            </span>
          </div>
          <div className="mt-5 space-y-3">
            {adminModules.map(module => (
              <div
                className="rounded-xl border border-[#ece5d9] p-4"
                key={module.id}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="font-semibold">{module.title}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {module.slug} ·{" "}
                      {module.published ? "Published" : "Unpublished"} ·{" "}
                      {module.archived ? "Archived" : "Active"}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => startEdit(module)}
                    >
                      Edit lesson
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={lifecycle.isPending}
                      onClick={() =>
                        lifecycle.mutate({
                          id: module.id,
                          published: !Boolean(module.published),
                        })
                      }
                    >
                      {module.published ? "Unpublish" : "Publish"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={lifecycle.isPending}
                      onClick={() =>
                        lifecycle.mutate({
                          id: module.id,
                          archived: !Boolean(module.archived),
                        })
                      }
                    >
                      {module.archived ? "Restore" : "Archive"}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 border-t border-[#ece5d9] pt-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h4 className="font-semibold">
                {editingId ? "Edit module" : "Add module"}
              </h4>
              {editingId ? (
                <Button variant="outline" size="sm" onClick={resetDraft}>
                  Cancel editing
                </Button>
              ) : null}
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <Input
                value={draft.slug}
                onChange={e => updateDraft("slug", e.target.value)}
                placeholder="Short slug, e.g. safe-links"
                disabled={Boolean(editingId)}
              />
              <Input
                value={draft.category}
                onChange={e => updateDraft("category", e.target.value)}
                placeholder="Category"
              />
              <Input
                value={draft.title}
                onChange={e => updateDraft("title", e.target.value)}
                placeholder="English title"
              />
              <Input
                value={draft.titleHi}
                onChange={e => updateDraft("titleHi", e.target.value)}
                placeholder="Hindi title"
              />
              <Textarea
                value={draft.description}
                onChange={e => updateDraft("description", e.target.value)}
                placeholder="English description"
              />
              <Textarea
                value={draft.descriptionHi}
                onChange={e => updateDraft("descriptionHi", e.target.value)}
                placeholder="Hindi description"
              />
              <Input
                value={draft.imageUrl}
                onChange={e => updateDraft("imageUrl", e.target.value)}
                placeholder="Illustration URL (optional)"
              />
              <Input
                value={draft.videoUrl}
                onChange={e => updateDraft("videoUrl", e.target.value)}
                placeholder="Video URL (optional)"
              />
            </div>
            <div className="mt-5 space-y-4">
              <div>
                <h5 className="font-semibold">Five-question quiz editor</h5>
                <p className="mt-1 text-xs text-muted-foreground">
                  Write each question and its Hindi translation, add three
                  options, choose the correct option, and explain the answer. No
                  JSON required.
                </p>
              </div>
              {draft.quizQuestions.map((question, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-[#ece5d9] bg-[#faf8f2] p-4"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="font-semibold">Question {index + 1}</span>
                    <span className="text-xs text-muted-foreground">
                      {question.correct === 0
                        ? "Option A"
                        : question.correct === 1
                          ? "Option B"
                          : "Option C"}{" "}
                      is correct
                    </span>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Textarea
                      value={question.q}
                      onChange={e => updateQuestion(index, "q", e.target.value)}
                      placeholder="Question in English"
                    />
                    <Textarea
                      value={question.qHi}
                      onChange={e =>
                        updateQuestion(index, "qHi", e.target.value)
                      }
                      placeholder="प्रश्न हिंदी में"
                    />
                  </div>
                  <div className="mt-2 grid gap-2 sm:grid-cols-3">
                    {question.a.map((option, optionIndex) => (
                      <Input
                        key={`en-${optionIndex}`}
                        value={option}
                        onChange={e =>
                          updateOption(index, "a", optionIndex, e.target.value)
                        }
                        placeholder={`English option ${String.fromCharCode(65 + optionIndex)}`}
                      />
                    ))}
                  </div>
                  <div className="mt-2 grid gap-2 sm:grid-cols-3">
                    {question.aHi.map((option, optionIndex) => (
                      <Input
                        key={`hi-${optionIndex}`}
                        value={option}
                        onChange={e =>
                          updateOption(
                            index,
                            "aHi",
                            optionIndex,
                            e.target.value
                          )
                        }
                        placeholder={`हिंदी विकल्प ${String.fromCharCode(65 + optionIndex)}`}
                      />
                    ))}
                  </div>
                  <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_2fr_2fr]">
                    <select
                      value={question.correct}
                      onChange={e =>
                        updateQuestion(index, "correct", Number(e.target.value))
                      }
                      className="h-10 rounded-lg border border-[#d8d0c2] bg-white px-3 text-sm"
                      aria-label={`Correct option for question ${index + 1}`}
                    >
                      <option value={0}>Correct: A</option>
                      <option value={1}>Correct: B</option>
                      <option value={2}>Correct: C</option>
                    </select>
                    <Textarea
                      value={question.explanation}
                      onChange={e =>
                        updateQuestion(index, "explanation", e.target.value)
                      }
                      placeholder="Explanation in English"
                    />
                    <Textarea
                      value={question.explanationHi}
                      onChange={e =>
                        updateQuestion(index, "explanationHi", e.target.value)
                      }
                      placeholder="व्याख्या हिंदी में"
                    />
                  </div>
                </div>
              ))}
            </div>
            <Button
              disabled={isSaving}
              onClick={submitModule}
              className="mt-5 rounded-xl bg-[#0F766E]"
            >
              {isSaving
                ? "Saving…"
                : editingId
                  ? "Save module changes"
                  : "Create and publish module"}
            </Button>
          </div>
        </div>
        <div className="mt-4 rounded-2xl bg-[#182d29] p-6 text-white">
          <div className="eyebrow text-[#a7d6c0]">broadcast alert</div>
          <h3 className="mt-4 font-display text-3xl leading-none">
            Keep your community informed.
          </h3>
          <Textarea
            value={alert}
            onChange={e => setAlert(e.target.value)}
            className="mt-5 border-white/15 bg-white/10 text-white placeholder:text-white/45"
            placeholder="Write an urgent safety notice…"
          />
          <Button
            disabled={publish.isPending || alert.trim().length < 5}
            onClick={() =>
              publish.mutate({ message: alert.trim(), urgent: true })
            }
            className="mt-4 w-full rounded-xl bg-[#f97316] hover:bg-[#df6412]"
          >
            {publish.isPending ? (
              "Publishing…"
            ) : (
              <>
                <Bell size={15} /> Publish urgent alert
              </>
            )}
          </Button>
          <p className="mt-3 text-xs text-white/60">
            The alert is saved server-side and appears in the member dashboard
            after refresh.
          </p>
        </div>
      </div>
    </div>
  );
}

function ProfileSetup({
  lang,
  onComplete,
}: {
  lang: "en" | "hi";
  onComplete: () => void;
}) {
  const [shgGroup, setShgGroup] = useState("");
  const [phone, setPhone] = useState("");
  const [preferredLanguage, setPreferredLanguage] = useState<"en" | "hi">(lang);
  const update = trpc.digisakhi.updateProfile.useMutation({
    onSuccess: () => {
      onComplete();
      toast.success(
        lang === "en" ? "Your profile is ready." : "आपकी प्रोफ़ाइल तैयार है।"
      );
    },
    onError: error => toast.error(error.message),
  });
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center overflow-y-auto bg-[#15201d]/50 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        className="max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-[28px] bg-[#fffdf8] p-7 shadow-2xl sm:p-10"
      >
        <div className="eyebrow text-[#0F766E]">
          {lang === "en"
            ? "one-time profile setup"
            : "एक बार की प्रोफ़ाइल सेटअप"}
        </div>
        <h2 className="font-display mt-3 text-5xl leading-none">
          {lang === "en" ? "Make this space yours." : "इस जगह को अपना बनाएँ।"}
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          {lang === "en"
            ? "Your SHG group and phone help your coordinator support you. They are stored with your account."
            : "आपका SHG समूह और फ़ोन आपके समन्वयक को सहायता देने में मदद करते हैं। इन्हें आपके खाते के साथ सुरक्षित रखा जाएगा।"}
        </p>
        <div className="mt-6 space-y-3">
          <Input
            value={shgGroup}
            onChange={e => setShgGroup(e.target.value)}
            placeholder={lang === "en" ? "SHG group name" : "SHG समूह का नाम"}
          />
          <Input
            value={phone}
            onChange={e => setPhone(e.target.value)}
            inputMode="tel"
            placeholder={lang === "en" ? "Phone number" : "फ़ोन नंबर"}
          />
          <div className="flex gap-2">
            <Button
              type="button"
              variant={preferredLanguage === "en" ? "default" : "outline"}
              onClick={() => setPreferredLanguage("en")}
              className="rounded-full"
            >
              English
            </Button>
            <Button
              type="button"
              variant={preferredLanguage === "hi" ? "default" : "outline"}
              onClick={() => setPreferredLanguage("hi")}
              className="rounded-full"
            >
              हिंदी
            </Button>
          </div>
        </div>
        <Button
          disabled={
            update.isPending ||
            shgGroup.trim().length < 2 ||
            phone.trim().length < 7
          }
          onClick={() =>
            update.mutate({
              shgGroup: shgGroup.trim(),
              phone: phone.trim(),
              preferredLanguage,
            })
          }
          className="mt-7 h-12 w-full rounded-xl bg-[#0F766E]"
        >
          {update.isPending
            ? lang === "en"
              ? "Saving…"
              : "सहेजा जा रहा है…"
            : lang === "en"
              ? "Save profile"
              : "प्रोफ़ाइल सहेजें"}
        </Button>
        {update.isError ? (
          <p role="alert" className="mt-3 text-xs text-[#8b4024]">
            {update.error.message}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function escapeHtml(value: string) {
  return value.replace(
    /[&<>'"]/g,
    character =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        '"': "&quot;",
      })[character] ?? character
  );
}

function CertificateCard({
  lang,
  isAuthenticated,
}: {
  lang: "en" | "hi";
  isAuthenticated: boolean;
}) {
  const certificate = trpc.digisakhi.certificate.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const downloadCertificate = () => {
    const data = certificate.data;
    if (!data?.unlocked) return;
    const completionDate = data.unlockedAt
      ? new Date(data.unlockedAt).toLocaleDateString()
      : new Date().toLocaleDateString();
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>DigiSakhi Certificate</title><style>body{font-family:Georgia,serif;background:#f6f2e8;padding:48px;color:#182d29}.certificate{max-width:760px;margin:auto;border:10px solid #0f766e;padding:64px;text-align:center;background:#fffdf8}.eyebrow{letter-spacing:.18em;text-transform:uppercase;color:#7c3aed;font:700 12px Arial}.name{font-size:42px;margin:28px 0 10px}.meta{font:16px Arial;color:#47635a;line-height:1.7}.footer{margin-top:54px;font:12px Arial;color:#6b746f}</style></head><body><main class="certificate"><div class="eyebrow">DigiSakhi · Digital Safety Companion</div><h1>Certificate of Completion</h1><p class="meta">This certifies that</p><div class="name">${escapeHtml(data.memberName)}</div><p class="meta">has completed all four required DigiSakhi digital-safety modules${data.shgGroup ? ` for ${escapeHtml(data.shgGroup)}` : ""}.</p><p class="footer">Verified from saved learning progress on ${completionDate}.</p></main></body></html>`;
    const url = URL.createObjectURL(new Blob([html], { type: "text/html" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "digisakhi-certificate.html";
    anchor.click();
    URL.revokeObjectURL(url);
  };
  const printCertificate = () => {
    const data = certificate.data;
    if (!data?.unlocked) return;
    const popup = window.open("", "_blank", "width=900,height=700");
    if (!popup) {
      toast.error(
        lang === "en"
          ? "Allow pop-ups to print the certificate."
          : "प्रमाणपत्र प्रिंट करने के लिए पॉप-अप की अनुमति दें।"
      );
      return;
    }
    popup.document.write(
      `<html><head><title>DigiSakhi Certificate</title><style>body{font-family:Georgia,serif;padding:48px;color:#182d29}.certificate{border:10px solid #0f766e;padding:64px;text-align:center}.name{font-size:42px;margin:28px 0 10px}.meta{font:16px Arial;line-height:1.7}</style></head><body><main class="certificate"><div>DigiSakhi · Digital Safety Companion</div><h1>Certificate of Completion</h1><p class="meta">This certifies that</p><div class="name">${escapeHtml(data.memberName)}</div><p class="meta">has completed all four required DigiSakhi digital-safety modules.</p></main></body></html>`
    );
    popup.document.close();
    popup.focus();
    popup.print();
  };
  if (!isAuthenticated)
    return (
      <section className="bg-[#faf9f4] py-8">
        <div className="mx-auto max-w-[1320px] px-5 lg:px-10">
          <div className="rounded-2xl border border-[#ded8cc] bg-[#f4f0e8] p-5 text-sm text-muted-foreground">
            {lang === "en"
              ? "Sign in to track the four required modules for certificate eligibility."
              : "प्रमाणपत्र की पात्रता के लिए चार आवश्यक मॉड्यूल ट्रैक करने हेतु साइन इन करें।"}
          </div>
        </div>
      </section>
    );
  return (
    <section className="bg-[#faf9f4] py-8">
      <div className="mx-auto max-w-[1320px] px-5 lg:px-10">
        <div
          className={cn(
            "rounded-2xl border p-5",
            certificate.data?.unlocked
              ? "border-[#93c9ad] bg-[#e1eee8]"
              : "border-[#ded8cc] bg-[#f4f0e8]"
          )}
        >
          {certificate.isLoading ? (
            <p className="text-sm text-muted-foreground">
              {lang === "en"
                ? "Checking certificate eligibility…"
                : "प्रमाणपत्र की पात्रता जाँची जा रही है…"}
            </p>
          ) : certificate.isError ? (
            <p role="alert" className="text-sm text-[#8b4024]">
              {lang === "en"
                ? "Certificate status could not be loaded."
                : "प्रमाणपत्र की स्थिति लोड नहीं हो सकी।"}
            </p>
          ) : certificate.data?.unlocked ? (
            <>
              <div className="eyebrow text-[#0F766E]">
                {lang === "en" ? "certificate unlocked" : "प्रमाणपत्र अनलॉक"}
              </div>
              <h2 className="font-display mt-2 text-3xl">
                {lang === "en"
                  ? "You completed all four required modules."
                  : "आपने चारों आवश्यक मॉड्यूल पूरे कर लिए हैं।"}
              </h2>
              <p className="mt-2 text-sm text-[#3f6256]">
                {lang === "en"
                  ? "Your completion status is verified from saved progress."
                  : "आपकी पूर्णता स्थिति सुरक्षित प्रगति से सत्यापित है।"}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button
                  onClick={downloadCertificate}
                  className="rounded-xl bg-[#0F766E]"
                >
                  <FileText size={16} />
                  {lang === "en"
                    ? "Download certificate"
                    : "प्रमाणपत्र डाउनलोड करें"}
                </Button>
                <Button
                  variant="outline"
                  onClick={printCertificate}
                  className="rounded-xl border-[#0F766E] text-[#0F766E]"
                >
                  <ExternalLink size={16} />
                  {lang === "en"
                    ? "Print / save as PDF"
                    : "प्रिंट / PDF में सहेजें"}
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="eyebrow text-[#7c3aed]">
                {lang === "en" ? "certificate locked" : "प्रमाणपत्र लॉक है"}
              </div>
              <h2 className="font-display mt-2 text-3xl">
                {certificate.data?.completedCount ?? 0} /{" "}
                {certificate.data?.requiredCount ?? 4}{" "}
                {lang === "en"
                  ? "required modules complete"
                  : "आवश्यक मॉड्यूल पूरे"}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {lang === "en"
                  ? "Complete all four required modules to unlock the certificate."
                  : "प्रमाणपत्र अनलॉक करने के लिए चारों आवश्यक मॉड्यूल पूरे करें।"}
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-[#182d29] py-10 text-white">
      <div className="mx-auto flex max-w-[1320px] flex-col justify-between gap-8 px-5 sm:flex-row sm:items-end lg:px-10">
        <div>
          <Logo />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/55">
            A calmer, safer internet starts with one trusted friend and one good
            habit.
          </p>
        </div>
        <div className="text-left text-xs uppercase tracking-[.18em] text-white/45 sm:text-right">
          DigiSakhi · CEP Project
          <br />
          <span className="mt-2 inline-block text-[#a7d6c0]">
            Learn · Protect · Support
          </span>
        </div>
      </div>
    </footer>
  );
}

function Announcements({ lang }: { lang: "en" | "hi" }) {
  const announcements = trpc.digisakhi.announcements.useQuery();
  if (announcements.isLoading)
    return (
      <div className="border-b border-[#ded8cc] bg-[#fff8ee] px-5 py-3 text-xs text-[#9a6a4b]">
        {lang === "en"
          ? "Loading safety notices…"
          : "सुरक्षा सूचनाएँ लोड हो रही हैं…"}
      </div>
    );
  if (announcements.isError)
    return (
      <div
        role="alert"
        className="border-b border-[#f0d3b9] bg-[#fff0e8] px-5 py-3 text-xs text-[#8b4024]"
      >
        {lang === "en"
          ? "Safety notices are temporarily unavailable."
          : "सुरक्षा सूचनाएँ अभी उपलब्ध नहीं हैं।"}
      </div>
    );
  if (!announcements.data?.length) return null;
  return (
    <section className="border-b border-[#ded8cc] bg-[#fff8ee] py-5">
      <div className="mx-auto max-w-[1320px] px-5 lg:px-10">
        <div className="eyebrow text-[#f97316]">
          {lang === "en" ? "safety notice" : "सुरक्षा सूचना"}
        </div>
        <div className="mt-3 space-y-2">
          {announcements.data.slice(0, 3).map(item => (
            <div
              key={item.id}
              className="flex flex-col gap-1 rounded-xl border border-[#f0d3b9] bg-white/70 p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <p className="text-sm font-semibold text-[#6f3f25]">
                {item.message}
              </p>
              <span className="text-[10px] uppercase tracking-widest text-[#9a6a4b]">
                {item.urgent
                  ? lang === "en"
                    ? "urgent"
                    : "तत्काल"
                  : lang === "en"
                    ? "notice"
                    : "सूचना"}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-[#9a6a4b]">
          {lang === "en"
            ? "Shared by your DigiSakhi coordinator. Verify urgent claims through official channels."
            : "आपके DigiSakhi समन्वयक द्वारा साझा। तत्काल दावों की आधिकारिक माध्यम से जाँच करें।"}
        </p>
      </div>
    </section>
  );
}

export default function Home() {
  const [lang, setLang] = useState<"en" | "hi">("en");
  const [login, setLogin] = useState(false);
  const [menu, setMenu] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [view, setView] = useState("home");
  const auth = useAuth();
  const modulesQuery = trpc.digisakhi.modules.useQuery();
  const modules = useMemo<ModuleView[]>(
    () =>
      (modulesQuery.data ?? []).map(record => {
        const decoration = moduleDecorations[record.slug] ?? {
          icon: BookOpen,
          tint: "teal",
          duration: "10 min",
        };
        let quizQuestions = moduleQuizzes[record.slug] ?? [];
        if (record.quizData) {
          try {
            const parsed = JSON.parse(record.quizData) as QuizQuestion[];
            if (parsed.length === 5) quizQuestions = parsed;
          } catch {
            /* keep the safe built-in quiz for legacy records */
          }
        }
        return {
          id: record.slug,
          title: record.title,
          titleHi: record.titleHi ?? record.title,
          category: record.category,
          categoryHi: moduleCategoryHindi[record.slug] ?? record.category,
          desc: record.description,
          descHi: record.descriptionHi ?? record.description,
          imageUrl: record.imageUrl,
          videoUrl: record.videoUrl,
          quizQuestions,
          ...decoration,
        };
      }),
    [modulesQuery.data]
  );
  const progressQuery = trpc.digisakhi.progress.useQuery(undefined, {
    enabled: auth.isAuthenticated,
  });
  const profileQuery = trpc.digisakhi.profile.useQuery(undefined, {
    enabled: auth.isAuthenticated,
  });
  useEffect(() => {
    const preferredLanguage = profileQuery.data?.user.preferredLanguage;
    if (preferredLanguage) setLang(preferredLanguage);
  }, [profileQuery.data?.user.preferredLanguage]);

  useEffect(() => {
    const handleOpen = () => setLogin(true);
    window.addEventListener("open-login-modal", handleOpen);
    return () => window.removeEventListener("open-login-modal", handleOpen);
  }, []);

  const selectedModule = modules.find(module => module.id === view);
  const isAdmin = auth.user?.role === "admin";
  return (
    <div className="min-h-screen bg-[#faf9f4] text-[#18201e]">
      <Topbar
        lang={lang}
        setLang={setLang}
        user={auth.user}
        onLogin={() => setLogin(true)}
        onLogout={auth.logout}
        onMenu={() => setMenu(!menu)}
        onAdminOpen={() => setAdminOpen(true)}
      />
      {menu ? (
        <div className="border-b border-[#ded8cc] bg-[#fffdf8] px-5 py-4 lg:hidden">
          <div className="flex flex-col gap-4 text-sm font-semibold">
            <a href="#learn" onClick={() => setMenu(false)}>
              Learn / सीखें
            </a>
            <a href="#toolkit" onClick={() => setMenu(false)}>
              Safety toolkit / सुरक्षा टूलकिट
            </a>
            <a href="#forum" onClick={() => setMenu(false)}>
              Community / समुदाय
            </a>
            {isAdmin ? (
              <button
                onClick={() => {
                  setAdminOpen(true);
                  setMenu(false);
                }}
                className="text-left text-[#7c3aed]"
              >
                Admin workspace
              </button>
            ) : null}
            <button
              onClick={() => setLang(lang === "en" ? "hi" : "en")}
              className="flex items-center gap-2 text-left"
            >
              <Languages size={15} /> Switch language
            </button>
          </div>
        </div>
      ) : null}
      <main>
        <Hero
          lang={lang}
          isAuthenticated={auth.isAuthenticated}
          onLogin={() => setLogin(true)}
          topicCount={modules.length}
        />
        <Announcements lang={lang} />
        <Dashboard
          lang={lang}
          setView={setView}
          modules={modules}
          progress={progressQuery.data}
          isAuthenticated={auth.isAuthenticated}
          isLoading={modulesQuery.isLoading || progressQuery.isLoading}
          isError={modulesQuery.isError || progressQuery.isError}
        />
        <CertificateCard lang={lang} isAuthenticated={auth.isAuthenticated} />
        <section className="border-b border-[#ded8cc] bg-[#faf9f4] py-14">
          <div className="mx-auto grid max-w-[1320px] gap-5 px-5 sm:grid-cols-3 lg:px-10">
            <div className="flex gap-4">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#e1eee8] text-[#0F766E]">
                <BookOpen size={18} />
              </div>
              <div>
                <div className="font-semibold">Learn simply</div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Short lessons, real examples.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#eee6fb] text-[#7C3AED]">
                <Users size={18} />
              </div>
              <div>
                <div className="font-semibold">Find support</div>
                <p className="mt-1 text-sm text-muted-foreground">
                  A community that listens.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#fbe4d8] text-[#f97316]">
                <Bell size={18} />
              </div>
              <div>
                <div className="font-semibold">Stay informed</div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Timely alerts from your trainer.
                </p>
              </div>
            </div>
          </div>
        </section>
        <Toolkit lang={lang} />
        <Forum
          lang={lang}
          isAuthenticated={auth.isAuthenticated}
          isAdmin={isAdmin}
          onLogin={() => setLogin(true)}
        />
        <section className="bg-[#faf9f4] py-20">
          <div className="mx-auto max-w-[1320px] px-5 lg:px-10">
            <div className="rounded-[30px] bg-[#ded8f6] p-8 md:p-12">
              <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
                <div>
                  <div className="eyebrow text-[#6d45c9]">
                    {lang === "en"
                      ? "a note from your sakhi"
                      : "आपकी सखी का एक संदेश"}
                  </div>
                  <h2 className="font-display mt-4 max-w-xl text-5xl leading-[.9] tracking-[-.05em] text-[#241c42]">
                    {lang === "en"
                      ? "You do not need to be a technology expert to be digitally safe."
                      : "डिजिटल रूप से सुरक्षित रहने के लिए आपको तकनीक विशेषज्ञ होने की आवश्यकता नहीं है।"}
                  </h2>
                  <p className="mt-5 max-w-lg font-serif text-lg text-[#574f73]">
                    {lang === "en"
                      ? "You only need the confidence to pause, ask and choose what feels right."
                      : "आपको बस रुकने, पूछने और सही फैसला लेने के आत्मविश्वास की जरूरत है।"}
                  </p>
                </div>
                <Button
                  onClick={() => {
                    if (auth.isAuthenticated) {
                      const el = document.getElementById("learn");
                      if (el) {
                        el.scrollIntoView({ behavior: "smooth" });
                      } else {
                        window.location.hash = "learn";
                      }
                    } else {
                      setLogin(true);
                    }
                  }}
                  className="rounded-full bg-[#7c3aed] px-6 hover:bg-[#6930d3]"
                >
                  {lang === "en" ? "Begin your journey" : "अपनी यात्रा शुरू करें"}{" "}
                  <ArrowRight size={16} />
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <QuickExit lang={lang} />
      {selectedModule ? (
        <ModuleModal
          module={selectedModule}
          lang={lang}
          isAuthenticated={auth.isAuthenticated}
          onCompleted={() => {
            void progressQuery.refetch();
          }}
          close={() => setView("home")}
        />
      ) : null}
      {login ? <LoginModal lang={lang} close={() => setLogin(false)} /> : null}
      {isAdmin && adminOpen ? (
        <AdminPanel
          close={() => setAdminOpen(false)}
          onModulesChanged={() => void modulesQuery.refetch()}
        />
      ) : null}
      {auth.isAuthenticated && profileQuery.data?.needsSetup ? (
        <ProfileSetup
          lang={lang}
          onComplete={() => void profileQuery.refetch()}
        />
      ) : null}
      <>
        {isAdmin ? (
          <button
            onClick={() => setAdminOpen(true)}
            className="fixed bottom-5 left-5 z-40 rounded-full bg-[#7c3aed] px-4 py-3 text-xs font-bold text-white shadow-lg"
          >
            Admin workspace
          </button>
        ) : null}
      </>
    </div>
  );
}
