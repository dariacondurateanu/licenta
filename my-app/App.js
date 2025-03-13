import { createStackNavigator } from "@react-navigation/stack";
import { NavigationContainer } from "@react-navigation/native";
import HomeScreen from "./HomeScreen";
import RegisterScreen from "./RegisterScreen";
import LoginScreen from "./LoginScreen";
import LocationsListScreen from "./LocationsListScreen";
import LocationsDetailsScreen from "./LocationsDetailsScreen";
import ReviewScreen from "./ReviewScreen";
import MenuScreen from "./MenuScreen";
const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="LocationsList" component={LocationsListScreen} />
        <Stack.Screen name="LocationDetails" component={LocationsDetailsScreen} />
        <Stack.Screen name="ReviewScreen" component={ReviewScreen} />
        <Stack.Screen name="MenuScreen" component={MenuScreen} />

      </Stack.Navigator>
    </NavigationContainer>
  );
}
