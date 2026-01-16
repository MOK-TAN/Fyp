import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

type Slot = {
  id: string;
  status: "available" | "occupied" | "reserved";
  occupiedBy?: string; // customer name
  paid?: boolean;
  timer?: number; // seconds used if occupied
};

type PastCustomer = {
  name: string;
  slotId: string;
  duration: number; // seconds parked
  paid: boolean;
};

type Parking = {
  id: string;
  name: string;
  location: string;
  slots: Slot[];
  pastCustomers: PastCustomer[];
};

// Dummy data
const parkingLots: Parking[] = [
  {
    id: "1",
    name: "Thamel Parking Lot",
    location: "Thamel, Kathmandu",
    slots: [
      { id: "A1", status: "occupied", occupiedBy: "Ramesh", paid: true, timer: 300 },
      { id: "A2", status: "available" },
      { id: "A3", status: "reserved" },
      { id: "A4", status: "occupied", occupiedBy: "Sita", paid: false, timer: 1200 },
    ],
    pastCustomers: [
      { name: "Hari", slotId: "A5", duration: 1800, paid: true },
      { name: "Maya", slotId: "A6", duration: 900, paid: true },
    ],
  },
  {
    id: "2",
    name: "New Road Parking",
    location: "New Road, Kathmandu",
    slots: [
      { id: "B1", status: "available" },
      { id: "B2", status: "occupied", occupiedBy: "Mohan", paid: true, timer: 600 },
      { id: "B3", status: "available" },
    ],
    pastCustomers: [
      { name: "Sushil", slotId: "B4", duration: 1200, paid: true },
    ],
  },
];

export default function OwnerDashboard() {
  const [lots, setLots] = useState(parkingLots);

  // Timer update for occupied slots
  useEffect(() => {
    const interval = setInterval(() => {
      setLots((prev) =>
        prev.map((lot) => ({
          ...lot,
          slots: lot.slots?.map((slot) =>
            slot.status === "occupied"
              ? { ...slot, timer: (slot.timer ?? 0) + 1 }
              : slot
          ) ?? [],
        }))
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h.toString().padStart(2, "0")}:${m
      .toString()
      .padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Parking Owner Dashboard</Text>

      {lots.map((lot) => {
        const occupiedSlots = lot.slots?.filter((s) => s.status === "occupied").length ?? 0;

        return (
          <View key={lot.id} style={styles.card}>
            {/* Parking lot info */}
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{lot.name}</Text>
              <Text style={styles.cardSub}>
                {lot.location} • {occupiedSlots}/{lot.slots?.length ?? 0} occupied
              </Text>
            </View>

            {/* Active Slots */}
            <Text style={styles.sectionTitle}>Active Customers</Text>
            <View style={styles.slotsContainer}>
              {lot.slots?.map(
                (slot) =>
                  slot.status === "occupied" && (
                    <View key={slot.id} style={[styles.slot, styles.occupied]}>
                      <Text style={styles.slotText}>{slot.id}</Text>
                      <Text style={styles.timer}>{formatTime(slot.timer ?? 0)}</Text>
                      <Text style={styles.customer}>
                        {slot.occupiedBy} {slot.paid ? "💰" : ""}
                      </Text>
                    </View>
                  )
              )}
            </View>

            {/* Past Customers */}
            <Text style={styles.sectionTitle}>Past Customers</Text>
            <View style={styles.slotsContainer}>
              {lot.pastCustomers?.map((customer, idx) => (
                <View key={idx} style={[styles.slot, styles.past]}>
                  <Text style={styles.slotText}>{customer.slotId}</Text>
                  <Text style={styles.customer}>{customer.name}</Text>
                  <Text style={styles.timer}>{formatTime(customer.duration)}</Text>
                  <Text style={styles.paid}>{customer.paid ? "💰 Paid" : "❌ Unpaid"}</Text>
                </View>
              ))}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f4f6f8" },
  header: { fontSize: 22, fontWeight: "600", marginBottom: 12 },

  card: { backgroundColor: "#fff", padding: 14, borderRadius: 12, marginBottom: 16, elevation: 2 },
  cardHeader: { marginBottom: 10 },
  cardTitle: { fontSize: 18, fontWeight: "600" },
  cardSub: { fontSize: 14, color: "#555", marginTop: 2 },

  sectionTitle: { fontSize: 16, fontWeight: "600", marginTop: 10, marginBottom: 6 },

  slotsContainer: { flexDirection: "row", flexWrap: "wrap", gap: 10 },

  slot: {
    width: 80,
    height: 80,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    padding: 6,
  },
  slotText: { fontWeight: "600", color: "#fff" },
  timer: { fontSize: 10, color: "#fff", marginTop: 2 },
  customer: { fontSize: 12, color: "#fff", marginTop: 2 },
  paid: { fontSize: 10, color: "#fff", marginTop: 2 },

  occupied: { backgroundColor: "#E53935" },
  past: { backgroundColor: "#4CAF50" },
});
