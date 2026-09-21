# Attendify Mobile App

The mobile app is the student and teacher client for the BLE attendance system. It handles sign-in, class workflows, real-time attendance actions, and Bluetooth-based session discovery.

## What the app does

- teacher login and registration
- student login and registration
- class creation and class joining
- teacher request approval flow
- live attendance session start
- BLE advertising by the teacher device
- BLE scanning by the student device
- attendance submission and attendance history
- secure local storage for authentication tokens

## Tech stack

- Expo
- React Native
- Expo Router
- TypeScript
- expo-secure-store
- react-native-bluetooth-ble

## App structure

```text
mobile/
├── app/
│   ├── _layout.tsx
│   ├── index.tsx
│   ├── (auth)/
│   ├── (student)/
│   └── (teacher)/
├── src/
│   ├── api.ts
│   ├── auth.tsx
│   ├── attendance.ts
│   ├── ble.ts
│   └── ...
├── app.json
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## Mobile flow

### Teacher flow

1. Open the app and sign in.
2. Create a class and share the class code.
3. Start an attendance session from a class screen.
4. The app begins BLE advertising using the session token.
5. Students nearby read the attendance token and mark attendance.

### Student flow

1. Sign in as a student.
2. Find and join a class.
3. Wait for teacher approval.
4. Scan nearby devices for the active teacher beacon.
5. Confirm the session and send the token to the backend.
6. Attendance is marked if the backend validates the session.

## BLE implementation

The app uses a fixed BLE service UUID and a characteristic value for each attendance session.

- Teacher device advertises with `startTeacherBeacon()`.
- Student device scans for the matching service UUID and reads the characteristic.
- The token is submitted to the backend with the class ID.

This keeps the attendance token ephemeral and tied to the server-managed session.

## Authentication

The app stores the access token in Expo Secure Store and restores the user session automatically on app launch.

Key file:

- `src/auth.tsx`

The auth provider wraps the app and exposes:

- `signIn(email, password)`
- `signUp(name, email, password, role)`
- `signOut()`
- current `user` state

## API integration

The API client lives in `src/api.ts` and handles all backend requests for:

- login and registration
- class creation and class lookup
- member join requests
- attendance session start and end
- student attendance mark and history actions

## Local setup

```bash
cd mobile
npm install
cp .env.example .env
```

Set the backend URL for the app:

```env
EXPO_PUBLIC_API_URL=http://localhost:10000
```

Start the development build:

```bash
npx expo start --dev-client
```

Run Android:

```bash
npx expo run:android
```

## Android permissions

The app requests the following permissions for BLE functionality:

- `BLUETOOTH`
- `BLUETOOTH_ADMIN`
- `BLUETOOTH_ADVERTISE`
- `BLUETOOTH_SCAN`
- `BLUETOOTH_CONNECT`
- `ACCESS_FINE_LOCATION`
- `ACCESS_COARSE_LOCATION`

## Notes for real device testing

BLE is a native feature and is not reliable in a browser-only environment. Use a physical Android device and a development build to verify:

- teacher advertising
- student scanning
- correct session detection
- attendance verification behavior

## Troubleshooting

### Permission prompt is denied

- reopen the app and grant Bluetooth permissions manually in Android settings
- restart the dev build after permissions change

### Session not detected

- confirm the teacher has started a session
- keep the devices physically close
- check that Bluetooth is enabled on both phones

### API errors

- confirm `EXPO_PUBLIC_API_URL` points to the backend
- verify the backend is running and reachable
- check the backend logs for auth and session validation messages

## Summary

The mobile app is the classroom-facing layer of Attendify. It gives teachers a simple way to manage attendance sessions and gives students a smooth way to scan, validate, and submit attendance using proximity-based Bluetooth communication.
