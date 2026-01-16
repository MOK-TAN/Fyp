import { router } from "expo-router";
import { Button, Text, View } from "react-native";

export default function RoleSelect() {
  return (
    <View>
      <Text>Select Role</Text>

      <Button title="User" onPress={() => router.push("/(auth)/signup?role=user")} />
      <Button title="Land Owner" onPress={() => router.push("/(auth)/signup?role=land_owner")} />
      <Button title="Parking Owner" onPress={() => router.push("/(auth)/signup?role=parking_owner")} />
    </View>
  );
}
