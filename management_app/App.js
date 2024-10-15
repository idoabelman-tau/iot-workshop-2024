import React, { useEffect, useState } from 'react';
import { View, Text, Button, TextInput, StyleSheet, Dimensions } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { WebView } from 'react-native-webview';
import axios from 'axios';
import { initializeApp } from '@firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from '@firebase/auth';
import { Alert } from 'react-native';

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

function MapView() {
  const [mapData, setMapData] = useState([]);
  const [error, setError] = useState(null);

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

  const generateHTML = (data) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Azure Map</title>
        <meta name="viewport" content="initial-scale=1,maximum-scale=1,user-scalable=no"/>

        <!-- Load JQuery UI -->
        <link rel="stylesheet" href="https://code.jquery.com/ui/1.12.1/themes/smoothness/jquery-ui.css">

        <script src="https://code.jquery.com/jquery-1.12.4.js"></script>
        <script src="https://code.jquery.com/ui/1.12.1/jquery-ui.js"></script>

        <!-- Add references to the Azure Maps Map control JavaScript and CSS files. -->
        <script src="https://atlas.microsoft.com/sdk/js/atlas.min.js?api-version=2.0&subscription-key=5ySo1oALGOO4dggn1dVgANogVlQgfmYxAKOdNxSvlGngnZgEFHwgJQQJ99AGAC5RqLJPSPD9AAAgAZMPIZmH"></script>
        <link rel="stylesheet" href="https://atlas.microsoft.com/sdk/css/atlas.min.css?api-version=2.0" type="text/css"/>
        

        <!-- Add a reference to the Azure Maps Rest Helper JavaScript file. -->
        <script src="https://samples.azuremaps.com/lib/azure-maps/azure-maps-helper.min.js"></script>

        <script>
          const pointsSource = new atlas.source.DataSource();
          var map;
          var geocodeServiceUrlTemplate = 'https://{azMapsDomain}/search/address/json?typeahead=true&api-version=1.0&query={query}&language=he-IL&lon={lon}&lat={lat}&countrySet=IL&view=Auto';
          marker_clicked = false;

          function startAutocomplete() {
            //Create a jQuery autocomplete UI widget.
            $("#queryTbx").autocomplete({
                minLength: 3,   //Don't ask for suggestions until atleast 3 characters have been typed. This will reduce costs by not making requests that will likely not have much relevance.
                source: function (request, response) {
                    var center = map.getCamera().center;

                    //Create a URL to the Azure Maps search service to perform the search.
                    var requestUrl = geocodeServiceUrlTemplate.replace('{query}', encodeURIComponent(request.term))
                        .replace('{lon}', center[0])    //Use a lat and lon value of the center the map to bais the results to the current map view.
                        .replace('{lat}', center[1])

                    processRequest(requestUrl).then(data => {
                        response(data.results);
                    });
                },
                select: function (event, ui) {
                    //Create a point feature to mark the selected location.
                    pointsSource.add(
                      new atlas.data.Feature(
                        new atlas.data.Point([ui.item.position.lon, ui.item.position.lat]),
                        {marked: 0, submitted: 0}
                      )
                    );

                    //Zoom the map into the selected location.
                    map.setCamera({
                        bounds: [
                            ui.item.viewport.topLeftPoint.lon, ui.item.viewport.btmRightPoint.lat,
                            ui.item.viewport.btmRightPoint.lon, ui.item.viewport.topLeftPoint.lat
                        ],
                        padding: 30
                    });
                }
            }).autocomplete("instance")._renderItem = function (ul, item) {
                //Format the displayed suggestion to show the formatted suggestion string.
                var suggestionLabel = item.address.freeformAddress;

                if (item.poi && item.poi.name) {
                    suggestionLabel = item.poi.name + ' (' + suggestionLabel + ')';
                }

                return $("<li>")
                    .append("<a>" + suggestionLabel + "</a>")
                    .appendTo(ul);
            };
          }

          function startMap() {
            console.log('Map script loading...');

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
          
                ${data.map(point => `
                  point = new atlas.data.Feature(
                    new atlas.data.Point([${point[0]}, ${point[1]}]),
                    {marked: 0, submitted: 1}
                  );
                  pointsSource.add(point);
                `).join('')}

         
                pointsLayer = new atlas.layer.SymbolLayer(pointsSource, null, {
                  iconOptions: {
                    image: [
                      "case",
                        ["==", ["get", "marked"], 1],
                          "marker-red",
                        ["==", ["get", "submitted"], 1],
                          "marker-darkblue",

                        "marker-blue",
                    ]
                  }
                });
                map.layers.add(pointsLayer);

                console.log('Data source and layers added.');

                map.events.add('click', pointsLayer, function(e) {
                  if (e.shapes && e.shapes.length > 0) { // if we clicked on a marker
                    marker = e.shapes[0];
                    props = marker.getProperties();
                    props.marked = 1 - props.marked; // toggle 1 to 0 and vice versa
                    marker.setProperties(props);
                    e.preventDefault();
                    marker_clicked = true;
                  }
                });

                // handle click on map
                map.events.add('click', function(e){
                  if (marker_clicked) {
                    marker_clicked = false;
                    return;
                  }
                  const point = new atlas.data.Point(e.position);
                  const feature = new atlas.data.Feature(point, 
                        {marked: 0, submitted: 0});
                  pointsSource.add(feature);
                });

                startAutocomplete();
              });
            } catch (error) {
              console.error('Error initializing map:', error);
            }
          }

          function submitTasks() {
            pointsToSubmit = pointsSource.shapes.filter(
              (marker) => { return marker.getProperties().marked == 1 && 
                                  marker.getProperties().submitted == 0 }
            )

            submission_array = pointsToSubmit.map(
              (marker) => { return {company_id: "1",
                            user_id: "1",
                            courier_id:"1",
                            delivery_address: "POINT (" + marker.getCoordinates()[0] + " " + marker.getCoordinates()[1] + ")",
                            delivery_time: "10/8/2024",
                            status:"pending"} }
            );

            fetch ("https://gettasks.azurewebsites.net/api/commitTask?", {
              method: "POST",
              body: JSON.stringify(submission_array)
            }).then((response)=>{
              if (response.status == 200) {
                alert("tasks submitted");
                pointsToSubmit.forEach(
                  (marker)=>{
                    props=marker.getProperties();
                    props.marked = 0;
                    props.submitted=1;
                    marker.setProperties(props)
                  });
              }
              else {
                alert("error submitting tasks");
              }
            });
          }
        </script>

        <style>
          body { margin: 0; padding: 0; }
          #map { width: 100vw; height: 100vh; }
        </style>
      </head>
      <body onload="startMap()">
        <div class="ui-widget">
            <label for="queryTbx">Your query: </label>
            <input id="queryTbx">
        </div>

        <div id="map" style="position:relative;width:100%;min-width:290px;height:500px;"></div>

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

/*
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
*/

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
  return (
    <View style={styles2.authContainer}>
      <Text style={styles2.title}>Welcome</Text>
      <Text style={styles2.emailText}>{user.email}</Text>
      <Button title="Employee list" onPress={() => navigation.navigate('Main')} />
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
          await signInWithEmailAndPassword(auth, email, password);
          console.log('User signed in successfully!');
        } else {
          // Sign up
          await createUserWithEmailAndPassword(auth, email, password);
          console.log('User created successfully!');
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
        <Stack.Screen 
          name="Main"
          component={MainScreen}
          options={({ route }) => ({ title: "Employee list"})}
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

const styles2 = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f0f0f0',
  },
  authContainer: {
    width: '80%',
    maxWidth: 400,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    height: 40,
    borderColor: '#ddd',
    borderWidth: 1,
    marginBottom: 16,
    padding: 8,
    borderRadius: 4,
  },
  buttonContainer: {
    marginBottom: 16,
  },
  toggleText: {
    color: '#3498db',
    textAlign: 'center',
  },
  bottomContainer: {
    marginTop: 20,
  },
  emailText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
});

export default App;