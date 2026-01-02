// Scripts for firebase messaging service worker
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in the
// messagingSenderId.
// Using hardcoded config or self.firebaseConfig if available. 
// Note: For service workers in public folder, environment variables are not directly accessible.
// We will use the ones from the main app or you can hardcode them here if needed.
// For now, we attempt to initialize with standard config structure.

// P.S. Replace these with your actual Firebase project config values if they don't load dynamically
// or if you want to be robust. 
// Since this is a public file, typically we hardcode or fetch config. 
// For this environment, I'll add a placeholder to be safe, but the user should ideally check this.

// However, typically `firebase-messaging-sw.js` needs the config.
// I will setup a meaningful default or comment for the user.
// Accessing the values from the window context (main app) to here is tricky without postMessage.
// Standard practice: Initialize with hardcoded values in SW or use postMessage.

// Let's rely on standard initialization pattern.
const firebaseConfig = {
    apiKey: "AIzaSyBuu6ziYQMFENY8XUGjSbe39hYDJmQl8cc",
    authDomain: "campus-confession-3f696.firebaseapp.com",
    projectId: "campus-confession-3f696",
    storageBucket: "campus-confession-3f696.firebasestorage.app",
    messagingSenderId: "137080487648",
    appId: "1:137080487648:web:f5ca9d910bcfd983c41a85"
};

// Try to initialize
try {
    firebase.initializeApp(firebaseConfig);
    const messaging = firebase.messaging();

    messaging.onBackgroundMessage((payload) => {
        console.log('[firebase-messaging-sw.js] Received background message ', payload);
        // Customize notification here
        const notificationTitle = payload.notification.title;
        const notificationOptions = {
            body: payload.notification.body,
            icon: payload.notification.icon || '/logo.svg'
        };

        self.registration.showNotification(notificationTitle, notificationOptions);
    });
} catch (e) {
    console.log("Firebase SW init failed (expected if config missing):", e);
}
