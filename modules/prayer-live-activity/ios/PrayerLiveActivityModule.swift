import ExpoModulesCore
import ActivityKit

// MARK: - Activity Attributes
//
// IMPORTANT: must stay byte-for-byte identical to the copy in
// targets/widget/WidgetLiveActivity.swift — ActivityKit matches the app's
// Activity<…> to the widget's ActivityConfiguration by this attributes type.
// If you change one, change both.

struct PrayerLiveActivityAttributes: ActivityAttributes {
  public struct ContentState: Codable, Hashable {
    var nextPrayer: String
    var prayerTimeEpoch: Double
    var clockLabel: String
  }

  var widgetName: String
}

/// End every running prayer activity, handling the 16.1 vs 16.2 API split.
@available(iOS 16.1, *)
private func endAllPrayerActivities() async {
  for activity in Activity<PrayerLiveActivityAttributes>.activities {
    if #available(iOS 16.2, *) {
      await activity.end(nil, dismissalPolicy: .immediate)
    } else {
      await activity.end(using: nil, dismissalPolicy: .immediate)
    }
  }
}

public class PrayerLiveActivityModule: Module {
  public func definition() -> ModuleDefinition {
    Name("PrayerLiveActivity")

    // Whether Live Activities are supported (iOS 16.1+) and enabled by the user.
    Function("isAvailable") { () -> Bool in
      if #available(iOS 16.1, *) {
        return ActivityAuthorizationInfo().areActivitiesEnabled
      }
      return false
    }

    // Start (replacing any existing) the prayer Live Activity. Returns its id.
    AsyncFunction("start") { (nextPrayer: String, prayerTimeEpoch: Double, clockLabel: String) async -> String? in
      guard #available(iOS 16.1, *) else { return nil }
      guard ActivityAuthorizationInfo().areActivitiesEnabled else { return nil }

      // Only ever keep one prayer activity alive.
      await endAllPrayerActivities()

      let attributes = PrayerLiveActivityAttributes(widgetName: "Prayer")
      let state = PrayerLiveActivityAttributes.ContentState(
        nextPrayer: nextPrayer,
        prayerTimeEpoch: prayerTimeEpoch,
        clockLabel: clockLabel
      )
      let stale = Date(timeIntervalSince1970: prayerTimeEpoch).addingTimeInterval(60)

      do {
        if #available(iOS 16.2, *) {
          let activity = try Activity<PrayerLiveActivityAttributes>.request(
            attributes: attributes,
            content: ActivityContent(state: state, staleDate: stale),
            pushType: nil
          )
          return activity.id
        } else {
          let activity = try Activity<PrayerLiveActivityAttributes>.request(
            attributes: attributes,
            contentState: state,
            pushType: nil
          )
          return activity.id
        }
      } catch {
        return nil
      }
    }

    // Update the running activity (e.g. advance to the next prayer).
    AsyncFunction("update") { (nextPrayer: String, prayerTimeEpoch: Double, clockLabel: String) async -> Void in
      guard #available(iOS 16.1, *) else { return }

      let state = PrayerLiveActivityAttributes.ContentState(
        nextPrayer: nextPrayer,
        prayerTimeEpoch: prayerTimeEpoch,
        clockLabel: clockLabel
      )
      let stale = Date(timeIntervalSince1970: prayerTimeEpoch).addingTimeInterval(60)

      for activity in Activity<PrayerLiveActivityAttributes>.activities {
        if #available(iOS 16.2, *) {
          await activity.update(ActivityContent(state: state, staleDate: stale))
        } else {
          await activity.update(using: state)
        }
      }
    }

    // End all prayer activities immediately.
    AsyncFunction("end") { () async -> Void in
      guard #available(iOS 16.1, *) else { return }
      await endAllPrayerActivities()
    }
  }
}
