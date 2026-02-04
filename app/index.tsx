import { router } from "expo-router";
import { useState } from "react";
import { Dimensions, Image, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const { width } = Dimensions.get("window");

const slides = [
  {
    image: require("../assets/images/car.png"),
    title: "Welcome",
    subtitle: "Easily find the best parking spot near you.",
  },
  {
    image: require("../assets/images/booking.png"),
    title: "Search & Book",
    subtitle: "Find and reserve parking in seconds",
  },
  {
    image: require("../assets/images/location.png"),
    title: "Smart & Secure",
    subtitle: "Manage your parking with ease",
  },
];

export default function WelcomeScreen() {
  const [index, setIndex] = useState(0);
  const slide = slides[index];

  return (

    

    <View style={styles.container}>
      

       {/* TEMP TEST BUTTON */}

        <TouchableOpacity
        style={{
          flex: 1,
          backgroundColor: '#22C55E',
          paddingVertical: 10,
          borderRadius: 8,
          alignItems: 'center',
        }}
        onPress={() => {
          router.push({
            pathname: '/(user)/bookings/review-booking',
            params: {
              parkingId: '1',
              parkingName: 'New Road Parking',
              pricePerHour: '50',
            }
          });
        }}
      >
        <Text style={{ color: '#fff', fontSize: 11, fontWeight: 'bold' }}>1.Date</Text>
      </TouchableOpacity>


      {/* Swipe Area - Only for Image Section */}
      <Pressable 
        style={styles.imageSwipeArea}
        onPress={() => setIndex((prev) => (prev === slides.length - 1 ? 0 : prev + 1))}
      >
        {/* Image */}
        <Image source={slide.image} style={styles.image} resizeMode="contain" />

        {/* Text */}
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.subtitle}>{slide.subtitle}</Text>

        {/* Dots */}
        <View style={styles.dots}>
          {slides.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === index && styles.activeDot]}
            />
          ))}
        </View>
      </Pressable>

      {/* Buttons - These are now outside the swipe area */}
      <Pressable 
        style={styles.loginBtn} 
        onPress={() => {
          console.log('Login button pressed');
          router.push("/(auth)/login");
        }}
      >
        <Text style={styles.loginText}>LOGIN</Text>
      </Pressable>

      <Pressable 
        style={styles.signupBtn} 
        onPress={() => {
          console.log('Signup button pressed');
          router.push("/(auth)/signup");
        }}
      >
        <Text style={styles.signupText}>SIGN UP</Text>
      </Pressable>

      {/* Social */}
      <View style={styles.socialRow}>
        <Text style={styles.socialText}>Find us</Text>
        <Text style={styles.socialIcon}>ⓕ</Text>
        <Text style={styles.socialIcon}>ⓘ</Text>
        <Text style={styles.socialIcon}>▶</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  imageSwipeArea: {
    alignItems: "center",
    width: "100%",
  },
  image: {
    width: width * 0.6,
    height: 200,
    marginTop: 80,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    marginTop: 24,
    color: "#0F172A",
  },
  subtitle: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    marginTop: 8,
    maxWidth: 260,
  },
  dots: {
    flexDirection: "row",
    marginTop: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E5E7EB",
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: "#16A34A",
  },
  loginBtn: {
    backgroundColor: "#16A34A",
    width: "100%",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 40,
    zIndex: 10, // Ensure button is on top
  },
  loginText: {
    color: "#FFFFFF",
    fontWeight: "700",
    letterSpacing: 1,
  },
  signupBtn: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    width: "100%",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 14,
    zIndex: 10, // Ensure button is on top
  },
  signupText: {
    color: "#0F172A",
    fontWeight: "600",
    letterSpacing: 1,
  },
  socialRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 40,
    zIndex: 10, // Ensure social icons are on top
  },
  socialText: {
    marginRight: 10,
    color: "#0F172A",
    fontWeight: "500",
  },
  socialIcon: {
    fontSize: 18,
    marginHorizontal: 6,
  },
});


//work
// import { router } from "expo-router";
// import { useState } from "react";
// import { Button, Dimensions, Image, Pressable, StyleSheet, Text, View } from "react-native";

// const { width } = Dimensions.get("window");

// const slides = [
//   {
//     image: require("../assets/images/car.png"),
//     title: "Welcome",
//     subtitle: "Easily find the best parking spot near you.",
//   },
//   {
//     image: require("../assets/images/booking.png"),
//     title: "Search & Book",
//     subtitle: "Find and reserve parking in seconds",
//   },
//   {
//     image: require("../assets/images/location.png"),
//     title: "Smart & Secure",
//     subtitle: "Manage your parking with ease",
//   },
// ];

// export default function WelcomeScreen() {
//   const [index, setIndex] = useState(0);
//   const slide = slides[index];

//   return (
//     <View style={styles.container}>
//       {/* Image */}
//       <Image source={slide.image} style={styles.image} resizeMode="contain" />

//       {/* Text */}
//       <Text style={styles.title}>{slide.title}</Text>
//       <Text style={styles.subtitle}>{slide.subtitle}</Text>

//       {/* Dots */}
//       <View style={styles.dots}>
//         {slides.map((_, i) => (
//           <View
//             key={i}
//             style={[styles.dot, i === index && styles.activeDot]}
//           />
//         ))}
//       </View>

//       {/* Buttons */}

//         <Button  
//         title="Login"
//         onPress={() => {
//           // Navigate to different dashboards based on role
//           router.push("/(auth)/login")
//         }}
//       />


//       <Pressable style={styles.loginBtn} onPress={() => router.push("/(auth)/login")}>
//         <Text style={styles.loginText}>LOGIN</Text>
//       </Pressable>

