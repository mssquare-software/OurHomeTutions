# Mentor Notification & Tracking API Guide

## 🎯 Complete Mentor System Overview

When a parent makes a booking, the mentor receives a detailed popup notification with all booking details and can accept/reject. Parents get notified of mentor decisions and can track live tutor location.

---

## 📱 Mentor Notification Flow

### **1. Booking Created → Mentor Gets Detailed Notification**

**Mentor receives popup with:**
```
🎯 New Booking Request

📚 CLASS: 10 - CBSE
🎯 SUBJECTS: Mathematics, Science  
📝 TOPICS: Algebra, Geometry, Physics, Chemistry
👥 STUDENTS: John Doe, Jane Doe
📞 CONTACT: 9876543210
👨‍👩‍👧‍👦 PARENT: Jane Doe
🏠 ADDRESS: 123 Main St, City
💻 MODE: Online
📅 DATE: 2026-03-12
⏰ TIME: 16:00
💰 AMOUNT: ₹1000
💳 PAYMENT: razorpay ✅ Paid

🔔 ACTION REQUIRED: Accept or Reject this booking
```

---

## 🛠️ API Endpoints

### **📨 Mentor Accept/Reject Booking**
```http
POST /api/payment/respond-booking
```

**Request Body:**
```json
{
  "bookingId": "uuid-here",
  "tutorId": "uuid-here", 
  "action": "accept", // or "reject"
  "reason": "Optional rejection reason"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Booking accepted successfully",
  "action": "accept",
  "bookingId": "uuid-here",
  "parentNotified": true
}
```

---

### **📋 Get Mentor's Pending Bookings**
```http
GET /api/payment/mentor-bookings/:tutorId
```

**Response:**
```json
{
  "success": true,
  "bookings": [
    {
      "id": "booking-uuid",
      "status": "pending",
      "scheduled_date": "2026-03-12T16:00:00Z",
      "price": 1000,
      "location": {"address": "123 Main St"},
      "users": {
        "first_name": "Jane",
        "last_name": "Doe", 
        "phone": "9876543210",
        "email": "jane@email.com"
      },
      "subjects": {
        "name": "Mathematics",
        "board": "CBSE",
        "class_level": 10
      }
    }
  ]
}
```

---

### **📍 Update Tutor Location (Live Tracking)**
```http
POST /api/payment/update-location
```

**Request Body:**
```json
{
  "tutorId": "uuid-here",
  "bookingId": "uuid-here", 
  "latitude": 28.6139,
  "longitude": 77.2090,
  "accuracy": 10.0
}
```

**Response:**
```json
{
  "success": true,
  "message": "Location updated successfully"
}
```

---

### **🗺️ Get Tutor Live Location**
```http
GET /api/payment/tutor-location/:bookingId
```

**Response:**
```json
{
  "success": true,
  "location": {
    "id": "location-uuid",
    "booking_id": "booking-uuid",
    "tutor_id": "tutor-uuid",
    "latitude": 28.6139,
    "longitude": 77.2090,
    "accuracy": 10.0,
    "timestamp": "2026-03-12T15:45:00Z"
  },
  "message": "Live location available"
}
```

---

## 🎯 Parent Notification Flow

### **When Mentor Accepts:**
```
🎉 Tutor Accepted!

✅ Great news! Dr. Sarah Johnson has accepted your booking for 2026-03-12. 
Tutor will contact you soon.

📞 Tutor Contact: +919876543210
📅 Session: 2026-03-12 at 4:00 PM
```

### **When Mentor Rejects:**
```
⚠️ Tutor Declined

❌ Unfortunately, Dr. Sarah Johnson had to decline your booking. 
Reason: Already have another session at that time.
We will find another tutor for you.
```

---

## 🗺️ Live Tracking Implementation

### **For Parents - Map Integration:**
```javascript
// Fetch tutor location
const response = await fetch(`/api/payment/tutor-location/${bookingId}`);
const { location } = await response.json();

if (location) {
  // Show on map
  map.setView([location.latitude, location.longitude], 15);
  L.marker([location.latitude, location.longitude])
    .addTo(map)
    .bindPopup('📍 Tutor Live Location');
}
```

