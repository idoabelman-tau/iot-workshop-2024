
# About
This delivery management solution optimizes courier and service routes, making it easy for managers to assign tasks, for couriers to navigate efficiently, and for customers to track and confirm their deliveries.

[Visit our Website DeliverEase](https://pentagon-kangaroo-dn4z.squarespace.com/) (### Password is: 123)


### Key Features
- **Efficient Task Division:** Distribute tasks among couriers automatically, based on delivery locations.
- **Real-Time Courier Tracking:** Track each courier’s location in real-time as they progress through their delivery tasks.
- **Route Optimization:** Help couriers follow the most efficient route to complete all assigned tasks.
- **Delivery Verification:** Ensure successful delivery with QR code scanning, confirming that the package reached the customer.

---

# Features Overview

### Manager App
- **Secure Authentication:** Managers log in using Firebase for secure user management.
- **Task Assignment:** Assign delivery tasks to couriers by selecting addresses on a map. Choose between manual or automatic clustering of delivery points.
- **Courier Management:** Easily add new couriers to your organization.
- **Real-Time Tracking:** View live courier locations and track task completion in real time on a map interface.

### Employee App
- **Task Visualization:** Drivers can view their assigned delivery addresses on a map as soon as they’re dispatched.
- **Optimized Routing:** Automatically generated route recommendations help couriers complete deliveries efficiently.
- **Customer Tracking Links:** Drivers send customers tracking links when en route, allowing them to view the driver's location in real time.
- **QR Code Verification:** Drivers display a QR code for customers to scan upon delivery, confirming successful receipt.

### Customer Web App
- **Live Driver Tracking:** Customers can view their delivery’s live location on a web app.
- **Delivery Verification:** Customers scan a QR code upon receiving their package to confirm the delivery is complete.

---

# Services and Technologies Used

### Azure
- **Azure SQL Database:** Manages data for users, companies, and delivery tasks.
- **Azure Functions:** Powers the backend, enabling database access and API endpoints for app functionality.
- **Azure Maps:** Displays delivery locations and calculates optimal routes for each courier.
- **Azure App Services:** Hosts the customer-facing web app with CI/CD integration for seamless updates from GitHub.
- **Azure Communication Services:** Sends notification emails with tracking links to customers when deliveries are on the way.
- **Azure SignalR:** Provides real-time synchronization, instantly updating tasks and courier locations across the manager and customer apps.

### Firebase
- **Firebase Authentication:** Handles user authentication securely across all apps.