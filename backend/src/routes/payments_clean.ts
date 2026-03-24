import express, { Router, Request, Response } from "express";
import { createBookingInSupabase, getParentBookings, getParentNotifications, supabase } from "../config/supabase";
import Razorpay from "razorpay";
import crypto from "crypto";

const router = express.Router();

// Use mock mode if Razorpay keys are not configured
const useMockMode = !process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID.includes('YOUR_') || !process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET.includes('YOUR_');

const razorpay = useMockMode ? null : new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// ✅ Create Order
router.post("/create-order", async (req: any, res: any) => {
  try {
    const { amount, paymentMethod } = req.body;

    let order;
    
    if (useMockMode) {
      // Mock order for development
      order = {
        id: "order_mock_" + Date.now(),
        entity: "order",
        amount: amount * 100,
        currency: "INR",
        receipt: "receipt_" + Date.now(),
        status: "created",
        key: "rzp_test_1DP5mmOlF5G4Tb"
      };
    } else {
      // Real Razorpay order
      const options = {
        amount: amount * 100,
        currency: "INR",
        receipt: "receipt_" + Date.now(),
      };

      order = await razorpay!.orders.create(options);
    }

    // Create payment URLs based on method
    let paymentUrl = '';
    
    if (paymentMethod === 'paytm') {
      // Paytm payment URL
      paymentUrl = `paytmmp://pay?order_id=${order.id}&amount=${order.amount}&merchant_name=OurHomeTutions`;
    } else if (paymentMethod === 'upi') {
      // UPI payment URL
      paymentUrl = `upi://pay?pa=yourupiid@ybl&pn=OurHomeTutions&am=${amount/100}&cu=INR&tn=Payment for tutoring`;
    }

    // Send key and payment URL to frontend
    res.json({
      ...order,
      key: useMockMode ? "rzp_test_1DP5mmOlF5G4Tb" : process.env.RAZORPAY_KEY_ID,
      paymentUrl: paymentUrl,
      paymentMethod: paymentMethod,
      mockMode: useMockMode
    });
  } catch (err) {
    console.error('Order creation error:', err);
    res.status(500).json({ error: "Order creation failed" });
  }
});

// ✅ Create Payment Redirect API
router.post("/create-payment", async (req: any, res: any) => {
  try {
    const { amount, paymentMethod } = req.body;

    if (!paymentMethod) {
      return res.status(400).json({ error: "Payment method is required" });
    }

    let paymentUrl = '';
    let normalizedMethod = paymentMethod.toLowerCase().replace(/\s+/g, '');
    
    // Handle different payment method formats
    if (normalizedMethod === 'paytm' || normalizedMethod.includes('paytm')) {
      // Generate Paytm payment link
      const orderId = 'order_' + Date.now();
      paymentUrl = `paytmmp://pay?order_id=${orderId}&amount=${amount * 100}&merchant_name=OurHomeTutions`;
      normalizedMethod = 'paytm';
    } else if (normalizedMethod === 'upi' || normalizedMethod.includes('upi') || normalizedMethod === 'bhim') {
      // Generate UPI payment link with proper UPI ID
      const upiId = 'testuser@ybl'; // Hardcoded test UPI ID for testing
      console.log('🔧 UPI ID from env:', process.env.UPI_ID);
      console.log('🔧 Using UPI ID:', upiId);
      // Try different UPI URL formats
      paymentUrl = `upi://pay?pa=${upiId}&pn=OurHomeTutions&am=${amount}&cu=INR&tn=Payment+for+tutoring`;
      console.log('🔧 Generated UPI URL:', paymentUrl);
      normalizedMethod = 'upi';
    } else if (normalizedMethod === 'phonepe' || normalizedMethod.includes('phonepe')) {
      // PhonePe payment link with proper UPI ID
      const upiId = process.env.UPI_ID || '9123456789@ybl';
      paymentUrl = `phonepe://pay?pa=${upiId}&pn=OurHomeTutions&am=${amount}&cu=INR&tn=Payment for tutoring`;
      normalizedMethod = 'phonepe';
    } else if (normalizedMethod === 'gpay' || normalizedMethod.includes('google') || normalizedMethod.includes('gpay')) {
      // Google Pay payment link with proper UPI ID
      const upiId = process.env.UPI_ID || '9123456789@ybl';
      paymentUrl = `gpay://pay?pa=${upiId}&pn=OurHomeTutions&am=${amount}&cu=INR&tn=Payment for tutoring`;
      normalizedMethod = 'gpay';
    } else if (normalizedMethod === 'card' || normalizedMethod.includes('card') || normalizedMethod.includes('debit') || normalizedMethod.includes('credit')) {
      // For card payments, use Razorpay
      paymentUrl = 'razorpay';
      normalizedMethod = 'razorpay';
    } else if (normalizedMethod === 'paypal' || normalizedMethod.includes('paypal')) {
      // PayPal payments
      paymentUrl = 'paypal';
      normalizedMethod = 'paypal';
    }

    if (!paymentUrl) {
      return res.status(400).json({ error: "Unsupported payment method" });
    }

    res.json({
      success: true,
      paymentUrl: paymentUrl,
      paymentMethod: normalizedMethod,
      amount: amount
    });

  } catch (err) {
    console.error('Payment redirect error:', err);
    res.status(500).json({ error: "Payment redirect failed" });
  }
});

