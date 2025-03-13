import React from "react";
import { View, ActivityIndicator } from "react-native";
import { WebView } from "react-native-webview";

const MenuScreen = ({ route }) => {
  const { menuUrl } = route.params; 

  return (
    <View style={{ flex: 1 }}>
      {menuUrl ? (
        <WebView source={{ uri: menuUrl }} />
      ) : (
        <ActivityIndicator size="large" color="#0000ff" />
      )}
    </View>
  );
};

export default MenuScreen;
