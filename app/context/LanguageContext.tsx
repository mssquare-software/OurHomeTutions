import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type AppLanguage = "en" | "hi" | "te";

const STORAGE_KEY = "oht_language_v1";

type TranslationKey =
  | "language.title"
  | "language.english"
  | "language.hindi"
  | "language.telugu"
  | "sidebar.language"
  | "sidebar.notifications"
  | "sidebar.bookings"
  | "sidebar.queries"
  | "sidebar.mentors"
  | "sidebar.bookingManagement"
  | "sidebar.hrReview"
  | "sidebar.postJob"
  | "sidebar.subjects"
  | "sidebar.updateAccount"
  | "sidebar.raiseQuery"
  | "sidebar.inbox"
  | "sidebar.messages"
  | "sidebar.accountSecurity"
  | "sidebar.resetPassword";

// App / screens
type ExtraKeys =
  | "common.overview"
  | "common.home"
  | "common.logout"
  | "common.booking"
  | "common.bookings"
  | "common.assign"
  | "common.refresh"
  | "common.dashboard"
  | "common.active"
  | "common.unsolved"
  | "dashboard.quickActions"
  | "dashboard.todaysActiveMentors"
  | "dashboard.mentorAvatar"
  | "dashboard.selectMentorChooseAvatar"
  | "stats.revenue"
  | "stats.today"
  | "stats.avgSession"
  | "stats.totalRevenue"
  | "stats.allTime"
  | "stats.newBookings"
  | "stats.acrossModes"
  | "stats.total"
  | "queries.title"
  | "queries.solved"
  | "queries.unsolved"
  | "queries.dateRange"
  | "queries.from"
  | "queries.to"
  | "queries.noQueries"
  | "queries.tryChange"
  | "queries.markSolved"
  | "queries.moveToUnsolved"
  | "bookings.title"
  | "bookings.assignMentor"
  | "bookingManagement.title"
  | "bookingManagement.reviewBookings"
  | "bookingManagement.selectBooking"
  | "bookingManagement.assignMentor"
  | "bookingManagement.greenRed"
  | "bookingManagement.selectedBooking"
  | "subjects.title"
  | "subjects.addSubject"
  | "subjects.allSubjects"
  | "subjects.manageTopics"
  | "subjects.hideTopics"
  | "raiseQuery.title"
  | "raiseQuery.subject"
  | "raiseQuery.message"
  | "raiseQuery.attachments"
  | "raiseQuery.submit";

type AllKeys = TranslationKey | ExtraKeys;