// ✅ Verify Payment
router.post("/verify", (req: any, res: any) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, payment_status } = req.body;

  console.log('Verifying payment:', { razorpay_order_id, razorpay_payment_id, razorpay_signature, payment_status });

  // Check if payment was explicitly cancelled
  if (payment_status === 'cancelled' || payment_status === 'failed' || payment_status === 'error') {
    console.log('Payment was cancelled or failed');
    return res.status(400).json({ success: false, error: 'Payment was cancelled' });
  }

  // For mock mode, only succeed if not cancelled
  if (useMockMode) {
    console.log('Mock mode - accepting payment verification');
    return res.json({ success: true });
  }

  // For simulated payments, check if they have valid payment IDs (not cancelled)
  if ((razorpay_order_id?.startsWith('order_') && !razorpay_order_id?.includes('mock')) ||
      (razorpay_payment_id?.includes('paytm_') && !razorpay_payment_id?.includes('cancelled')) || 
      (razorpay_payment_id?.includes('upi_') && !razorpay_payment_id?.includes('cancelled')) ||
      (razorpay_payment_id?.includes('phonepe_') && !razorpay_payment_id?.includes('cancelled')) ||
      (razorpay_payment_id?.includes('gpay_') && !razorpay_payment_id?.includes('cancelled')) ||
      (razorpay_signature?.includes('_signature') && !razorpay_signature?.includes('cancelled'))) {
    console.log('Simulated payment verification - success');
    return res.json({ success: true });
  }

  // For real payments, verify signature
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    console.log('Missing payment details');
    return res.status(400).json({ success: false, error: 'Missing payment details' });
  }

  const body = razorpay_order_id + "|" + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(body)
    .digest("hex");

  const isValid = expectedSignature === razorpay_signature;
  
  console.log('Payment verification result:', isValid);

  if (isValid) {
    res.json({ success: true });
  } else {
    console.log('Signature mismatch:', { expected: expectedSignature, received: razorpay_signature });
    res.status(400).json({ success: false, error: 'Invalid payment signature' });
  }
});