### **For Tutors - Location Updates:**
```javascript
// Update location every 30 seconds
setInterval(async () => {
  const position = await navigator.geolocation.getCurrentPosition();
  
  await fetch('/api/payment/update-location', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tutorId: 'tutor-uuid',
      bookingId: 'booking-uuid',
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy
    })
  });
}, 30000); // 30 seconds
```

---

## 📱 Frontend Implementation

### **Mentor Popup Component:**
```jsx
function MentorBookingPopup({ booking }) {
  const handleResponse = async (action) => {
    await fetch('/api/payment/respond-booking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookingId: booking.id,
        tutorId: 'current-tutor-id',
        action: action,
        reason: action === 'reject' ? 'Busy at that time' : null
      })
    });
  };

  return (
    <Modal>
      <View>
        <Text>🎯 New Booking Request</Text>
        <Text>📚 Class: {booking.class} - {booking.board}</Text>
        <Text>🎯 Subjects: {booking.subjects.join(', ')}</Text>
        <Text>👥 Students: {booking.participants.join(', ')}</Text>
        <Text>📞 Contact: {booking.contact}</Text>
        <Text>📅 Date: {booking.date} at {booking.time}</Text>
        <Text>💰 Amount: ₹{booking.amount}</Text>
        
        <View style={{flexDirection: 'row'}}>
          <Button onPress={() => handleResponse('accept')}>
            ✅ Accept
          </Button>
          <Button onPress={() => handleResponse('reject')}>
            ❌ Reject
          </Button>
        </View>
      </View>
    </Modal>
  );
}
```

### **Parent Map Component:**
```jsx
function TutorTrackingMap({ bookingId }) {
  const [tutorLocation, setTutorLocation] = useState(null);

  useEffect(() => {
    const fetchLocation = async () => {
      const response = await fetch(`/api/payment/tutor-location/${bookingId}`);
      const { location } = await response.json();
      setTutorLocation(location);
    };

    fetchLocation();
    const interval = setInterval(fetchLocation, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [bookingId]);

  return (
    <View>
      {tutorLocation ? (
        <MapView
          initialRegion={{
            latitude: tutorLocation.latitude,
            longitude: tutorLocation.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
        >
          <Marker
            coordinate={{
              latitude: tutorLocation.latitude,
              longitude: tutorLocation.longitude,
            }}
            title="📍 Tutor Live Location"
            description="Your tutor is on the way!"
          />
        </MapView>
      ) : (
        <Text>Waiting for tutor location...</Text>
      )}
    </View>
  );
}
```

---

## 🔄 Complete Workflow

1. **Parent Books** → Payment successful
2. **Mentor Gets Popup** → All details shown
3. **Mentor Accepts/Rejects** → Updates booking status
4. **Parent Notified** → Gets acceptance/rejection message
5. **If Accepted** → Parent can track mentor live on map
6. **Tutor Updates Location** → Every 30 seconds
7. **Parent Sees Live Tracking** → Real-time location updates

---

## 🎯 Key Features

✅ **Detailed Mentor Notifications** → All booking details included  
✅ **Accept/Reject System** → Mentors can respond to bookings  
✅ **Parent Notifications** → Instant updates on mentor decisions  
✅ **Live Location Tracking** → Real-time tutor location on map  
✅ **Automatic Status Updates** → Booking status changes automatically  
✅ **Contact Information** → Parents get mentor contact details  
✅ **Expiration System** → Booking requests expire after 2 hours  

---

## 🚀 Testing the System

1. **Make a test booking** → Check mentor gets detailed popup
2. **Accept/reject booking** → Verify parent gets notification  
3. **Check booking status** → Should update in database
4. **Test location tracking** → Verify map updates work
5. **Verify notifications** → All messages should be detailed

**The complete mentor notification and tracking system is now ready!** 🎉
