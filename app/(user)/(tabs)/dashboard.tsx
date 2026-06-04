// import { useEffect, useState } from "react";
// import {
//   Alert,
//   FlatList,
//   StyleSheet,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   View,
// } from "react-native";

// type Slot = {
//   id: string;
//   booked: boolean;
// };

// type Parking = {
//   id: string;
//   name: string;
//   area: string;
//   price: number;
//   distance: number;
//   slots: Slot[];
// };

// const DATA: Parking[] = [
//   {
//     id: "1",
//     name: "Thamel Central Parking",
//     area: "Thamel",
//     price: 50,
//     distance: 0.6,
//     slots: [
//       { id: "A1", booked: false },
//       { id: "A2", booked: false },
//       { id: "A3", booked: true },
//     ],
//   },
//   {
//     id: "2",
//     name: "New Road City Parking",
//     area: "New Road",
//     price: 40,
//     distance: 1.4,
//     slots: [
//       { id: "B1", booked: false },
//       { id: "B2", booked: false },
//     ],
//   },
// ];

// export default function Dashboard() {
//   const [expandedId, setExpandedId] = useState<string | null>(null);
//   const [activeSlot, setActiveSlot] = useState<string | null>(null);
//   const [seconds, setSeconds] = useState(0);
//   const [search, setSearch] = useState("");

//   const [showFilter, setShowFilter] = useState(false);
//   const [maxDistance, setMaxDistance] = useState<number | null>(null);
//   const [maxPrice, setMaxPrice] = useState<number | null>(null);

//   // Timer
//   useEffect(() => {
//     let timer: any;
//     if (activeSlot) {
//       timer = setInterval(() => setSeconds((s) => s + 1), 1000);
//     } else {
//       setSeconds(0);
//     }
//     return () => clearInterval(timer);
//   }, [activeSlot]);

//   // convert 1234 to 1:11:11
//   const formatTime = (s: number) => {
//     const h = Math.floor(s / 3600);
//     const m = Math.floor((s % 3600) / 60);
//     const sec = s % 60;
//     return `${h.toString().padStart(2, "0")}:${m
//       .toString()
//       .padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
//   };

  
//   const confirmBooking = (parking: Parking, slotId: string) => {
//     Alert.alert(
//       "Confirm Parking",
//       `${parking.name}\nSlot: ${slotId}\nRs. ${parking.price}/hr`,
//       [
//         { text: "Cancel", style: "cancel" },
//         {
//           text: "Confirm",
//           onPress: () => setActiveSlot(slotId),
//         },
//       ]
//     );
//   };

//   // Filter + Search
//   const filteredData = DATA.filter(
//     (p) =>
//       (p.name.toLowerCase().includes(search.toLowerCase()) ||
//         p.area.toLowerCase().includes(search.toLowerCase())) &&
//       (maxDistance === null || p.distance <= maxDistance) &&
//       (maxPrice === null || p.price <= maxPrice)
//   );

//   return (
//     <View style={styles.container}>
//       <View style={styles.headerRow}>
//         <Text style={styles.header}>Nearby Parking</Text>
//         <TouchableOpacity
//           onPress={() => setShowFilter(!showFilter)}
//           style={styles.menuBtn}
//         >
//           <Text style={{ fontSize: 22 }}>☰</Text>
//         </TouchableOpacity>
//       </View>

//       {/* Search */}
//       <TextInput
//         placeholder="Search by area or parking name"
//         value={search}
//         onChangeText={setSearch}
//         style={styles.search}
//       />

//       {/* Filter Menu */}
//       {showFilter && (
//         <View style={styles.filterBox}>
//           <Text style={styles.filterTitle}>Filter</Text>

//           {/* Distance */}
//           <Text style={styles.filterLabel}>Distance (km)</Text>
//           <View style={styles.row}>
//             <FilterButton label="1 km" onPress={() => setMaxDistance(1)} />
//             <FilterButton label="2 km" onPress={() => setMaxDistance(2)} />
//             <FilterButton label="All" onPress={() => setMaxDistance(null)} />
//           </View>

//           {/* Price */}
//           <Text style={styles.filterLabel}>Max Price (Rs/hr)</Text>
//           <View style={styles.row}>
//             <FilterButton label="30" onPress={() => setMaxPrice(30)} />
//             <FilterButton label="40" onPress={() => setMaxPrice(40)} />
//             <FilterButton label="All" onPress={() => setMaxPrice(null)} />
//           </View>
//         </View>
//       )}