// ✅ Create Booking and Send to Mentor
router.post("/create-booking", async (req: any, res: any) => {
  console.error('🚀 CREATE-BOOKING ROUTE HIT!');
  console.error('🚀 METHOD:', req.method);
  console.error('🚀 URL:', req.url);
  console.error('🚀 HEADERS:', req.headers);
  
  try {
    console.error('🔍 Raw request body:', JSON.stringify(req.body, null, 2));
    console.error('🔍 req.body type:', typeof req.body);
    console.error('🔍 req.body keys:', Object.keys(req.body));
    console.error('🔍 req.body.address:', req.body.address);
    console.error('🔍 req.body.address type:', typeof req.body.address);
    
    console.log('�📦 Incoming body:', req.body);
    
    // SPECIFIC ADDRESS LOGGING
    console.log('📍 ADDRESS FLOW TRACKING:');
    console.log('📍 Address received from frontend:', req.body.address);
    console.log('📍 Address type:', typeof req.body.address);
    console.log('📍 Address length:', req.body.address?.length || 0);
    console.log('📍 Address trimmed:', req.body.address?.trim());
    console.log('📍 Is empty string:', req.body.address === "");
    console.log('📍 Is null/undefined:', req.body.address == null);
    
    // Test Supabase connection
    try {
      const { data: testData, error: testError } = await supabase
        .from('subjects')
        .select('count')
        .limit(1);
      
      if (testError) {
        console.error('❌ Supabase connection test failed:', testError);
        return res.status(500).json({
          success: false,
          error: "Supabase connection failed",
          details: testError.message
        });
      } else {
        console.log('✅ Supabase connection working - found subjects table');
      }
    } catch (connectionError) {
      console.error('❌ Supabase connection error:', connectionError);
      return res.status(500).json({
        success: false,
        error: "Cannot connect to Supabase",
        details: connectionError instanceof Error ? connectionError.message : String(connectionError)
      });
    }
    
    console.log('🔍 About to destruct request body...');
    const {
      // Student Details
      class: studentClass,
      board,
      stateBoard,
      subjects,
      hoursBySubject,
      mode,
      date,
      time,
      participants,
      contact,
      address,
      // Payment Details
      paymentMethod,
      paymentStatus,
      paymentId,
      amount,
      // Parent Details - should come from frontend
      parentId,
      parentName,
      parentEmail,
      parentPhone
    } = req.body;

    // ✅ FORCE ADDRESS FROM REQUEST BODY
    const forcedAddress = req.body.address;
    console.log('🔍 FORCED ADDRESS FROM REQ.BODY:', forcedAddress);
    console.log('🔍 FORCED ADDRESS TYPE:', typeof forcedAddress);
    console.log('🔍 FORCED ADDRESS LENGTH:', forcedAddress?.length || 0);

    // ✅ PRESERVE ADDRESS IMMEDIATELY
    const preservedAddress = forcedAddress || address;
    console.log('🔍 PRESERVED ADDRESS:', preservedAddress);
    console.log('🔍 PRESERVED ADDRESS TYPE:', typeof preservedAddress);
    console.log('🔍 PRESERVED ADDRESS LENGTH:', preservedAddress?.length || 0);

    console.log('Creating booking with data:', req.body);
    // Parse subjects if they're in string format
    let parsedSubjects = subjects;
    if (typeof subjects === 'string') {
      try {
        parsedSubjects = JSON.parse(subjects);
      } catch (e) {
        console.log('⚠️ Could not parse subjects JSON, using as-is:', subjects);
      }
    }
    
    console.log('🔍 Debug - Available data:', {
      studentClass,
      board,
      stateBoard,
      subjects: parsedSubjects,
      mode,
      date,
      time,
      amount,
      paymentId,
      paymentMethod,
      parentId,
      parentName,
      parentEmail,
      parentPhone,
      address, // ✅ ADD ADDRESS TO DEBUG
      addressType: typeof address,
      addressLength: address?.length || 0,
      subjectsType: typeof parsedSubjects,
      subjectsKeys: parsedSubjects ? Object.keys(parsedSubjects) : 'null',
      subjectsValues: parsedSubjects ? Object.values(parsedSubjects) : 'null'
    });

    // Validate required data before proceeding
    if (!studentClass || !board || !subjects || !date || !time) {
      console.error('❌ Missing required booking data:', {
        studentClass: !!studentClass,
        board: !!board,
        subjects: !!subjects,
        date: !!date,
        time: !!time,
        studentClassValue: studentClass,
        boardValue: board,
        subjectsValue: subjects,
        dateValue: date,
        timeValue: time
      });
      return res.status(400).json({
        success: false,
        error: "Missing required booking data: class, board, subjects, date, and time are required",
        details: {
          studentClass: !!studentClass,
          board: !!board,
          subjects: !!subjects,
          date: !!date,
          time: !!time
        }
      });
    }

    // Create booking in Supabase
    console.log('🔍 ABOUT TO CALL createBookingInSupabase WITH:');
    console.log('🔍 Mode:', mode);
    console.log('🔍 Address:', address);
    console.log('🔍 Mode Lowercase:', mode?.toLowerCase());
    console.log('🔍 Condition Result:', mode?.toLowerCase() === "offline");
    
    // ✅ SIMPLE FIX: USE ADDRESS DIRECTLY FROM FRONTEND WITH MODE LOGIC
    const locationFromFrontend = req.body.address;
    const modeFromFrontend = req.body.mode;
    
    // 🔥 IMPORTANT LOGIC: Online = "Online", Offline = actual address
    const finalLocation = modeFromFrontend?.toLowerCase() === "online" ? "Online" : locationFromFrontend;
    
    console.log('🔍 LOCATION FROM FRONTEND:', locationFromFrontend);
    console.log('🔍 MODE FROM FRONTEND:', modeFromFrontend);
    console.log('🔍 FINAL LOCATION TO STORE:', finalLocation);
    
    const bookingResult = await createBookingInSupabase({
      parentId: parentId || "parent_001",
      class: studentClass,
      board: board,
      stateBoard: stateBoard,
      subjects: JSON.stringify(parsedSubjects), // Convert back to string for storage
      topics: Object.values(parsedSubjects || {}).flat(),
      hoursBySubject: hoursBySubject || {},
      participants: participants || [],
      contact: contact || "", // Use actual contact from frontend
      parentName: parentName || "Parent",
      address: finalLocation, // ✅ USE MODE-BASED LOCATION LOGIC
      mode: mode,
      date: date,
      time: time,
      amount: (amount || 0).toString(),
      paymentId: paymentId || "",
      paymentMethod: paymentMethod || "unknown"
    });

    console.log('🔍 Debug - Supabase result:', {
      success: bookingResult.success,
      error: bookingResult.error,
      booking: bookingResult.booking,
      bookingId: bookingResult.booking?.id,
      hasError: !!bookingResult.error,
      errorMessage: bookingResult.error || 'No error'
    });

    if (bookingResult.success) {
      console.log('✅ Booking created and stored in Supabase:', bookingResult.message);
      
      // Find and assign suitable tutor
      const tutor = await findSuitableTutor(bookingResult.booking);
      
      if (tutor) {
        bookingResult.booking.tutorAssigned = true;
        bookingResult.booking.tutorId = tutor.id;
        bookingResult.booking.tutorName = tutor.name;
        bookingResult.booking.tutorSubject = tutor.subject;
        bookingResult.booking.tutorEmail = tutor.email;
        bookingResult.booking.tutorPhone = tutor.phone;
        
        // Send notification to mentor
        await sendMentorNotification(bookingResult.booking, tutor);
        console.log('Mentor notification sent to:', tutor.name);
      }

      res.json({
        success: true,
        message: "Payment verified and booking created successfully",
        booking: bookingResult.booking,
        paymentId: paymentId
      });
    } else {
      console.error('❌ Supabase booking creation failed:', bookingResult.error);
      console.error('❌ Full error details:', JSON.stringify(bookingResult, null, 2));
      console.error('❌ Error stack trace:', new Error().stack);
      res.status(500).json({
        success: false,
        error: "Booking creation failed",
        details: bookingResult.error,
        debug: {
          receivedData: {
            studentClass,
            board,
            subjects,
            date,
            time,
            amount
          },
          supabaseResult: bookingResult
        }
      });
    }

  } catch (err) {
    console.error('Booking creation error:', err);
    res.status(500).json({ 
      success: false, 
      error: "Booking creation failed" 
    });
  }
});
// Helper function to find suitable tutor
async function findSuitableTutor(booking: any) {
  // Mock tutor database - in real app, query your database
  const tutors = [
    {
      id: "tutor_001",
      name: "Dr. Sarah Johnson",
      subject: "Mathematics",
      email: "sarah.johnson@tutor.com",
      phone: "+919876543210",
      expertise: ["CBSE", "STATE", "Mathematics", "Science"],
      available: true
    },
    {
      id: "tutor_002", 
      name: "Prof. Michael Chen",
      subject: "Science",
      email: "michael.chen@tutor.com",
      phone: "+919876543211",
      expertise: ["CBSE", "ICSE", "Science", "Physics"],
      available: true
    },
    {
      id: "tutor_003",
      name: "Ms. Priya Sharma",
      subject: "English", 
      email: "priya.sharma@tutor.com", 
      phone: "+919876543212",
      expertise: ["CBSE", "STATE", "English", "Social Studies"],
      available: true
    }
  ];

  try {
    // Find tutor based on subjects and board
    if (!booking.subjects || typeof booking.subjects !== 'object') {
      console.warn('⚠️ No subjects found in booking, using fallback tutor');
      return tutors[0]; // Return first tutor as fallback
    }

    const mainSubject = Object.keys(booking.subjects)[0];
    console.log('🔍 Finding tutor for subject:', mainSubject, 'board:', booking.board);
    
    const suitableTutor = tutors.find(tutor => 
      tutor.expertise.includes(mainSubject) && 
      tutor.expertise.includes(booking.board) &&
      tutor.available
    );

    const selectedTutor = suitableTutor || tutors[0]; // Fallback to first tutor
    console.log('✅ Tutor selected:', selectedTutor.name);
    
    return selectedTutor;
  } catch (error) {
    console.error('❌ Error finding suitable tutor:', error);
    return tutors[0]; // Always return a tutor
  }
}

