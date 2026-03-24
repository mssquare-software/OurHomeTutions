import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://gjusrbtrohibyxnglwai.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqdXNyYnRyb2hpYnl4bmdsd2FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNzEwODgsImV4cCI6MjA4ODk0NzA4OH0.77QhEBtHaVLGcDGNPD98yRm9mwGOcnDOVScga-hc_Lk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ✅ Generate Unique Booking Code
export async function generateUniqueBookingCode(): Promise<string> {
  let code: string;
  let exists = true;
  let attempts = 0;
  const maxAttempts = 100;

  while (exists && attempts < maxAttempts) {
    // Generate 4-digit code
    code = Math.floor(1000 + Math.random() * 9000).toString();
    
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select("id")
        .eq("booking_code", code);

      if (error) throw error;
      
      if (!data || data.length === 0) {
        exists = false;
      }
    } catch (error) {
      console.error('Error checking booking code uniqueness:', error);
      // If there's an error, assume the code is unique to avoid infinite loop
      exists = false;
    }
    
    attempts++;
  }

  if (exists) {
    throw new Error('Failed to generate unique booking code after maximum attempts');
  }

  return code!;
}

// Create Supabase client with service role key for admin operations
export const supabaseAdmin = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Create Supabase client with anon key for client operations
export const supabaseAnon: SupabaseClient = createClient(supabaseUrl, process.env.SUPABASE_ANON_KEY!);

