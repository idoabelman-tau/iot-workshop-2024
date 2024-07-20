import React, { useEffect, useState } from 'react';
import { View, Text, Button, TextInput } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const LoginScreen = ({navigation}) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  return (
    <View>
      <TextInput placeholder="username" onChangeText={(username) => setUsername(username)}/>
      <TextInput placeholder="password" onChangeText={(password) => setPassword(password)}/>
      <Button
        title="Login"
        onPress={() =>
          navigation.navigate('Main', {name: username})
        }
      />
    </View>
  );
};

const MainScreen = ({navigation, route}) => {
  return (
    <Text>No deliveries</Text>
  );
};

const Stack = createNativeStackNavigator();

function App() {

  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{title: 'Login'}}
        />
        <Stack.Screen
          name="Main"
          component={MainScreen}
          options={({ route }) => ({ title: "Welcome " + route.params.name })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;