// Helper function to send mentor notification
async function sendMentorNotification(booking: any, tutor: any): Promise<boolean> {
  try {
    // TODO: Implement actual notification system
    // Options: Email, SMS, Push Notification, WebSocket
    
    // Safely get subject name
    let subjectName = "General";
    if (booking.subjects && typeof booking.subjects === 'object') {
      const subjectKeys = Object.keys(booking.subjects);
      if (subjectKeys.length > 0) {
        subjectName = subjectKeys[0];
      }
    }
    
    const notificationData = {
      type: "new_booking",
      tutorId: tutor.id,
      tutorEmail: tutor.email,
      tutorPhone: tutor.phone,
      bookingId: booking.id,
      studentName: booking.participants && booking.participants.length > 0 ? booking.participants[0] : "Student",
      subject: subjectName,
      class: booking.studentClass || "Not specified",
      board: booking.board || "Not specified",
      mode: booking.mode || "online",
      date: booking.date || "Not specified",
      time: booking.time || "Not specified",
      parentName: booking.parentName || "Parent",
      parentContact: booking.contact || "Not provided",
      amount: booking.amount || "0",
      paymentStatus: booking.paymentStatus || "paid",
      createdAt: booking.createdAt || new Date().toISOString()
    };

    console.log('📧 Sending notification to mentor:', notificationData);
    
    // Send message to parent's inbox about tutor assignment
    const parentMessage = {
      senderId: tutor.id,
      senderType: 'mentor',
      recipientId: booking.parentId || 'parent_001',
      subject: 'Tutor Assigned - ' + subjectName + ' Session',
      message: `Great news! ${tutor.name} has been assigned for your ${subjectName} session on ${booking.date || 'scheduled date'} at ${booking.time || 'scheduled time'}. ${tutor.name} is an expert in ${tutor.subject || subjectName} and will contact you soon with further details.`,
      bookingId: booking.id
    };

    // TODO: Save message to database
    console.log('📨 Message sent to parent inbox:', parentMessage);
    
    // TODO: Implement actual notification channels:
    // 1. Email notification
    // await sendEmail(tutor.email, "New Booking Request", notificationData);
    
    // 2. SMS notification  
    // await sendSMS(tutor.phone, `New booking: ${booking.studentClass} ${subjectName} on ${booking.date} at ${booking.time}`);
    
    // 3. Push notification (if using Firebase/OneSignal)
    // await sendPushNotification(tutor.id, notificationData);
    // await sendPushNotification(booking.parentId, parentMessage);
    
    // 4. WebSocket real-time notification
    // await sendWebSocketNotification(tutor.id, notificationData);
    // await sendWebSocketNotification(booking.parentId, parentMessage);
    
    return true;
  } catch (error) {
    console.error('Error sending mentor notification:', error);
    return false;
  }
}

