import DateTimePicker from "@react-native-community/datetimepicker";
import { CameraView, useCameraPermissions } from "expo-camera";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { router } from "expo-router";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Easing,
  Modal,
  Platform,
  Pressable,
  type PressableProps,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  type ViewStyle,
  View,
} from "react-native";
import { PayPalLoader } from "../../components/animations/PayPalLoader";
import { CBSE_DATA, type CbseSubject } from "../../constants/cbseSubjects";
import { BookingRequest } from "../../constants/notificationTypes";
import type { StateBoard, StateSubject } from "../../constants/stateSubjects";
import { STATE_DATA } from "../../constants/stateSubjects";
import { listSubjects } from "../data/repo/repo";
import { useNotifications } from "../hooks/useNotifications";
import { useTour } from "../tour/useTour";

type Board = "CBSE" | "STATE";
type LessonType = "Single" | "Group";
type ClassMode = "Online" | "Offline";

type Step =
  | "selectClass"
  | "selectBoard"
  | "selectSubjects"
  | "mode"
  | "slots"
  | "details"
  | "payment";

const PAL = {
  // Vibrant Purple (Generate Site Button)
  PURPLE_BASE: "#7C3AED",
  PURPLE_GLOW: "#A78BFA",
  
  // Dark Navy (Book Now Button)
  NAVY_BTN_BG: "#1C2F4A",
  NAVY_BTN_BORDER: "#6085B6",

  // Typography & Layout
  PURE_WHITE: "#FFFFFF",
  MUTED_WHITE: "rgba(255,255,255,0.65)",
  GLASS_BG: "rgba(255,255,255,0.08)",
  GLASS_BORDER: "rgba(255,255,255,0.15)",
  DARK_MODAL: "#111F35",
  CORAL: "#FF7F50",
} as const;

/** Local calendar day (avoids UTC shift for YYYY-MM-DD). */
function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function formatDateLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatHourSlot(hour: number): string {
  return `${String(hour).padStart(2, "0")}:00`;
}

/** True if this calendar day + hour is not after "now" (past or same instant). */
function isHourSlotPassed(date: Date, hour: number): boolean {
  const slot = new Date(date);
  slot.setHours(hour, 0, 0, 0);
  return slot.getTime() <= Date.now();
}

/** 9:00 … 20:00 (9 AM – 8 PM). */
const SESSION_HOURS = Array.from({ length: 12 }, (_, i) => 9 + i);

const WINDOW_H = Dimensions.get("window").height;

function SparklePressable({
  children,
  onPressIn,
  style,
  ...rest
}: PressableProps) {
  const burst = useRef(new Animated.Value(0)).current;

  const playBurst = useCallback(() => {
    burst.setValue(0);
    Animated.timing(burst, {
      toValue: 1,
      duration: 520,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [burst]);

  const particles = useMemo(
    () => [
      { x: -78, y: -22, size: 9, hollow: true },
      { x: -58, y: -40, size: 6 },
      { x: -26, y: -52, size: 8 },
      { x: 2, y: -58, size: 5 },
      { x: 30, y: -50, size: 7, hollow: true },
      { x: 58, y: -34, size: 8 },
      { x: 78, y: -6, size: 6 },
      { x: 84, y: 26, size: 9 },
      { x: 46, y: 50, size: 7 },
      { x: 14, y: 58, size: 8, hollow: true },
      { x: -18, y: 56, size: 6 },
      { x: -50, y: 48, size: 8 },
      { x: -80, y: 20, size: 7 },
      { x: -84, y: -4, size: 5 },
    ],
    [],
  );

  return (
    <Pressable
      {...rest}
      onPressIn={(e) => {
        playBurst();
        onPressIn?.(e);
      }}
      style={(state) => {
        const base: ViewStyle = { overflow: "visible" };
        const restStyle = typeof style === "function" ? style(state) : style;
        return [
          base,
          state.pressed && { transform: [{ scale: 0.96 }] },
          restStyle,
        ];
      }}
    >
      {(state) => (
        <View style={{ position: "relative", overflow: "visible" }}>
          {typeof children === "function" ? children(state) : children}

          <Animated.View
            pointerEvents="none"
            style={[
              styles.sparkLayer,
              {
                opacity: burst.interpolate({
                  inputRange: [0, 0.12, 1],
                  outputRange: [0, 1, 0],
                }),
              },
            ]}
          >
            {particles.map((p, i) => (
              <Animated.View
                // eslint-disable-next-line react/no-array-index-key
                key={`p-${i}`}
                style={[
                  p.hollow ? styles.sparkDotHollow : styles.sparkDot,
                  {
                    left: "50%",
                    top: "50%",
                    width: p.size,
                    height: p.size,
                    marginLeft: -p.size / 2,
                    marginTop: -p.size / 2,
                    borderRadius: p.size / 2,
                    transform: [
                      {
                        translateX: burst.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, p.x],
                        }),
                      },
                      {
                        translateY: burst.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, p.y],
                        }),
                      },
                      {
                        scale: burst.interpolate({
                          inputRange: [0, 0.35, 1],
                          outputRange: [0.25, 1.1, 0.45],
                        }),
                      },
                    ],
                  },
                ]}
              />
            ))}
          </Animated.View>
        </View>
      )}
    </Pressable>
  );
}

