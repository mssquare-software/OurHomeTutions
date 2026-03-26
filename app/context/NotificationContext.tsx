import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useEffect, useState } from "react";
import type { BookingRequest, Notification } from "../../constants/notificationTypes";
import {
  ADMIN_USER_ID,
  generateAttendanceCode,
  makeSlotKey,
} from "../../constants/notificationTypes";
import { listUsers } from "../data/repo/repo";

export type { BookingRequest, Notification } from "../../constants/notificationTypes";

interface NotificationContextType {
  notifications: Notification[];
  bookings: BookingRequest[];
  unreadCount: number;
  addNotification: (notification: Notification) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  acceptBooking: (bookingId: string, teacherId: string) => Promise<void>;
  rejectBooking: (bookingId: string, teacherId: string) => Promise<void>;
  createBooking: (booking: BookingRequest) => Promise<void>;
  assignTeacher: (
    bookingId: string,
    mentorEmail: string,
    mentorName: string
  ) => Promise<{ ok: boolean; error?: string }>;
  getBookingById: (bookingId: string) => BookingRequest | undefined;
  getBookingsForParent: (parentEmail: string) => BookingRequest[];
  getBookingsForMentor: (mentorEmail: string) => BookingRequest[];
  markAttendance: (
    bookingId: string,
    mentorEmail: string,
    code: string
  ) => Promise<boolean>;
  startSession: (bookingId: string) => Promise<void>;
  completeBooking: (bookingId: string) => Promise<void>;
  rateBooking: (bookingId: string, stars: number) => Promise<void>;
  sendNearArrivalCodeToParent: (bookingId: string) => Promise<void>;
}

export const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