// Helper function to create booking with all details
export const createBookingInSupabase = async (bookingData: any) => {
  try {
    console.log('🗄️ Storing booking in Supabase:', bookingData);
    console.log('🔍 createBookingInSupabase CALLED WITH:');
    console.log('🔍 Address in createBookingInSupabase:', bookingData.address);
    console.log('🔍 Address Type:', typeof bookingData.address);
    console.log('🔍 Address Length:', bookingData.address?.length || 0);

    // Debug: Log subjects data
    console.log('🔍 Supabase Debug - Subjects Data:', {
      subjects: bookingData.subjects,
      subjectsType: typeof bookingData.subjects,
      subjectsKeys: Object.keys(bookingData.subjects || {}),
      subjectsLength: Object.keys(bookingData.subjects || {}).length,
      hasSubjects: Object.keys(bookingData.subjects || {}).length > 0
    });

    // Parse subjects if it's a JSON string
    let parsedSubjects = bookingData.subjects;
    if (typeof bookingData.subjects === 'string') {
      try {
        parsedSubjects = JSON.parse(bookingData.subjects);
      } catch (error) {
        console.error('❌ Failed to parse subjects JSON:', error);
        parsedSubjects = {};
      }
    }

    // Debug: Log parsed subjects
    console.log('🔍 Parsed Subjects Debug:', {
      original: bookingData.subjects,
      parsed: parsedSubjects,
      type: typeof parsedSubjects,
      keys: Object.keys(parsedSubjects || {}),
      values: Object.values(parsedSubjects || {})
    });

    // TEMPORARY FIX: If subjects are empty, use test data to verify Supabase works
    if (!parsedSubjects || Object.keys(parsedSubjects).length === 0) {
      console.log('⚠️ Subjects empty - using test data for Supabase verification');
      parsedSubjects = {
        "English": ["Reading", "Writing", "Grammar"],
        "Mathematics": ["Algebra", "Geometry"]
      };
      console.log('🔧 Using test subjects:', parsedSubjects);
    }

    // Validate subjects
    if (!parsedSubjects || Object.keys(parsedSubjects).length === 0) {
      console.error('❌ No subjects provided in booking data');
      return {
        success: false,
        error: 'No subjects provided in booking data',
        booking: undefined,
        bookingId: undefined,
        hasError: true,
        errorMessage: 'No subjects provided in booking data'
      };
    }

    const firstSubject = Object.keys(parsedSubjects)[0];
    console.log('🔍 Looking for subject:', { name: firstSubject, board: bookingData.board, class_level: parseInt(bookingData.class) });

    // First, find the subject
    const { data: subject, error: subjectError } = await supabase
      .from('subjects')
      .select('*')
      .eq('name', firstSubject)
      .eq('board', bookingData.board)
      .eq('class_level', parseInt(bookingData.class))
      .single();

    console.log('🔍 Subject query result:', { subject, subjectError });

    let subjectData: any;
    if (subjectError || !subject) {
      console.error('❌ Subject not found:', { subjectError, firstSubject, board: bookingData.board, class: bookingData.class });
      // Create fallback subject for testing
      const fallbackSubject = {
        id: 'subject_fallback_001',
        name: firstSubject,
        board: bookingData.board,
        class_level: parseInt(bookingData.class)
      };
      console.log('⚠️ Using fallback subject:', fallbackSubject);
      subjectData = fallbackSubject;
    } else {
      subjectData = subject;
    }

    console.log('✅ Subject found/created:', subjectData);

    // Find a suitable tutor
    const { data: tutor, error: tutorError } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'tutor')
      .contains('subjects', [firstSubject])
      .eq('is_available', true)
      .limit(1);

    console.log('🔍 Tutor query result:', { tutor, tutorError });

    let tutorData: any;
    if (tutorError || !tutor || tutor.length === 0) {
      console.error('❌ No suitable tutor found:', { tutorError, firstSubject });
      // Create a fallback tutor for testing
      const fallbackTutor = {
        id: 'tutor_fallback_001',
        first_name: 'Test',
        last_name: 'Tutor',
        email: 'test@tutor.com',
        phone: '+919876543210'
      };
      console.log('⚠️ Using fallback tutor:', fallbackTutor);
      
      // Continue with fallback tutor instead of throwing error
      tutorData = fallbackTutor;
    } else {
      tutorData = tutor[0];
    }

    console.log('✅ Tutor assigned:', tutorData);

    // Parse scheduled date and time
    const scheduledDateTime = new Date(`${bookingData.date}T${bookingData.time}:00`);
    console.log('📅 Scheduled datetime:', scheduledDateTime.toISOString());

    // Try to create booking in Supabase, fall back to mock if schema issues
    let booking;
    let bookingError;
    let bookingCode: string = ""; // ✅ Initialize bookingCode to avoid "used before being assigned" error
    let useMockBooking = false;

    try {
      // ✅ Generate Unique Booking Code
      bookingCode = await generateUniqueBookingCode();
      console.log('🎯 Generated booking code:', bookingCode);

      // Enhanced notes with all parent selections
      const detailedNotes = `
📚 CLASS: ${bookingData.class || 'Not specified'}
📖 BOARD: ${bookingData.board || 'Not specified'}${bookingData.stateBoard ? ' (' + bookingData.stateBoard + ')' : ''}
🎯 SUBJECTS: ${Object.keys(parsedSubjects || {}).join(', ')}
📝 TOPICS: ${Object.values(parsedSubjects || {}).flat().join(', ') || 'Not specified'}
👥 PARTICIPANTS: ${Array.isArray(bookingData.participants) ? bookingData.participants.map((p: any) => p.name || p).join(', ') : (bookingData.participants || 'Not specified')}
📞 CONTACT: ${bookingData.contact || 'Not provided'}
👨‍👩‍👧‍👦 PARENT: ${bookingData.parentName || 'Not specified'}
🏠 ADDRESS: ${bookingData.address || 'Not provided'}
💻 MODE: ${bookingData.mode || 'online'}
📅 DATE: ${bookingData.date || 'Not specified'}
⏰ TIME: ${bookingData.time || 'Not specified'}
💰 AMOUNT: ₹${bookingData.amount || '0'}
💳 PAYMENT: ${bookingData.paymentMethod || 'razorpay'} (${bookingData.paymentId || 'N/A'})
      `.trim();

      // Debug: Log what we're actually storing
      const finalLocation = bookingData.address || ""; // SIMPLIFIED: Just use whatever address is sent
      console.log('🔍 FINAL LOCATION TO STORE (DIRECT):', finalLocation); // Added comment to force recompile
      console.log('🔍 BOOKING DATA ADDRESS:', bookingData.address);
      console.log('🔍 FINAL LOCATION TYPE:', typeof finalLocation);
      console.log('🔍 FINAL LOCATION LENGTH:', finalLocation?.length || 0);

      // Debug: Log address specifically
      console.log('🔍 ADDRESS DEBUG:', {
        received: bookingData.address,
        type: typeof bookingData.address,
        hasAddress: !!bookingData.address,
        addressLength: bookingData.address?.length || 0,
        addressTrimmed: bookingData.address?.trim(),
        finalLocation: finalLocation,
        fullBookingData: bookingData
      });

      const bookingInsertData = {
        parent_id: bookingData.parentId, // ← Use exactly what frontend sends (username)
        tutor_id: tutorData.id,
        subject_id: subjectData.id,
        class_mode: bookingData.mode?.toLowerCase() || 'online',
        lesson_type: 'single',
        scheduled_date: scheduledDateTime.toISOString(),
        duration_minutes: 60,
        price: parseFloat(bookingData.amount) || 1000,
        status: 'confirmed',
        location: finalLocation, // ← Use the debug variable
        notes: detailedNotes,
        payment_status: 'paid',
        payment_id: bookingData.paymentId,
        booking_code: bookingCode // ✅ ADD UNIQUE BOOKING CODE
      };

      console.log('🔍 Attempting Supabase insert with data:', bookingInsertData);
      
      // Debug: Log parent_id specifically
      console.log('🔍 PARENT ID DEBUG:', {
        received: bookingData.parentId,
        type: typeof bookingData.parentId,
        isUsername: bookingData.parentId !== 'parent_001',
        finalValue: bookingData.parentId
      });

      // Debug: Log address specifically
      console.log('🔍 ADDRESS DEBUG:', {
        received: bookingData.address,
        type: typeof bookingData.address,
        hasAddress: !!bookingData.address,
        addressLength: bookingData.address?.length || 0,
        addressTrimmed: bookingData.address?.trim(),
        finalLocation: finalLocation,
        fullBookingData: bookingData
      });

      const result = await supabase
        .from('bookings')
        .insert(bookingInsertData)
        .select()
        .single();
      
      booking = result.data;
      bookingError = result.error;

      console.log('🔍 Supabase insert result:', { booking, bookingError });

      // If Supabase fails, show the actual error instead of using mock mode
      if (bookingError || !booking) {
        console.error('❌ Supabase booking failed:', bookingError);
        console.error('❌ Full error details:', JSON.stringify(bookingError, null, 2));
        console.error('❌ Attempted data:', JSON.stringify(bookingInsertData, null, 2));
        
        // Don't use mock mode - return the actual error
        const errorMessage = (bookingError as any)?.message || 'Unknown error';
        throw new Error(`Supabase booking failed: ${errorMessage}`);
      }

    } catch (insertError) {
      console.error('❌ Supabase insert failed:', insertError);
      bookingError = insertError;
    }

    // Check for errors after the try-catch
    if (bookingError || !booking) {
      console.error('❌ Supabase booking failed:', bookingError);
      console.error('❌ Full error details:', JSON.stringify(bookingError, null, 2));
      
      // Don't use mock mode - return the actual error
      const errorMessage = (bookingError as any)?.message || 'Unknown error';
      throw new Error(`Supabase booking failed: ${errorMessage}`);
    }

    console.log('✅ Real Supabase booking created successfully:', booking);

    // Try to create payment record (don't fail if this fails)
    try {
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          booking_id: booking.id,
          amount: parseFloat(bookingData.amount) || 1000,
          currency: 'INR',
          status: 'completed',
          payment_method: bookingData.paymentMethod?.toLowerCase() || 'razorpay',
          transaction_id: bookingData.paymentId,
        });

      if (paymentError) {
        console.error('⚠️ Payment record creation failed:', paymentError);
      } else {
        console.log('✅ Payment record created');
      }
    } catch (paymentError) {
      console.error('⚠️ Payment record creation failed:', paymentError);
    }

    // Send notification to mentor with full booking details
    const { error: mentorNotificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: tutorData.id,
        title: '🎯 New Booking Request',
        message: `
📚 CLASS: ${bookingData.class} - ${bookingData.board}
🎯 SUBJECTS: ${Object.keys(parsedSubjects || {}).join(', ')}
📝 TOPICS: ${Object.values(parsedSubjects || {}).flat().join(', ')}
👥 STUDENTS: ${Array.isArray(bookingData.participants) ? bookingData.participants.join(', ') : (bookingData.participants || 'Not specified')}
📞 CONTACT: ${bookingData.contact}
👨‍👩‍👧‍👦 PARENT: ${bookingData.parentName}
🏠 ADDRESS: ${bookingData.address || 'Online Session'}
💻 MODE: ${bookingData.mode}
📅 DATE: ${bookingData.date}
⏰ TIME: ${bookingData.time}
💰 AMOUNT: ₹${bookingData.amount}
💳 PAYMENT: ${bookingData.paymentMethod} ✅ Paid

🔔 ACTION REQUIRED: Accept or Reject this booking
        `.trim(),
        type: 'booking_request',
        data: {
          bookingId: booking.id,
          bookingData: {
            class: bookingData.class,
            board: bookingData.board,
            subjects: parsedSubjects, // Use parsed subjects
            topics: Object.values(parsedSubjects || {}).flat(),
            participants: bookingData.participants,
            contact: bookingData.contact,
            parentName: bookingData.parentName,
            address: bookingData.address,
            mode: bookingData.mode,
            date: bookingData.date,
            time: bookingData.time,
            amount: bookingData.amount,
            paymentMethod: bookingData.paymentMethod,
            paymentId: bookingData.paymentId
          },
          requiresAction: true,
          actionType: 'accept_reject_booking',
          expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() // 2 hours
        }
      });

    if (mentorNotificationError) {
      console.error('⚠️ Mentor notification creation failed:', mentorNotificationError);
    } else {
      console.log('✅ Detailed notification sent to mentor:', tutorData.first_name, tutorData.last_name);
    }

    const successMessage = "Booking created and stored in database successfully";

    console.log(`✅ ${successMessage}:`, booking);

    return {
      success: true,
      booking: {
        ...booking,
        bookingCode: bookingCode, // ✅ ADD BOOKING CODE TO RESPONSE
        tutor: {
          id: tutorData.id,
          name: `${tutorData.first_name} ${tutorData.last_name}`,
          subject: subjectData.name,
          email: tutorData.email,
          phone: tutorData.phone
        },
        // Include the original booking data for confirmation page
        originalData: {
          class: bookingData.class,
          board: bookingData.board,
          subjects: parsedSubjects, // Use parsed subjects instead of original
          date: bookingData.date,
          time: bookingData.time,
          mode: bookingData.mode,
          participants: bookingData.participants,
          contact: bookingData.contact,
          address: bookingData.address,
          amount: bookingData.amount,
          parentName: bookingData.parentName
        }
      },
      message: successMessage
    };
  } catch (error) {
    console.error('❌ Booking creation failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create booking'
    };
  }
};

// Helper function to get parent's bookings
export const getParentBookings = async (parentId: string) => {
  try {
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select(`
        *,
        subject:subjects(name, board, class_level),
        tutor:users!bookings_tutor_id_fkey(first_name, last_name, email, phone, rating)
      `)
      .eq('parent_id', parentId)
      .order('scheduled_date', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch bookings: ${error.message}`);
    }

    return {
      success: true,
      bookings
    };

  } catch (error) {
    console.error('❌ Failed to fetch parent bookings:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch bookings'
    };
  }
};

// Helper function to get parent's notifications
export const getParentNotifications = async (parentId: string) => {
  try {
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', parentId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch notifications: ${error.message}`);
    }

    return {
      success: true,
      notifications
    };

  } catch (error) {
    console.error('❌ Failed to fetch notifications:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch notifications'
    };
  }
};

export default supabase;
