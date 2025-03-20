import { createStackNavigator } from "@react-navigation/stack";
import { NavigationContainer } from "@react-navigation/native";
import HomeScreen from "./HomeScreen";
import RegisterScreen from "./RegisterScreen";
import LoginScreen from "./LoginScreen";
import LocationsListScreen from "./LocationsListScreen";
import LocationsDetailsScreen from "./LocationsDetailsScreen";
import ReviewScreen from "./ReviewScreen";
import MenuScreen from "./MenuScreen";
import ExplorePage from "./ExplorePage";
import FavouritesScreen from "./FavouritesScreen";
import SurpriseMeScreen from "./SurpriseMeScreen";
import LuckyWheelScreen from "./LuckyWheelScreen";
import AccountDetailsScreen from "./AccountDetailsScreen";
import EmailVerificationScreen from "./EmailVerificationScreen";
import BookingScreen from "./BookingScreen";
const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="LocationsList" component={LocationsListScreen} />
        <Stack.Screen name="LocationDetails" component={LocationsDetailsScreen} options={{ title: "Detalii" }}/>
        <Stack.Screen name="ReviewScreen" component={ReviewScreen} />
        <Stack.Screen name="MenuScreen" component={MenuScreen} />
        <Stack.Screen name="ExplorePage" component={ExplorePage} options={{ title: "" }}/>
        <Stack.Screen name="FavouritesScreen" component={FavouritesScreen} options={{ title: "" }}/>
        <Stack.Screen name="SurpriseMe" component={SurpriseMeScreen} options={{ title: "" }}/>
        <Stack.Screen name="LuckyWheel" component={LuckyWheelScreen} options={{ title: "" }}/>
        <Stack.Screen name="AccountDetailsScreen" component={AccountDetailsScreen} options={{ title: "Contul meu" }} />
        <Stack.Screen name="EmailVerificationScreen" component={EmailVerificationScreen} />
        <Stack.Screen name="BookingScreen" component={BookingScreen} options={{ title: "" }}/>
      </Stack.Navigator>
    </NavigationContainer>
  );
}
