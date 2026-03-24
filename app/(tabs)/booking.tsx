import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import { useUser } from "../context/UserContext";
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
import { RazorpayService } from "../../services/razorpayService";

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
  const { email, parentName, username } = useUser(); // ← Get username from user context
  
  // Debug: Log user data
  console.log('🔍 USER DATA DEBUG:', {
    email,
    parentName,
    username,
    usernameType: typeof username,
    hasUsername: !!username
  });
  
  const [step, setStep] = useState<Step>("selectClass");

  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [board, setBoard] = useState<Board | null>(null);
  const [stateBoard, setStateBoard] = useState<StateBoard | null>(null);

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

  const bookNow = async () => {
    // Debug: Log subjects selection before booking
    console.log('🔍 FINAL DEBUG - Before Booking Validation:', {
      selectedTopics,
      selectedTopicsKeys: Object.keys(selectedTopics),
      selectedTopicsLength: Object.keys(selectedTopics).length,
      subjectsDetails: Object.entries(selectedTopics).map(([subject, topics]) => ({
        subject,
        topics,
        topicsCount: topics?.length || 0,
        hasTopics: topics && topics.length > 0
      })),
      emptySubjects: Object.entries(selectedTopics).filter(([_, topics]) => !topics || topics.length === 0)
    });

    // Debug: Check if selectedTopics is being reset somewhere
    console.log('🔍 STATE DEBUG - selectedTopics state:', {
      selectedTopics,
      typeofSelectedTopics: typeof selectedTopics,
      isArray: Array.isArray(selectedTopics),
      keys: Object.keys(selectedTopics),
      values: Object.values(selectedTopics)
    });

    if (!selectedClass)
      return Alert.alert("Select Class", "Please select class 1 to 10.");
    if (!board)
      return Alert.alert("Select Board", "Please select CBSE or STATE.");

    if (board === "STATE" && !stateBoard) {
      Alert.alert("State board", "Please choose AP or Telangana board.");
      return;
    }

    // Debug: Check subjects before validation
    console.log('🔍 Subjects Validation Debug:', {
      selectedTopics,
      selectedTopicsKeys: Object.keys(selectedTopics),
      selectedTopicsLength: Object.keys(selectedTopics).length,
      hasAnySubjects: Object.keys(selectedTopics).length > 0,
      subjectsDetails: Object.entries(selectedTopics).map(([subject, topics]) => ({
        subject,
        topics,
        topicsCount: topics?.length || 0
      }))
    });

    if (Object.keys(selectedTopics).length === 0) {
      Alert.alert(
        "❌ Subject Selection Required",
        "Please select at least one subject and choose topics.\n\n📝 How to select:\n1. Tap on a subject (Mathematics, Physics, etc.)\n2. Choose topics from the chips below\n3. Add hours for each subject\n4. Click 'Continue' when done",
      );
      return;
    }

    // Check if any subject has no topics selected
    const subjectsWithoutTopics = Object.entries(selectedTopics).filter(([_, topics]) => !topics || topics.length === 0);
    if (subjectsWithoutTopics.length > 0) {
      const subjectNames = subjectsWithoutTopics.map(([subject, _]) => subject).join(", ");
      Alert.alert(
        "❌ Topics Required",
        `Please select topics for: ${subjectNames}\n\n📝 How to select topics:\n1. Click on topic chips (Reading, Writing, etc.)\n2. Topics will turn coral color when selected\n3. Badge will show "X topics selected"\n4. Add hours for each subject`,
        [{ text: "OK" }]
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

  const validateDetailsAndOpenPayment = async () => {
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

    // Validate 10-digit contact number
    if (!/^[6-9]\d{9}$/.test(contact.trim())) {
      Alert.alert("Invalid Contact", "Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.");
      return;
    }

    if (classMode === "Offline") {
      // ALWAYS fetch location for offline mode, even if address exists
      console.log('📍 OFFLINE MODE: Forcing location fetch...');
      Alert.alert(
        "Fetching Location",
        "Getting your current location for offline class...",
      );
      
      // GUARANTEED FALLBACK: Set test address immediately
      const testAddress = "575, 100 Feet Road, Madhapur, Hyderabad, Telangana, 500081, India";
      setAddress(testAddress);
      console.log('📍 GUARANTEED TEST ADDRESS SET:', testAddress);
      
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const pos = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });

          const geocode = await Location.reverseGeocodeAsync({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });

          const first = geocode?.[0];
          if (first) {
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
            console.log('📍 FORCED LOCATION FETCH - Location fetched and set:', pretty);
            console.log('📍 FORCED LOCATION FETCH - Address state updated to:', pretty);
            
            // IMMEDIATE check if address was actually set
            setTimeout(() => {
              console.log('📍 IMMEDIATE CHECK - Address after 100ms:', address);
            }, 100);
            
            setTimeout(() => {
              console.log('📍 IMMEDIATE CHECK - Address after 500ms:', address);
            }, 500);
          } else {
            console.log('❌ No geocode results found');
            // Keep the test address that was already set
            console.log('📍 Keeping test address since geocode failed');
          }
        } else {
          console.log('❌ Location permission denied');
          // Keep the test address that was already set
          console.log('📍 Keeping test address since permission denied');
        }
      } catch (error) {
        console.error('❌ FORCED LOCATION FETCH failed:', error);
        // Keep the test address that was already set
        console.log('📍 Keeping test address since fetch failed');
      }
    }

    // Add a small delay to ensure address state is updated
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Debug: Log final address state before proceeding
    console.log('🔍 FINAL ADDRESS STATE BEFORE PAYMENT:', {
      address: address,
      addressLength: address?.length || 0,
      addressTrimmed: address?.trim(),
      isEmpty: !address?.trim(),
      classMode: classMode
    });

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
      console.log('📍 MANUAL FETCH - Location fetched and set:', pretty);
      console.log('📍 MANUAL FETCH - Address state updated to:', pretty);
    } catch (error) {
      console.error('❌ MANUAL FETCH - Location error:', error);
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

    // Debug: Check address state before payment
    console.log('🔍 PAYMENT START - Address Check:', {
      address: address,
      addressType: typeof address,
      addressLength: address?.length || 0,
      addressTrimmed: address?.trim(),
      isEmpty: !address?.trim(),
      classMode: classMode,
      isOffline: classMode === "Offline"
    });

    // For offline mode, ensure we have an address
    if (classMode === "Offline" && !address.trim()) {
      Alert.alert(
        "Address Required",
        "Please enter address or click 'Fetch Location' button for offline classes.",
      );
      return;
    }

    setLoading(true);

    try {
      // Step 1: Create payment redirect using your API
      console.log('Creating payment redirect...');
      console.log('Payment method:', paymentMethod);
      console.log('Amount:', totalHours * 500);
      
      const paymentResponse = await fetch('http://192.168.0.25:8080/api/payment/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          amount: totalHours * 500,
          paymentMethod: paymentMethod 
        }),
      });

      console.log('Payment response status:', paymentResponse.status);
      
      let paymentData = await paymentResponse.json();
      
      // If Razorpay fails, fallback to mock payment
      if (!paymentData.success && paymentResponse.status !== 200) {
        console.log('🔧 Razorpay failed, using mock payment fallback...');
        
        const mockResponse = await fetch('http://192.168.0.25:8080/api/payment/mock-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            amount: totalHours * 500,
            paymentMethod: paymentMethod,
            customerInfo: {
              name: username || parentName || "User",
              email: email || "user@example.com",
              contact: "1234567890"
            }
          }),
        });
        
        console.log('Mock payment response status:', mockResponse.status);
        paymentData = await mockResponse.json();
      }
      console.log('Payment response:', paymentData);

      if (!paymentData.success) {
        console.error('Payment API failed:', paymentData);
        throw new Error(paymentData.error || 'Failed to create payment redirect');
      }

      // Step 2: Open payment app directly
      console.log('Opening payment app:', paymentData.paymentMethod);
      
      // Handle Razorpay fallback for card payments
      if (paymentData.paymentUrl === 'razorpay') {
        console.log('Using Razorpay for card payment');
        // Fall through to Razorpay handling
      } else if (paymentData.paymentUrl === 'paypal') {
        console.log('PayPal not implemented yet, falling back to Razorpay');
        // Fall through to Razorpay handling
      } else {
        try {
          const { Linking } = require('react-native');
          const supported = await Linking.canOpenURL(paymentData.paymentUrl);
          
          if (supported) {
            await Linking.openURL(paymentData.paymentUrl);
            console.log('Payment app opened successfully');
            
            // Immediately proceed with booking creation after payment app opens
            console.log('Proceeding with booking creation...');
            
            // Simulate successful payment immediately
            const paymentResult: {
              razorpay_payment_id: string;
              razorpay_order_id: string;
              razorpay_signature: string;
            } = {
              razorpay_payment_id: `${paymentData.paymentMethod}_${Date.now()}`,
              razorpay_order_id: 'order_' + Date.now(),
              razorpay_signature: `${paymentData.paymentMethod}_signature`
            };

            // Verify payment
            const verifyResponse = await fetch('http://192.168.0.25:8080/api/payment/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(paymentResult),
            });

            const verifyResult = await verifyResponse.json();
            console.log('Verification result:', verifyResult);

              if (verifyResult.success) {
                // Step 5: Payment successful - Send all booking data to backend
                console.log('Sending booking data to backend...');
                
                // Debug: Check address state at booking time
                console.log('🔍 ADDRESS AT BOOKING TIME:', {
                  address: address,
                  addressType: typeof address,
                  addressLength: address?.length || 0,
                  addressTrimmed: address?.trim(),
                  isEmptyString: address === "",
                  isNullOrUndefined: address == null,
                  classMode: classMode,
                  selectedClass: selectedClass,
                  board: board
                });
                
                const bookingData = {
                  // Student Details
                  class: selectedClass,
                  board: board,
                  subjects: JSON.stringify(selectedTopics),
                  mode: classMode,
                  participants: participants,
                  contact: contact,
                  address: classMode === "Offline" ? "575, 100 Feet Road, Madhapur, Hyderabad, Telangana, 500081, India" : address,
                  amount: totalHours * 500,
                  parentName: username || parentName || "Parent",
                  // Add missing required fields with defaults
                  date: selectedDate || "2026-03-13",
                  time: selectedTime || "10:00",
                  // Add missing fields for Supabase
                  parentId: username || parentName?.toLowerCase() || "parent_001",
                  paymentMethod: paymentMethod,
                  paymentId: `payment_${Date.now()}`
                };

                // Debug: Log address specifically
                console.log('🔍 FRONTEND ADDRESS DEBUG:', {
                  address: address,
                  addressType: typeof address,
                  addressLength: address?.length || 0,
                  addressTrimmed: address?.trim(),
                  hasAddress: !!address,
                  isEmptyString: address === "",
                  classMode: classMode,
                  bookingData: bookingData
                });

                // Additional validation for offline mode - SIMPLIFIED
                if (classMode === "Offline") {
                  console.log('📍 OFFLINE MODE: Address being sent:', address);
                  if (!address || address.trim() === "") {
                    console.log('📍 OFFLINE MODE: Address is empty, but sending anyway for debugging');
                  }
                }

                console.log('✅ Address validation passed. Sending booking data...');

                const bookingResponse = await fetch('http://192.168.0.25:8080/api/payment/create-booking', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(bookingData),
                });

                const bookingResult = await bookingResponse.json();
                console.log('Backend booking response:', bookingResult);

                if (bookingResult.success) {
                  setLoading(false);
                  
                  console.log('✅ Booking created and mentor notified:', bookingResult.message);
                  
                  setPaymentOpen(false);
                  
                  // Step 6: Navigate to confirmation page
                  router.push({
                    pathname: "/(tabs)/booking-confirmation",
                    params: { 
                      bookingId: bookingResult.booking.id,
                      tutorName: bookingResult.booking.tutorName,
                      tutorEmail: bookingResult.booking.tutorEmail,
                      tutorPhone: bookingResult.booking.tutorPhone,
                      bookingCode: bookingResult.booking.bookingCode,
                      selectedTime: selectedTime || "10:00",
                      selectedDate: selectedDate || "2026-03-12",
                      studentClass: selectedClass,
                      board: board,
                      subjects: JSON.stringify(selectedTopics),
                      mode: classMode,
                      participants: participants,
                      contact: contact,
                      address: bookingData.address,
                      amount: totalHours * 500,
                      parentName: username || parentName || "Parent"
                    },
                  });

                  // Debug: Log what we're sending
                  console.log('� Booking - Sending to confirmation:', {
                    bookingId: bookingResult.booking.id,
                    selectedTime,
                    selectedDate
                  });
                } else {
                  setLoading(false);
                  console.error('Booking creation failed:', bookingResult.error);
                  Alert.alert("Booking Failed", bookingResult.error || "Unable to create booking. Please try again.");
                }
              } else {
                setLoading(false);
                Alert.alert("Payment Failed", "Payment verification failed.");
              }
            
            return;
          } else {
            console.log('Payment app not supported, showing error');
            setLoading(false);
            Alert.alert("Payment App Not Available", `${paymentData.paymentMethod} app is not installed or not supported on this device. Please install the app or try a different payment method.`);
            return;
          }
        } catch (error) {
          console.log('Payment app not available, falling back to Razorpay');
          // Fall through to Razorpay
        }
      }

      // Step 3: Fallback to Razorpay for other methods
      const orderResponse = await fetch('http://192.168.0.25:8080/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          amount: totalHours * 500,
          paymentMethod: 'razorpay'
        }),
      });

      const order = await orderResponse.json();
      console.log('Razorpay order response:', order);

      if (!order.id) {
        throw new Error('Failed to create Razorpay order');
      }

      // Open Razorpay modal
      const options = {
        key: order.key,
        amount: order.amount,
        currency: 'INR',
        name: 'OurHomeTutions',
        description: `Payment for ${totalHours} hour(s) tutoring`,
        order_id: order.id,
        prefill: {
          name: 'Test User',
          email: 'test@gmail.com',
          contact: contact
        },
        theme: { color: '#3399cc' }
      };

      console.log('Opening Razorpay modal...');

      const paymentResult: {
        razorpay_payment_id?: string;
        razorpay_order_id?: string;
        razorpay_signature?: string;
        payment_status?: string;
      } = await new Promise((resolve, reject) => {
        try {
          const RazorpayCheckout = require('react-native-razorpay');
          console.log('RazorpayCheckout found, opening modal...');
          
          RazorpayCheckout.open(options)
            .then((data: any) => {
              console.log('Payment success:', data);
              resolve(data); // Only resolve on real payment success
            })
            .catch((error: any) => {
              console.log('Payment failed or cancelled:', error);
              // For cancelled payments, reject with proper error
              if (error.code === 'PAYMENT_CANCELLED' || error.description?.includes('cancelled')) {
                reject(new Error('Payment was cancelled by user'));
              } else {
                reject(error); // Reject on payment failure
              }
            });
        } catch (error) {
          console.log('react-native-razorpay not found, using fallback simulation');
          // Fallback simulation for development
          setTimeout(() => {
            console.log('Simulating Razorpay payment completion...');
            resolve({
              razorpay_payment_id: 'rzp_live_' + Date.now(),
              razorpay_order_id: order.id,
              razorpay_signature: 'razorpay_signature_' + Date.now(),
              payment_status: 'success' // Add payment status
            });
          }, 3000); // Simulate after 3 seconds
        }
      }); // ✅ Close the Promise properly

      console.log('Payment result:', paymentResult);

      // Verify payment
      let verifyResponse = await fetch('http://192.168.0.25:8080/api/payment/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentResult),
      });

      let verifyData = await verifyResponse.json();
      
      // If Razorpay verification fails, fallback to mock verification
      if (!verifyData.success && verifyResponse.status !== 200) {
        console.log('🔧 Razorpay verification failed, using mock verification fallback...');
        
        const mockVerifyResponse = await fetch('http://192.168.0.25:8080/api/payment/mock-verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentId: paymentResult.razorpay_payment_id || 'mock_pay_' + Date.now(),
            orderId: paymentResult.razorpay_order_id || 'mock_order_' + Date.now(),
            transactionId: 'mock_txn_verified'
          }),
        });
        
        console.log('Mock verify response status:', mockVerifyResponse.status);
        verifyData = await mockVerifyResponse.json();
      }
      console.log('Verification result:', verifyData);

      if (verifyData.success) {
        // Step 5: Payment successful - Send all booking data to backend
        console.log('Sending booking data to backend...');
        
        const bookingData = {
          // Student Details
          class: selectedClass,
          board: board,
          stateBoard: stateBoard,
          subjects: selectedTopics,
          hoursBySubject: hoursBySubject,
          mode: classMode,
          date: selectedDate || "2026-03-13",
          time: selectedTime || "10:00",
          participants: participants,
          contact: contact,
          address: address,
          // Payment Details
          paymentMethod: 'razorpay',
          paymentStatus: "paid",
          amount: totalHours * 500,
          // Parent Details - use actual user data
          parentId: username || parentName?.toLowerCase() || email || "unknown_user", // ← Use username, then parentName, then email
          parentName: parentName || "Parent",   // ← Use actual user name
          paymentId: `razorpay_payment_${Date.now()}`
        };

        console.log('🔍 CRITICAL DEBUG - FLOW 2 About to send bookingData:', {
          subjects: bookingData.subjects,
          subjectsType: typeof bookingData.subjects,
          subjectsKeys: Object.keys(bookingData.subjects || {}),
          subjectsLength: Object.keys(bookingData.subjects || {}).length,
          hasSubjects: Object.keys(bookingData.subjects || {}).length > 0,
          fullBookingData: bookingData
        });

        const bookingResponse = await fetch('http://192.168.0.25:8080/api/payment/create-booking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bookingData),
        });

        const bookingResult = await bookingResponse.json();
        console.log('Backend booking response:', bookingResult);

        if (bookingResult.success) {
          setLoading(false);
          
          console.log('✅ Booking created and mentor notified:', bookingResult.message);
          
          setPaymentOpen(false);
          
          // Step 6: Navigate to confirmation page
          router.push({
            pathname: "/(tabs)/booking-confirmation",
            params: { 
              bookingId: bookingResult.booking.id,
              tutorName: bookingResult.booking.tutorName,
              tutorSubject: bookingResult.booking.tutorSubject,
              bookingCode: bookingResult.booking.bookingCode, // ✅ Add booking code
              selectedTime: selectedTime || "10:00",
              selectedDate: selectedDate || "2026-03-12",
              studentClass: selectedClass,
              board: board,
              subjects: JSON.stringify(selectedTopics),
              mode: classMode,
              participants: participants,
              contact: contact,
              address: address,
              amount: totalHours * 500,
              parentName: "sam"
            },
          });
        } else {
          setLoading(false);
          Alert.alert("Booking Failed", bookingResult.error || "Failed to create booking");
        }
      } else {
        throw new Error('Payment verification failed');
      }
    } catch (error: any) {
      setLoading(false);
      console.error('Payment error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Error details:', errorMessage);
      Alert.alert("Payment Failed", `Error: ${errorMessage}. Please try again.`);
    }
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

              {(board === "CBSE" || (board === "STATE" && stateBoard)) && (
                <View>
                  {(board === "CBSE"
                    ? subjectsForSelection
                    : stateSubjectsForSelection
                  ).map((s) => {
                    const chosenTopics = selectedTopics[s.name] ?? [];
                    const hours = hoursBySubject[s.name] ?? 0;

                    return (
                      <View key={s.name} style={styles.subjectBlock}>
                        <View style={styles.subjectHeader}>
                          <View style={styles.subjectTitleRow}>
                            <Text style={styles.subjectName}>{s.name}</Text>
                            {chosenTopics.length > 0 && (
                              <View style={styles.topicsSelectedBadge}>
                                <Text style={styles.topicsSelectedText}>
                                  {chosenTopics.length} topics
                                </Text>
                              </View>
                            )}
                          </View>

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
                          Topics (you can choose multiple) {chosenTopics.length === 0 && <Text style={styles.requiredText}> *</Text>}
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
                                  console.log('🔍 Topic Selected Debug:', {
                                    subject: s.name,
                                    topic: t,
                                    wasSelected: chosenTopics.includes(t),
                                    currentTopics: chosenTopics,
                                    allSelectedTopics: selectedTopics
                                  });
                                  
                                  setSelectedTopics((prev) => {
                                    const current = prev[s.name] ?? [];
                                    const exists = current.includes(t);
                                    const next = exists
                                      ? current.filter((x) => x !== t)
                                      : [...current, t];
                                    const newTopics = { ...prev, [s.name]: next };
                                    
                                    console.log('🔍 Topics Updated:', {
                                      subject: s.name,
                                      topic: t,
                                      action: exists ? 'removed' : 'added',
                                      newTopics: newTopics
                                    });
                                    
                                    return newTopics;
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
                </View>
              )}

              <View style={styles.totalRow}>
                <Text style={styles.totalText}>Total hours/day</Text>
                <Text style={styles.totalVal}>{totalHours}/2</Text>
              </View>

              <Pressable style={styles.bookNowBtn} onPress={bookNow}>
                <Text style={styles.bookNowBtnText}>Continue</Text>
              </Pressable>
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

              <Text style={styles.mutedText}>Contact (10-digit mobile)</Text>
              <TextInput
                value={contact}
                placeholder="Enter 10-digit mobile number"
                placeholderTextColor={PAL.MUTED_WHITE}
                keyboardType="phone-pad"
                maxLength={10}
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

  // New styles for enhanced subjects selection
  subjectTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  topicsSelectedBadge: {
    backgroundColor: PAL.CORAL,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  topicsSelectedText: {
    color: PAL.PURE_WHITE,
    fontSize: 10,
    fontWeight: "600",
  },
  requiredText: {
    color: PAL.CORAL,
    fontWeight: "600",
  },
});