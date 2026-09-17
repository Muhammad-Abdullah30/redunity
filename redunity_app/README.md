# RedUnity - Blood Donation Network

Pakistan's premier voluntary blood donation network built with React, Firebase, and modern web technologies.

## Features

- **Blood Donor Directory**: Search for voluntary blood donors by location, blood group, and availability
- **Blood Request System**: Post emergency blood requests and get connected with donors
- **Phone-based Authentication**: Easy login using Pakistan phone numbers
- **Real-time Updates**: Instant notifications when matching donors are available
- **Admin Dashboard**: Data explorer for managing users, requests, and interactions
- **PWA Support**: Works offline and can be installed on mobile devices
- **Responsive Design**: Optimized for mobile, tablet, and desktop

## Tech Stack

- **Frontend**: React 19, Vite, TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Backend**: Firebase (Authentication, Firestore)
- **PWA**: Service Worker with offline support

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Firebase project with Authentication and Firestore enabled
- Firebase project credentials

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd redunity_app
```

2. Install dependencies:
```bash
npm install
```

3. Configure Firebase:
   - Open `firebase-config.js`
   - Replace the placeholder values with your Firebase project credentials
   - Get credentials from: https://console.firebase.google.com/project/redunity-f080a/settings/general

4. Start the development server:
```bash
npm run dev
```

5. Open your browser to `http://localhost:3000`

## Firebase Setup

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project named `redunity-f080a`
3. Enable Authentication (Phone provider)
4. Enable Firestore Database
5. Configure security rules

### 2. Authentication Setup

- Enable Phone authentication in Firebase Console
- Configure phone number regions for Pakistan
- Set up reCAPTCHA (invisible reCAPTCHA is configured in the app)

### 3. Firestore Database Setup

Create the following collections:

**users collection:**
```javascript
{
  name: string,
  phone: string,
  bloodGroup: string, // A+, A-, B+, B-, AB+, AB-, O+, O-
  city: string,
  country: string,
  redunityId: string, // Unique ID for login
  role: string, // 'donor' | 'requestor' | 'admin'
  status: string, // 'active' | 'inactive'
  createdAt: timestamp
}
```

**bloodRequests collection:**
```javascript
{
  patientName: string,
  contactPhone: string,
  bloodGroup: string,
  city: string,
  country: string,
  hospital: string,
  urgency: string, // 'normal' | 'urgent' | 'critical'
  notes: string,
  requestedBy: {
    uid: string,
    name: string,
    phone: string,
    redunityId: string
  },
  status: string, // 'active' | 'fulfilled' | 'expired'
  createdAt: timestamp,
  updatedAt: timestamp
}
```

**interactions collection:**
```javascript
{
  fromUser: {
    uid: string,
    name: string,
    phone: string,
    redunityId: string,
    role: string
  },
  toUser: {
    id: string,
    name: string,
    bloodGroup: string,
    type: string
  },
  method: string,
  timestamp: timestamp
}
```

### 4. Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read: if true;
      allow write: if request.auth != null && 
                      (request.auth.uid == userId || 
                       request.resource.data.redunityId == userId);
    }
    
    // Blood requests collection
    match /bloodRequests/{requestId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update: if request.auth != null && 
                      request.resource.data.requestedBy.uid == request.auth.uid;
    }
    
    // Interactions collection
    match /interactions/{interactionId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
    }
  }
}
```

## Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Deployment

### Firebase Hosting

1. Install Firebase CLI:
```bash
npm install -g firebase-tools
```

2. Login to Firebase:
```bash
firebase login
```

3. Initialize hosting:
```bash
firebase init hosting
```
- Select your `redunity-f080a` project
- Set public directory to `dist`
- Configure as single-page app: Yes

4. Deploy:
```bash
firebase deploy --only hosting
```

### Other Hosting Options

The app can be deployed to any static hosting service:
- Netlify
- Vercel
- GitHub Pages
- AWS S3 + CloudFront

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run linter

## Project Structure

```
redunity_app/
├── public/
│   ├── manifest.json      # PWA manifest
│   ├── sw.js             # Service worker
│   └── favicon.webp      # App icon
├── src/
│   ├── components/
│   │   ├── auth/         # Authentication components
│   │   ├── ui/           # UI components
│   │   ├── BloodDirectory.tsx
│   │   ├── BloodRequestForm.tsx
│   │   ├── TeamSection.tsx
│   │   ├── HeroSection.tsx
│   │   └── DataExplorerModal.tsx
│   ├── contexts/
│   │   ├── FirebaseContext.tsx
│   │   └── UserContext.tsx
│   ├── hooks/
│   │   └── useFirebase.ts
│   ├── utils/
│   │   ├── locationData.ts
│   │   ├── formatters.ts
│   │   └── validators.ts
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── firebase-config.js    # Firebase configuration
├── tailwind.config.js    # Tailwind CSS configuration
├── vite.config.js        # Vite configuration
└── package.json
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.

## Support

For support, please contact the RedUnity team or open an issue in the repository.

## Acknowledgments

- Built with [React](https://react.dev/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Animated with [Framer Motion](https://www.framer.com/motion/)
- Backend by [Firebase](https://firebase.google.com/)
- Icons by [Lucide](https://lucide.dev/)