const DICT: Record<AppLanguage, Record<AllKeys, string>> = {
  en: {
    "language.title": "Language",
    "language.english": "English",
    "language.hindi": "Hindi",
    "language.telugu": "Telugu",
    "sidebar.language": "Language",
    "sidebar.notifications": "Notifications",
    "sidebar.bookings": "Bookings",
    "sidebar.queries": "Queries",
    "sidebar.mentors": "Mentors",
    "sidebar.bookingManagement": "Booking Management",
    "sidebar.hrReview": "HR Review",
    "sidebar.postJob": "Post Job",
    "sidebar.subjects": "Subjects",
    "sidebar.updateAccount": "Update Account Data",
    "sidebar.raiseQuery": "Raise Query",
    "sidebar.inbox": "Inbox",
    "sidebar.messages": "Messages",
    "sidebar.accountSecurity": "Account and Security",
    "sidebar.resetPassword": "Reset Password",

    "common.overview": "Overview",
    "common.home": "Home",
    "common.logout": "Logout",
    "common.booking": "Booking",
    "common.bookings": "Bookings",
    "common.assign": "Assign",
    "common.refresh": "Refresh",
    "common.dashboard": "Dashboard",
    "common.active": "Active",
    "common.unsolved": "Unsolved",
    "dashboard.quickActions": "Quick Actions",
    "dashboard.todaysActiveMentors": "Today's Active Mentors",
    "dashboard.mentorAvatar": "Mentor Avatar",
    "dashboard.selectMentorChooseAvatar": "Select mentor • choose avatar",
    "stats.revenue": "Revenue",
    "stats.today": "Today",
    "stats.avgSession": "Avg Session",
    "stats.totalRevenue": "Total Revenue",
    "stats.allTime": "All time",
    "stats.newBookings": "New bookings",
    "stats.acrossModes": "Across modes",
    "stats.total": "Total",
    "queries.title": "Queries",
    "queries.solved": "Solved",
    "queries.unsolved": "Unsolved",
    "queries.dateRange": "Date range",
    "queries.from": "From",
    "queries.to": "To",
    "queries.noQueries": "No queries",
    "queries.tryChange": "Try changing the date range or switching tabs.",
    "queries.markSolved": "Mark solved",
    "queries.moveToUnsolved": "Move to unsolved",
    "bookings.title": "Bookings",
    "bookings.assignMentor": "Assign Mentor",
    "bookingManagement.title": "Booking Management",
    "bookingManagement.reviewBookings": "Review Bookings",
    "bookingManagement.selectBooking": "Select a booking to assign a mentor.",
    "bookingManagement.assignMentor": "Assign Mentor",
    "bookingManagement.greenRed": "Green dot = Active, Red dot = Deactive.",
    "bookingManagement.selectedBooking": "Selected Booking",
    "subjects.title": "Subjects",
    "subjects.addSubject": "Add Subject",
    "subjects.allSubjects": "All Subjects",
    "subjects.manageTopics": "Manage topics",
    "subjects.hideTopics": "Hide topics",
    "raiseQuery.title": "Raise Query",
    "raiseQuery.subject": "Subject",
    "raiseQuery.message": "Message",
    "raiseQuery.attachments": "Attachments",
    "raiseQuery.submit": "Submit to Admin",
  },
  hi: {
    "language.title": "भाषा",
    "language.english": "अंग्रेज़ी",
    "language.hindi": "हिन्दी",
    "language.telugu": "तेलुगु",
    "sidebar.language": "भाषा",
    "sidebar.notifications": "सूचनाएँ",
    "sidebar.bookings": "बुकिंग",
    "sidebar.queries": "प्रश्न",
    "sidebar.mentors": "मेंटर्स",
    "sidebar.bookingManagement": "बुकिंग प्रबंधन",
    "sidebar.hrReview": "एचआर समीक्षा",
    "sidebar.postJob": "नौकरी पोस्ट करें",
    "sidebar.subjects": "विषय",
    "sidebar.updateAccount": "खाता अपडेट करें",
    "sidebar.raiseQuery": "प्रश्न भेजें",
    "sidebar.inbox": "इनबॉक्स",
    "sidebar.messages": "संदेश",
    "sidebar.accountSecurity": "खाता और सुरक्षा",
    "sidebar.resetPassword": "पासवर्ड रीसेट",

    "common.overview": "अवलोकन",
    "common.home": "होम",
    "common.logout": "लॉगआउट",
    "common.booking": "बुकिंग",
    "common.bookings": "बुकिंग",
    "common.assign": "असाइन",
    "common.refresh": "रीफ़्रेश",
    "common.dashboard": "डैशबोर्ड",
    "common.active": "सक्रिय",
    "common.unsolved": "अनसुलझा",
    "dashboard.quickActions": "क्विक एक्शन्स",
    "dashboard.todaysActiveMentors": "आज के सक्रिय मेंटर्स",
    "dashboard.mentorAvatar": "मेंटोर अवतार",
    "dashboard.selectMentorChooseAvatar": "मेंटोर चुनें • अवतार चुनें",
    "stats.revenue": "राजस्व",
    "stats.today": "आज",
    "stats.avgSession": "औसत सत्र",
    "stats.totalRevenue": "कुल राजस्व",
    "stats.allTime": "अब तक",
    "stats.newBookings": "नई बुकिंग",
    "stats.acrossModes": "सभी मोड",
    "stats.total": "कुल",
    "queries.title": "प्रश्न",
    "queries.solved": "सुलझा हुआ",
    "queries.unsolved": "अनसुलझा",
    "queries.dateRange": "तारीख सीमा",
    "queries.from": "से",
    "queries.to": "तक",
    "queries.noQueries": "कोई प्रश्न नहीं",
    "queries.tryChange": "तारीख सीमा बदलें या टैब बदलें।",
    "queries.markSolved": "सुलझा हुआ करें",
    "queries.moveToUnsolved": "अनसुलझा में रखें",
    "bookings.title": "बुकिंग",
    "bookings.assignMentor": "मेंटोर असाइन",
    "bookingManagement.title": "बुकिंग प्रबंधन",
    "bookingManagement.reviewBookings": "बुकिंग देखें",
    "bookingManagement.selectBooking": "मेंटोर असाइन करने के लिए बुकिंग चुनें।",
    "bookingManagement.assignMentor": "मेंटोर असाइन",
    "bookingManagement.greenRed": "हरा = सक्रिय, लाल = निष्क्रिय।",
    "bookingManagement.selectedBooking": "चुनी हुई बुकिंग",
    "subjects.title": "विषय",
    "subjects.addSubject": "विषय जोड़ें",
    "subjects.allSubjects": "सभी विषय",
    "subjects.manageTopics": "टॉपिक्स प्रबंधित करें",
    "subjects.hideTopics": "टॉपिक्स छुपाएँ",
    "raiseQuery.title": "प्रश्न भेजें",
    "raiseQuery.subject": "विषय",
    "raiseQuery.message": "संदेश",
    "raiseQuery.attachments": "अटैचमेंट्स",
    "raiseQuery.submit": "एडमिन को भेजें",
  },
  te: {
    "language.title": "భాష",
    "language.english": "ఇంగ్లీష్",
    "language.hindi": "హిందీ",
    "language.telugu": "తెలుగు",
    "sidebar.language": "భాష",
    "sidebar.notifications": "నోటిఫికేషన్స్",
    "sidebar.bookings": "బుకింగ్స్",
    "sidebar.queries": "క్వెరీస్",
    "sidebar.mentors": "మెంటర్స్",
    "sidebar.bookingManagement": "బుకింగ్ మేనేజ్‌మెంట్",
    "sidebar.hrReview": "హెచ్‌آర్ రివ్యూ",
    "sidebar.postJob": "జాబ్ పోస్ట్",
    "sidebar.subjects": "విషయాలు",
    "sidebar.updateAccount": "అకౌంట్ అప్డేట్",
    "sidebar.raiseQuery": "క్వెరీ పంపండి",
    "sidebar.inbox": "ఇన్‌బాక్స్",
    "sidebar.messages": "మెసేజెస్",
    "sidebar.accountSecurity": "అకౌంట్ & సెక్యూరిటీ",
    "sidebar.resetPassword": "పాస్‌వర్డ్ రీసెట్",

    "common.overview": "అవలోకనం",
    "common.home": "హోమ్",
    "common.logout": "లాగౌట్",
    "common.booking": "బుకింగ్",
    "common.bookings": "బుకింగ్స్",
    "common.assign": "అసైన్",
    "common.refresh": "రిఫ్రెష్",
    "common.dashboard": "డాష్‌బోర్డ్",
    "common.active": "యాక్టివ్",
    "common.unsolved": "అన్‌సాల్వ్డ్",
    "dashboard.quickActions": "క్విక్ యాక్షన్స్",
    "dashboard.todaysActiveMentors": "ఈరోజు యాక్టివ్ మెంటర్స్",
    "dashboard.mentorAvatar": "మెంటర్ అవతార్",
    "dashboard.selectMentorChooseAvatar": "మెంటర్ ఎంచుకోండి • అవతార్ ఎంచుకోండి",
    "stats.revenue": "రెవెన్యూ",
    "stats.today": "ఈరోజు",
    "stats.avgSession": "సగటు సెషన్",
    "stats.totalRevenue": "మొత్తం రెవెన్యూ",
    "stats.allTime": "మొత్తం",
    "stats.newBookings": "కొత్త బుకింగ్స్",
    "stats.acrossModes": "అన్ని మోడ్‌లు",
    "stats.total": "మొత్తం",
    "queries.title": "క్వెరీస్",
    "queries.solved": "సాల్వ్డ్",
    "queries.unsolved": "అన్‌సాల్వ్డ్",
    "queries.dateRange": "తేదీ పరిధి",
    "queries.from": "నుండి",
    "queries.to": "వరకు",
    "queries.noQueries": "క్వెరీస్ లేవు",
    "queries.tryChange": "తేదీ పరిధి లేదా ట్యాబ్ మార్చండి.",
    "queries.markSolved": "సాల్వ్డ్ చేయండి",
    "queries.moveToUnsolved": "అన్‌సాల్వ్డ్ కి మార్చండి",
    "bookings.title": "బుకింగ్స్",
    "bookings.assignMentor": "మెంటర్ అసైన్",
    "bookingManagement.title": "బుకింగ్ మేనేజ్‌మెంట్",
    "bookingManagement.reviewBookings": "బుకింగ్స్ రివ్యూ",
    "bookingManagement.selectBooking": "మెంటర్ అసైన్ చేయడానికి బుకింగ్ ఎంచుకోండి.",
    "bookingManagement.assignMentor": "మెంటర్ అసైన్",
    "bookingManagement.greenRed": "పచ్చ = యాక్టివ్, ఎరుపు = డియాక్టివ్.",
    "bookingManagement.selectedBooking": "ఎంచుకున్న బుకింగ్",
    "subjects.title": "విషయాలు",
    "subjects.addSubject": "విషయం జోడించండి",
    "subjects.allSubjects": "అన్ని విషయాలు",
    "subjects.manageTopics": "టాపిక్స్ మేనేజ్",
    "subjects.hideTopics": "టాపిక్స్ దాచు",
    "raiseQuery.title": "క్వెరీ పంపండి",
    "raiseQuery.subject": "విషయం",
    "raiseQuery.message": "సందేశం",
    "raiseQuery.attachments": "అటాచ్‌మెంట్స్",
    "raiseQuery.submit": "అడ్మిన్‌కు పంపండి",
  },
};

type LanguageContextType = {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => Promise<void>;
  t: (key: AllKeys) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>("en");

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw === "en" || raw === "hi" || raw === "te") setLanguageState(raw);
      } catch {
        // ignore
      }
    })();
  }, []);

  const setLanguage = useCallback(async (lang: AppLanguage) => {
    setLanguageState(lang);
    await AsyncStorage.setItem(STORAGE_KEY, lang);
  }, []);

  const t = useCallback(
    (key: AllKeys) => {
      return DICT[language][key] ?? DICT.en[key] ?? key;
    },
    [language]
  );

  const value = useMemo(() => ({ language, setLanguage, t }), [language, setLanguage, t]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}