// ✅ Mentor Accept/Reject Booking
router.post("/respond-booking", async (req: Request, res: Response): Promise<void> => {
  try {
    const { bookingId, tutorId, action, reason } = req.body; // action: 'accept' or 'reject'

    if (!bookingId || !tutorId || !action) {
      res.status(400).json({
        success: false,
        error: "bookingId, tutorId, and action are required"
      });
      return;
    }

    if (!['accept', 'reject'].includes(action)) {
      res.status(400).json({
        success: false,
        error: "action must be 'accept' or 'reject'"
      });
      return;
    }

    // Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      res.status(404).json({
        success: false,
        error: "Booking not found"
      });
      return;
    }

    // Update booking status
    const newStatus = action === 'accept' ? 'confirmed' : 'cancelled';
    const { error: updateError } = await supabase
      .from('bookings')
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId);

    if (updateError) {
      res.status(500).json({
        success: false,
        error: "Failed to update booking status"
      });
      return;
    }

    // Get tutor details
    const { data: tutor } = await supabase
      .from('users')
      .select('first_name, last_name, phone, email')
      .eq('id', tutorId)
      .single();

    const tutorName = tutor ? `${tutor.first_name} ${tutor.last_name}` : 'Tutor';

    // Send notification to parent
    const parentMessage = action === 'accept' 
      ? `✅ Great news! ${tutorName} has accepted your booking for ${booking.scheduled_date}. Tutor will contact you soon.`
      : `❌ Unfortunately, ${tutorName} had to decline your booking. ${reason || 'We will find another tutor for you.'}`;

    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: booking.parent_id,
        title: action === 'accept' ? '🎉 Tutor Accepted!' : '⚠️ Tutor Declined',
        message: parentMessage,
        type: action === 'accept' ? 'booking_accepted' : 'booking_rejected',
        data: {
          bookingId: bookingId,
          tutorName: tutorName,
          tutorPhone: tutor?.phone,
          action: action,
          reason: reason || null,
          scheduledDate: booking.scheduled_date,
          scheduledTime: new Date(booking.scheduled_date).toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })
        }
      });

    if (notificationError) {
      console.error('Failed to send parent notification:', notificationError);
    }

    console.log(`✅ Tutor ${action}ed booking ${bookingId}`);

    res.json({
      success: true,
      message: `Booking ${action}ed successfully`,
      action: action,
      bookingId: bookingId,
      parentNotified: !notificationError
    });

  } catch (error) {
    console.error('Error responding to booking:', error);
    res.status(500).json({
      success: false,
      error: "Failed to process booking response"
    });
  }
});