const nid = () => `n_${Math.random().toString(36).slice(2)}_${Date.now()}`;

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [bookings, setBookings] = useState<BookingRequest[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [savedNotifications, savedBookings] = await Promise.all([
          AsyncStorage.getItem("notifications"),
          AsyncStorage.getItem("bookings"),
        ]);
        if (savedNotifications) setNotifications(JSON.parse(savedNotifications));
        if (savedBookings) setBookings(JSON.parse(savedBookings));
      } catch (e) {
        console.log("Error loading notifications/bookings:", e);
      }
    };
    loadData();
  }, []);

  const saveNotifications = useCallback(async (data: Notification[]) => {
    await AsyncStorage.setItem("notifications", JSON.stringify(data));
  }, []);

  const saveBookings = useCallback(async (data: BookingRequest[]) => {
    await AsyncStorage.setItem("bookings", JSON.stringify(data));
  }, []);

  const addNotification = useCallback(
    async (notification: Notification) => {
      setNotifications((prev) => {
        const updated = [notification, ...prev];
        saveNotifications(updated);
        return updated;
      });
    },
    [saveNotifications]
  );

  const markAsRead = useCallback(
    async (notificationId: string) => {
      setNotifications((prev) => {
        const updated = prev.map((n) =>
          n.id === notificationId ? { ...n, read: true } : n
        );
        saveNotifications(updated);
        return updated;
      });
    },
    [saveNotifications]
  );

  const deleteNotification = useCallback(
    async (notificationId: string) => {
      setNotifications((prev) => {
        const updated = prev.filter((n) => n.id !== notificationId);
        saveNotifications(updated);
        return updated;
      });
    },
    [saveNotifications]
  );

  const createBooking = useCallback(
    async (booking: BookingRequest) => {
      const b: BookingRequest = {
        ...booking,
        slotKey: makeSlotKey(booking.date, booking.time),
        status: booking.status ?? "pending",
      };
      setBookings((prev) => {
        const updated = [...prev, b];
        saveBookings(updated);
        return updated;
      });

      const parentNotif: Notification = {
        id: nid(),
        type: "booking_success_parent",
        title: "Booking successful",
        description:
          "Your booking was successful. We will assign a tutor soon — you’ll get another update when they accept.",
        userId: b.parentId,
        senderId: "system",
        role: "parent",
        bookingId: b.id,
        parentId: b.parentId,
        childName: b.childName,
        subject: b.subject,
        date: b.date,
        time: b.time,
        createdAt: new Date().toISOString(),
        read: false,
      };
      await addNotification(parentNotif);

      const adminNotif: Notification = {
        id: nid(),
        type: "admin_new_booking",
        title: "New booking — assign mentor",
        description: `${b.parentName} • ${b.subject} • ${b.hours}h • ${b.contact} • ${b.address ?? "—"}`,
        userId: ADMIN_USER_ID,
        senderId: b.parentId,
        role: "admin",
        bookingId: b.id,
        parentId: b.parentId,
        childName: b.childName,
        subject: b.subject,
        date: b.date,
        time: b.time,
        createdAt: new Date().toISOString(),
        read: false,
      };
      await addNotification(adminNotif);

      // Auto-assign: pick a random active mentor who is free for this slot.
      try {
        const users = await listUsers();
        const mentors = users.filter((u) => u.role === "mentor" && u.isActive !== false);
        const availableMentors = mentors.filter((m) =>
          !bookings.some(
            (x) =>
              (x.slotKey ?? makeSlotKey(x.date, x.time)) === b.slotKey &&
              x.assignedTeacherId?.toLowerCase() === m.email.toLowerCase() &&
              ["assigned", "accepted", "in_progress", "confirmed"].includes(x.status)
          )
        );

        if (availableMentors.length === 0) {
          await addNotification({
            id: nid(),
            type: "booking_success_parent",
            title: "Mentor will assign soon",
            description:
              "All mentors are currently busy for this slot. We will assign a mentor shortly.",
            userId: b.parentId,
            senderId: "system",
            role: "parent",
            bookingId: b.id,
            parentId: b.parentId,
            childName: b.childName,
            subject: b.subject,
            date: b.date,
            time: b.time,
            createdAt: new Date().toISOString(),
            read: false,
          });
          return;
        }

        const pick =
          availableMentors[Math.floor(Math.random() * availableMentors.length)];

        setBookings((prev) => {
          const updated = prev.map((row) =>
            row.id === b.id
              ? {
                  ...row,
                  status: "assigned" as const,
                  assignedTeacherId: pick.email.toLowerCase(),
                  mentorEmail: pick.email.toLowerCase(),
                  mentorName: pick.fullName,
                }
              : row
          );
          saveBookings(updated);
          return updated;
        });

        await addNotification({
          id: nid(),
          type: "mentor_assignment",
          title: "New session request",
          description: `Parent: ${b.parentName} • ${b.subject} • ${b.hours}h • ₹${b.price ?? "—"} • 📍 ${b.address ?? "—"} • 📞 ${b.contact}.`,
          userId: pick.email.toLowerCase(),
          senderId: ADMIN_USER_ID,
          role: "teacher",
          bookingId: b.id,
          parentId: b.parentId,
          childName: b.childName,
          subject: b.subject,
          date: b.date,
          time: b.time,
          createdAt: new Date().toISOString(),
          read: false,
          action: null,
        });

        await addNotification({
          id: nid(),
          type: "mentor_assigned_parent",
          title: "Mentor assigned",
          description: `${pick.fullName} has been assigned. Waiting for mentor acceptance.`,
          userId: b.parentId,
          senderId: pick.email.toLowerCase(),
          role: "parent",
          bookingId: b.id,
          teacherId: pick.email.toLowerCase(),
          subject: b.subject,
          date: b.date,
          time: b.time,
          createdAt: new Date().toISOString(),
          read: false,
        });
      } catch {
        await addNotification({
          id: nid(),
          type: "booking_success_parent",
          title: "Mentor will assign soon",
          description:
            "Your booking is successful. We are assigning a mentor and will update you soon.",
          userId: b.parentId,
          senderId: "system",
          role: "parent",
          bookingId: b.id,
          createdAt: new Date().toISOString(),
          read: false,
        });
      }
    },
    [addNotification, bookings, saveBookings]
  );

  const assignTeacher = useCallback(
    async (bookingId: string, mentorEmail: string, mentorName: string) => {
      const b = bookings.find((x) => x.id === bookingId);
      if (!b) return { ok: false, error: "Booking not found" };

      const slotKey = b.slotKey ?? makeSlotKey(b.date, b.time);
      const mentorBusy = bookings.some(
        (x) =>
          x.id !== bookingId &&
          (x.slotKey ?? makeSlotKey(x.date, x.time)) === slotKey &&
          x.assignedTeacherId?.toLowerCase() === mentorEmail.toLowerCase() &&
          ["assigned", "accepted", "in_progress", "confirmed"].includes(x.status)
      );
      if (mentorBusy) {
        return {
          ok: false,
          error: "This mentor is already busy for this time slot.",
        };
      }

      setBookings((prev) => {
        const updated = prev.map((row) =>
          row.id === bookingId
            ? {
                ...row,
                status: "assigned" as const,
                assignedTeacherId: mentorEmail.toLowerCase(),
                mentorEmail: mentorEmail.toLowerCase(),
                mentorName,
              }
            : row
        );
        saveBookings(updated);
        return updated;
      });

      const mentorNotif: Notification = {
        id: nid(),
        type: "mentor_assignment",
        title: "Admin assigned you a parent booking",
        description: `From Admin: ${b.parentName} • ${b.subject} • ₹${b.price ?? "—"} • 📍 ${b.address ?? "—"} • 📞 ${b.contact}. Expand and Accept/Reject.`,
        userId: mentorEmail.toLowerCase(),
        senderId: ADMIN_USER_ID,
        role: "teacher",
        bookingId,
        parentId: b.parentId,
        childName: b.childName,
        subject: b.subject,
        date: b.date,
        time: b.time,
        createdAt: new Date().toISOString(),
        read: false,
        action: null,
      };
      await addNotification(mentorNotif);

      const parentNotif: Notification = {
        id: nid(),
        type: "mentor_assigned_parent",
        title: "Tutor assigned",
        description: `${mentorName} has been chosen for your session. Waiting for them to accept your request…`,
        userId: b.parentId,
        senderId: mentorEmail,
        role: "parent",
        bookingId,
        teacherId: mentorEmail,
        subject: b.subject,
        date: b.date,
        time: b.time,
        createdAt: new Date().toISOString(),
        read: false,
      };
      await addNotification(parentNotif);
      return { ok: true };
    },
    [addNotification, bookings, saveBookings]
  );

  const acceptBooking = useCallback(
    async (bookingId: string, teacherId: string) => {
      const booking = bookings.find((x) => x.id === bookingId);
      if (!booking) return;

      const code = generateAttendanceCode();
      const mentorName =
        booking.mentorName ?? booking.assignedTeacherId ?? teacherId;

      setBookings((prev) => {
        const updated = prev.map((b) =>
          b.id === bookingId
            ? {
                ...b,
                status: "accepted" as const,
                assignedTeacherId: teacherId.toLowerCase(),
                mentorEmail: teacherId.toLowerCase(),
                mentorRating: b.mentorRating ?? 4.8,
                attendanceCode: code,
              }
            : b
        );
        saveBookings(updated);
        return updated;
      });

      const parentNotif: Notification = {
        id: nid(),
        type: "teacher_accepted",
        title: "Tutor accepted",
        description: `${mentorName} accepted your request. Live tracking is now enabled. Attendance code: ${code}.`,
        userId: booking.parentId,
        senderId: teacherId,
        role: "parent",
        bookingId,
        teacherId,
        childName: booking.childName,
        subject: booking.subject,
        date: booking.date,
        time: booking.time,
        createdAt: new Date().toISOString(),
        read: false,
      };
      await addNotification(parentNotif);

      const adminNotif: Notification = {
        id: nid(),
        type: "mentor_accepted_admin",
        title: "Mentor accepted",
        description: `${mentorName} has accepted the request for ${booking.parentName} • ${booking.subject} • ${booking.date} ${booking.time}.`,
        userId: ADMIN_USER_ID,
        senderId: teacherId,
        role: "admin",
        bookingId,
        teacherId,
        createdAt: new Date().toISOString(),
        read: false,
      };
      await addNotification(adminNotif);
    },
    [addNotification, bookings, saveBookings]
  );

  const rejectBooking = useCallback(
    async (bookingId: string, teacherId: string) => {
      const booking = bookings.find((x) => x.id === bookingId);
      setBookings((prev) => {
        const updated = prev.map((b) =>
          b.id === bookingId
            ? {
                ...b,
                status: "pending" as const,
                assignedTeacherId: undefined,
                mentorEmail: undefined,
                mentorName: undefined,
              }
            : b
        );
        saveBookings(updated);
        return updated;
      });

      await addNotification({
        id: nid(),
        type: "teacher_rejected",
        title: "Mentor rejected",
        description: `${teacherId} has rejected ${
          booking?.parentName ?? "this parent"
        } • ${booking?.subject ?? "session"}. Kindly assign new mentor soon.`,
        userId: ADMIN_USER_ID,
        senderId: teacherId,
        role: "admin",
        bookingId,
        teacherId,
        createdAt: new Date().toISOString(),
        read: false,
      });
    },
    [addNotification, bookings, saveBookings]
  );

  const getBookingById = useCallback(
    (bookingId: string) => bookings.find((b) => b.id === bookingId),
    [bookings]
  );

  const getBookingsForParent = useCallback(
    (parentEmail: string) =>
      bookings.filter(
        (b) => b.parentId.toLowerCase() === parentEmail.toLowerCase()
      ),
    [bookings]
  );

  const getBookingsForMentor = useCallback(
    (mentorEmail: string) =>
      bookings.filter(
        (b) =>
          b.assignedTeacherId?.toLowerCase() === mentorEmail.toLowerCase() &&
          ["assigned", "accepted", "confirmed", "in_progress", "completed"].includes(
            b.status
          )
      ),
    [bookings]
  );

  const markAttendance = useCallback(
    async (bookingId: string, mentorEmail: string, code: string) => {
      const booking = bookings.find((x) => x.id === bookingId);
      if (
        !booking ||
        booking.assignedTeacherId?.toLowerCase() !== mentorEmail.toLowerCase()
      ) {
        return false;
      }
      if (
        booking.attendanceCode?.toUpperCase() !== code.trim().toUpperCase()
      ) {
        return false;
      }

      setBookings((prev) => {
        const updated = prev.map((x) =>
          x.id === bookingId
            ? {
                ...x,
                attendanceMarkedAt: new Date().toISOString(),
                status: "in_progress" as const,
              }
            : x
        );
        saveBookings(updated);
        return updated;
      });

      await addNotification({
        id: nid(),
        type: "attendance_marked_admin",
        title: "Attendance verified",
        description: `${mentorEmail} reached ${booking.parentName}'s location and marked attendance for ${booking.subject}.`,
        userId: ADMIN_USER_ID,
        senderId: mentorEmail,
        role: "admin",
        bookingId,
        createdAt: new Date().toISOString(),
        read: false,
      });
      return true;
    },
    [addNotification, bookings, saveBookings]
  );

  const startSession = useCallback(
    async (bookingId: string) => {
      setBookings((prev) => {
        const updated = prev.map((b) =>
          b.id === bookingId
            ? {
                ...b,
                sessionStartedAt: new Date().toISOString(),
                status: "in_progress" as const,
              }
            : b
        );
        saveBookings(updated);
        return updated;
      });
    },
    [saveBookings]
  );

  const completeBooking = useCallback(
    async (bookingId: string) => {
      const b = bookings.find((x) => x.id === bookingId);
      setBookings((prev) => {
        const updated = prev.map((row) =>
          row.id === bookingId
            ? {
                ...row,
                completedAt: new Date().toISOString(),
                status: "completed" as const,
              }
            : row
        );
        saveBookings(updated);
        return updated;
      });
      if (b) {
        await addNotification({
          id: nid(),
          type: "rate_mentor_reminder",
          title: "Rate your mentor",
          description: `How was ${b.mentorName ?? "your mentor"} for ${b.subject}?`,
          userId: b.parentId,
          senderId: "system",
          role: "parent",
          bookingId,
          createdAt: new Date().toISOString(),
          read: false,
        });
      }
    },
    [addNotification, bookings, saveBookings]
  );

  const rateBooking = useCallback(
    async (bookingId: string, stars: number) => {
      setBookings((prev) => {
        const updated = prev.map((b) =>
          b.id === bookingId ? { ...b, parentRating: stars } : b
        );
        saveBookings(updated);
        return updated;
      });
    },
    [saveBookings]
  );

  const sendNearArrivalCodeToParent = useCallback(
    async (bookingId: string) => {
      const b = bookings.find((x) => x.id === bookingId);
      if (!b?.attendanceCode) return;
      const n: Notification = {
        id: nid(),
        type: "attendance_code_parent",
        title: "Mentor is almost there",
        description: `Hey ${b.parentName}, This is Attendance code **${b.attendanceCode}**. Please provide the mentor so they can mark attendance. Thank you — Admin.`,
        userId: b.parentId,
        senderId: b.assignedTeacherId ?? "mentor",
        role: "parent",
        bookingId,
        createdAt: new Date().toISOString(),
        read: false,
      };
      await addNotification(n);
    },
    [addNotification, bookings]
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  const value: NotificationContextType = {
    notifications,
    bookings,
    unreadCount,
    addNotification,
    markAsRead,
    deleteNotification,
    acceptBooking,
    rejectBooking,
    createBooking,
    assignTeacher,
    getBookingById,
    getBookingsForParent,
    getBookingsForMentor,
    markAttendance,
    startSession,
    completeBooking,
    rateBooking,
    sendNearArrivalCodeToParent,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
