import React, { useEffect, useState } from 'react';
import { View, Text, Button, TextInput } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const employees = [{
  id: 0,
  name: "Guy"
}, {
  id: 1,
  name: "Buddy"
}, {
  id: 2,
  name: "Man"
}];

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
  const employeeButtons = employees.map((employee) =>
    <Button
      title = {employee.name}
      key = {employee.id}
      onPress={() =>
        navigation.navigate('Employee', {id: employee.id})
      }
    />
  );
  return (
    <View>
      <Text>Choose employee:</Text>
      <View>
        {employeeButtons}
      </View>
    </View>
  );
};

const EmployeeScreen = ({navigation, route}) => {
  return (
    <Text>Choose delivery points:</Text>
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
        <Stack.Screen
          name="Employee"
          component={EmployeeScreen}
          options={({ route }) => ({ title: "Employee " + employees[route.params.id].name })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;