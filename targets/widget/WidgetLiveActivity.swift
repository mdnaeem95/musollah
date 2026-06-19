import ActivityKit
import WidgetKit
import SwiftUI

// MARK: - Activity Attributes
//
// IMPORTANT: this struct must stay byte-for-byte identical to the copy in the
// app-side module (modules/prayer-live-activity/ios/PrayerLiveActivityModule.swift)
// — ActivityKit matches the app's Activity<…> to this configuration by the
// attributes type. If you change one, change both.

struct PrayerLiveActivityAttributes: ActivityAttributes {
  public struct ContentState: Codable, Hashable {
    /// e.g. "Zohor"
    var nextPrayer: String
    /// Target prayer time, seconds since 1970 (drives the on-device countdown).
    var prayerTimeEpoch: Double
    /// Pre-formatted clock label for display, e.g. "1:08 PM".
    var clockLabel: String
  }

  /// Fixed for the activity's lifetime (unused for now, reserved).
  var widgetName: String
}

// MARK: - Helpers

private func prayerSymbol(_ name: String) -> String {
  switch name.lowercased() {
  case "subuh", "fajr": return "sunrise.fill"
  case "syuruk", "sunrise": return "sun.horizon.fill"
  case "zohor", "dhuhr": return "sun.max.fill"
  case "asar", "asr": return "sun.min.fill"
  case "maghrib": return "sunset.fill"
  case "isyak", "isha": return "moon.stars.fill"
  default: return "moon.stars.fill"
  }
}

private let accent = Color(red: 0.13, green: 0.77, blue: 0.49) // app green

private func targetDate(_ state: PrayerLiveActivityAttributes.ContentState) -> Date {
  Date(timeIntervalSince1970: state.prayerTimeEpoch)
}

/// Counting-down timer text that auto-updates on-device. Falls back to the
/// clock label once the prayer time has passed.
private func countdownText(_ state: PrayerLiveActivityAttributes.ContentState) -> Text {
  let target = targetDate(state)
  if target > Date() {
    return Text(timerInterval: Date()...target, countsDown: true)
  }
  return Text(state.clockLabel)
}

// MARK: - Live Activity

struct WidgetLiveActivity: Widget {
  var body: some WidgetConfiguration {
    ActivityConfiguration(for: PrayerLiveActivityAttributes.self) { context in
      // Lock screen / banner
      HStack(spacing: 14) {
        ZStack {
          Circle().fill(accent.opacity(0.18)).frame(width: 44, height: 44)
          Image(systemName: prayerSymbol(context.state.nextPrayer))
            .font(.system(size: 20, weight: .semibold))
            .foregroundColor(accent)
        }

        VStack(alignment: .leading, spacing: 2) {
          Text("NEXT PRAYER")
            .font(.system(size: 11, weight: .medium))
            .foregroundColor(.secondary)
          Text(context.state.nextPrayer)
            .font(.system(size: 20, weight: .bold))
            .foregroundColor(.primary)
        }

        Spacer()

        VStack(alignment: .trailing, spacing: 2) {
          countdownText(context.state)
            .font(.system(size: 22, weight: .bold, design: .rounded))
            .monospacedDigit()
            .foregroundColor(accent)
            .multilineTextAlignment(.trailing)
          Text(context.state.clockLabel)
            .font(.system(size: 12))
            .foregroundColor(.secondary)
        }
      }
      .padding(16)
      .activityBackgroundTint(Color.black.opacity(0.5))
      .activitySystemActionForegroundColor(accent)

    } dynamicIsland: { context in
      DynamicIsland {
        DynamicIslandExpandedRegion(.leading) {
          HStack(spacing: 6) {
            Image(systemName: prayerSymbol(context.state.nextPrayer))
              .foregroundColor(accent)
            Text(context.state.nextPrayer)
              .font(.system(size: 15, weight: .semibold))
          }
        }
        DynamicIslandExpandedRegion(.trailing) {
          countdownText(context.state)
            .font(.system(size: 15, weight: .bold, design: .rounded))
            .monospacedDigit()
            .foregroundColor(accent)
            .frame(maxWidth: 90, alignment: .trailing)
        }
        DynamicIslandExpandedRegion(.bottom) {
          Text("at \(context.state.clockLabel)")
            .font(.system(size: 12))
            .foregroundColor(.secondary)
        }
      } compactLeading: {
        Image(systemName: prayerSymbol(context.state.nextPrayer))
          .foregroundColor(accent)
      } compactTrailing: {
        countdownText(context.state)
          .monospacedDigit()
          .foregroundColor(accent)
          .frame(maxWidth: 60)
      } minimal: {
        Image(systemName: prayerSymbol(context.state.nextPrayer))
          .foregroundColor(accent)
      }
      .keylineTint(accent)
    }
  }
}

// MARK: - Preview

extension PrayerLiveActivityAttributes {
  fileprivate static var preview: PrayerLiveActivityAttributes {
    PrayerLiveActivityAttributes(widgetName: "Prayer")
  }
}

extension PrayerLiveActivityAttributes.ContentState {
  fileprivate static var zohor: PrayerLiveActivityAttributes.ContentState {
    .init(nextPrayer: "Zohor", prayerTimeEpoch: Date().addingTimeInterval(1800).timeIntervalSince1970, clockLabel: "1:08 PM")
  }
}

#Preview("Lock Screen", as: .content, using: PrayerLiveActivityAttributes.preview) {
  WidgetLiveActivity()
} contentStates: {
  PrayerLiveActivityAttributes.ContentState.zohor
}