export default function Booking() {
  const [step, setStep] = useState<Step>("selectClass");

  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [board, setBoard] = useState<Board | null>(null);
  const [stateBoard, setStateBoard] = useState<StateBoard | null>(null);

  const [adminSubjects, setAdminSubjects] = useState<{ name: string; topics: string[] }[]>([]);

  const [selectedTopics, setSelectedTopics] = useState<
    Record<string, string[] | undefined>
  >({});
  const [hoursBySubject, setHoursBySubject] = useState<Record<string, number>>(
    {},
  );

  const [classMode, setClassMode] = useState<ClassMode | null>(null);

  const [slotOpen, setSlotOpen] = useState(false);
  const [slotDate, setSlotDate] = useState<Date>(() => startOfDay(new Date()));
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [showAndroidDatePicker, setShowAndroidDatePicker] = useState(false);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [lessonType, setLessonType] = useState<LessonType>("Single");
  const [participants, setParticipants] = useState<string[]>([""]);
  const [address, setAddress] = useState("");
  const [contact, setContact] = useState("");
  const [locLoading, setLocLoading] = useState(false);

  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<
    "Card" | "Paytm" | "BHIM" | "UPI" | "PayPal" | "Scan QR" | null
  >(null);
  const [loading, setLoading] = useState(false);
  const [cardHolder, setCardHolder] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [paytmId, setPaytmId] = useState("");
  const [bhimUpiId, setBhimUpiId] = useState("");
  const [gpayUpiId, setGpayUpiId] = useState("");
  const [qrScannerOpen, setQrScannerOpen] = useState(false);
  const [qrPayload, setQrPayload] = useState("");
  const qrScanLock = useRef(false);
  const [, requestCameraPermission] = useCameraPermissions();

  // Hooks
  const { createBooking } = useNotifications();
  const { startTour, completedPages } = useTour();

  const subjectsForSelection = useMemo<CbseSubject[]>(() => {
    if (board !== "CBSE" || !selectedClass) return [];
    return (
      CBSE_DATA.find(
        (x: { class: number; subjects: CbseSubject[] }) =>
          x.class === selectedClass,
      )?.subjects ?? []
    );
  }, [board, selectedClass]);

  const stateSubjectsForSelection = useMemo<StateSubject[]>(() => {
    if (board !== "STATE" || !selectedClass || !stateBoard) return [];
    const cls = STATE_DATA[stateBoard].find((x) => x.class === selectedClass);
    return cls?.subjects ?? [];
  }, [board, selectedClass, stateBoard]);

  React.useEffect(() => {
    (async () => {
      try {
        const subs = await listSubjects();
        const mapped = subs
          .filter((s) => s.isActive !== false)
          .map((s) => ({
            name: s.name,
            topics: (s.topics ?? []).map((t) => t.name),
          }))
          .filter((s) => s.name && s.topics.length > 0);
        setAdminSubjects(mapped);
      } catch {
        setAdminSubjects([]);
      }
    })();
  }, []);

  const subjectsToRender = useMemo(() => {
    if (adminSubjects.length > 0) return adminSubjects;
    if (board === "CBSE") return subjectsForSelection;
    if (board === "STATE") return stateSubjectsForSelection;
    return [];
  }, [adminSubjects, board, subjectsForSelection, stateSubjectsForSelection]);

  const totalHours = useMemo(
    () => Object.values(hoursBySubject).reduce((a, b) => a + (b || 0), 0),
    [hoursBySubject],
  );

  React.useEffect(() => {
    if (!completedPages.includes("booking")) {
      startTour("booking");
    }
  }, [startTour, completedPages]);

  /** Android: open system date picker shortly after the slot modal is visible (avoids stacking glitches). */
  React.useEffect(() => {
    if (!slotOpen || Platform.OS !== "android") return;
    const id = setTimeout(() => setShowAndroidDatePicker(true), 400);
    return () => {
      clearTimeout(id);
      setShowAndroidDatePicker(false);
    };
  }, [slotOpen]);

  const openQrScanner = useCallback(async () => {
    if (Platform.OS === "web") {
      Alert.alert(
        "QR on web",
        "Paste the payment link or UPI text in the field below.",
      );
      return;
    }
    const res = await requestCameraPermission();
    if (!res.granted) {
      Alert.alert(
        "Camera",
        "Camera access is required to scan QR codes for payment.",
      );
      return;
    }
    qrScanLock.current = false;
    setQrScannerOpen(true);
  }, [requestCameraPermission]);

  const onQrBarcodeScanned = useCallback(
    (result: { data: string }) => {
      if (qrScanLock.current) return;
      qrScanLock.current = true;
      setQrPayload(result.data);
      setQrScannerOpen(false);
      setTimeout(() => {
        qrScanLock.current = false;
      }, 600);
    },
    [],
  );

  const handleSlotDateChange = useCallback((next: Date) => {
    const nextDay = startOfDay(next);
    const today = startOfDay(new Date());
    const clamped = nextDay < today ? today : nextDay;
    setSlotDate(clamped);
    setSelectedTime((prev) => {
      if (!prev) return null;
      const h = parseInt(prev.split(":")[0], 10);
      if (Number.isNaN(h)) return null;
      return isHourSlotPassed(clamped, h) ? null : prev;
    });
  }, []);

  const setHoursSafe = (subjectName: string, hours: number) => {
    const next = { ...hoursBySubject, [subjectName]: hours };
    const nextTotal = Object.values(next).reduce((a, b) => a + (b || 0), 0);

    if (nextTotal > 2) {
      Alert.alert(
        "Max 2 hours per Days",
        "Total hours per day cannot exceed 2.",
      );
      return;
    }
    setHoursBySubject(next);
  };

  const bookNow = () => {
    if (!selectedClass)
      return Alert.alert("Select Class", "Please select class 1 to 10.");
    if (!board)
      return Alert.alert("Select Board", "Please select CBSE or STATE.");

    if (board === "STATE" && !stateBoard) {
      Alert.alert("State board", "Please choose AP or Telangana board.");
      return;
    }

    if (Object.keys(selectedTopics).length === 0) {
      Alert.alert(
        "Select Subject",
        "Please select at least one subject/topic.",
      );
      return;
    }

    if (totalHours <= 0) {
      Alert.alert("Select Hours", "Please select hours (max 2 per day).");
      return;
    }

    setStep("mode");
  };

  const proceedToSlots = () => {
    if (!classMode) {
      Alert.alert("Mode required", "Please select Online or Offline.");
      return;
    }
    setSlotDate((prev) => {
      const today = startOfDay(new Date());
      const cur = startOfDay(prev);
      return cur < today ? today : cur;
    });
    setStep("slots");
    setSlotOpen(true);
  };

  const proceedToDetails = () => {
    if (!selectedTime) {
      Alert.alert("Select Slot", "Please select a time.");
      return;
    }
    setSlotOpen(false);
    setStep("details");
    setDetailsOpen(true);
  };

  const validateDetailsAndOpenPayment = () => {
    const names = participants.map((p) => p.trim()).filter(Boolean);

    if (names.length === 0) {
      Alert.alert("Name required", "Please enter at least one name.");
      return;
    }
    if (lessonType === "Single" && names.length !== 1) {
      Alert.alert("Single session", "Only 1 person is allowed in Single mode.");
      return;
    }
    if (lessonType === "Group" && names.length > 5) {
      Alert.alert("Max 5 people", "You can add maximum 5 people in group.");
      return;
    }

    if (!contact.trim()) {
      Alert.alert("Contact required", "Please enter contact number.");
      return;
    }

    if (classMode === "Offline" && !address.trim()) {
      Alert.alert(
        "Address required",
        "Please enter address or fetch current location.",
      );
      return;
    }

    setDetailsOpen(false);
    setStep("payment");
    setPaymentOpen(true);
  };

  const fetchCurrentLocation = async () => {
    try {
      setLocLoading(true);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission denied",
          "Location permission is required to fetch address.",
        );
        return;
      }

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const geocode = await Location.reverseGeocodeAsync({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });

      const first = geocode?.[0];
      if (!first) {
        Alert.alert(
          "Location",
          "Unable to fetch address. Please enter manually.",
        );
        return;
      }

      const pretty = [
        first.name,
        first.street,
        first.district,
        first.city,
        first.region,
        first.postalCode,
        first.country,
      ]
        .filter(Boolean)
        .join(", ");

      setAddress(pretty);
    } catch {
      Alert.alert("Location error", "Could not fetch current location.");
    } finally {
      setLocLoading(false);
    }
  };

  const pay = async () => {
    if (!paymentMethod) {
      Alert.alert(
        "Select payment method",
        "Please choose Card/Paytm/BHIM/UPI/PayPal/Scan QR.",
      );
      return;
    }

    setLoading(true);
    setTimeout(async () => {
      setLoading(false);
      setPaymentOpen(false);

      try {
        const booking: BookingRequest = {
          id: Math.random().toString(36).substr(2, 9),
          parentId: "parent-001",
          parentName: "John Doe",
          childName: participants[0] || "Student",
          subject: Object.keys(selectedTopics)[0] || "Mathematics",
          grade: String(selectedClass),
          mode: classMode?.toLowerCase() as "online" | "offline",
          date: formatDateLocal(slotDate),
          time: selectedTime || "10:00",
          hours: totalHours,
          address: address,
          contact: contact,
          status: "pending",
          createdAt: new Date().toISOString(),
        };

        await createBooking(booking);

        router.push({
          pathname: "/(tabs)/booking-confirmation",
          params: { bookingId: booking.id },
        });
      } catch (error) {
        Alert.alert("Error", "Failed to create booking. Please try again.");
      }
    }, 1500);
  };

  const StepBack = () => {
    if (qrScannerOpen) return setQrScannerOpen(false);
    if (paymentOpen) return setPaymentOpen(false);
    if (detailsOpen) return setDetailsOpen(false);
    if (slotOpen) return setSlotOpen(false);

    if (step === "payment") return setStep("details");
    if (step === "details") return setStep("slots");
    if (step === "slots") return setStep("mode");
    if (step === "mode") return setStep("selectSubjects");
    if (step === "selectSubjects") return setStep("selectBoard");
    if (step === "selectBoard") return setStep("selectClass");

    router.back();
  };

  const setLessonTypeSafe = (t: LessonType) => {
    setLessonType(t);
    if (t === "Single") setParticipants((prev) => [prev[0] ?? ""]);
    else setParticipants((prev) => (prev.length ? prev : [""]));
  };

  const addPerson = () => {
    setParticipants((prev) => {
      if (prev.length >= 5) {
        Alert.alert("Max 5 people", "You can add maximum 5 people in group.");
        return prev;
      }
      return [...prev, ""];
    });
  };

  const updatePerson = (idx: number, value: string) => {
    setParticipants((prev) => prev.map((p, i) => (i === idx ? value : p)));
  };

  const removePerson = (idx: number) => {
    setParticipants((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      return next.length ? next : [""];
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Background Gradient matching the first image */}
      <LinearGradient
        colors={["#0A1930", "#122A4F", "#0A1930"]}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.container}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <SparklePressable onPress={StepBack} style={styles.backBtn} hitSlop={10}>
            <Text style={styles.backBtnText}>‹ Back</Text>
          </SparklePressable>

          <View style={{ flex: 1 }}>
            <Text style={styles.h1}>Booking</Text>
            <Text style={styles.h2}>Step: {step}</Text>
          </View>

          <View style={{ width: 70 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Class */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>1) Please select Class</Text>
            <View style={styles.chipsWrap}>
              {Array.from({ length: 10 }, (_, i) => i + 1).map((c) => {
                const active = selectedClass === c;
                return (
                  <SparklePressable
                    key={c}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => {
                      setSelectedClass(c);
                      setBoard(null);
                      setSelectedTopics({});
                      setHoursBySubject({});
                      setClassMode(null);
                      setStep("selectBoard");
                    }}
                  >
                    <Text
                      style={[styles.chipText, active && styles.chipTextActive]}
                    >
                      Class {c}
                    </Text>
                  </SparklePressable>
                );
              })}
            </View>
          </View>

          {/* Board */}
          {selectedClass && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>2) Select Board</Text>
              <View style={styles.row}>
                <SparklePressable
                  style={[
                    styles.bigOption,
                    board === "CBSE" && styles.bigOptionActive,
                  ]}
                  onPress={() => {
                    setBoard("CBSE");
                    setSelectedTopics({});
                    setHoursBySubject({});
                    setClassMode(null);
                    setStep("selectSubjects");
                  }}
                >
                  <Text
                    style={[
                      styles.bigOptionText,
                      board === "CBSE" && styles.bigOptionTextActive,
                    ]}
                  >
                    CBSE
                  </Text>
                </SparklePressable>

                <SparklePressable
                  style={[
                    styles.bigOption,
                    board === "STATE" && styles.bigOptionActive,
                  ]}
                  onPress={() => {
                    setBoard("STATE");
                    setSelectedTopics({});
                    setHoursBySubject({});
                    setClassMode(null);
                    setStep("selectSubjects");
                  }}
                >
                  <Text
                    style={[
                      styles.bigOptionText,
                      board === "STATE" && styles.bigOptionTextActive,
                    ]}
                  >
                    STATE
                  </Text>
                </SparklePressable>
              </View>
            </View>
          )}

          {/* Subjects */}
          {board && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>
                3) Subjects & Topics (max 2 hours/day)
              </Text>

              {board === "STATE" && (
                <>
                  <Text style={styles.mutedText}>Choose State board</Text>
                  <View style={[styles.row, { marginVertical: 8 }]}>
                    {(["AP", "Telangana"] as StateBoard[]).map((sb) => {
                      const active = stateBoard === sb;
                      return (
                        <SparklePressable
                          key={sb}
                          style={[
                            styles.bigOption,
                            active && styles.bigOptionActive,
                          ]}
                          onPress={() => {
                            setStateBoard(sb);
                            setSelectedTopics({});
                            setHoursBySubject({});
                          }}
                        >
                          <Text
                            style={[
                              styles.bigOptionText,
                              active && styles.bigOptionTextActive,
                            ]}
                          >
                            {sb}
                          </Text>
                        </SparklePressable>
                      );
                    })}
                  </View>
                </>
              )}

              {((adminSubjects.length > 0) || board === "CBSE" || (board === "STATE" && stateBoard)) && (
                <>
                  {(subjectsToRender as any[]).map((s: any) => {
                    const chosenTopics = selectedTopics[s.name] ?? [];
                    const hours = hoursBySubject[s.name] ?? 0;

                    return (
                      <View key={s.name} style={styles.subjectBlock}>
                        <View style={styles.subjectHeader}>
                          <Text style={styles.subjectName}>{s.name}</Text>

                          <View style={styles.hoursRow}>
                            <Text style={styles.mutedText}>Hours</Text>
                            <TextInput
                              value={String(hours)}
                              keyboardType="numeric"
                              onChangeText={(t) => {
                                const n = Number(t.replace(/[^0-9]/g, ""));
                                setHoursSafe(
                                  s.name,
                                  Number.isFinite(n) ? n : 0,
                                );
                              }}
                              style={styles.hoursInput}
                            />
                          </View>
                        </View>

                        <Text style={styles.mutedText}>
                          Topics (you can choose multiple)
                        </Text>
                        <View style={styles.topicsWrap}>
                          {s.topics.map((t: string) => {
                            const active = chosenTopics.includes(t);
                            return (
                              <SparklePressable
                                key={t}
                                style={[
                                  styles.chip,
                                  active && styles.chipActive,
                                ]}
                                onPress={() => {
                                  setSelectedTopics((prev) => {
                                    const current = prev[s.name] ?? [];
                                    const exists = current.includes(t);
                                    const next = exists
                                      ? current.filter((x) => x !== t)
                                      : [...current, t];
                                    return { ...prev, [s.name]: next };
                                  });
                                  if ((hoursBySubject[s.name] ?? 0) === 0)
                                    setHoursSafe(s.name, 1);
                                }}
                              >
                                <Text
                                  style={[
                                    styles.chipText,
                                    active && styles.chipTextActive,
                                  ]}
                                >
                                  {t}
                                </Text>
                              </SparklePressable>
                            );
                          })}
                        </View>
                      </View>
                    );
                  })}

                  <View style={styles.totalRow}>
                    <Text style={styles.totalText}>Total hours/day</Text>
                    <Text style={styles.totalVal}>{totalHours}/2</Text>
                  </View>

                  <SparklePressable style={styles.bookNowBtn} onPress={bookNow}>
                    <Text style={styles.bookNowBtnText}>Continue</Text>
                  </SparklePressable>
                </>
              )}
            </View>
          )}

          {/* Mode of classes */}
          {step === "mode" && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>4) Mode of Classes</Text>

              <View style={styles.row}>
                <SparklePressable
                  style={[
                    styles.bigOption,
                    classMode === "Online" && styles.bigOptionActive,
                  ]}
                  onPress={() => setClassMode("Online")}
                >
                  <Text
                    style={[
                      styles.bigOptionText,
                      classMode === "Online" && styles.bigOptionTextActive,
                    ]}
                  >
                    Online
                  </Text>
                </SparklePressable>

                <SparklePressable
                  style={[
                    styles.bigOption,
                    classMode === "Offline" && styles.bigOptionActive,
                  ]}
                  onPress={() => setClassMode("Offline")}
                >
                  <Text
                    style={[
                      styles.bigOptionText,
                      classMode === "Offline" && styles.bigOptionTextActive,
                    ]}
                  >
                    Offline
                  </Text>
                </SparklePressable>
              </View>

              <SparklePressable style={styles.bookNowBtn} onPress={proceedToSlots}>
                <Text style={styles.bookNowBtnText}>Choose Slot</Text>
              </SparklePressable>
            </View>
          )}
        </ScrollView>

        {/* Slots modal */}
        <Modal
          visible={slotOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setSlotOpen(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, styles.slotModalCard]}>
              <SparklePressable
                onPress={StepBack}
                style={styles.modalBack}
                hitSlop={8}
              >
                <Text style={styles.modalBackText}>‹ Back</Text>
              </SparklePressable>

              <Text style={styles.slotModalTitle}>Available Slots</Text>
              <Text style={styles.slotModalSub}>
                Mode: {classMode ?? "-"}
              </Text>

              <View style={{ height: 12 }} />

              <ScrollView
                style={styles.slotModalScroll}
                contentContainerStyle={styles.slotModalScrollContent}
                showsVerticalScrollIndicator
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled
              >
                <Text style={styles.slotModalLabel}>Select date</Text>
                {Platform.OS === "ios" ? (
                  <View style={styles.slotDatePickerWrap}>
                    <DateTimePicker
                      value={slotDate}
                      mode="date"
                      display="inline"
                      themeVariant="dark"
                      textColor={PAL.PURE_WHITE}
                      minimumDate={startOfDay(new Date())}
                      onChange={(_, date) => {
                        if (date) handleSlotDateChange(date);
                      }}
                    />
                  </View>
                ) : (
                  <>
                    <SparklePressable
                      style={styles.slotDateButton}
                      onPress={() => setShowAndroidDatePicker(true)}
                    >
                      <Text style={styles.slotModalStrong}>
                        {formatDateLocal(slotDate)}
                      </Text>
                      <Text style={styles.slotModalHint}>
                        Tap to open calendar again
                      </Text>
                    </SparklePressable>
                    {showAndroidDatePicker && (
                      <DateTimePicker
                        value={slotDate}
                        mode="date"
                        display="default"
                        minimumDate={startOfDay(new Date())}
                        onChange={(event, date) => {
                          setShowAndroidDatePicker(false);
                          if (event.type === "dismissed") return;
                          if (date) handleSlotDateChange(date);
                        }}
                      />
                    )}
                  </>
                )}

                <View style={{ height: 12 }} />

                <Text style={styles.slotModalLabel}>
                  Select time (9:00 – 8:00 PM)
                </Text>
                <View style={styles.chipsWrap}>
                  {SESSION_HOURS.map((h) => {
                    const tm = formatHourSlot(h);
                    const active = selectedTime === tm;
                    const passed = isHourSlotPassed(slotDate, h);
                    return (
                      <SparklePressable
                        key={tm}
                        disabled={passed}
                        style={[
                          styles.slotChip,
                          active && styles.slotChipActive,
                          passed && styles.slotChipDisabled,
                        ]}
                        onPress={() => setSelectedTime(tm)}
                      >
                        <Text
                          style={[
                            styles.slotChipText,
                            active && styles.slotChipTextActive,
                            passed && styles.slotChipTextDisabled,
                          ]}
                        >
                          {tm}
                        </Text>
                      </SparklePressable>
                    );
                  })}
                </View>
              </ScrollView>

              <View style={styles.modalBtns}>
                <SparklePressable style={styles.modalSecondary} onPress={StepBack}>
                  <Text style={styles.modalSecondaryText}>Back</Text>
                </SparklePressable>

                <SparklePressable style={styles.bookNowBtnModal} onPress={proceedToDetails}>
                  <Text style={styles.bookNowBtnText}>Continue</Text>
                </SparklePressable>
              </View>
            </View>
          </View>
        </Modal>

        {/* Details form modal */}
        <Modal
          visible={detailsOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setDetailsOpen(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <SparklePressable
                onPress={StepBack}
                style={styles.modalBack}
                hitSlop={8}
              >
                <Text style={styles.modalBackText}>‹ Back</Text>
              </SparklePressable>

              <Text style={styles.modalTitle}>Booking Details</Text>
              <Text style={styles.modalSub}>
                Mode: {classMode ?? "-"} • {formatDateLocal(slotDate)}{" "}
                {selectedTime}
              </Text>

              <View style={{ height: 12 }} />

              <Text style={styles.mutedText}>Session Type</Text>
              <View style={[styles.row, { marginTop: 8 }]}>
                <SparklePressable
                  style={[
                    styles.chip,
                    lessonType === "Single" && styles.chipActive,
                  ]}
                  onPress={() => setLessonTypeSafe("Single")}
                >
                  <Text
                    style={[
                      styles.chipText,
                      lessonType === "Single" && styles.chipTextActive,
                    ]}
                  >
                    Single
                  </Text>
                </SparklePressable>

                <SparklePressable
                  style={[
                    styles.chip,
                    lessonType === "Group" && styles.chipActive,
                  ]}
                  onPress={() => setLessonTypeSafe("Group")}
                >
                  <Text
                    style={[
                      styles.chipText,
                      lessonType === "Group" && styles.chipTextActive,
                    ]}
                  >
                    Group
                  </Text>
                </SparklePressable>

                {lessonType === "Group" && (
                  <SparklePressable style={styles.addBtn} onPress={addPerson}>
                    <Text style={styles.addBtnText}>＋</Text>
                  </SparklePressable>
                )}
              </View>

              <View style={{ height: 12 }} />

              <Text style={styles.mutedText}>
                Name{lessonType === "Group" ? "s (max 5)" : ""}
              </Text>

              <View style={{ marginTop: 8, gap: 10 }}>
                {participants.map((p, idx) => (
                  <View key={idx} style={styles.nameRow}>
                    <TextInput
                      value={p}
                      placeholder={
                        idx === 0 ? "Enter name" : `Person ${idx + 1} name`
                      }
                      placeholderTextColor={PAL.MUTED_WHITE}
                      onChangeText={(t) => updatePerson(idx, t)}
                      style={styles.input}
                    />

                    {lessonType === "Group" && participants.length > 1 && (
                      <SparklePressable
                        onPress={() => removePerson(idx)}
                        style={styles.removeBtn}
                      >
                        <Text style={styles.removeBtnText}>×</Text>
                      </SparklePressable>
                    )}
                  </View>
                ))}
              </View>

              <View style={{ height: 12 }} />

              <Text style={styles.mutedText}>Contact</Text>
              <TextInput
                value={contact}
                placeholder="Enter contact number"
                placeholderTextColor={PAL.MUTED_WHITE}
                keyboardType="phone-pad"
                onChangeText={setContact}
                style={styles.input}
              />

              <View style={{ height: 12 }} />

              <View style={styles.addressHeader}>
                <Text style={styles.mutedText}>
                  Address
                  {classMode === "Online" ? " (optional for Online)" : ""}
                </Text>

                <SparklePressable
                  onPress={fetchCurrentLocation}
                  style={styles.fetchBtn}
                  disabled={locLoading}
                >
                  <Text style={styles.fetchBtnText}>
                    {locLoading ? "Fetching..." : "Fetch Location"}
                  </Text>
                </SparklePressable>
              </View>

              <TextInput
                value={address}
                placeholder="Enter address"
                placeholderTextColor={PAL.MUTED_WHITE}
                onChangeText={setAddress}
                style={[styles.input, { height: 86, textAlignVertical: "top" }]}
                multiline
              />

              <View style={styles.modalBtns}>
                <SparklePressable style={styles.modalSecondary} onPress={StepBack}>
                  <Text style={styles.modalSecondaryText}>Back</Text>
                </SparklePressable>
                <SparklePressable
                  style={styles.bookNowBtnModal}
                  onPress={validateDetailsAndOpenPayment}
                >
                  <Text style={styles.bookNowBtnText}>Continue</Text>
                </SparklePressable>
              </View>
            </View>
          </View>
        </Modal>

        {/* Payment modal */}
        <Modal
          visible={paymentOpen}
          transparent
          animationType="fade"
          onRequestClose={() => {
            if (qrScannerOpen) setQrScannerOpen(false);
            else setPaymentOpen(false);
          }}
        >
          <View style={styles.modalOverlay}>
            <ScrollView
              contentContainerStyle={styles.paymentModalScrollOuter}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.paymentModalInner}>
                <View style={styles.paymentHeader}>
                  <Text style={styles.paymentTitle}>Payment Options</Text>
                  <SparklePressable
                    onPress={StepBack}
                    style={styles.backCircle}
                    hitSlop={8}
                  >
                    <Text style={styles.backCircleGlyph}>‹</Text>
                  </SparklePressable>
                </View>

                <Text style={styles.paymentSessionLine}>
                  {classMode ?? "-"} · {formatDateLocal(slotDate)} ·{" "}
                  {selectedTime ?? ""}
                </Text>

                {loading ? (
                  <View style={styles.loadingBoxLight}>
                    <PayPalLoader />
                    <Text style={styles.loadingTextDark}>
                      Processing payment…
                    </Text>
                  </View>
                ) : (
                  <>
                    <View style={styles.iconRow}>
                      {(
                        [
                          { key: "Card" as const, label: "Card" },
                          { key: "Paytm" as const, label: "Paytm" },
                          { key: "BHIM" as const, label: "BHIM" },
                          { key: "UPI" as const, label: "GPay" },
                          { key: "PayPal" as const, label: "Pay" },
                          { key: "Scan QR" as const, label: "QR" },
                        ] as const
                      ).map(({ key, label }) => {
                        const active = paymentMethod === key;
                        return (
                          <SparklePressable
                            key={key}
                            style={[
                              styles.methodIcon,
                              active && styles.methodIconActive,
                            ]}
                            onPress={() => setPaymentMethod(key)}
                          >
                            <Text
                              style={[
                                styles.methodIconText,
                                active && styles.methodIconTextActive,
                              ]}
                              numberOfLines={1}
                            >
                              {label}
                            </Text>
                          </SparklePressable>
                        );
                      })}
                    </View>

                    {paymentMethod === "Card" && (
                      <>
                        <LinearGradient
                          colors={["#7C3AED", "#4C1D95"]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.creditCard}
                        >
                          <Text style={styles.cardBrand}>CARD</Text>
                          <Text style={styles.cardNumber}>
                            {(() => {
                              const d = cardNumber.replace(/\s/g, "");
                              if (d.length === 0) return "···· ···· ···· ····";
                              if (d.length <= 4) return `${d} ···· ···· ····`;
                              return `${d.slice(0, 4)} ···· ···· ${d.slice(-4)}`;
                            })()}
                          </Text>
                          <View style={styles.cardBottom}>
                            <Text style={styles.cardHolder} numberOfLines={1}>
                              {cardHolder.trim() || "CARD HOLDER"}
                            </Text>
                            <Text style={styles.cardExpiry}>
                              {cardExpiry.trim() || "MM/YY"}
                            </Text>
                          </View>
                        </LinearGradient>

                      <View style={styles.inputGroup}>
                        <View>
                          <Text style={styles.inputLabel}>Name on card</Text>
                          <TextInput
                            value={cardHolder}
                            onChangeText={setCardHolder}
                            placeholder="John Doe"
                            placeholderTextColor="#9CA3AF"
                            style={styles.lightInput}
                          />
                        </View>
                        <View>
                          <Text style={styles.inputLabel}>Card number</Text>
                          <TextInput
                            value={cardNumber}
                            onChangeText={(t) =>
                              setCardNumber(t.replace(/[^0-9 ]/g, ""))
                            }
                            placeholder="4242 4242 4242 4242"
                            placeholderTextColor="#9CA3AF"
                            keyboardType="number-pad"
                            style={styles.lightInput}
                          />
                        </View>
                        <View style={styles.cardRowInputs}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.inputLabel}>Expiry</Text>
                            <TextInput
                              value={cardExpiry}
                              onChangeText={setCardExpiry}
                              placeholder="MM/YY"
                              placeholderTextColor="#9CA3AF"
                              style={styles.lightInput}
                            />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.inputLabel}>CVV</Text>
                            <TextInput
                              value={cardCvv}
                              onChangeText={(t) =>
                                setCardCvv(t.replace(/[^0-9]/g, "").slice(0, 4))
                              }
                              placeholder="···"
                              placeholderTextColor="#9CA3AF"
                              keyboardType="number-pad"
                              secureTextEntry
                              style={styles.lightInput}
                            />
                          </View>
                        </View>
                      </View>
                      </>
                    )}

                    {paymentMethod === "Paytm" && (
                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>
                          Paytm number / Paytm ID
                        </Text>
                        <TextInput
                          value={paytmId}
                          onChangeText={setPaytmId}
                          placeholder="9876543210 or yourname@paytm"
                          placeholderTextColor="#9CA3AF"
                          style={styles.lightInput}
                          keyboardType="default"
                          autoCapitalize="none"
                        />
                      </View>
                    )}

                    {paymentMethod === "BHIM" && (
                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>UPI ID (BHIM)</Text>
                        <TextInput
                          value={bhimUpiId}
                          onChangeText={setBhimUpiId}
                          placeholder="yourname@upi"
                          placeholderTextColor="#9CA3AF"
                          style={styles.lightInput}
                          autoCapitalize="none"
                        />
                      </View>
                    )}

                    {paymentMethod === "UPI" && (
                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>
                          UPI ID (GPay / PhonePe / BHIM)
                        </Text>
                        <TextInput
                          value={gpayUpiId}
                          onChangeText={setGpayUpiId}
                          placeholder="name@oksbi or name@ybl"
                          placeholderTextColor="#9CA3AF"
                          style={styles.lightInput}
                          autoCapitalize="none"
                        />
                      </View>
                    )}

                    {paymentMethod === "Scan QR" && (
                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>
                          Scan a QR or paste payment link / UPI text
                        </Text>
                        <TextInput
                          value={qrPayload}
                          onChangeText={setQrPayload}
                          placeholder="Paste here if not using the camera"
                          placeholderTextColor="#9CA3AF"
                          style={[styles.lightInput, styles.qrTextArea]}
                          multiline
                        />
                        {Platform.OS !== "web" && (
                          <SparklePressable
                            style={styles.qrOpenBtn}
                            onPress={openQrScanner}
                          >
                            <Text style={styles.qrOpenBtnText}>
                              Open QR scanner
                            </Text>
                          </SparklePressable>
                        )}
                      </View>
                    )}

                    <SparklePressable style={styles.saveBtn} onPress={pay}>
                      <Text style={styles.saveBtnText}>Complete payment</Text>
                    </SparklePressable>
                  </>
                )}
              </View>
            </ScrollView>
          </View>
        </Modal>

        <Modal
          visible={qrScannerOpen}
          animationType="slide"
          onRequestClose={() => setQrScannerOpen(false)}
        >
          <View style={styles.qrScannerRoot}>
            {Platform.OS !== "web" ? (
              <CameraView
                style={StyleSheet.absoluteFillObject}
                facing="back"
                barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                onBarcodeScanned={onQrBarcodeScanned}
              />
            ) : null}
            <View style={styles.qrScannerTopBar}>
              <SparklePressable
                style={styles.qrScannerCloseBtn}
                onPress={() => setQrScannerOpen(false)}
              >
                <Text style={styles.qrScannerCloseText}>× Close</Text>
              </SparklePressable>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0A1930" }, // Matches the deep background
  container: { flex: 1 }, // transparent so gradient shows through

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 8,
    gap: 10,
  },
  backBtn: {
    height: 36,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: PAL.GLASS_BG,
    borderWidth: 1,
    borderColor: PAL.GLASS_BORDER,
    alignItems: "center",
    justifyContent: "center",
  },
  backBtnText: { color: PAL.PURE_WHITE, fontWeight: "900" },

  content: { padding: 16, paddingBottom: 120 },

  h1: { color: PAL.PURE_WHITE, fontSize: 24, fontWeight: "900" },
  h2: {
    color: PAL.MUTED_WHITE,
    fontSize: 13,
    fontWeight: "800",
    marginTop: 4,
  },

  card: {
    marginTop: 16,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: PAL.GLASS_BORDER,
    backgroundColor: "rgba(255, 255, 255, 0.03)", // Subtle glassmorphism card
  },
  cardTitle: {
    color: PAL.PURE_WHITE,
    fontWeight: "900",
    fontSize: 15,
    marginBottom: 12,
  },

  row: { flexDirection: "row", gap: 10, alignItems: "center" },
  chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 10 },

  // Updated 'Generate Site' Purple styling for Chips
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: PAL.GLASS_BG,
    borderWidth: 1,
    borderColor: PAL.GLASS_BORDER,
  },
  chipActive: {
    backgroundColor: PAL.PURPLE_BASE,
    borderColor: PAL.PURPLE_GLOW,
    shadowColor: PAL.PURPLE_BASE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 6,
  },
  chipText: {
    color: "rgba(255,255,255,0.70)",
    fontWeight: "700",
    fontSize: 13,
  },
  chipTextActive: { color: PAL.PURE_WHITE, fontWeight: "900" },

  // Large options (Board, Mode)
  bigOption: {
    flex: 1,
    height: 56,
    borderRadius: 999, // Pill shape like Generate Site
    borderWidth: 1,
    borderColor: PAL.GLASS_BORDER,
    backgroundColor: PAL.GLASS_BG,
    alignItems: "center",
    justifyContent: "center",
  },
  bigOptionActive: {
    backgroundColor: PAL.PURPLE_BASE,
    borderColor: PAL.PURPLE_GLOW,
    shadowColor: PAL.PURPLE_BASE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 6,
  },
  bigOptionText: { color: "rgba(255,255,255,0.70)", fontWeight: "700" },
  bigOptionTextActive: { color: PAL.PURE_WHITE, fontWeight: "900" },

  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: PAL.PURPLE_BASE,
    alignItems: "center",
    justifyContent: "center",
  },
  addBtnText: {
    color: PAL.PURE_WHITE,
    fontWeight: "900",
    fontSize: 20,
    lineHeight: 22,
  },

  subjectBlock: {
    marginTop: 12,
    padding: 16,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    borderWidth: 1,
    borderColor: PAL.GLASS_BORDER,
  },
  subjectHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  subjectName: { color: PAL.PURE_WHITE, fontWeight: "900", fontSize: 16 },

  topicsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 8 },

  hoursRow: { alignItems: "flex-end" },
  hoursInput: {
    marginTop: 6,
    width: 60,
    height: 40,
    borderRadius: 12,
    backgroundColor: PAL.GLASS_BG,
    borderWidth: 1,
    borderColor: PAL.GLASS_BORDER,
    color: PAL.PURE_WHITE,
    fontWeight: "900",
    textAlign: "center",
  },

  mutedText: { color: PAL.MUTED_WHITE, fontWeight: "700", fontSize: 13 },

  totalRow: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  totalText: { color: PAL.MUTED_WHITE, fontWeight: "900" },
  totalVal: { color: PAL.PURE_WHITE, fontWeight: "900", fontSize: 16 },

  // Updated 'Book Now' dark styling
  bookNowBtn: {
    marginTop: 20,
    height: 56,
    borderRadius: 999, // Pill shape
    backgroundColor: PAL.NAVY_BTN_BG,
    borderWidth: 1.5,
    borderColor: PAL.NAVY_BTN_BORDER,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  bookNowBtnText: { color: PAL.PURE_WHITE, fontWeight: "800", fontSize: 16 },

  bookNowBtnModal: {
    flex: 1,
    height: 50,
    borderRadius: 999, 
    backgroundColor: PAL.NAVY_BTN_BG,
    borderWidth: 1.5,
    borderColor: PAL.NAVY_BTN_BORDER,
    alignItems: "center",
    justifyContent: "center",
  },

  // Deep dark theme for Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)", // Darker overlay
    justifyContent: "center",
    padding: 16,
  },
  modalCard: {
    backgroundColor: PAL.DARK_MODAL,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: PAL.GLASS_BORDER,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  slotModalCard: {
    maxHeight: WINDOW_H * 0.88,
    width: "100%",
  },
  slotModalScroll: {
    maxHeight: WINDOW_H * 0.58,
  },
  slotModalScrollContent: {
    paddingBottom: 16,
  },
  modalBack: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: PAL.GLASS_BG,
  },
  modalBackText: { color: PAL.PURE_WHITE, fontWeight: "900", fontSize: 13 },

  modalTitle: { color: PAL.PURE_WHITE, fontSize: 20, fontWeight: "900" },
  modalSub: {
    marginTop: 6,
    color: PAL.PURPLE_GLOW,
    lineHeight: 18,
    fontWeight: "700",
  },

  slotModalTitle: { color: PAL.PURE_WHITE, fontSize: 20, fontWeight: "900" },
  slotModalSub: {
    marginTop: 6,
    color: PAL.PURE_WHITE,
    lineHeight: 18,
    fontWeight: "700",
  },
  slotModalLabel: {
    color: PAL.PURE_WHITE,
    fontWeight: "800",
    fontSize: 13,
    marginBottom: 8,
  },
  slotModalStrong: {
    color: PAL.PURE_WHITE,
    fontWeight: "900",
    fontSize: 17,
  },
  slotModalHint: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },
  slotDateButton: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.25)",
    borderWidth: 1,
    borderColor: PAL.GLASS_BORDER,
    marginBottom: 4,
  },
  slotDatePickerWrap: {
    minHeight: 360,
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PAL.GLASS_BORDER,
    overflow: "hidden",
    marginBottom: 4,
  },
  slotChip: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: PAL.GLASS_BG,
    borderWidth: 1,
    borderColor: PAL.GLASS_BORDER,
  },
  slotChipActive: {
    backgroundColor: PAL.PURPLE_BASE,
    borderColor: PAL.PURPLE_GLOW,
    shadowColor: PAL.PURPLE_BASE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 6,
  },
  slotChipDisabled: {
    opacity: 0.4,
  },
  slotChipText: {
    color: PAL.PURE_WHITE,
    fontWeight: "700",
    fontSize: 13,
  },
  slotChipTextActive: { color: PAL.PURE_WHITE, fontWeight: "900" },
  slotChipTextDisabled: { color: "rgba(255,255,255,0.45)" },
  
  modalBtns: { flexDirection: "row", gap: 12, marginTop: 24 },
  modalSecondary: {
    flex: 1,
    height: 50,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: PAL.GLASS_BORDER,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  modalSecondaryText: { color: PAL.PURE_WHITE, fontWeight: "800" },

  input: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: PAL.GLASS_BORDER,
    backgroundColor: "rgba(0,0,0,0.25)",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: PAL.PURE_WHITE,
    fontWeight: "700",
  },
  
  nameRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  removeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,127,80,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,127,80,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  removeBtnText: {
    color: PAL.CORAL,
    fontWeight: "900",
    fontSize: 20,
    lineHeight: 22,
  },

  addressHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
  },
  fetchBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: PAL.PURPLE_BASE,
  },
  fetchBtnText: { color: PAL.PURE_WHITE, fontWeight: "900", fontSize: 12 },

  loadingBox: {
    height: 80,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.25)",
    borderWidth: 1,
    borderColor: PAL.GLASS_BORDER,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: { color: PAL.PURE_WHITE, fontWeight: "800", marginTop: 8 },

  paymentModalScrollOuter: {
    flexGrow: 1,
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  paymentModalInner: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    width: "100%",
    maxWidth: 440,
    alignSelf: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  paymentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  paymentTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A1A",
    flex: 1,
  },
  backCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFF",
    elevation: 2,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EEE",
  },
  backCircleGlyph: {
    fontSize: 22,
    color: "#1A1A1A",
    fontWeight: "800",
    marginTop: -2,
  },
  paymentSessionLine: {
    fontSize: 13,
    color: "#666",
    marginBottom: 20,
    fontWeight: "600",
  },
  loadingBoxLight: {
    minHeight: 120,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  loadingTextDark: {
    color: "#333",
    fontWeight: "700",
    marginTop: 12,
    fontSize: 15,
  },
  iconRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
    gap: 8,
  },
  methodIcon: {
    width: "31%",
    height: 40,
    borderRadius: 8,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#EEE",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  methodIconActive: {
    borderColor: "#7C3AED",
    backgroundColor: "#F5F3FF",
  },
  methodIconText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#333",
  },
  methodIconTextActive: {
    color: "#7C3AED",
  },
  creditCard: {
    height: 200,
    borderRadius: 20,
    padding: 24,
    justifyContent: "space-between",
    marginBottom: 24,
  },
  cardBrand: { color: "#FFF", fontSize: 20, fontWeight: "bold" },
  cardNumber: { color: "#FFF", fontSize: 20, letterSpacing: 2 },
  cardBottom: { flexDirection: "row", justifyContent: "space-between" },
  cardHolder: { color: "#FFF", opacity: 0.9, flex: 1, marginRight: 12 },
  cardExpiry: { color: "#FFF" },
  inputGroup: { gap: 15 },
  inputLabel: { fontSize: 14, color: "#333", fontWeight: "600", marginBottom: 6 },
  lightInput: {
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: "#000",
  },
  cardRowInputs: {
    flexDirection: "row",
    gap: 12,
  },
  saveBtn: {
    backgroundColor: "#7C3AED",
    padding: 18,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 24,
  },
  saveBtnText: { color: "#FFF", fontWeight: "bold", fontSize: 16 },

  successIconContainer: {
    marginBottom: 30,
    marginTop: 40,
    alignItems: "center",
  },
  purpleBadge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#7C3AED",
    justifyContent: "center",
    alignItems: "center",
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1A1A1A",
    marginBottom: 15,
    textAlign: "center",
  },
  successSub: {
    textAlign: "center",
    color: "#666",
    paddingHorizontal: 20,
    lineHeight: 22,
    marginBottom: 40,
  },
  homeBtn: {
    backgroundColor: "#7C3AED",
    width: "100%",
    padding: 18,
    borderRadius: 30,
    alignItems: "center",
  },
  homeBtnText: { color: "#FFF", fontWeight: "bold" },

  qrOpenBtn: {
    backgroundColor: "#7C3AED",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  qrOpenBtnText: { color: "#FFF", fontWeight: "800", fontSize: 15 },
  qrTextArea: { minHeight: 88, textAlignVertical: "top" },
  qrScannerRoot: {
    flex: 1,
    backgroundColor: "#000",
  },
  qrScannerTopBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 56,
    paddingHorizontal: 16,
    zIndex: 10,
  },
  qrScannerCloseBtn: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  qrScannerCloseText: { color: "#FFF", fontWeight: "800", fontSize: 16 },

  sparkLayer: {
    position: "absolute",
    left: -90,
    right: -90,
    top: -72,
    bottom: -72,
    zIndex: 20,
  },
  sparkDot: {
    position: "absolute",
    backgroundColor: "#7C3AED",
    shadowColor: "#C084FC",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 4,
  },
  sparkDotHollow: {
    position: "absolute",
    backgroundColor: "transparent",
    borderWidth: 1.3,
    borderColor: "rgba(124,58,237,0.65)",
    shadowColor: "#C084FC",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 3,
  },
});