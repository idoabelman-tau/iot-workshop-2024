import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Button, TextInput, StyleSheet, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { WebView } from 'react-native-webview';
import axios from 'axios';
import * as Location from 'expo-location';
import { initializeApp } from '@firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from '@firebase/auth';
import { Alert } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

//xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
const firebaseConfig = {
  apiKey: "AIzaSyAu4qWAzOtvLZ-2wrVH_6WonOJEr0UecW0",
  authDomain: "management-994ae.firebaseapp.com",
  projectId: "management-994ae",
  storageBucket: "management-994ae.appspot.com",
  messagingSenderId: "676453066536",
  appId: "1:676453066536:web:2563425657ce7f33aa121d",
  measurementId: "G-CE7Y0ZHDWP"
};

const app = initializeApp(firebaseConfig);
//xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

const LOCATION_TASK_NAME = "background-location-task";

var tasks = [];

const MainScreen = ({navigation, route}) => {
  const { employee_id, company_id } = route.params;

  const [mapData, setMapData] = useState([]);
  const [shipmentId, setShipmentId] = useState(null);
  const [error, setError] = useState(null);
  const webref = useRef(null);


  useEffect(() => {
    axios.post('https://gettasks.azurewebsites.net/api/getTasks?', [
        {
          "company_id" : company_id,  // Adjust company_id if needed
          "UID" : employee_id   // Use employee_id for fetching specific delivery points
        }
      ])
      .then(response => {
        tasks = response.data;
        points = response.data.map(shipment => {
          return {
            coords: [parseFloat(shipment["delivery_address"].split(" ")[1].slice(1)),
                  parseFloat(shipment["delivery_address"].split(" ")[2].slice(0,-1))],
            shipment_id: shipment["shipment_id"]
          };
        });
        setMapData(points);
      }).catch(error => {
        setError(error.message);
        console.error(error);
      });
  }, [ employee_id, company_id ]); // Re-run the effect when employee_id changes
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

  const showTaskHandler = () => {
    if (shipmentId == null) {
      alert("select point first");
    }
    else {
      navigation.navigate('Task', { shipmentId: shipmentId });
    }
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
          const pointsSource = new atlas.source.DataSource();
          const pathsSource = new atlas.source.DataSource();
          const courierSource = new atlas.source.DataSource();
          const coordinates = [];
          var courierPosition;
          var map;
          var courierPoint;
          var mapLoaded = false;
          var selected_marker = null;

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
                    new atlas.data.Point([${point.coords[0]}, ${point.coords[1]}]),
                    {selected: 0, shipment_id: "${point.shipment_id}"}
                  );
                  pointsSource.add(point);
                  coordinates.push([${point.coords[0]}, ${point.coords[1]}]);
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
          
                pointsLayer = new atlas.layer.SymbolLayer(pointsSource, null, {
                  iconOptions: {
                    image: [
                      "case",
                        ["==", ["get", "selected"], 1], // red for the selected marker
                          "marker-red",

                        "marker-blue", // blue default
                    ]
                  }
                });
                map.layers.add(pointsLayer);

                map.events.add('click', pointsLayer, function(e) {
                  if (e.shapes && e.shapes.length > 0) { // if we clicked on a marker
                    marker = e.shapes[0];
                    setSelected(marker);
                  }
                });

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

          function setSelected(marker) {
            props = marker.getProperties();
            if (props.selected == 0) { // select the current marker instead of the previous one
              if (selected_marker != null) {
                selected_props = selected_marker.getProperties();
                selected_props.selected = 0;
                selected_marker.setProperties(selected_props);
              }

              props.selected = 1;
              marker.setProperties(props);
              selected_marker = marker;
              window.ReactNativeWebView.postMessage(props.shipment_id); // update selected marker's shipment id
            }
          }

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
      </body>
      </html>
    `};

  return (
    <View style={styles.mapContainer}>
      <WebView 
        ref={webref}
        originWhitelist={['*']} 
        source={{ html: generateHTML(mapData) }}
        onMessage={(event) => {
          setShipmentId(Number(event.nativeEvent.data));
        }}
        onLoad={onLoadHandler}  
      />
      <Button title="Show best route" onPress={() => webref.current.injectJavaScript("calcRoute()")} />
      <Button title="Show task details" onPress={ showTaskHandler } />
    </View>
  );
};

const TaskScreen = ({navigation, route}) => {
  const { shipmentId } = route.params;
  const task = tasks.find(t => t["shipment_id"] === shipmentId);
  return (
    <View style={styles.TaskContainer}>
      <Text style={styles1.smallText}>Client phone number: {task["phone_number"]}</Text>
      <QRCode
        value={task["confirmation_id"]}
        size={200}
      />
    </View>
  );
};

const Stack = createNativeStackNavigator();

//xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
const AuthScreen = ({ email, setEmail, password, setPassword, isLogin, setIsLogin, handleAuthentication }) => {
  return (
    <View style={styles2.authContainer}>
       <Text style={styles2.title}>{isLogin ? 'Sign In' : 'Sign Up'}</Text>

       <TextInput
        style={styles2.input}
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        autoCapitalize="none"
      />
      <TextInput
        style={styles2.input}
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        secureTextEntry
      />
      <View style={styles2.buttonContainer}>
        <Button title={isLogin ? 'Sign In' : 'Sign Up'} onPress={handleAuthentication} color="#3498db" />
      </View>

      <View style={styles2.bottomContainer}>
        <Text style={styles2.toggleText} onPress={() => setIsLogin(!isLogin)}>
          {isLogin ? 'Need an account? Sign Up' : 'Already have an account? Sign In'}
        </Text>
      </View>
    </View>
  );
}


const AuthenticatedScreen = ({ user, handleAuthentication, navigation }) => {
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true); // Add a loading state

  useEffect(() => {
      const fetchData = async () => {
          try {
              const response = await axios.post('https://getDb.azurewebsites.net/api/getUsers', {
                  UID: user.uid // Use the dynamic UID here
              });

              setUserData(response.data[0]);
          } catch (err) {
              setError(err.message);
          } finally {
              setLoading(false); // Set loading to false after fetch completes
          }
      };

      fetchData();
  }, [user.uid]); // Add uid as a dependency

  if (loading) {
    // Show a loading indicator while data is being fetched
    return (
      <View style={styles1.authContainer}>
        <Text style={styles1.title}>Loading...</Text>
        {/* ActivityIndicator */}
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  // Find the employee using the user.uid from Firebase
  const isEmployee = userData && userData.role === 'courier';

  // Log information when an employee is found
  if (isEmployee) {
    console.log(`User Logged In: Name: ${userData.name}, Employee ID: ${userData.user_id}, User UID: ${userData.UID}, Company ID: ${userData.company_id}`);
  }
  if (!isEmployee) {
    return (
      <View style={styles1.authContainer}>
        <Text style={styles1.title}>Employee not found</Text>
        <Text style={styles1.smallText}>If you are an admin, please login using the manager app.</Text>
        {/* Add a button to log out and try logging in again */}
        <Button title="Try Again" onPress={handleAuthentication} color="#e74c3c" />
      </View>
    );
  }

  return (
    <View style={styles1.authContainer}>
      <Text style={styles1.title}>Welcome</Text>
      <Text style={styles1.emailText}>{user.email}</Text>
      {/* Pass the employee_id instead of user_id to MainScreen */}
      <Button title="Go to Map" onPress={() => navigation.navigate('Main', { employee_id: userData.UID, company_id: userData.company_id})} />
      <Button title="Logout" onPress={handleAuthentication} color="#e74c3c" />
    </View>
  );
};

//xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState(null); // Track user authentication state
  const [isLogin, setIsLogin] = useState(true);

  const auth = getAuth(app);
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });

    return () => unsubscribe();
  }, [auth]);

  
  const handleAuthentication = async () => {
    try {
      // Attempt to sign in or sign up
      if (user) {
        // If user is already authenticated, log out
        console.log('User logged out successfully!');
        await signOut(auth);
      } else {
        // Sign in or sign up
        if (isLogin) {
          // Sign in
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          const signedInUser = userCredential.user;  // Get the user object
          console.log('User signed in successfully!');
          console.log('User.uid:', signedInUser.uid); // Log the UID
        } else {
          // Sign up
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          const createdUser = userCredential.user; // Get the user object
          console.log('User created successfully!');
          console.log('User.uid:', createdUser.uid); // Log the UID
        }
      }
    } catch (error) {
      // Log the error for debugging
      console.error('Authentication error:', error.message);
      
      // Handle specific authentication errors
      if (error.code === 'auth/invalid-email') {
        Alert.alert('Error', 'The email address is not valid.');
      } else if (error.code === 'auth/wrong-password') {
        Alert.alert('Error', 'The password is incorrect.');
      } else if (error.code === 'auth/user-not-found') {
        Alert.alert('Error', 'No user found with this email.');
      } else if (error.code === 'auth/invalid-credential') {
        Alert.alert('Error', 'The user or password is not valid. Please try again.');
      } else if (error.code === 'auth/email-already-in-use') {
        Alert.alert('Error', 'This email is already in use. Please try logging in instead.');
      } else {
        // General error handling
        Alert.alert('Error', 'An error occurred. Please try again.');
      }
    }
  };

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {user ? (
          // If user is authenticated, navigate to AuthenticatedScreen
          <Stack.Screen name="Authenticated">
            {(props) => (
              <AuthenticatedScreen
                {...props}
                user={user}
                handleAuthentication={handleAuthentication}
              />
            )}
          </Stack.Screen>
        ) : (
          // If user is not authenticated, navigate to AuthScreen
          <Stack.Screen name="Auth">
            {(props) => (
              <AuthScreen
                {...props}
                email={email}
                setEmail={setEmail}
                password={password}
                setPassword={setPassword}
                isLogin={isLogin}
                setIsLogin={setIsLogin}
                handleAuthentication={handleAuthentication}
              />
            )}
          </Stack.Screen>
        )}
        <Stack.Screen name="Main" component={MainScreen} />
        <Stack.Screen name="Task" component={TaskScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  mapContainer: {
    flex: 1,
  },
  TaskContainer :  {
    flex: 1,
    justifyContent: 'flex-start', // Centers vertically
    alignItems: 'center',     // Centers horizontally
  },
});

const styles1 = StyleSheet.create({
  authContainer: {
    flex: 1,
    justifyContent: 'flex-start', // Align items to the start (top)
    alignItems: 'center', // Center horizontally
    padding: 20, //  add some padding
    paddingTop: 180, // Adjust padding to move content higher
    backgroundColor: '#f5f5f5', // set a background color
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20, // Space below title
  },
  smallText: {
    fontSize: 16,
    marginBottom: 20, // Space below small text
    textAlign: 'center', // Center text
  },
  emailText: {
    fontSize: 18,
    marginBottom: 20, // Space below email text
  },
});

const styles2 = StyleSheet.create({
  authContainer: {
    flex: 1,
    justifyContent: 'flex-start', // Centers vertically
    alignItems: 'center',     // Centers horizontally
    padding: 20,
    paddingTop: 180, // Adjust padding to move content higher
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  input: {
    width: '80%',             // Set the input width to 80% of the container
    padding: 15,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  buttonContainer: {
    width: '80%',             // Set the button container width to 80%
    marginVertical: 10,
  },
  bottomContainer: {
    marginTop: 20,
  },
  toggleText: {
    color: '#3498db',
    textDecorationLine: 'underline',
  },
});

export default App;