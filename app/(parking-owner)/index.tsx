import React, { useState } from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function OwnerDashboard() {
  // Parking slots
  const [slots, setSlots] = useState([
    { id: "1", name: "Slot A1", available: true },
    { id: "2", name: "Slot A2", available: false },
    { id: "3", name: "Slot B1", available: true },
  ]);

  // Booking requests
  const [bookings, setBookings] = useState([
    {
      id: "101",
      user: "John Doe",
      slotId: "1",
      status: "pending",
    },
  ]);

  // Toggle slot availability
  const toggleSlot = (slotId) => {
    setSlots((prev) =>
      prev.map((slot) =>
        slot.id === slotId
          ? { ...slot, available: !slot.available }
          : slot
      )
    );
  };

  // Accept booking
  const acceptBooking = (bookingId, slotId) => {
    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId ? { ...b, status: "accepted" } : b
      )
    );

    setSlots((prev) =>
      prev.map((s) =>
        s.id === slotId ? { ...s, available: false } : s
      )
    );

    Alert.alert("Booking Accepted", "Slot reserved successfully");
  };

  // Decline booking
  const declineBooking = (bookingId) => {
    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId ? { ...b, status: "declined" } : b
      )
    );

    Alert.alert("Booking Declined");
  };

  // Render parking slot
  const renderSlot = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.title}>{item.name}</Text>
      <Text style={{ color: item.available ? "green" : "red" }}>
        {item.available ? "Available" : "Occupied"}
      </Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => toggleSlot(item.id)}
      >
        <Text style={styles.buttonText}>Toggle Status</Text>
      </TouchableOpacity>
    </View>
  );

  // Render booking request
  const renderBooking = ({ item }) => {
    if (item.status !== "pending") return null;

    return (
      <View style={styles.card}>
        <Text style={styles.title}>Booking Request</Text>
        <Text>User: {item.user}</Text>
        <Text>Slot ID: {item.slotId}</Text>

        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: "green" }]}
            onPress={() => acceptBooking(item.id, item.slotId)}
          >
            <Text style={styles.buttonText}>Accept</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: "red" }]}
            onPress={() => declineBooking(item.id)}
          >
            <Text style={styles.buttonText}>Decline</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>🚗 Parking Owner Dashboard</Text>

      <Text style={styles.section}>Booking Requests</Text>
      <FlatList
        data={bookings}
        keyExtractor={(item) => item.id}
        renderItem={renderBooking}
      />

      <Text style={styles.section}>Parking Slots</Text>
      <FlatList
        data={slots}
        keyExtractor={(item) => item.id}
        renderItem={renderSlot}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
  },
  section: {
    fontSize: 18,
    marginVertical: 8,
    fontWeight: "600",
  },
  card: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 8,
    marginVertical: 6,
    elevation: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
  },
  button: {
    marginTop: 8,
    backgroundColor: "#007bff",
    padding: 10,
    borderRadius: 6,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
});
