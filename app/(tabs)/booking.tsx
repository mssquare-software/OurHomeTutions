import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { PayPalLoader } from "../../components/animations/PayPalLoader";
import { CBSE_DATA, type CbseSubject } from "../../constants/cbseSubjects";
import { BookingRequest } from "../../constants/notificationTypes";
import type { StateBoard, StateSubject } from "../../constants/stateSubjects";
import { STATE_DATA } from "../../constants/stateSubjects";
import { useNotifications } from "../hooks/useNotifications";
import { useTour } from "../tour/useTour";
import { listSubjects } from "../data/repo/repo";

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
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

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
    setStep("slots");
    setSlotOpen(true);
  };

  const proceedToDetails = () => {
    if (!selectedDate || !selectedTime) {
      Alert.alert("Select Slot", "Please select date and time.");
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
          date: selectedDate || "2026-03-12",
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
          <Pressable onPress={StepBack} style={styles.backBtn} hitSlop={10}>
            <Text style={styles.backBtnText}>‹ Back</Text>
          </Pressable>

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
                  <Pressable
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
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Board */}
          {selectedClass && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>2) Select Board</Text>
              <View style={styles.row}>
                <Pressable
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
                </Pressable>

                <Pressable
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
                </Pressable>
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
                        <Pressable
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
                        </Pressable>
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
                              <Pressable
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
                              </Pressable>
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

                  <Pressable style={styles.bookNowBtn} onPress={bookNow}>
                    <Text style={styles.bookNowBtnText}>Continue</Text>
                  </Pressable>
                </>
              )}
            </View>
          )}

          {/* Mode of classes */}
          {step === "mode" && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>4) Mode of Classes</Text>

              <View style={styles.row}>
                <Pressable
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
                </Pressable>

                <Pressable
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
                </Pressable>
              </View>

              <Pressable style={styles.bookNowBtn} onPress={proceedToSlots}>
                <Text style={styles.bookNowBtnText}>Choose Slot</Text>
              </Pressable>
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
            <View style={styles.modalCard}>
              <Pressable
                onPress={StepBack}
                style={styles.modalBack}
                hitSlop={8}
              >
                <Text style={styles.modalBackText}>‹ Back</Text>
              </Pressable>

              <Text style={styles.modalTitle}>Available Slots</Text>
              <Text style={styles.modalSub}>Mode: {classMode ?? "-"}</Text>

              <View style={{ height: 12 }} />

              <Text style={styles.mutedText}>Select Date</Text>
              <View style={styles.chipsWrap}>
                {["2026-03-12", "2026-03-13", "2026-03-14"].map((d) => {
                  const active = selectedDate === d;
                  return (
                    <Pressable
                      key={d}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => setSelectedDate(d)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          active && styles.chipTextActive,
                        ]}
                      >
                        {d}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={{ height: 12 }} />

              <Text style={styles.mutedText}>Select Time</Text>
              <View style={styles.chipsWrap}>
                {["10:00", "12:00", "16:00", "18:00"].map((tm) => {
                  const active = selectedTime === tm;
                  return (
                    <Pressable
                      key={tm}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => setSelectedTime(tm)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          active && styles.chipTextActive,
                        ]}
                      >
                        {tm}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.modalBtns}>
                <Pressable style={styles.modalSecondary} onPress={StepBack}>
                  <Text style={styles.modalSecondaryText}>Back</Text>
                </Pressable>

                <Pressable style={styles.bookNowBtnModal} onPress={proceedToDetails}>
                  <Text style={styles.bookNowBtnText}>Continue</Text>
                </Pressable>
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
              <Pressable
                onPress={StepBack}
                style={styles.modalBack}
                hitSlop={8}
              >
                <Text style={styles.modalBackText}>‹ Back</Text>
              </Pressable>

              <Text style={styles.modalTitle}>Booking Details</Text>
              <Text style={styles.modalSub}>
                Mode: {classMode ?? "-"} • {selectedDate} {selectedTime}
              </Text>

              <View style={{ height: 12 }} />

              <Text style={styles.mutedText}>Session Type</Text>
              <View style={[styles.row, { marginTop: 8 }]}>
                <Pressable
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
                </Pressable>

                <Pressable
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
                </Pressable>

                {lessonType === "Group" && (
                  <Pressable style={styles.addBtn} onPress={addPerson}>
                    <Text style={styles.addBtnText}>＋</Text>
                  </Pressable>
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
                      <Pressable
                        onPress={() => removePerson(idx)}
                        style={styles.removeBtn}
                      >
                        <Text style={styles.removeBtnText}>×</Text>
                      </Pressable>
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

                <Pressable
                  onPress={fetchCurrentLocation}
                  style={styles.fetchBtn}
                  disabled={locLoading}
                >
                  <Text style={styles.fetchBtnText}>
                    {locLoading ? "Fetching..." : "Fetch Location"}
                  </Text>
                </Pressable>
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
                <Pressable style={styles.modalSecondary} onPress={StepBack}>
                  <Text style={styles.modalSecondaryText}>Back</Text>
                </Pressable>
                <Pressable
                  style={styles.bookNowBtnModal}
                  onPress={validateDetailsAndOpenPayment}
                >
                  <Text style={styles.bookNowBtnText}>Continue</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        {/* Payment modal */}
        <Modal
          visible={paymentOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setPaymentOpen(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Pressable
                onPress={StepBack}
                style={styles.modalBack}
                hitSlop={8}
              >
                <Text style={styles.modalBackText}>‹ Back</Text>
              </Pressable>

              <Text style={styles.modalTitle}>Payment</Text>
              <Text style={styles.modalSub}>
                Mode: {classMode ?? "-"} • {selectedDate} {selectedTime}
              </Text>

              <View style={{ height: 12 }} />

              {loading ? (
                <View style={styles.loadingBox}>
                  <PayPalLoader />
                  <Text style={styles.loadingText}>Processing payment…</Text>
                </View>
              ) : (
                <>
                  <Text style={styles.mutedText}>Select Payment Method</Text>
                  <View style={[styles.chipsWrap, { marginTop: 8 }]}>
                    {(
                      ["Card", "Paytm", "BHIM", "UPI", "PayPal", "Scan QR"] as const
                    ).map((m) => {
                      const active = paymentMethod === m;
                      return (
                        <Pressable
                          key={m}
                          style={[styles.chip, active && styles.chipActive]}
                          onPress={() => setPaymentMethod(m)}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              active && styles.chipTextActive,
                            ]}
                          >
                            {m}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  <Pressable style={styles.bookNowBtn} onPress={pay}>
                    <Text style={styles.bookNowBtnText}>Book Now</Text>
                  </Pressable>
                </>
              )}
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
});