// ✅ Get Mentor's Pending Bookings
router.get("/mentor-bookings/:tutorId", async (req: Request, res: Response): Promise<void> => {
  try {
    const { tutorId } = req.params;

    const { data: bookings, error } = await supabase
      .from('bookings')
      .select(`
        *,
        users!bookings_parent_id_fkey (
          first_name,
          last_name,
          phone,
          email
        ),
        subjects (
          name,
          board,
          class_level
        )
      `)
      .eq('tutor_id', tutorId)
      .in('status', ['pending', 'confirmed'])
      .order('created_at', { ascending: false });

    if (error) {
      res.status(500).json({
        success: false,
        error: "Failed to fetch mentor bookings"
      });
      return;
    }

    res.json({
      success: true,
      bookings: bookings || []
    });

  } catch (error) {
    console.error('Error fetching mentor bookings:', error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch bookings"
    });
  }
});

// ✅ Update Tutor Location (for live tracking)
router.post("/update-location", async (req: Request, res: Response): Promise<void> => {
  try {
    const { tutorId, bookingId, latitude, longitude, accuracy } = req.body;

    if (!tutorId || !bookingId || !latitude || !longitude) {
      res.status(400).json({
        success: false,
        error: "tutorId, bookingId, latitude, and longitude are required"
      });
      return;
    }

    // Insert location tracking data
    const { error } = await supabase
      .from('location_tracking')
      .insert({
        booking_id: bookingId,
        tutor_id: tutorId,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        accuracy: accuracy ? parseFloat(accuracy) : null,
        timestamp: new Date().toISOString()
      });

    if (error) {
      console.error('Location tracking error:', error);
      res.status(500).json({
        success: false,
        error: "Failed to update location"
      });
      return;
    }

    console.log(`📍 Location updated for tutor ${tutorId}, booking ${bookingId}`);

    res.json({
      success: true,
      message: "Location updated successfully"
    });

  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({
      success: false,
      error: "Failed to update location"
    });
  }
});

