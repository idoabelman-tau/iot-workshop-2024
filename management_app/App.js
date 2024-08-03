import React, { useEffect, useState } from 'react';
import { View, Text, Button, TextInput, StyleSheet, Dimensions } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { WebView } from 'react-native-webview';
import axios from 'axios';

function MapView() {
  const [mapData, setMapData] = useState([]);
  const [error, setError] = useState(null);


  useEffect(() => {
    axios.get('https://gettasks.azurewebsites.net/api/gettasks')
      .then(response => {
        setMapData([response.data]);
      }).catch(error => {
        setError(error.message);
        console.error(error);
      });
  }, []);
  if (error) {
    console.log('error')
    return (
      <View style={styles.container}>
        <Text>Error: {error}</Text>
      </View>
    );
  }

  const generateHTML = (data) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Azure Map</title>
        <meta name="viewport" content="initial-scale=1,maximum-scale=1,user-scalable=no"/>
        <script src="https://atlas.microsoft.com/sdk/js/atlas.min.js?api-version=2.0&subscription-key=5ySo1oALGOO4dggn1dVgANogVlQgfmYxAKOdNxSvlGngnZgEFHwgJQQJ99AGAC5RqLJPSPD9AAAgAZMPIZmH"></script>
        <link rel="stylesheet" href="https://atlas.microsoft.com/sdk/css/atlas.min.css?api-version=2.0" type="text/css"/>
        <style>
          body { margin: 0; padding: 0; }
          #map { width: 100vw; height: 100vh; }
        </style>
      </head>
      <body>
        <div id="map" style="position:relative;width:100%;min-width:290px;height:500px;"></div>
        <script>
          const dataSource = new atlas.source.DataSource();
          const coordinatesToSubmit = [];

          console.log('Map script loading...');
          (function() {
            try {
              let map = new atlas.Map('map', {
                center: [35, 32],
                zoom: 7,
                view: 'Auto',
                authOptions: {
                  authType: 'subscriptionKey',
                  subscriptionKey: '5ySo1oALGOO4dggn1dVgANogVlQgfmYxAKOdNxSvlGngnZgEFHwgJQQJ99AGAC5RqLJPSPD9AAAgAZMPIZmH'
                }
              });

              console.log('Map instance created.');

              map.events.add('ready', function() {
                console.log('Map is ready.');
                map.sources.add(dataSource);

                map.layers.add(new atlas.layer.SymbolLayer(dataSource));
                console.log('Data source and layers added.');
              });

              map.events.add('click', function(e){
                const point = new atlas.Shape(new atlas.data.Point());
                point.setCoordinates(e.position);
                dataSource.add(point);
                coordinatesToSubmit.push(e.position);
              });
            } catch (error) {
              console.error('Error initializing map:', error);
            }
          })();

          function submitTasks() {
            alert(coordinatesToSubmit);
          }
        </script>

        <Button onclick="submitTasks()">Submit tasks</Button>
      </body>
      </html>
    `;
  };

  return (
    <View style={styles.container}>
      <WebView 
        originWhitelist={['*']} 
        source={{ html: generateHTML(mapData) }}  
      />
    </View>
  );
}

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
    <MapView/>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;