//       <Pressable style={styles.signupBtn} onPress={() => router.push("/(auth)/signup")}>
//         <Text style={styles.signupText}>SIGN UP</Text>
//       </Pressable>

//       {/* Social */}
//       <View style={styles.socialRow}>
//         <Text style={styles.socialText}>Find us</Text>
//         <Text style={styles.socialIcon}>ⓕ</Text>
//         <Text style={styles.socialIcon}>ⓘ</Text>
//         <Text style={styles.socialIcon}>▶</Text>
//       </View>

//       {/* Swipe Area */}
//       <View style={styles.swipeArea}>
//         <Pressable
//           style={{ flex: 1 }}
//           onPress={() => setIndex((prev) => (prev === 0 ? prev : prev - 1))}
//         />
//         <Pressable
//           style={{ flex: 1 }}
//           onPress={() => setIndex((prev) => (prev === slides.length - 1 ? prev : prev + 1))}
//         />
//       </View>
//     </View>
//   );
// }




// const styles = StyleSheet.create({
//     container: {
//     flex: 1,
//     backgroundColor: "#FFFFFF",
//     alignItems: "center",
//     paddingHorizontal: 24,
//   },
//   image: {
//     width: width * 0.6,
//     height: 200,
//     marginTop: 80,
//   },
//   title: {
//     fontSize: 26,
//     fontWeight: "700",
//     marginTop: 24,
//     color: "#0F172A",
//   },
//   subtitle: {
//     fontSize: 14,
//     color: "#64748B",
//     textAlign: "center",
//     marginTop: 8,
//     maxWidth: 260,
//   },
//   dots: {
//     flexDirection: "row",
//     marginTop: 20,
//   },
//   dot: {
//     width: 8,
//     height: 8,
//     borderRadius: 4,
//     backgroundColor: "#E5E7EB",
//     marginHorizontal: 4,
//   },
//   activeDot: {
//     backgroundColor: "#16A34A",
//   },
//   loginBtn: {
//     backgroundColor: "#16A34A",
//     width: "100%",
//     paddingVertical: 14,
//     borderRadius: 14,
//     alignItems: "center",
//     marginTop: 40,
//   },
//   loginText: {
//     color: "#FFFFFF",
//     fontWeight: "700",
//     letterSpacing: 1,
//   },
//   signupBtn: {
//     borderWidth: 1,
//     borderColor: "#CBD5E1",
//     width: "100%",
//     paddingVertical: 14,
//     borderRadius: 14,
//     alignItems: "center",
//     marginTop: 14,
//   },
//   signupText: {
//     color: "#0F172A",
//     fontWeight: "600",
//     letterSpacing: 1,
//   },
//   socialRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginTop: 40,
//   },
//   socialText: {
//     marginRight: 10,
//     color: "#0F172A",
//     fontWeight: "500",
//   },
//   socialIcon: {
//     fontSize: 18,
//     marginHorizontal: 6,
//   },
//   swipeArea: {
//     position: "absolute",
//     bottom: 0,
//     width: "100%",
//     height: "100%",
//     flexDirection: "row",
//   },
// });


// const styles = StyleSheet.create({

// });

 {/* Image */}
      



// import { router } from "expo-router";
// import { useState } from "react";
// import {
//   Button,
//   StyleSheet,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   View,
// } from "react-native";

// export default function Index() {
//   const [role, setRole] = useState<"user" | "parkingOwner" | "landOwner">("user");

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>Welcome to Smart Parking</Text>

      

//       {/* Phone Number */}
//       <TextInput
//         placeholder="Phone Number"
//         keyboardType="phone-pad"
//         style={styles.input}
//       />

//       {/* Password */}
//       <TextInput placeholder="Password" secureTextEntry style={styles.input} />

//       {/* Role Selection */}
//       <View style={styles.roleContainer}>
//         <TouchableOpacity
//           style={[styles.roleBtn, role === "user" && styles.activeRole]}
//           onPress={() => setRole("user")}
//         >
//           <Text style={styles.roleText}>User</Text>
//         </TouchableOpacity>

//         <TouchableOpacity
//           style={[styles.roleBtn, role === "parkingOwner" && styles.activeRole]}
//           onPress={() => setRole("parkingOwner")}
//         >
//           <Text style={styles.roleText}>Parking Owner</Text>
//         </TouchableOpacity>

     
//       </View>

//       {/* Login Button */}
//       <Button
//         title="Login"
//         onPress={() => {
//           // Navigate to different dashboards based on role
//           if (role === "user") router.push("/(user)/(tabs)/dashboard");
//           else if (role === "parkingOwner")
//             router.push("/(user)/(tabs)/parking");
//           else router.push("/(user)/(tabs)/dashboard");
//         }}
//       />

//       {/* Social Login */}
//       <Text style={styles.orText}>Or sign up with</Text>

//       <TouchableOpacity style={[styles.socialBtn, styles.google]}>
//         <Text style={styles.socialText}>Continue with Google</Text>
//       </TouchableOpacity>

//       <TouchableOpacity style={[styles.socialBtn, styles.twitter]}>
//         <Text style={styles.socialText}>Continue with Twitter</Text>
//       </TouchableOpacity>

//       <TouchableOpacity style={[styles.socialBtn, styles.facebook]}>
//         <Text style={styles.socialText}>Continue with Facebook</Text>
//       </TouchableOpacity>

//       {/* Create Account */}
//       <Text style={styles.link} onPress={() => router.push("/(auth)/signup")}>
//         Create Account
//       </Text>
//     </View>
//   );
// }