//       {/* Active parking bar */}
//       {activeSlot && (
//         <View style={styles.activeBar}>
//           <Text style={styles.activeText}>
//             Active Parking • {formatTime(seconds)}
//           </Text>
//         </View>
//       )}

//       {/* Parking List */}
//       <FlatList
//         data={filteredData}
//         keyExtractor={(item) => item.id}
//         ListEmptyComponent={
//           <Text style={styles.empty}>No parking found</Text>
//         }
//         renderItem={({ item }) => {
//           const expanded = expandedId === item.id;
//           const available = item.slots.filter((s) => !s.booked).length;

//           return (
//             <View style={styles.card}>
//               {/* Card header */}
//               <TouchableOpacity
//                 activeOpacity={0.8}
//                 onPress={() =>
//                   setExpandedId(expanded ? null : item.id)
//                 }
//               >
//                 <View style={styles.cardTop}>
//                   <Text style={styles.cardTitle}>{item.name}</Text>
//                   <Text style={styles.price}>Rs. {item.price}/hr</Text>
//                 </View>

//                 <Text style={styles.sub}>
//                   {item.area} • {item.distance} km away
//                 </Text>

//                 <Text
//                   style={[
//                     styles.availability,
//                     available === 0 && { color: "#d32f2f" },
//                   ]}
//                 >
//                   {available} slots available
//                 </Text>
//               </TouchableOpacity>

//               {/* Slots */}
//               {expanded && (
//                 <View style={styles.slotGrid}>
//                   {item.slots.map((slot) => (
//                     <TouchableOpacity
//                       key={slot.id}
//                       disabled={slot.booked || !!activeSlot}
//                       style={[
//                         styles.slot,
//                         slot.booked && styles.slotBooked,
//                       ]}
//                       onPress={() => confirmBooking(item, slot.id)}
//                     >
//                       <Text style={styles.slotText}>{slot.id}</Text>
//                     </TouchableOpacity>
//                   ))}
//                 </View>
//               )}
//             </View>
//           );
//         }}
//       />
//     </View>
//   );
// }

// // Small filter button
// const FilterButton = ({ label, onPress }: { label: string; onPress: () => void }) => (
//   <TouchableOpacity style={styles.filterBtn} onPress={onPress}>
//     <Text>{label}</Text>
//   </TouchableOpacity>
// );

// const styles = StyleSheet.create({
//   container: { flex: 1, padding: 16, backgroundColor: "#f4f6f8" },
//   headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
//   header: { fontSize: 22, fontWeight: "600", marginBottom: 10 },
//   menuBtn: { padding: 6 },
//   search: {
//     backgroundColor: "#fff",
//     padding: 12,
//     borderRadius: 10,
//     marginBottom: 10,
//     borderWidth: 1,
//     borderColor: "#ddd",
//   },
//   filterBox: {
//     backgroundColor: "#f0f0f0",
//     padding: 12,
//     borderRadius: 10,
//     marginBottom: 12,
//   },
//   filterTitle: { fontSize: 16, fontWeight: "600", marginBottom: 6 },
//   filterLabel: { marginTop: 8, marginBottom: 4, fontWeight: "500" },
//   row: { flexDirection: "row", gap: 10 },
//   filterBtn: {
//     borderWidth: 1,
//     borderColor: "#ccc",
//     paddingVertical: 6,
//     paddingHorizontal: 12,
//     borderRadius: 6,
//   },
//   activeBar: {
//     backgroundColor: "#1b5e20",
//     padding: 10,
//     borderRadius: 8,
//     marginBottom: 10,
//   },
//   activeText: { color: "#fff", textAlign: "center", fontWeight: "600" },
//   card: { backgroundColor: "#fff", padding: 14, borderRadius: 14, marginBottom: 14, elevation: 2 },
//   cardTop: { flexDirection: "row", justifyContent: "space-between" },
//   cardTitle: { fontSize: 16, fontWeight: "600", flex: 1 },
//   price: { fontWeight: "600", color: "#2e7d32" },
//   sub: { marginTop: 4, color: "#555" },
//   availability: { marginTop: 6, fontWeight: "500", color: "#2e7d32" },
//   slotGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 12 },
//   slot: { width: 60, height: 40, borderRadius: 8, backgroundColor: "#2e7d32", justifyContent: "center", alignItems: "center" },
//   slotBooked: { backgroundColor: "#bdbdbd" },
//   slotText: { color: "#fff", fontWeight: "600" },
//   empty: { textAlign: "center", marginTop: 30, color: "#777" },
// });
