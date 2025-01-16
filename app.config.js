import applePrivacyManifest from './utils/apple-privacy-manifest.json'

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
      "runtimeVersion": "1.0.0",
      "privacyManifests": applePrivacyManifest,
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
          "userTrackingUsageDescription": "This identifier will be used to deliver personalized ads to you.",
          "skAdNetworkItems": [
            "cstr6suwn9.skadnetwork",
            "4fzdc2evr5.skadnetwork",
            "2fnua5tdw4.skadnetwork",
            "ydx93a7ass.skadnetwork",
            "p78axxw29g.skadnetwork",
            "v72qych5uu.skadnetwork",
            "ludvb6z3bs.skadnetwork",
            "cp8zw746q7.skadnetwork",
            "3sh42y64q3.skadnetwork",
            "c6k4g5qg8m.skadnetwork",
            "s39g8k73mm.skadnetwork",
            "3qy4746246.skadnetwork",
            "hs6bdukanm.skadnetwork",
            "mlmmfzh3r3.skadnetwork",
            "v4nxqhlyqp.skadnetwork",
            "wzmmz9fp6w.skadnetwork",
            "su67r6k2v3.skadnetwork",
            "yclnxrl5pm.skadnetwork",
            "7ug5zh24hu.skadnetwork",
            "gta9lk7p23.skadnetwork",
            "vutu7akeur.skadnetwork",
            "y5ghdn5j9k.skadnetwork",
            "v9wttpbfk9.skadnetwork",
            "n38lu8286q.skadnetwork",
            "47vhws6wlr.skadnetwork",
            "kbd757ywx3.skadnetwork",
            "9t245vhmpl.skadnetwork",
            "a2p9lx4jpn.skadnetwork",
            "22mmun2rn5.skadnetwork",
            "4468km3ulz.skadnetwork",
            "2u9pt9hc89.skadnetwork",
            "8s468mfl3y.skadnetwork",
            "ppxm28t8ap.skadnetwork",
            "uw77j35x4d.skadnetwork",
            "pwa73g5rt2.skadnetwork",
            "578prtvx9j.skadnetwork",
            "4dzt52r2t5.skadnetwork",
            "tl55sbb4fm.skadnetwork",
            "e5fvkxwrpn.skadnetwork",
            "8c4e2ghe7u.skadnetwork",
            "3rd42ekr43.skadnetwork",
            "3qcr597p9d.skadnetwork"
          ]
        }
      ],
      [
        "expo-tracking-transparency"
      ],
      [
        "@sentry/react-native/expo",
        {
          "organization": "rihlah",
          "project": "rihlah",
          "url": "https://sentry.io/"
        }
      ],
      "@react-native-firebase/auth",
      "@react-native-firebase/app",
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