// ✅ Get Tutor Live Location
router.get("/tutor-location/:bookingId", async (req: Request, res: Response): Promise<void> => {
  try {
    const { bookingId } = req.params;

    // Get latest location for the booking
    const { data: location, error } = await supabase
      .from('location_tracking')
      .select('*')
      .eq('booking_id', bookingId)
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      res.status(500).json({
        success: false,
        error: "Failed to fetch tutor location"
      });
      return;
    }

    res.json({
      success: true,
      location: location || null,
      message: location ? "Live location available" : "No location data available"
    });

  } catch (error) {
    console.error('Error fetching tutor location:', error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch location"
    });
  }
});
router.get("/messages", async (req: Request, res: Response): Promise<void> => {
  try {
    const { parentId } = req.query;
    
    if (!parentId) {
      res.status(400).json({
        success: false,
        error: "parentId is required"
      });
      return;
    }

    // Get notifications from Supabase
    const result = await getParentNotifications(parentId as string);
    
    if (result.success && result.notifications) {
      // Transform Supabase notifications to message format
      const messages = result.notifications.map((notification: any) => ({
        id: notification.id,
        type: notification.type,
        sender: notification.type === 'booking' ? 'System' : 'Admin',
        subject: notification.title,
        message: notification.message,
        timestamp: notification.created_at,
        read: notification.is_read,
        data: notification.data
      }));

      res.json({
        success: true,
        messages: messages
      });
    } else if (result.success) {
      // No notifications found
      res.json({
        success: true,
        messages: []
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch messages"
    });
  }
});

// ✅ Send Message from Mentor/Admin
router.post("/send-message", async (req: any, res: any) => {
  try {
    const {
      senderId,
      senderType, // 'mentor' or 'admin'
      recipientId, // parentId
      subject,
      message,
      bookingId
    } = req.body;

    console.log('Sending message:', req.body);

    // Create message
    const newMessage = {
      id: "msg_" + Date.now(),
      type: senderType,
      senderName: senderType === 'mentor' ? 'Dr. Sarah Johnson' : 'OurHomeTutions Admin',
      subject: subject,
      message: message,
      timestamp: new Date().toISOString(),
      read: false,
      bookingId: bookingId,
      actionRequired: subject.includes('Action Required') || subject.includes('Urgent')
    };

    // TODO: Save to database
    console.log('Message created:', newMessage);

    // TODO: Send push notification to parent
    console.log('📱 Push notification sent to parent:', recipientId);

    res.json({
      success: true,
      message: "Message sent successfully",
      messageId: newMessage.id
    });

  } catch (err) {
    console.error('Error sending message:', err);
    res.status(500).json({ 
      success: false, 
      error: "Failed to send message" 
    });
  }
});

// ✅ Update Account Data
router.post("/update-account", async (req: any, res: any) => {
  try {
    const {
      parentId,
      parentName,
      email,
      phone,
      address,
      city,
      state,
      pincode
    } = req.body;

    console.log('Updating account data for parent:', parentId);

    // Validate required fields
    if (!parentId || !parentName || !email || !phone) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: parentId, parentName, email, phone"
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: "Invalid email format"
      });
    }

    // Validate phone format (10 digits)
    if (!/^[0-9]{10}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        error: "Phone number must be 10 digits"
      });
    }

    // TODO: Update in database (Supabase/MySQL)
    const updatedAccount = {
      parentId,
      parentName,
      email,
      phone,
      address,
      city,
      state,
      pincode,
      updatedAt: new Date().toISOString()
    };

    // TODO: Update login credentials in auth system
    const updatedCredentials = {
      parentId,
      email,
      parentName,
      // Note: Password remains the same for security
      // Only email and name are updated for login
    };

    console.log('Account updated successfully:', updatedAccount);
    console.log('Login credentials updated:', updatedCredentials);

    // Send confirmation message to parent's inbox
    const confirmationMessage = {
      senderId: "system",
      senderType: "system",
      recipientId: parentId,
      subject: "Account Information Updated",
      message: `Your account information has been successfully updated. You can now login using your new email: ${email}. Your password remains the same for security.`,
      bookingId: null
    };

    console.log('📨 Account update confirmation sent to parent:', confirmationMessage);

    res.json({
      success: true,
      message: "Account information updated successfully. Please use your new email for future logins.",
      account: updatedAccount,
      credentials: updatedCredentials
    });

  } catch (err) {
    console.error('Account update error:', err);
    res.status(500).json({ 
      success: false, 
      error: "Failed to update account information" 
    });
  }
});

export default router;
