import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Button, TextInput, StyleSheet, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { WebView } from 'react-native-webview';
import axios from 'axios';
import * as Location from 'expo-location';

const LOCATION_TASK_NAME = "background-location-task";

function MapView() {
  const [mapData, setMapData] = useState([]);
  const [error, setError] = useState(null);
  const webref = useRef(null);


  useEffect(() => {
    axios.post('https://gettasks.azurewebsites.net/api/getTasks?', [
        {
          "company_id" : 1,
          "courier_id" : 1
        }
      ])
      .then(response => {
        pointStrings = response.data.map(shipment => shipment["delivery_address"]);
        points = pointStrings.map(str =>
          [parseFloat(str.split(" ")[1].slice(1)),
            parseFloat(str.split(" ")[2].slice(0,-1))]
        );
        setMapData(points);
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

  const onLoadHandler = ({ nativeEvent }) => {
    if (!nativeEvent.url.startsWith("http")) {
      (async () => {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('Permission to access location was denied');
          return;
        }

        Location.watchPositionAsync(
          {
            enableHighAccuracy: true,
            distanceInterval: 1,
            timeInterval: 10000
          },
          newLocation => {
            //alert("position watch triggered");
            if (webref != null) {
              //alert("injecting js");
              webref.current.injectJavaScript("updateCourierPosition(" + 
                newLocation.coords.longitude + "," +
                newLocation.coords.latitude + ");");
            }
          },
          error => console.log(error)
        )
        
      })();
    }
  };

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
          const pointsSource = new atlas.source.DataSource();
          const pathsSource = new atlas.source.DataSource();
          const courierSource = new atlas.source.DataSource();
          const coordinates = [];
          var courierPosition;
          var map;
          var courierPoint;
          var mapLoaded = false;

          console.log('Map script loading...');
          (function() {
            try {
              map = new atlas.Map('map', {
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
                map.sources.add(pointsSource);
                map.sources.add(pathsSource);
                map.sources.add(courierSource);

                ${data.map(point => `
                  point = new atlas.data.Feature(
                    new atlas.data.Point([${point[0]}, ${point[1]}])
                  );
                  pointsSource.add(point);
                  coordinates.push([${point[0]}, ${point[1]}]);
                `).join('')}

                map.layers.add(
                  new atlas.layer.LineLayer(pathsSource, null, {
                    strokeColor: "#2272B9",
                    strokeWidth: 5,
                    lineJoin: "round",
                    lineCap: "round"
                  }),
                  "labels"
                );
          
                map.layers.add(new atlas.layer.SymbolLayer(pointsSource));
                map.layers.add(new atlas.layer.SymbolLayer(courierSource, null, {
                  iconOptions: {
                    image: "pin-round-red"
                  }
                }));

                console.log('Data source and layers added.');
                mapLoaded = true;
                if (courierPosition) {
                  updateCourierMapPoint();
                }
              });

            } catch (error) {
              console.error('Error initializing map:', error);
            }
          })();

          function calcRoute() {
            let url = "https://atlas.microsoft.com/route/directions/json?";
            url += "&api-version=1.0";
            url += "&computeBestOrder=true";
            url += "&query=";

            url += courierPosition[1] + "," + courierPosition[0] + ":";
            for (const point of coordinates) {
              url += point[1] + "," + point[0] + ":";
            }
            url += courierPosition[1] + "," + courierPosition[0];
            url += "&subscription-key=5ySo1oALGOO4dggn1dVgANogVlQgfmYxAKOdNxSvlGngnZgEFHwgJQQJ99AGAC5RqLJPSPD9AAAgAZMPIZmH";

            // Process request
            fetch(url)
              .then((response) => response.json())
              .then((response) => {
                const bounds = [];
                const route = response.routes[0];
                
                // Create an array to store the coordinates of each turn
                let routeCoordinates = [];
                route.legs.forEach((leg) => {
                  const legCoordinates = leg.points.map((point) => {
                    const position = [point.longitude, point.latitude];
                    bounds.push(position);
                    return position;
                  });
                  // Add each turn coordinate to the array
                  routeCoordinates = routeCoordinates.concat(legCoordinates);
              });

              // Add route line to the dataSource
              pathsSource.clear();
              pathsSource.add(new atlas.data.Feature(new atlas.data.LineString(routeCoordinates)));
            });
          }

          function updateCourierPosition(longitude, latitude) {
            courierPosition = [longitude, latitude];
            if (mapLoaded) {
              updateCourierMapPoint();
            }
          }

          function updateCourierMapPoint() {
            if (!courierPoint) {
              courierPoint = new atlas.Shape(new atlas.data.Feature(new atlas.data.Point(courierPosition)));
              courierSource.add(courierPoint);
            }
            else {
              courierPoint.setCoordinates(courierPosition);
            }

            //alert("map: " + map);
            map.setCamera({
                center: courierPosition,
                zoom: 15
            });
          }
        </script>

        <Button onclick="calcRoute()">Show best route</Button>
      </body>
      </html>
    `};

  return (
    <View style={styles.container}>
      <WebView 
        ref={webref}
        originWhitelist={['*']} 
        source={{ html: generateHTML(mapData) }}
        onMessage={(event) => {
          console.log(event.nativeEvent.data);
        }}
        onLoad={onLoadHandler}  
      />
    </View>
  );
}

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