
// import withBoringSSLFix from './withBoringSSLFix'

export default {
  "expo": {
    "name": "rihlah",
    "slug": "rihlah",
    "scheme": "rihlah",
    "version": "2.0.0",
    "orientation": "portrait",
    "icon": "./assets/rihlahAppIcon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#2E3D3A"
    },
    "ios": {
      "supportsTablet": false,
      "infoPlist": {
        "UIBackgroundModes": ["location", "fetch", "remote-notification", "audio"],
        "LSApplicationQueriesSchemes": ["file", "tel"],
        "ITSAppUsesNonExemptEncryption": false,
        "NSLocationWhenInUseUsageDescription": "We use your location to show you locations of interest nearby (mosques, musollah, food).",
        "NSLocationAlwaysUsageDescription": "We use your location to show you locations of interest nearby (mosques, musollah, food)."
      },
      "googleServicesFile": "./GoogleService-Info.plist",
      "bundleIdentifier": "com.naeemsani95.rihlah",
      "runtimeVersion": "1.0.0"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/rihlahAppIcon.png",
        "backgroundColor": "#ffffff"
      },
      "permissions": [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "android.permission.ACCESS_COARSE_LOCATION",
        "android.permission.ACCESS_FINE_LOCATION"
      ],
      "config": {
        "googleMaps": {
          "apiKey": "AIzaSyDTIIDN0wON_VgheCfUN5LGECUL8UaGrS0"
        }
      },
      "googleServicesFile": "./google-services.json",
      "package": "com.naeemsani.rihlah",
      "runtimeVersion": {
        "policy": "appVersion"
      }
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      [
        "react-native-google-mobile-ads",
        {
          "androidAppId": "ca-app-pub-3113906121142395~8011626070",
          "iosAppId": "ca-app-pub-3113906121142395~4456095266",
        }
      ],
      "@react-native-firebase/auth",
      "@react-native-firebase/app",
      // withBoringSSLFix,
      [
        "expo-build-properties",
        {
          "ios": {
            "useFrameworks": "static",
            "deploymentTarget": "15.1"
          }
        }
      ],
      "expo-router",
      "expo-font",
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "Allow Rihlah to use your location."
        }
      ],
      "expo-asset",
    ],
    "extra": {
      "router": {
        "origin": false
      },
      "eas": {
        "projectId": "deec8169-b934-4eff-8714-421a695e3d9b"
      },
    },
    "owner": "naeemsani95",
    "updates": {
      "url": "https://u.expo.dev/deec8169-b934-4eff-8714-421a695e3d9b"
    }
  }
}
