import React, { useEffect, useState } from 'react';
import { View, Text, Button, TextInput, StyleSheet, Dimensions, Alert, TouchableOpacity, Pressable } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { WebView } from 'react-native-webview';
import axios from 'axios';
import { initializeApp } from '@firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from '@firebase/auth';
import { useNavigation } from '@react-navigation/native';
import { useIsFocused } from '@react-navigation/native';


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
const auth = getAuth(app);
//xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

function MapView( { employee_id, company_id } ) {
  const [mapData, setMapData] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios.post('https://gettasks.azurewebsites.net/api/getTasks?', [
        {
          "company_id" : company_id,
          "courier_id" : employee_id
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
  }, [ employee_id, company_id ]);
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
          var marker_clicked = false;
          var selected_marker = null;

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
                        {selected: 0, submitted: 0}
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
                    {selected: 0, submitted: 1}
                  );
                  pointsSource.add(point);
                `).join('')}

         
                pointsLayer = new atlas.layer.SymbolLayer(pointsSource, null, {
                  iconOptions: {
                    image: [
                      "case",
                        ["==", ["get", "selected"], 1], // red for the selected marker
                          "marker-red",
                        ["==", ["get", "submitted"], 1], // dark blue for submitted (i.e. in the database)
                          "marker-darkblue",
                        ["has", "phone_number"], // yellow for unsubmitted with an updated phone number (to be submitted)
                          "marker-yellow",

                        "marker-blue", // blue default
                    ]
                  }
                });
                map.layers.add(pointsLayer);

                console.log('Data source and layers added.');

                map.events.add('click', pointsLayer, function(e) {
                  if (e.shapes && e.shapes.length > 0) { // if we clicked on a marker
                    marker = e.shapes[0];
                    setSelected(marker);
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
                        {selected: 0, submitted: 0});
                  const shape = new atlas.Shape(feature); 
                  pointsSource.add(shape);
                  setSelected(shape);
                });

                startAutocomplete();
              });
            } catch (error) {
              console.error('Error initializing map:', error);
            }
          }

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
              if (props.phone_number) {
                $("#phone_number").val(props.phone_number);
              }
              else {
                $("#phone_number").val("");
              }
            }
          }

          function submitTasks() {
            // submit points that have the phone number set and weren't already submitted
            pointsToSubmit = pointsSource.shapes.filter(
              (marker) => { return "phone_number" in marker.getProperties() && 
                                  marker.getProperties().submitted == 0 }
            )

            submission_array = pointsToSubmit.map(
              (marker) => { return {company_id: "${company_id}",
                            user_id: "1",
                            courier_id:"${employee_id}",
                            delivery_address: "POINT (" + marker.getCoordinates()[0] + " " + marker.getCoordinates()[1] + ")",
                            delivery_time: "10/8/2024",
                            phone_number: marker.getProperties().phone_number,
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

          function updatePhone() {
            props = selected_marker.getProperties();
            props.phone_number = $("#phone_number").val();
            selected_marker.setProperties(props);
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

        <div class="ui-widget">
            <label for="phone_number">Client phone number: </label>
            <input id="phone_number">
            <Button onclick="updatePhone()">Update</Button>
        </div>
        <div class="ui-widget">
          <Button onclick="submitTasks()">Submit tasks</Button>
        </div>
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
  employee_id: 1,
  company_id: 1,
  name: "guy",
  user_id: "rRWUKie3aWXNvUlvDSthhs7kGio1"
}, {
  employee_id: 2,
  company_id: 1,
  name: "buddy",
  user_id: "mw1sQmRWJUaqn0YlPSrgqDT0Jh63"
}, {
  employee_id: 3,
  company_id: 1,
  name: "man",
  user_id: "NNoxdcAlYhcy7trB4PxhcVzF9wH2"
}, {
  employee_id: 4,
  company_id: 2,
  name: "adam",
  user_id: "McmAIYF4yQbsAVNAkT3LDuGel1z1"
}, {
  employee_id: 5,
  company_id: 2,
  name: "jack",
  user_id: "n81jOz8eFsRqxFSLyTlBK5shCFO2"
}, {
  employee_id: 6,
  company_id: 3,
  name: "noor",
  user_id: "6TjZVM9gZZTfJJu3tgy1BfmLP3V2"
}];

const admins = [{
  admin_id: 7,
  company_id: 1,
  name: "Admin1",
  user_id: "V6lMmiF6zdRpz9U5aFzd1Pr2xE93"
}, {
  admin_id: 8,
  company_id: 2,
  name: "Admin2",
  user_id: "DZ4Q4BVZw2esryz9ejHdPpsLfTE3"
}, {
  admin_id: 9,
  company_id: 3,
  name: "Admin3",
  user_id: "VAikv8G3zWW694SOym2fLzkQa523"
}];


//-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
const AddEmployeeScreen = ({ navigation, route }) => {
  const [newEmployeeName, setNewEmployeeName] = useState('');
  const loggedInAdminId = route.params.loggedInAdminId;

  // Find the admin to get their company_id
  const admin = admins.find(admin => admin.user_id === loggedInAdminId);
  const companyId = admin ? admin.company_id : null;

  const addEmployee = async () => {
    if (!newEmployeeName || !companyId) {
      Alert.alert("Please enter a name for the employee.");
      return;
    }
  
    try {
      // Create new user
      const userCredential = await createUserWithEmailAndPassword(auth, newEmployeeName + "@gmail.com", "1234567890");
      const userId = userCredential.user.uid;
  
      // Create the new employee object
      const newEmployee = {
        employee_id: employees.length + 1, // Generate a new employee ID
        company_id: companyId,
        name: newEmployeeName,
        user_id: userId
      };
  
      // Update local employees list here (need to replace to upadte in azure database)
  
      Alert.alert("Employee added successfully!");
      navigation.goBack(); // Navigate back to the MainScreen
    } catch (error) {
      Alert.alert("Error adding employee: " + error.message);
    }
  };

  return (
    <View style={styles3.container}>
      <Text style={styles3.headerText}>Add New Employee</Text>
      <TextInput
        style={styles3.input}
        placeholder="Employee Name"
        value={newEmployeeName}
        onChangeText={setNewEmployeeName}
      />
      <Button title="Add Employee" onPress={addEmployee} />
    </View>
  );
};
//-----------------------------------------------------------------------------------------------------------------------------------------------------------------------


const MainScreen = ({ route }) => {
  const navigation = useNavigation();
  const loggedInAdminId = route.params.loggedInAdminId;

  return (
    <View style={styles4.container}>
      <Text style={styles4.chooseEmployeeText}>Choose employee:</Text>

      {/* Employee Buttons */}
      <View style={styles4.employeeButtonsContainer}>
        {employees
          .filter(employee => employee.company_id === (admins.find(admin => admin.user_id === loggedInAdminId)?.company_id))
          .map(employee => (
            <Button
              title={employee.name}
              key={employee.employee_id}
              onPress={() =>
                navigation.navigate('Employee', { employee_id: employee.employee_id, company_id: employee.company_id })
              }
              color={styles4.button.color} // Use the color from styles
              style={styles4.button}
              titleStyle={{ fontSize: 18 }} // Adjust the font size here
            />
          ))}
      </View>

      {/* Add Employee Button at the bottom */}
      <Button 
        title="Add Employee" 
        onPress={() => navigation.navigate('AddEmployee', { loggedInAdminId })} 
        color={styles4.addButton.color} // Use the color from styles
        style={styles4.addButton} 
      />
    </View>
  );
};


const EmployeeScreen = ({navigation, route}) => {
  const { employee_id, company_id } = route.params;
  return (
    <MapView employee_id={employee_id}  company_id={company_id} />
  );
};

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

    // Find the admin using the user.uid from Firebase
  const admin = admins.find(e => e.user_id === user.uid);

  // Log information when an admin is found
  if (admin) {
    console.log(`User Logged In: Name: ${admin.name}, Admin ID: ${admin.admin_id}, User ID: ${user.uid}, Company ID: ${admin.company_id}`);
  }
  if (!admin) {
    return (
      <View style={styles1.authContainer}>
        <Text style={styles1.title}>Admin not found</Text>
        <Text style={styles1.smallText}>If you are an employee, please login using the employee app.</Text>
        {/* Add a button to log out and try logging in again */}
        <Button title="Try Again" onPress={handleAuthentication} color="#e74c3c" />
      </View>
    );
  }
  return (
    <View style={styles1.authContainer}>
      <Text style={styles1.title}>Welcome</Text>
      <Text style={styles1.emailText}>{user.email}</Text>
      <Button title="Employee list" onPress={() => navigation.navigate('Main', { loggedInAdminId: admin.user_id })} />
      <Button title="Logout" onPress={handleAuthentication} color="#e74c3c" />
    </View>
  );
};

//xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

const Stack = createNativeStackNavigator();

function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState(null); // Track user authentication state
  const [isLogin, setIsLogin] = useState(true);

  //const auth = getAuth(app);
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
        <Stack.Screen 
          name="Main"
          component={MainScreen}
          options={({ route }) => ({ title: "Employee list"})}
        />

        <Stack.Screen name="AddEmployee" component={AddEmployeeScreen} />

        <Stack.Screen
          name="Employee"
          component={EmployeeScreen}
          options={({ route }) => ({ title: "Employee " })}
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

const styles3 = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center', // Center the content horizontally
    padding: 20,
  },
  headerText: {
    fontSize: 24,
    marginBottom: 20, // Space between header and input
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    width: '80%', // Make the input take up 80% of the width
    marginBottom: 20, // Space between input and button
    paddingHorizontal: 10,
  },
});


const styles4 = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between', // This keeps the Add Employee button at the bottom
  },
  chooseEmployeeText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  employeeButtonsContainer: {
    flex: 1,
    justifyContent: 'flex-start', // Align buttons at the start
    marginTop: 10, // Adjust margin to move buttons higher
  },
  button: {
    marginVertical: 10,
    borderColor: '#3498db',
    borderWidth: 2,
    backgroundColor: '#d9edf7', // Light gray background
    borderRadius: 10, // Rounded edges
    color: '#3498db', // Button text color
  },
  addButton: {
    marginTop: 10,
    borderColor: '#e74c3c',
    borderWidth: 2,
    backgroundColor: '#f8d7da', // color for the add button
    borderRadius: 10, // Rounded edges
    color: '#007bff', // Button text color
  },
});

export default App;